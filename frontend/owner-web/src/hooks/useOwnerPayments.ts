import { useMemo } from 'react'
import { useOwnerMockData } from '../lib/ownerConfig'
import {
  MOCK_OWNER_PAYMENTS,
  MOCK_SETTLEMENT_ACCOUNT,
  type MockOwnerPayment,
  type MockSettlementAccount,
} from '../lib/mocks/ownerMockPayments'

export function useOwnerPayments() {
  const mockMode = useOwnerMockData()

  return useMemo(() => {
    if (!mockMode) {
      return {
        mockMode: false,
        payments: [] as MockOwnerPayment[],
        account: null as MockSettlementAccount | null,
        loading: false,
        error: null as string | null,
      }
    }
    return {
      mockMode: true,
      payments: MOCK_OWNER_PAYMENTS,
      account: MOCK_SETTLEMENT_ACCOUNT,
      loading: false,
      error: null,
    }
  }, [mockMode])
}
