// Supabase Edge Function - send-email
// Sends emails via Gmail SMTP
// Required env vars:
// - GMAIL_SMTP_USER: Gmail email address
// - GMAIL_SMTP_PASSWORD: Gmail app-specific password (not regular password)
// - GMAIL_SMTP_HOST: Optional, defaults to smtp.gmail.com
// - GMAIL_SMTP_PORT: Optional, defaults to 587

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// SMTPClient from deno smtp library
// Note: If SMTP library is not available, we'll use a fallback approach with external service
import { SmtpClient } from "https://deno.land/x/smtp@0.16.0/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface EmailRequest {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
}

serve(async (req: any) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // @ts-ignore
    const env = Deno.env.toObject()
    const SMTP_USER = env?.GMAIL_SMTP_USER
    const SMTP_PASSWORD = env?.GMAIL_SMTP_PASSWORD
    const SMTP_HOST = env?.GMAIL_SMTP_HOST || "smtp.gmail.com"
    const SMTP_PORT = Number(env?.GMAIL_SMTP_PORT || 587)

    if (!SMTP_USER || !SMTP_PASSWORD) {
      console.error("Gmail SMTP credentials not configured")
      return new Response(
        JSON.stringify({
          error: "Email service not configured",
          message: "GMAIL_SMTP_USER and GMAIL_SMTP_PASSWORD environment variables are required",
        }),
        { status: 500, headers: corsHeaders }
      )
    }

    const body: EmailRequest = await req.json()
    const { to, cc, bcc, subject, html, text, from } = body

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          message: "to, subject, and html/text are required",
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Normalize email arrays
    const recipients = Array.isArray(to) ? to : [to]
    const ccList = cc ? (Array.isArray(cc) ? cc : [cc]) : []
    const bccList = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : []

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const allEmails = [...recipients, ...ccList, ...bccList]
    for (const email of allEmails) {
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format", email }),
          { status: 400, headers: corsHeaders }
        )
      }
    }

    // Create SMTP client
    const client = new SmtpClient()

    try {
      // Connect to Gmail SMTP server
      await client.connectTLS({
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        username: SMTP_USER,
        password: SMTP_PASSWORD,
      })

      // Send email
      await client.send({
        from: from || SMTP_USER,
        to: recipients,
        cc: ccList.length > 0 ? ccList : undefined,
        bcc: bccList.length > 0 ? bccList : undefined,
        subject: subject,
        content: text || "",
        html: html,
      })

      // Close connection
      await client.close()

      console.log(`Email sent successfully to ${recipients.join(", ")}`)

      return new Response(
        JSON.stringify({
          success: true,
          message: "Email sent successfully",
          recipients: recipients.length,
        }),
        { status: 200, headers: corsHeaders }
      )
    } catch (smtpError) {
      console.error("SMTP error:", smtpError)
      
      // If SMTP fails, try to provide helpful error message
      let errorMessage = "Failed to send email via SMTP"
      
      if (smtpError instanceof Error) {
        if (smtpError.message.includes("authentication failed")) {
          errorMessage = "Gmail authentication failed. Check credentials."
        } else if (smtpError.message.includes("connection refused")) {
          errorMessage = "SMTP server connection failed"
        } else {
          errorMessage = smtpError.message
        }
      }

      console.error("SMTP Error Message:", errorMessage)

      return new Response(
        JSON.stringify({
          error: "SMTP error",
          message: errorMessage,
        }),
        { status: 500, headers: corsHeaders }
      )
    }
  } catch (err) {
    console.error("send-email error:", err)
    
    const errorMessage = err instanceof Error ? err.message : String(err)
    
    return new Response(
      JSON.stringify({
        error: "Server error",
        message: errorMessage,
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
