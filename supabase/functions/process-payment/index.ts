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
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { amount, email, phone, metadata, provider, config } = await req.json()

        console.log(`Initializing Payment via ${provider}...`);

        if (provider === 'PayStack') {
            // PayStack Initialization Logic
            // Config contains keys passed from client or fetched from DB
            const paystackSecret = config?.secretKey;

            if (!paystackSecret) {
                throw new Error('PayStack Secret Key is missing');
            }

            const response = await fetch('https://api.paystack.co/transaction/initialize', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${paystackSecret}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    amount: amount * 100, // Paystack uses kobo
                    metadata,
                    callback_url: config?.webhookUrl || 'https://juaafya.com/payment/callback'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to initialize PayStack transaction');
            }

            const data = await response.json();

            return new Response(
                JSON.stringify(data),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            )
        }

        // M-Pesa STK Push (via PayStack)
        if (provider === 'M-Pesa') {
            const paystackSecret = config?.secretKey;

            if (!paystackSecret) {
                throw new Error('PayStack Secret Key is required for M-Pesa processing');
            }

            // PayStack Charge API for Mobile Money
            const response = await fetch('https://api.paystack.co/charge', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${paystackSecret}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email || 'customer@juaafya.com',
                    amount: amount * 100, // Kobo
                    currency: "KES",
                    mobile_money: {
                        phone: phone,
                        provider: "mpesa"
                    },
                    metadata
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to initiate M-Pesa payment via PayStack');
            }

            const apiData = await response.json();

            // Map PayStack response to what frontend expects for "M-Pesa"
            // Frontend expects: ResponseCode, ResponseDescription, CheckoutRequestID, CustomerMessage
            // PayStack returns: { status, message, data: { reference, status, display_text, ... } }

            const data = {
                ResponseCode: apiData.status ? "0" : "1",
                ResponseDescription: apiData.message || "Request processed",
                MerchantRequestID: `PAYSTACK-${apiData.data?.reference || Date.now()}`,
                CheckoutRequestID: apiData.data?.reference || `REF-${Date.now()}`,
                CustomerMessage: apiData.data?.display_text || apiData.message || "Please check your phone to complete payment."
            };

            return new Response(
                JSON.stringify(data),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            )
        }

        throw new Error('Unsupported payment provider');

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})
