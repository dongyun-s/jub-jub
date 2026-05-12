declare module 'https://cdn.portone.io/v2/browser-sdk.esm.js' {
  export interface PortOnePaymentRequest {
    storeId: string
    channelKey: string
    paymentId: string
    orderName: string
    customer?: {
      email?: string
      fullName?: string
      phoneNumber?: string
    }
    totalAmount: number
    currency?: string
    payMethod?: string
  }

  export interface PortOnePaymentResponse {
    paymentId?: string
    /** 일부 환경에서 txId로 내려옴 */
    transactionId?: string
    txId?: string
    transactionType?: string
    code?: string
    message?: string
  }

  export function requestPayment(request: PortOnePaymentRequest): Promise<PortOnePaymentResponse>
}

