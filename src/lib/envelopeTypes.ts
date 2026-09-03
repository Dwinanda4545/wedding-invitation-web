export type DigitalEnvelopeSettings = {
  presets?: number[]
  min_amount?: number
  max_amount?: number
}

export const DEFAULT_DIGITAL_ENVELOPE_SETTINGS: Required<DigitalEnvelopeSettings> = {
  presets: [50000, 100000, 200000],
  min_amount: 10000,
  max_amount: 10000000,
}

export function mergeDigitalEnvelopeSettings(
  partial?: DigitalEnvelopeSettings | null,
): Required<DigitalEnvelopeSettings> {
  return {
    ...DEFAULT_DIGITAL_ENVELOPE_SETTINGS,
    ...partial,
  }
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export type EnvelopePaymentResult = 'success' | 'pending' | 'failed' | null

export function parseEnvelopePaymentResult(
  params: URLSearchParams,
): EnvelopePaymentResult {
  const resultCode = params.get('resultCode')
  if (resultCode === '00') return 'success'
  if (resultCode === '01') return 'pending'
  if (resultCode === '02') return 'failed'
  if (params.get('envelope') === 'success') return 'success'
  if (params.get('envelope') === 'failed') return 'failed'
  return null
}

export type EnvelopeTransactionRow = {
  id: number
  sender_name: string
  sender_email: string | null
  sender_phone: string | null
  amount: number
  message: string | null
  payment_method: string | null
  status: 'pending' | 'paid' | 'expired' | 'failed'
  order_id: string
  paid_at: string | null
  created_at: string
}

export type EnvelopeTransactionsResponse = {
  summary: {
    total_paid_amount: number
    paid_count: number
    pending_count: number
  }
  data: EnvelopeTransactionRow[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type CreateEnvelopeResponse = {
  data: {
    order_id: string
    payment_url: string
    amount: number
    status: string
  }
}
