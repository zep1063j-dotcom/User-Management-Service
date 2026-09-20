import { supabase } from './supabaseClient';
import type { Attendance, Membership } from '../types/domain';

// 체크인 시 횟수제 이용권은 잔여 횟수를 1 차감합니다 (0이 되면 만료 처리).
// 기간제 이용권은 횟수 개념이 없으므로 상태를 건드리지 않습니다.
export async function checkIn(
  memberId: string,
  branchName: string,
  membership?: Membership | null
): Promise<Attendance> {
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      member_id: memberId,
      membership_id: membership?.id ?? null,
      branch_name: branchName,
    })
    .select()
    .single();

  if (error) throw error;

  if (membership && membership.type === 'COUNT' && membership.status === 'ACTIVE') {
    const remaining = Math.max(0, (membership.remaining_count ?? 0) - 1);
    const { error: membershipError } = await supabase
      .from('memberships')
      .update({
        remaining_count: remaining,
        status: remaining === 0 ? 'EXPIRED' : membership.status,
      })
      .eq('id', membership.id);
    if (membershipError) throw membershipError;
  }

  return data;
}

export async function fetchAttendanceForMember(memberId: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('member_id', memberId)
    .order('checked_in_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}
