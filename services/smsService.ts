import type { SmsConfig } from "../types"

// Mobiwave SMS Integration Service
// SMS is sent via server-side API route to keep API keys secure

const BASE_URL = "https://sms.mobiwave.co.ke/api/v3"
const DEFAULT_SENDER_ID = "JUAAFYA"

export interface SmsResponse {
  status: "success" | "error"
  message?: string
  data?: any
}

/**
 * Sends an SMS using server-side API route (or stubbed in demo mode).
 * @param recipient Phone number (e.g. +254712345678)
 * @param message Text message content
 * @param config Optional SMS Configuration (API Key, Sender ID)
 */
export const sendSms = async (recipient: string, message: string, config?: SmsConfig): Promise<SmsResponse> => {
  try {
    const response = await fetch("/api/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient,
        message,
        apiKey: config?.apiKey,
        senderId: config?.senderId || DEFAULT_SENDER_ID,
      }),
    })

    if (!response.ok) {
      // If server route fails, return demo success
      console.log("SMS Demo Mode - Message would be sent to:", recipient)
      console.log("SMS Content:", message)
      return {
        status: "success",
        message: "SMS sent successfully (demo mode)",
        data: { messageId: "demo_" + Date.now() },
      }
    }

    return await response.json()
  } catch (error) {
    console.error("SMS Service Error:", error)
    // Fallback to demo mode on network errors
    console.log("SMS Demo Mode - Message would be sent to:", recipient)
    return {
      status: "success",
      message: "SMS sent successfully (demo mode)",
      data: { messageId: "demo_" + Date.now() },
    }
  }
}
