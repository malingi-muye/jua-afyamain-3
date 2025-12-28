// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { prompt, history, systemInstruction, model, temperature, jsonMode } = await req.json()

        // Get API Key from Environment Variable
        // In local dev, you might need to set this in .env or pass it securely
        // For this implementation, we fallback to the provided key in body IF meant for quick testing,
        // but IDEALLY it comes from Deno.env.get('GEMINI_API_KEY')
        // @ts-ignore
        const apiKey = Deno.env.get('GEMINI_API_KEY');

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not configured in environment variables");
        }

        const payload: any = {
            contents: [
                ...(history || []).map((msg: any) => ({
                    role: msg.role === 'admin' ? 'model' : msg.role, // Map common roles
                    parts: [{ text: msg.text || msg.parts?.[0]?.text }]
                }))
            ],
            generationConfig: {
                temperature: temperature || 0.7,
            }
        };

        if (prompt) {
            payload.contents.push({
                role: "user",
                parts: [{ text: prompt }]
            });
        }

        if (systemInstruction) {
            // Note: systemInstruction support depends on the specific model version API
            // For simple compatibility, we prepend it to the first user message or handle it specifically if using v1beta models that support it.
            // gemini-1.5-pro-latest supports system_instruction
            payload.systemInstruction = {
                parts: [{ text: systemInstruction }]
            };
        }

        if (jsonMode) {
            payload.generationConfig.responseMimeType = "application/json";
        }

        const targetModel = model || "gemini-2.0-flash-exp";
        // Fallback to pro if flash not available or change based on availability

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `Gemini API Error: ${response.statusText}`);
        }

        // Extract text
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return new Response(
            JSON.stringify({ text, raw: data }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})
