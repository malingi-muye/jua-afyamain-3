// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

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
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { action, amount, email, phone, metadata, provider, reference, config } = await req.json()

        // Get the authenticated user's ID
        const authHeader = req.headers.get('Authorization')!;
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) {
            throw new Error('Unauthorized');
        }

        // Fetch clinic settings including payment config
        const { data: userData, error: userDbError } = await supabase
            .from('users')
            .select('clinic_id')
            .eq('id', user.id)
            .single();

        if (userDbError || !userData?.clinic_id) {
            throw new Error('Clinic context not found');
        }

        const { data: clinicData, error: clinicError } = await supabase
            .from('clinics')
            .select('settings')
            .eq('id', userData.clinic_id)
            .single();

        if (clinicError || !clinicData) {
            throw new Error('Failed to fetch clinic settings');
        }

        const dbConfig = clinicData.settings?.paymentConfig;
        let paystackSecret = dbConfig?.secretKey;

        // Security: Fallback to environment variable for platform-level payments if clinic config is missing
        const isSaaSPayment = metadata?.type === 'Plan' || metadata?.type === 'Credits';
        if (!paystackSecret && isSaaSPayment) {
            paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
        }

        if (!paystackSecret && provider !== 'None') {
            throw new Error('Payment gateway not configured correctly');
        }

        // --- ACTIONS ---

        // 1. Initialize Payment
        if (action === 'initialize') {
            if (!amount || amount <= 0) throw new Error('Invalid amount');

            const response = await fetch('https://api.paystack.co/transaction/initialize', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${paystackSecret}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    amount: Math.round(amount * 100), // Kobo
                    metadata,
                    callback_url: dbConfig?.webhookUrl || config?.callbackUrl
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Initialization failed');

            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 2. M-Pesa Charge (STK Push)
        if (action === 'charge' || (provider === 'M-Pesa' && !action)) {
            const response = await fetch('https://api.paystack.co/charge', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${paystackSecret}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email || 'customer@juaafya.com',
                    amount: Math.round(amount * 100),
                    currency: "KES",
                    mobile_money: { phone, provider: "mpesa" },
                    metadata
                })
            });

            const apiData = await response.json();
            if (!response.ok) throw new Error(apiData.message || 'M-Pesa charge failed');

            const data = {
                status: true,
                data: {
                    reference: apiData.data?.reference,
                    message: apiData.data?.display_text || apiData.message || "Please check your phone"
                }
            };

            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 3. Verify Payment
        if (action === 'verify') {
            if (!reference) throw new Error('Reference missing');

            const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
                headers: { Authorization: `Bearer ${paystackSecret}` }
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Verification failed');

            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 4. Process Refund
        if (action === 'refund') {
            if (!reference) throw new Error('Reference missing');

            const response = await fetch('https://api.paystack.co/refund', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${paystackSecret}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    transaction: reference,
                    amount: amount ? Math.round(amount * 100) : undefined,
                    memo: metadata?.reason || 'Clinic Refund'
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Refund failed');

            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        throw new Error(`Unsupported action or provider: ${action} / ${provider}`);

    } catch (error: any) {
        console.error('Edge Function Error:', error.message);
        return new Response(
            JSON.stringify({ status: false, message: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})
