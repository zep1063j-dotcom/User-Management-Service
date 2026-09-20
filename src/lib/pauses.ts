import { supabase } from './supabaseClient';
import type { Membership, MembershipPause } from '../types/domain';

const todayString = () => new Date().toISOString().slice(0, 10);

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function diffDays(fromStr: string, toStr: string): number {
  const from = new Date(fromStr).getTime();
  const to = new Date(toStr).getTime();
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

export async function pauseMembership(
  membership: Membership,
  reason?: string
): Promise<void> {
  const { error: pauseError } = await supabase.from('membership_pauses').insert({
    membership_id: membership.id,
    paused_at: todayString(),
    reason: reason || null,
  });
  if (pauseError) throw pauseError;

  const { error: membershipError } = await supabase
    .from('memberships')
    .update({ status: 'PAUSED' })
    .eq('id', membership.id);
  if (membershipError) throw membershipError;
}

// 재개 시, 정지된 일수만큼 만료일을 뒤로 미룹니다 (기간제만 해당).
export async function resumeMembership(membership: Membership): Promise<void> {
  const { data: openPause, error: fetchError } = await supabase
    .from('membership_pauses')
    .select('*')
    .eq('membership_id', membership.id)
    .is('resumed_at', null)
    .order('paused_at', { ascending: false })
    .limit(1)
    .maybeSingle<MembershipPause>();
  if (fetchError) throw fetchError;

  const resumedAt = todayString();

  if (openPause) {
    const { error: pauseUpdateError } = await supabase
      .from('membership_pauses')
      .update({ resumed_at: resumedAt })
      .eq('id', openPause.id);
    if (pauseUpdateError) throw pauseUpdateError;
  }

  const pausedDays = openPause ? diffDays(openPause.paused_at, resumedAt) : 0;
  const newEndDate =
    membership.type === 'PERIOD' && membership.end_date && pausedDays > 0
      ? addDays(membership.end_date, pausedDays)
      : membership.end_date;

  const { error: membershipError } = await supabase
    .from('memberships')
    .update({ status: 'ACTIVE', end_date: newEndDate })
    .eq('id', membership.id);
  if (membershipError) throw membershipError;
}

export async function fetchPausesForMembership(
  membershipId: string
): Promise<MembershipPause[]> {
  const { data, error } = await supabase
    .from('membership_pauses')
    .select('*')
    .eq('membership_id', membershipId)
    .order('paused_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
