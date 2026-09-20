import { supabase } from './supabaseClient';
import type { Membership, Payment } from '../types/domain';

export interface CreatePaymentInput {
  member_id: string;
  membership_id?: string;
  amount: number;
  payment_method: string;
  is_recurring: boolean;
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      member_id: input.member_id,
      membership_id: input.membership_id ?? null,
      amount: input.amount,
      payment_method: input.payment_method,
      is_recurring: input.is_recurring,
      status: 'PAID',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchPaymentsSince(sinceIso: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .gte('paid_at', sinceIso);

  if (error) throw error;
  return data ?? [];
}

export async function fetchPendingPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'PENDING');

  if (error) throw error;
  return data ?? [];
}

export interface CreatePendingPaymentInput {
  member_id: string;
  membership_id?: string;
  amount: number;
  payment_method: string;
  is_recurring: boolean;
  due_date: string;
}

// 청구(예정) 생성: 아직 결제되지 않은 상태로 payments 행을 만듭니다.
// due_date가 지나도록 결제 확인이 안 되면 "미납"으로 간주됩니다.
export async function createPendingPayment(
  input: CreatePendingPaymentInput
): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      member_id: input.member_id,
      membership_id: input.membership_id ?? null,
      amount: input.amount,
      payment_method: input.payment_method,
      is_recurring: input.is_recurring,
      status: 'PENDING',
      due_date: input.due_date,
      paid_at: input.due_date,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 청구된 결제를 "완료"로 확정합니다 (입금/결제 확인 후 스태프가 직접 처리).
export async function markPaymentPaid(paymentId: string): Promise<void> {
  const { error } = await supabase
    .from('payments')
    .update({ status: 'PAID', paid_at: new Date().toISOString() })
    .eq('id', paymentId);

  if (error) throw error;
}

export function isOverdue(payment: Payment): boolean {
  if (payment.status !== 'PENDING' || !payment.due_date) return false;
  return new Date(payment.due_date).getTime() < new Date().setHours(0, 0, 0, 0);
}

export async function fetchPaymentsForMember(memberId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('member_id', memberId)
    .order('paid_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchLatestPaymentForMembership(
  membershipId: string
): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('membership_id', membershipId)
    .eq('status', 'PAID')
    .order('paid_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// 환불 시 잔여 횟수/기간 기준으로 환불 금액을 계산합니다.
// - 횟수제: 원금 * (잔여 횟수 / 총 횟수)
// - 기간제: 원금 * (잔여 일수 / 총 이용 일수), 남은 기간이 없으면 0
export function calculateRefundAmount(membership: Membership, payment: Payment): number {
  if (membership.type === 'COUNT') {
    if (!membership.total_count) return 0;
    const remaining = membership.remaining_count ?? 0;
    return Math.round((payment.amount * remaining) / membership.total_count);
  }

  if (!membership.end_date) return 0;
  const start = new Date(membership.start_date).getTime();
  const end = new Date(membership.end_date).getTime();
  const today = Date.now();
  const totalDays = Math.max(1, Math.round((end - start) / 86_400_000));
  const remainingDays = Math.max(0, Math.round((end - today) / 86_400_000));
  return Math.round((payment.amount * remainingDays) / totalDays);
}

export interface RefundMembershipParams {
  membership: Membership;
  payment: Payment | null;
  refundAmount: number;
}

// 이용권 환불 처리: 결제 기록을 환불 상태로 바꾸고, 이용권은 취소 처리합니다.
export async function refundMembership({
  membership,
  payment,
  refundAmount,
}: RefundMembershipParams): Promise<void> {
  const refundedCount =
    membership.type === 'COUNT' ? membership.remaining_count ?? 0 : null;

  if (payment) {
    const isFullRefund = refundAmount >= payment.amount;
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refunded_amount: refundAmount,
        refunded_count: refundedCount,
      })
      .eq('id', payment.id);

    if (paymentError) throw paymentError;
  }

  const { error: membershipError } = await supabase
    .from('memberships')
    .update({
      status: 'CANCELLED',
      remaining_count: membership.type === 'COUNT' ? 0 : membership.remaining_count,
    })
    .eq('id', membership.id);

  if (membershipError) throw membershipError;
}
