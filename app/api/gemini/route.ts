import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || ""
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null

export async function POST(request: NextRequest) {
  if (!ai) {
    return NextResponse.json({ error: "API Key missing" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { action, ...params } = body

    let result = ""

    switch (action) {
      case "analyzeNotes":
        result = await analyzePatientNotes(params.notes)
        break
      case "draftSms":
        result = await draftAppointmentSms(params.patientName, params.date, params.reason)
        break
      case "draftCampaign":
        result = await draftCampaignMessage(params.topic, params.tone)
        break
      case "dailyBriefing":
        result = await generateDailyBriefing(params.appointmentCount, params.lowStockCount, params.revenueEstimate)
        break
      case "staffAssistant":
        const assistantResult = await getStaffAssistantResponse(params.query, params.context)
        return NextResponse.json(assistantResult)
      case "chat":
        result = await sendChatMessage(params.message, params.history)
        break
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Gemini API error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

async function analyzePatientNotes(notes: string): Promise<string> {
  const response = await ai!.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are a medical assistant for a clinic in Kenya. 
    Analyze the following patient notes and format them into a concise SOAP (Subjective, Objective, Assessment, Plan) format. 
    Keep it brief and professional.
    
    Notes: "${notes}"`,
  })
  return response.text || "Could not generate summary."
}

async function draftAppointmentSms(patientName: string, date: string, reason: string): Promise<string> {
  const response = await ai!.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Draft a short, polite, and friendly SMS reminder (max 160 chars) for a patient named ${patientName}.
    They have an appointment for "${reason}" on ${date}.
    The tone should be professional but caring, suitable for a small clinic in Kenya. 
    You can use a mix of English and Swahili (Sheng) if it sounds natural, but primarily English.
    Do not include placeholders like [Your Name]. Sign off as 'JuaAfya Clinic'.`,
  })
  return response.text?.trim().replace(/^"|"$/g, "") || "Could not draft SMS."
}

async function draftCampaignMessage(topic: string, tone: string): Promise<string> {
  const response = await ai!.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Draft a short, engaging SMS broadcast (max 160 chars) for a health clinic in Kenya.
    Topic: "${topic}"
    Tone: ${tone} (e.g., Professional, Urgent, Friendly, Educational).
    Target Audience: Patients.
    Language: English (can use common Kenyan phrases if appropriate).
    Call to action: Visit JuaAfya Clinic or call +254712345678.
    Do not use placeholders.`,
  })
  return response.text?.trim().replace(/^"|"$/g, "") || "Could not draft campaign."
}

async function generateDailyBriefing(
  appointmentCount: number,
  lowStockCount: number,
  revenueEstimate: string,
): Promise<string> {
  const response = await ai!.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are an intelligent clinic operations assistant. 
    Generate a 2-sentence "Daily Briefing" for the doctor.
    Data: 
    - Appointments today: ${appointmentCount}
    - Low stock items: ${lowStockCount}
    - Est. Revenue: ${revenueEstimate}
    
    Highlight action items (like restocking) if necessary, otherwise be encouraging.`,
  })
  return response.text || "Welcome back, Daktari."
}

async function getStaffAssistantResponse(userQuery: string, context: any): Promise<any> {
  const response = await ai!.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are the 'JuaAfya Ops Bot', a capable assistant for ${context.clinic?.name || "the clinic"}.
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
    config: {
      responseMimeType: "application/json",
    },
  })

  const text = response.text || "{}"
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch {
      return { reply: "I understood your request but had trouble formatting the response.", action: null }
    }
  }
  return { reply: "System Error: Invalid response format from AI.", action: null }
}

async function sendChatMessage(message: string, history: Array<{ role: string; text: string }>): Promise<string> {
  const chat = ai!.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction:
        "You are 'JuaAfya Assistant', a helpful AI assistant for a small health clinic in Kenya. You help the clinic staff with general medical questions, drafting SMS reminders, interpreting lab results, and suggesting operational improvements. You are NOT a doctor and must clarify that your advice does not replace professional medical judgment. Keep answers concise and friendly.",
    },
    history: history.map((h) => ({ role: h.role as "user" | "model", parts: [{ text: h.text }] })),
  })

  const response = await chat.sendMessage({ message })
  return response.text || "No response."
}
