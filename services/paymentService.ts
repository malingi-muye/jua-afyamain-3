/**
 * Payment Processing Service
 * Handles PayStack and M-Pesa payments
 * Supports cards, M-Pesa, and bank transfers
 */

import { apiClient } from '../lib/apiClient';
import { validation } from '../lib/validation';
import { auditLogger } from './auditService';

export type PaymentMethod = 'card' | 'mpesa' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Payment {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  patientId?: string;
  visitId?: string;
  invoiceId?: string;
  description: string;
  customerEmail: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface PaymentConfig {
  paystackPublicKey: string;
  paystackSecretKey: string;
  mpesaConsumerKey: string;
  mpesaConsumerSecret: string;
  mpesaPartyA: string; // Business M-Pesa code
  mpesaCallbackUrl: string;
  environment: 'test' | 'production';
}

/**
 * Payment Service - Main interface for all payment operations
 */
class PaymentService {
  private config: PaymentConfig | null = null;
  private paystackApiUrl = 'https://api.paystack.co';

  /**
   * Initialize payment service with configuration
   */
  initialize(config: Partial<PaymentConfig>): void {
    if (!config.paystackPublicKey || !config.paystackSecretKey) {
      console.warn('PayStack configuration incomplete');
    }
    this.config = config as PaymentConfig;
  }

  /**
   * Get configuration status
   */
  isConfigured(provider: 'paystack' | 'mpesa' | 'all' = 'all'): boolean {
    if (!this.config) return false;

    if (provider === 'paystack') {
      return !!this.config.paystackPublicKey && !!this.config.paystackSecretKey;
    }
    if (provider === 'mpesa') {
      return !!this.config.mpesaConsumerKey && !!this.config.mpesaConsumerSecret;
    }
    return this.isConfigured('paystack') && this.isConfigured('mpesa');
  }

  /**
   * Initialize PayStack payment
   * Returns access code for frontend redirect
   */
  async initializePayStackPayment(
    amount: number,
    email: string,
    metadata: Record<string, any> = {}
  ): Promise<{ accessCode: string; authorizationUrl: string }> {
    if (!this.config?.paystackSecretKey) {
      throw new Error('PayStack not configured');
    }

    if (amount <= 0) {
      throw new Error('Invalid amount');
    }

    if (!validation.isValidEmail(email)) {
      throw new Error('Invalid email');
    }

    try {
      const response = await fetch(`${this.paystackApiUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100), // Convert to cents
          metadata,
          channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money'],
        }),
      });

      if (!response.ok) {
        throw new Error(`PayStack error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message || 'Failed to initialize payment');
      }

      return {
        accessCode: data.data.access_code,
        authorizationUrl: data.data.authorization_url,
      };
    } catch (err: any) {
      console.error('PayStack initialization error:', err);
      throw new Error(err.message || 'Failed to initialize PayStack payment');
    }
  }

  /**
   * Verify PayStack payment
   */
  async verifyPayStackPayment(reference: string): Promise<Payment> {
    if (!this.config?.paystackSecretKey) {
      throw new Error('PayStack not configured');
    }

    if (!reference) {
      throw new Error('Payment reference required');
    }

    try {
      const response = await fetch(`${this.paystackApiUrl}/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${this.config.paystackSecretKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`PayStack error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message || 'Failed to verify payment');
      }

      const txnData = data.data;
      const payment: Payment = {
        id: txnData.id.toString(),
        reference: txnData.reference,
        amount: txnData.amount / 100, // Convert from cents
        currency: txnData.currency,
        method: 'card',
        status: txnData.status === 'success' ? 'completed' : 'failed',
        description: txnData.metadata?.description || 'Payment',
        customerEmail: txnData.customer.email,
        customerPhone: txnData.customer.phone,
        metadata: txnData.metadata,
        createdAt: txnData.created_at,
        completedAt: txnData.paid_at || undefined,
      };

      return payment;
    } catch (err: any) {
      console.error('PayStack verification error:', err);
      throw new Error(err.message || 'Failed to verify PayStack payment');
    }
  }

  /**
   * Initialize M-Pesa STK Push
   */
  async initializeMpesaPayment(
    phoneNumber: string,
    amount: number,
    accountReference: string,
    description: string = ''
  ): Promise<{ checkoutRequestId: string; message: string }> {
    if (!this.config?.mpesaConsumerKey || !this.config?.mpesaConsumerSecret) {
      throw new Error('M-Pesa not configured');
    }

    const phone = validation.sanitizePhone(phoneNumber);
    if (!validation.isValidPhone(phone)) {
      throw new Error('Invalid phone number');
    }

    if (amount <= 0) {
      throw new Error('Invalid amount');
    }

    try {
      // Get M-Pesa access token
      const accessToken = await this.getMpesaAccessToken();

      // Initiate STK Push
      const timestamp = new Date().toISOString().replace(/[:-]/g, '').slice(0, -5);
      const password = Buffer.from(
        `${this.config.mpesaPartyA}${process.env.VITE_MPESA_PASSKEY || ''}${timestamp}`
      ).toString('base64');

      const response = await fetch(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            BusinessShortCode: this.config.mpesaPartyA,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: phone,
            PartyB: this.config.mpesaPartyA,
            PhoneNumber: phone,
            CallBackURL: this.config.mpesaCallbackUrl,
            AccountReference: accountReference,
            TransactionDesc: description,
          }),
        }
      );

      const data = await response.json();
      if (data.ResponseCode !== '0') {
        throw new Error(data.ResponseDescription || 'M-Pesa error');
      }

      return {
        checkoutRequestId: data.CheckoutRequestID,
        message: 'STK prompt sent successfully',
      };
    } catch (err: any) {
      console.error('M-Pesa payment error:', err);
      throw new Error(err.message || 'Failed to initialize M-Pesa payment');
    }
  }

  /**
   * Check M-Pesa payment status
   */
  async checkMpesaPaymentStatus(checkoutRequestId: string): Promise<Payment> {
    if (!this.config?.mpesaConsumerKey || !this.config?.mpesaConsumerSecret) {
      throw new Error('M-Pesa not configured');
    }

    try {
      const accessToken = await this.getMpesaAccessToken();
      const timestamp = new Date().toISOString().replace(/[:-]/g, '').slice(0, -5);
      const password = Buffer.from(
        `${this.config.mpesaPartyA}${process.env.VITE_MPESA_PASSKEY || ''}${timestamp}`
      ).toString('base64');

      const response = await fetch(
        'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            BusinessShortCode: this.config.mpesaPartyA,
            CheckoutRequestID: checkoutRequestId,
            Password: password,
            Timestamp: timestamp,
          }),
        }
      );

      const data = await response.json();
      const isCompleted = data.ResultCode === '0';

      const payment: Payment = {
        id: checkoutRequestId,
        reference: checkoutRequestId,
        amount: 0, // Would need to track separately
        currency: 'KES',
        method: 'mpesa',
        status: isCompleted ? 'completed' : 'pending',
        description: 'M-Pesa Payment',
        customerEmail: '',
        createdAt: new Date().toISOString(),
      };

      return payment;
    } catch (err: any) {
      console.error('M-Pesa status check error:', err);
      throw new Error(err.message || 'Failed to check M-Pesa payment status');
    }
  }

  /**
   * Process refund
   */
  async processRefund(
    reference: string,
    amount: number,
    reason: string
  ): Promise<{ refundReference: string; status: string }> {
    if (!this.config?.paystackSecretKey) {
      throw new Error('PayStack not configured');
    }

    try {
      const response = await fetch(`${this.paystackApiUrl}/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: reference,
          amount: Math.round(amount * 100),
          memo: reason,
        }),
      });

      if (!response.ok) {
        throw new Error(`PayStack error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message || 'Failed to process refund');
      }

      return {
        refundReference: data.data.reference,
        status: data.data.status,
      };
    } catch (err: any) {
      console.error('Refund error:', err);
      throw new Error(err.message || 'Failed to process refund');
    }
  }

  /**
   * Private: Get M-Pesa access token
   */
  private async getMpesaAccessToken(): Promise<string> {
    if (!this.config?.mpesaConsumerKey || !this.config?.mpesaConsumerSecret) {
      throw new Error('M-Pesa not configured');
    }

    try {
      const auth = Buffer.from(
        `${this.config.mpesaConsumerKey}:${this.config.mpesaConsumerSecret}`
      ).toString('base64');

      const response = await fetch(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      const data = await response.json();
      if (!data.access_token) {
        throw new Error('Failed to get access token');
      }

      return data.access_token;
    } catch (err: any) {
      console.error('M-Pesa token error:', err);
      throw new Error(err.message || 'Failed to get M-Pesa access token');
    }
  }

  /**
   * Get payment history for patient
   */
  async getPaymentHistory(patientId: string): Promise<Payment[]> {
    try {
      const response = await apiClient.get(`/payments?patientId=${patientId}`);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data || [];
    } catch (err: any) {
      console.error('Payment history error:', err);
      return [];
    }
  }

  /**
   * Calculate payment split (if multiple recipients)
   */
  calculatePaymentSplit(
    totalAmount: number,
    splits: Array<{ id: string; percentage: number }>
  ): Array<{ id: string; amount: number }> {
    return splits.map((split) => ({
      id: split.id,
      amount: (totalAmount * split.percentage) / 100,
    }));
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

/**
 * Helper: Format amount for display
 */
export function formatAmount(amount: number, currency: string = 'KES'): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Helper: Generate invoice reference
 */
export function generatePaymentReference(prefix: string = 'PAY'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}
