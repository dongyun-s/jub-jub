declare module '@portone/browser-sdk' {
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
    transactionId?: string
    code?: string
    message?: string
  }

  export function requestPayment(request: PortOnePaymentRequest): Promise<PortOnePaymentResponse>
}

export {}

