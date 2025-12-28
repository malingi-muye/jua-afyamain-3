import { supabase } from "../lib/supabaseClient"

// Helper to call Edge Function
const callGemini = async (payload: any) => {
  // Ensure supabase client and functions are available
  if (!supabase || !supabase.functions) {
    throw new Error("Supabase client not initialized. Please check your configuration.")
  }

  const { data, error } = await supabase.functions.invoke("gemini-chat", {
    body: payload,
  })

  if (error) {
    console.error("[v0] Gemini invoke error:", error)
    throw error
  }
  if (data.error) throw new Error(data.error)

  return data.text
}

/**
 * Summarizes patient notes or converts unstructured notes into SOAP format.
 */
export const analyzePatientNotes = async (notes: string): Promise<string> => {
  try {
    return await callGemini({
      prompt: `You are a medical assistant for a clinic in Kenya. 
      Analyze the following patient notes and format them into a concise SOAP (Subjective, Objective, Assessment, Plan) format. 
      Keep it brief and professional.
      
      Notes: "${notes}"`,
      model: "gemini-2.0-flash",
    })
  } catch (error) {
    console.error("Gemini Error (analyzePatientNotes):", error)
    throw new Error("Failed to analyze patient notes. Please check your Gemini API configuration.")
  }
}

/**
 * Generates a short, friendly SMS reminder for a patient.
 */
export const draftAppointmentSms = async (patientName: string, date: string, reason: string): Promise<string> => {
  try {
    const text = await callGemini({
      prompt: `Draft a short, polite, and friendly SMS reminder (max 160 chars) for a patient named ${patientName}.
        They have an appointment for "${reason}" on ${date}.
        The tone should be professional but caring, suitable for a small clinic in Kenya. 
        You can use a mix of English and Swahili (Sheng) if it sounds natural, but primarily English.
        Do not include placeholders like [Your Name]. Sign off as 'JuaAfya Clinic'.`,
      model: "gemini-2.0-flash",
    })
    return text?.trim().replace(/^"|"$/g, "") || "Could not draft SMS."
  } catch (error) {
    console.error("Gemini Error (draftAppointmentSms):", error)
    throw new Error("Failed to draft appointment SMS. Please check your Gemini API configuration.")
  }
}

/**
 * Generates marketing or general broadcast SMS content.
 */
export const draftCampaignMessage = async (topic: string, tone: string): Promise<string> => {
  try {
    const text = await callGemini({
      prompt: `Draft a short, engaging SMS broadcast (max 160 chars) for a health clinic in Kenya.
        Topic: "${topic}"
        Tone: ${tone} (e.g., Professional, Urgent, Friendly, Educational).
        Target Audience: Patients.
        Language: English (can use common Kenyan phrases if appropriate).
        Call to action: Visit JuaAfya Clinic or call +254712345678.
        Do not use placeholders.`,
      model: "gemini-2.0-flash",
    })
    return text?.trim().replace(/^"|"$/g, "") || "Could not draft campaign."
  } catch (error) {
    console.error("Gemini Error (draftCampaignMessage):", error)
    throw new Error("Failed to draft campaign message. Please check your Gemini API configuration.")
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
    return await callGemini({
      prompt: `You are an intelligent clinic operations assistant. 
        Generate a 2-sentence "Daily Briefing" for the doctor.
        Data: 
        - Appointments today: ${appointmentCount}
        - Low stock items: ${lowStockCount}
        - Est. Revenue: ${revenueEstimate}
        
        Highlight action items (like restocking) if necessary, otherwise be encouraging.`,
      model: "gemini-2.0-flash",
    })
  } catch (error) {
    console.error("Gemini Error (generateDailyBriefing):", error)
    throw new Error("Failed to generate daily briefing. Please check your Gemini API configuration.")
  }
}

/**
 * Staff WhatsApp Agent Response
 */
export const getStaffAssistantResponse = async (userQuery: string, context: any): Promise<any> => {
  try {
    const text = await callGemini({
      prompt: `You are the 'JuaAfya Ops Bot', a capable assistant for ${context.clinic?.name || "the clinic"}.
        You have FULL ACCESS to read and MODIFY the clinic's data.
    
        Current Data Context:
        - Patients: ${JSON.stringify(context.patients || [])}
        - Appointments: ${JSON.stringify(context.appointments || [])}
        - Inventory: ${JSON.stringify(context.inventory || [])}
        - Today: ${context.today}
    
        User Query: "${userQuery}"
    
        INSTRUCTIONS:
        1. You must respond in valid JSON format ONLY. Do not include markdown blocks.
        2. Structure: { "reply": "string", "action": { "type": "string", "payload": object } | null }
        3. If the user asks a question, answer in 'reply' and set 'action' to null.
        4. If the user wants to ADD, UPDATE, or DELETE data, set the 'action' field.
        
        AVAILABLE ACTIONS:
        - ADD_PATIENT: payload { name, phone, age, gender (Male/Female) }
        - EDIT_PATIENT: payload { patientId, updates: { name?, phone?, age?, gender?, notes? } }
        - DELETE_PATIENT: payload { patientId }
        - ADD_APPOINTMENT: payload { patientId, date (YYYY-MM-DD), time (HH:MM), reason }
        - EDIT_APPOINTMENT: payload { appointmentId, updates: { date?, time?, reason? } }
        - CANCEL_APPOINTMENT: payload { appointmentId }
        - UPDATE_STOCK: payload { itemId or itemName, newQuantity }
        - DELETE_ITEM: payload { itemId or itemName }
    
        RULES:
        - Prioritize brevity in 'reply'. Use bullet points for lists. No emojis.
        - If details are missing for an action, ask the user for them and set 'action' to null.
        - Infer dates like 'tomorrow' based on ${context.today}.
        `,
      model: "gemini-2.0-flash",
      jsonMode: true,
    })

    // Clean up potential markdown code blocks
    const jsonStr = text.replace(/```json\n?|\n?```/g, "")

    try {
      return JSON.parse(jsonStr)
    } catch {
      return { reply: "I understood your request but had trouble formatting the response.", action: null }
    }
  } catch (error) {
    console.error("Gemini Staff Agent Error:", error)
    throw new Error("Failed to process staff request. Please check your Gemini API configuration.")
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

    const reply = await callGemini({
      prompt: message,
      history: chatHistory.slice(0, -1), // Send history excluding current message (handled by prompt usually, or we can send all in history)
      // Adjusting strategy: edge function accepts history array + prompt.
      // Actually the edge function appends prompt to history.
      // So passing history excluding the new message is fine because 'prompt' covers it.
      // Or we can just pass history w/ new message and no prompt?
      // My edge function logic: `payload.contents = [...history]; if (prompt) payload.contents.push({ role: 'user', parts: [{text: prompt}] })`
      // So passing history WITHOUT the new message, and passing the new message as prompt is correct.

      systemInstruction:
        "You are 'JuaAfya Assistant', a helpful AI assistant for a small health clinic in Kenya. You help the clinic staff with general medical questions, drafting SMS reminders, interpreting lab results, and suggesting operational improvements. You are NOT a doctor and must clarify that your advice does not replace professional medical judgment. Keep answers concise and friendly.",
      model: "gemini-2.0-flash",
    })

    chatHistory.push({ role: "model", text: reply })

    return reply
  } catch (error) {
    console.error("Chat Error:", error)
    const fallbackReply = `Thank you for your message. The AI assistant is currently unavailable. Please try again later.`
    chatHistory.push({ role: "model", text: fallbackReply })
    return fallbackReply
  }
}
