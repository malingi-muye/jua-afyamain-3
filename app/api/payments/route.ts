import { type NextRequest, NextResponse } from "next/server"
import { paymentService } from "../../../services/paymentService"
import { invoiceService } from "../../../services/invoiceService"
import { validation } from "../../../lib/validation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case "initialize-paystack":
        return await initializePayStack(params)
      case "verify-paystack":
        return await verifyPayStack(params)
      case "initialize-mpesa":
        return await initializeMpesa(params)
      case "check-mpesa-status":
        return await checkMpesaStatus(params)
      case "process-refund":
        return await processRefund(params)
      case "record-payment":
        return await recordPayment(params)
      case "get-payment-history":
        return await getPaymentHistory(params)
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Payment API error:", error)
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
  }
}

async function initializePayStack(params: any) {
  const { amount, email, invoiceId, patientId, patientName } = params

  // Validate inputs
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
  }
  if (!validation.isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  try {
    const result = await paymentService.initializePayStackPayment(amount, email, {
      invoiceId,
      patientId,
      patientName,
    })

    return NextResponse.json({
      success: true,
      accessCode: result.accessCode,
      authorizationUrl: result.authorizationUrl,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function verifyPayStack(params: any) {
  const { reference } = params

  if (!reference) {
    return NextResponse.json({ error: "Payment reference required" }, { status: 400 })
  }

  try {
    const payment = await paymentService.verifyPayStackPayment(reference)
    return NextResponse.json({
      success: true,
      payment,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function initializeMpesa(params: any) {
  const { phoneNumber, amount, accountReference, description } = params

  if (!validation.isValidPhone(phoneNumber)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
  }
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
  }

  try {
    const result = await paymentService.initializeMpesaPayment(
      phoneNumber,
      amount,
      accountReference,
      description
    )

    return NextResponse.json({
      success: true,
      checkoutRequestId: result.checkoutRequestId,
      message: result.message,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function checkMpesaStatus(params: any) {
  const { checkoutRequestId } = params

  if (!checkoutRequestId) {
    return NextResponse.json({ error: "Checkout request ID required" }, { status: 400 })
  }

  try {
    const payment = await paymentService.checkMpesaPaymentStatus(checkoutRequestId)
    return NextResponse.json({
      success: true,
      payment,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function processRefund(params: any) {
  const { reference, amount, reason } = params

  if (!reference || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const result = await paymentService.processRefund(reference, amount, reason)
    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function recordPayment(params: any) {
  const { invoiceId, amountPaid, paymentMethod, paymentReference, userId } = params

  if (!invoiceId || !amountPaid) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const invoice = await invoiceService.recordPayment(
      invoiceId,
      amountPaid,
      paymentMethod,
      paymentReference,
      userId
    )
    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function getPaymentHistory(params: any) {
  const { patientId } = params

  if (!patientId) {
    return NextResponse.json({ error: "Patient ID required" }, { status: 400 })
  }

  try {
    const payments = await paymentService.getPaymentHistory(patientId)
    return NextResponse.json({
      success: true,
      payments,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
