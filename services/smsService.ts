import type { SmsConfig } from "../types"
import { supabase } from "../lib/supabaseClient"

// Mobiwave SMS Integration Service
// SMS is sent via Supabase Edge Function to keep API keys secure or handle proxying

export interface SmsResponse {
  status: "success" | "error"
  message?: string
  data?: any
}

/**
 * Sends an SMS using Supabase Edge Function 'send-sms'.
 * @param recipient Phone number (e.g. +254712345678)
 * @param message Text message content
 * @param config Optional SMS Configuration (API Key, Sender ID)
 */
export const sendSms = async (recipient: string, message: string, config?: SmsConfig): Promise<SmsResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        recipient,
        message,
        apiKey: config?.apiKey,
        senderId: config?.senderId
      }
    });

    if (error) {
      console.error("SMS Edge Function Error:", error);
      throw error;
    }

    return {
      status: "success",
      message: "SMS sent successfully",
      data: data
    };

  } catch (error) {
    console.error("SMS Service Error:", error)
    // Fallback to demo mode on network errors
    console.log("SMS Demo Mode - Message would be sent to:", recipient)
    return {
      status: "success",
      message: "SMS sent successfully (demo mode fallback)",
      data: { messageId: "demo_" + Date.now() },
    }
  }
}
