import type { Member, Payment } from '../types/domain';

export interface MonthlyStat {
  key: string; // 'YYYY-MM'
  label: string; // '9월'
  revenue: number;
  newMembers: number;
  withdrawnMembers: number;
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function monthLabel(key: string): string {
  const month = Number(key.slice(5, 7));
  return `${month}월`;
}

// 최근 count개월(이번 달 포함)을 과거 → 현재 순서로 반환합니다.
export function recentMonthKeys(count: number, now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

// members/payments 원본 데이터를 월별로 집계합니다.
// - 매출: PAID/PARTIALLY_REFUNDED/REFUNDED 상태 결제의 (결제액 - 환불액) 합계, paid_at 기준 월
// - 신규 등록: created_at 기준 월
// - 탈퇴: status === 'WITHDRAWN'인 회원의 withdrawn_at 기준 월
export function buildMonthlyHistory(
  members: Member[],
  payments: Payment[],
  monthsBack = 6
): MonthlyStat[] {
  const keys = recentMonthKeys(monthsBack);
  const statByKey = new Map<string, MonthlyStat>();
  for (const key of keys) {
    statByKey.set(key, { key, label: monthLabel(key), revenue: 0, newMembers: 0, withdrawnMembers: 0 });
  }

  for (const payment of payments) {
    if (
      payment.status !== 'PAID' &&
      payment.status !== 'PARTIALLY_REFUNDED' &&
      payment.status !== 'REFUNDED'
    ) {
      continue;
    }
    const stat = statByKey.get(monthKey(payment.paid_at));
    if (stat) stat.revenue += payment.amount - (payment.refunded_amount ?? 0);
  }

  for (const member of members) {
    const createdStat = statByKey.get(monthKey(member.created_at));
    if (createdStat) createdStat.newMembers += 1;

    if (member.status === 'WITHDRAWN' && member.withdrawn_at) {
      const withdrawnStat = statByKey.get(monthKey(member.withdrawn_at));
      if (withdrawnStat) withdrawnStat.withdrawnMembers += 1;
    }
  }

  return keys.map((key) => statByKey.get(key)!);
}
