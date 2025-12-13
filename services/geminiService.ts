// Initialize only if API key is provided server-side
const ai = null

// Helper to check if API is available (always returns true since server handles this)
export const hasApiKey = () => true

/**
 * Summarizes patient notes or converts unstructured notes into SOAP format.
 */
export const analyzePatientNotes = async (notes: string): Promise<string> => {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "analyzeNotes", notes }),
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result || data.error || "Could not generate summary."
  } catch (error) {
    console.error("Gemini Error:", error)
    return `SOAP Summary (Demo):\n\nSubjective:\n${notes.substring(0, 100)}...\n\nObjective:\nPending assessment\n\nAssessment:\nRequires physician review\n\nPlan:\nSchedule follow-up visit`
  }
}

/**
 * Generates a short, friendly SMS reminder for a patient.
 */
export const draftAppointmentSms = async (patientName: string, date: string, reason: string): Promise<string> => {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "draftSms", patientName, date, reason }),
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result || `Hello ${patientName}, reminder for your appointment on ${date}. - JuaAfya Clinic`
  } catch (error) {
    console.error("Gemini Error:", error)
    return `Hello ${patientName}, this is a reminder for your ${reason} appointment on ${date}. Please confirm attendance. - JuaAfya Clinic`
  }
}

/**
 * Generates marketing or general broadcast SMS content.
 */
export const draftCampaignMessage = async (topic: string, tone: string): Promise<string> => {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "draftCampaign", topic, tone }),
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result || `Health Alert: ${topic}. Visit JuaAfya Clinic for more info.`
  } catch (error) {
    console.error("Gemini Error:", error)
    return `Join us at JuaAfya Clinic for comprehensive healthcare services. Book your appointment today.`
  }
}

/**
 * Generates a daily executive summary for the doctor based on stats.
 */
export const generateDailyBriefing = async (
  appointmentCount: number,
  lowStockCount: number,
  revenueEstimate: string,
): Promise<string> => {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dailyBriefing", appointmentCount, lowStockCount, revenueEstimate }),
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result || "Welcome back, Daktari. Systems operational."
  } catch (error) {
    console.error("Gemini Error:", error)
    return `Good morning, Doctor! Daily Briefing:\n• ${appointmentCount} appointments scheduled\n• ${lowStockCount} items low in stock\n• Estimated revenue: ${revenueEstimate}\nReview patient queue and inventory levels.`
  }
}

/**
 * Staff WhatsApp Agent Response
 */
export const getStaffAssistantResponse = async (userQuery: string, context: any): Promise<any> => {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "staffAssistant", query: userQuery, context }),
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Gemini Staff Agent Error:", error)
    return {
      reply: `I understand your request about "${userQuery}". Please provide more details or contact your administrator for assistance.`,
    }
  }
}

// Chat history stored in memory for the session
const chatHistory: Array<{ role: string; text: string }> = []

export const getChatSession = () => {
  return { active: true }
}

export const sendMessageToChat = async (message: string): Promise<string> => {
  try {
    chatHistory.push({ role: "user", text: message })

    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "chat", message, history: chatHistory.slice(-10) }),
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const reply = data.result || data.error || "No response."

    chatHistory.push({ role: "model", text: reply })

    return reply
  } catch (error) {
    console.error("Chat Error:", error)
    const fallbackReply = `Thank you for your message. The AI assistant is currently unavailable. Please try again later.`
    chatHistory.push({ role: "model", text: fallbackReply })
    return fallbackReply
  }
}
