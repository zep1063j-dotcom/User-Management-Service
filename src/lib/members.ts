import { supabase } from './supabaseClient';
import type {
  Member,
  MemberStatus,
  MemberWithMembership,
  Membership,
  MembershipType,
} from '../types/domain';

export async function fetchMembersWithMembership(): Promise<MemberWithMembership[]> {
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false });

  if (membersError) throw membersError;

  const { data: memberships, error: membershipsError } = await supabase
    .from('memberships')
    .select('*')
    .order('created_at', { ascending: false });

  if (membershipsError) throw membershipsError;

  // 회원별 최신 이용권 1건만 추림 (memberships는 최신순 정렬이므로 먼저 나온 것을 사용)
  const latestMembershipByMember = new Map<string, Membership>();
  for (const membership of memberships ?? []) {
    if (!latestMembershipByMember.has(membership.member_id)) {
      latestMembershipByMember.set(membership.member_id, membership);
    }
  }

  return (members ?? []).map((member: Member) => ({
    ...member,
    latestMembership: latestMembershipByMember.get(member.id) ?? null,
  }));
}

export interface CreateMemberInput {
  branch_name: string;
  name: string;
  phone: string;
  email?: string;
  birthdate?: string;
  address?: string;
  memo?: string;
}

export async function createMember(input: CreateMemberInput): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
    .insert({
      branch_name: input.branch_name,
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      birthdate: input.birthdate || null,
      address: input.address || null,
      memo: input.memo || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 회원을 완전히 삭제합니다. 이용권/결제/출석/예약 기록도 함께 삭제됩니다
// (member_id에 on delete cascade가 걸려 있음) — 되돌릴 수 없습니다.
export async function deleteMember(memberId: string): Promise<void> {
  const { error } = await supabase.from('members').delete().eq('id', memberId);
  if (error) throw error;
}

export async function updateMemberStatus(
  memberId: string,
  status: MemberStatus
): Promise<void> {
  const { error } = await supabase
    .from('members')
    .update({ status })
    .eq('id', memberId);

  if (error) throw error;
}

// 이용권 만료일 계산: 기간제는 시작일 + 개월 수, 횟수제는 종료일 없음
export function calculateEndDate(startDate: string, months: number): string {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

export interface CreateMembershipInput {
  member_id: string;
  plan_name: string;
  type: MembershipType;
  start_date: string;
  durationMonths?: number; // type === 'PERIOD'
  totalCount?: number; // type === 'COUNT'
  auto_renew: boolean;
}

export async function createMembership(input: CreateMembershipInput): Promise<Membership> {
  const isPeriod = input.type === 'PERIOD';

  const { data, error } = await supabase
    .from('memberships')
    .insert({
      member_id: input.member_id,
      plan_name: input.plan_name,
      type: input.type,
      start_date: input.start_date,
      end_date: isPeriod && input.durationMonths
        ? calculateEndDate(input.start_date, input.durationMonths)
        : null,
      total_count: isPeriod ? null : input.totalCount ?? null,
      remaining_count: isPeriod ? null : input.totalCount ?? null,
      auto_renew: input.auto_renew,
      status: 'ACTIVE',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
