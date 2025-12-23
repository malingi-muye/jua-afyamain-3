// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore
serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { recipient, message, apiKey, senderId } = await req.json()

        // Validate inputs
        if (!recipient || !message) {
            throw new Error('Missing recipient or message')
        }

        // In a real scenario, you usually store the API key in Supabase Secrets (Deno.env.get('MOBIWAVE_API_KEY'))
        // rather than passing it from the client. However, JuaAfya allows per-clinic configuration,
        // so we accept it from the client (or fetch it from the database here using the user's context).

        // Construct the payload for Mobiwave (Pseudo-code implementation based on typical SMS APIs)
        const payload = {
            api_key: apiKey || "DEMO_KEY",
            sender_id: senderId || "JUAAFYA",
            message: message,
            phone: recipient
        };

        console.log(`Sending SMS to ${recipient} via Mobiwave...`, payload);

        // UNCOMMENT TO ENABLE REAL SMS (Costs Money)
        /*
        const response = await fetch('https://sms.mobiwave.co.ke/api/v3/message/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`Mobiwave API Error: ${response.statusText}`);
        }
        const data = await response.json();
        */

        // SMS provider not configured
        throw new Error('SMS provider is not configured. Please configure Mobiwave credentials in your environment.');

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})
