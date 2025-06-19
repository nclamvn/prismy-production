import { Suspense } from 'react'
import { createServerComponentClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import PaymentResult from '@/components/payment/PaymentResult'

async function MoMoReturnContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createServerComponentClient({ cookies })
  const resolvedSearchParams = await searchParams
  
  const orderId = resolvedSearchParams.orderId as string
  const resultCode = resolvedSearchParams.resultCode as string
  
  let transaction = null
  if (orderId) {
    const { data } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .single()
    
    transaction = data
  }

  const isSuccess = resultCode === '0'
  
  return (
    <PaymentResult
      success={isSuccess}
      paymentMethod="momo"
      transaction={transaction}
      language="vi"
    />
  )
}

export default function MoMoReturn({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <Suspense fallback={<div>Đang xử lý kết quả thanh toán...</div>}>
      <MoMoReturnContent searchParams={searchParams} />
    </Suspense>
  )
}

export const metadata = {
  title: 'Kết quả thanh toán MoMo - Prismy',
  description: 'Kết quả thanh toán qua ví MoMo cho dịch vụ Prismy.',
}