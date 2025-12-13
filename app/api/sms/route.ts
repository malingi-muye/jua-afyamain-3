import { type NextRequest, NextResponse } from "next/server"

const DEFAULT_API_TOKEN = process.env.SMS_API_KEY || ""
const BASE_URL = "https://sms.mobiwave.co.ke/api/v3"
const DEFAULT_SENDER_ID = "MOBIWAVE"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipient, message, apiKey, senderId } = body

    const apiToken = apiKey || DEFAULT_API_TOKEN
    const sender = senderId || DEFAULT_SENDER_ID

    if (!apiToken) {
      return NextResponse.json(
        {
          status: "error",
          message: "SMS configuration missing (API Key not set).",
        },
        { status: 400 },
      )
    }

    const cleanRecipient = recipient.replace(/[^0-9]/g, "")

    if (!cleanRecipient) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid phone number format.",
        },
        { status: 400 },
      )
    }

    const response = await fetch(`${BASE_URL}/sms/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        recipient: cleanRecipient,
        sender_id: sender,
        type: "plain",
        message: message,
      }),
    })

    const data = await response.json()

    if (data.status === "success" || response.ok) {
      return NextResponse.json({ status: "success", data })
    } else {
      return NextResponse.json({
        status: "error",
        message: data.message || "Failed to send SMS via provider.",
      })
    }
  } catch (error) {
    console.error("SMS Service Error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Network error or SMS service unreachable.",
      },
      { status: 500 },
    )
  }
}
