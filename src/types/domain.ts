// CRM 핵심 도메인 타입
// 회원(Member) 상태와 이용권(Membership) 상태는 서로 다른 개념이므로
// 별도 타입으로 분리합니다. supabase/02_membership_domain_draft.sql 스키마와 대응됩니다.

export type MemberStatus = 'ACTIVE' | 'DORMANT' | 'WITHDRAWN';

export interface Member {
  id: string;
  branch_name: string;
  name: string;
  phone: string;
  email: string | null;
  status: MemberStatus;
  birthdate: string | null;
  address: string | null;
  memo: string | null;
  created_at: string;
  withdrawn_at: string | null;
}

export type MembershipType = 'PERIOD' | 'COUNT';
export type MembershipStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';

export interface Membership {
  id: string;
  member_id: string;
  plan_name: string;
  type: MembershipType;
  total_count: number | null;
  remaining_count: number | null;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  status: MembershipStatus;
  created_at: string;
}

// 회원 목록 화면에서 쓰는, 회원 + 최신 이용권을 합친 뷰 모델
export interface MemberWithMembership extends Member {
  latestMembership: Membership | null;
}

export interface MembershipPause {
  id: string;
  membership_id: string;
  paused_at: string;
  resumed_at: string | null;
  reason: string | null;
  created_at: string;
}

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'FAILED';

export interface Payment {
  id: string;
  member_id: string;
  membership_id: string | null;
  amount: number;
  payment_method: string;
  is_recurring: boolean;
  status: PaymentStatus;
  refunded_amount: number | null;
  refunded_count: number | null;
  due_date: string | null;
  paid_at: string;
}

export interface Attendance {
  id: string;
  member_id: string;
  membership_id: string | null;
  branch_name: string;
  checked_in_at: string;
}

export type ReservationClassType = 'PT' | 'GROUP_CLASS';
export type ReservationStatus = 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Reservation {
  id: string;
  member_id: string;
  trainer_id: string | null;
  branch_name: string;
  class_type: ReservationClassType;
  reserved_at: string;
  status: ReservationStatus;
  created_at: string;
}

export interface Trainer {
  id: string;
  name: string;
  branch_name: string;
}

export type StaffRole = 'admin' | 'trainer' | 'member';

export interface Profile {
  id: string;
  name: string;
  phone: string | null;
  role: StaffRole;
  branch_name: string;
  organization_id: string;
  created_at: string;
}

export interface Branch {
  id: string;
  name: string;
  organization_id: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}
