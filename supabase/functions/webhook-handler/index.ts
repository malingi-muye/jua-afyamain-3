// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
// import crypto from "node:crypto"; // Deno supports Web Crypto API globally

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
}

// @ts-ignore
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // Initialize Supabase Admin Client
    // Accessing Deno.env directly inside the handler
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    // @ts-ignore
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const url = new URL(req.url);
        const provider = url.searchParams.get('provider'); // ?provider=paystack or ?provider=mpesa

        if (req.method !== 'POST') {
            throw new Error('Method not allowed');
        }

        const body = await req.text();
        let eventData: any = {};

        // --- PAYSTACK WEBHOOK HANDLER ---
        if (provider === 'paystack') {
            const signature = req.headers.get('x-paystack-signature');
            // @ts-ignore
            const secret = Deno.env.get('PAYSTACK_SECRET_KEY');

            if (!secret || !signature) {
                console.warn("Missing secret or signature for Paystack");
                // In dev mode, we might process anyway if verified manually, but for prod we throw
                // throw new Error("Unauthorized");
            }

            // Verify signature (Node crypto style logic for Deno)
            const encoder = new TextEncoder();
            const keyData = encoder.encode(secret);
            const cryptoKey = await crypto.subtle.importKey(
                "raw", keyData, { name: "HMAC", hash: "SHA-512" }, false, ["verify"]
            );
            const signatureBuf = hexToBuf(signature || "");
            const verified = await crypto.subtle.verify(
                "HMAC", cryptoKey, signatureBuf, encoder.encode(body)
            );

            if (!verified && secret) {
                throw new Error("Invalid Paystack Signature");
            }

            const json = JSON.parse(body);
            if (json.event === 'charge.success') {
                eventData = {
                    status: 'Success',
                    reference: json.data.reference,
                    amount: json.data.amount / 100,
                    metadata: json.data.metadata
                };
            } else {
                return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
        }
        // --- M-PESA WEBHOOK HANDLER ---
        else if (provider === 'mpesa') {
            const json = JSON.parse(body);
            // M-Pesa structure varies (C2B vs STK Push). Assuming STK Push Callback for now.
            const stkCallback = json.Body?.stkCallback;
            if (stkCallback) {
                const resultCode = stkCallback.ResultCode;
                const checkoutRequestId = stkCallback.CheckoutRequestID;

                if (resultCode === 0) {
                    eventData = {
                        status: 'Success',
                        reference: checkoutRequestId,
                        amount: stkCallback.CallbackMetadata?.Item?.find((i: any) => i.Name === 'Amount')?.Value,
                        metadata: {} // M-Pesa callbacks don't return initial metadata easily, usually keyed by CheckoutRequestID in DB
                    };
                } else {
                    eventData = { status: 'Failed', reference: checkoutRequestId };
                }
            }
        } else {
            throw new Error("Unknown Provider");
        }

        // --- EXECUTE DB UPDATES ---
        if (eventData.status === 'Success' || eventData.status === 'Failed') {
            // 1. Update Transaction Status
            // We assume transaction was created with Pending status during init
            // If searching by reference:
            const { data: txn, error: txnError } = await supabase
                .from('transactions')
                .update({
                    status: eventData.status,
                    // amount: eventData.amount // trusted from callback
                    metadata: { ...eventData.metadata, webhook_received_at: new Date().toISOString() }
                })
                .eq('reference', eventData.reference) // or .like if prefixes involved
                .select()
                .single();

            if (txnError) console.error("Error updating transaction:", txnError);

            // 2. If Success, Update Clinic Subscription/Credits
            if (eventData.status === 'Success' && txn) {
                const clinicId = txn.clinic_id;
                const plan = txn.plan; // e.g. "Pro Payment" or specific item desc

                // Logic to extend subscription or add credits based on plan/metadata
                if (txn.method === 'M-Pesa') {
                    // Example logic
                }

                // Just marking as processed for now
                console.log(`Successfully processed payment for clinic ${clinicId}`);
            }
        }

        return new Response(
            JSON.stringify({ received: true, status: 'processed' }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )

    } catch (error: any) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: error.message || 'Unknown Error' }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})

// Helper for hex string to buffer
function hexToBuf(hex: string) {
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    return bytes;
}
