-- 헬스장/멤버십 CRM 핵심 도메인 스키마
-- members / memberships 는 회원·이용권 관리 화면에서 실제로 사용합니다.
-- payments / attendance / reservations 는 아직 프론트엔드에서 쓰지 않지만,
-- anon key로 누구나 접근하지 못하도록 미리 RLS를 걸어둡니다.
--
-- 설계 원칙:
--  - "회원 상태(활성/휴면/탈퇴)"와 "이용권 상태(진행중/일시정지/만료/취소)"는
--    서로 다른 개념이므로 별도 테이블로 분리합니다.
--  - 이용권 정지/재개 이력을 별도 테이블로 남겨, 만료일 연장 계산의 근거로 사용합니다.
--  - 결제 환불 시 잔여 횟수 계산이 가능하도록 결제-이용권을 연결합니다.

-- 회원 (헬스장 고객, CRM 로그인 계정인 profiles와는 다른 개념)
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  branch_name text not null,
  name text not null,
  phone text not null,
  email text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'DORMANT', 'WITHDRAWN')),
  birthdate date,
  address text,
  memo text,
  created_at timestamptz not null default now()
);

-- 이용권/멤버십 (기간제 또는 횟수제)
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  plan_name text not null,
  type text not null check (type in ('PERIOD', 'COUNT')),
  total_count integer,
  remaining_count integer,
  start_date date not null,
  end_date date,
  auto_renew boolean not null default false,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED')),
  created_at timestamptz not null default now()
);

-- 이용권 정지/재개 이력 (만료일 연장 계산의 근거 데이터)
create table if not exists public.membership_pauses (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships (id) on delete cascade,
  paused_at date not null,
  resumed_at date,
  reason text,
  created_at timestamptz not null default now()
);

-- 결제/구독
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  membership_id uuid references public.memberships (id) on delete set null,
  amount numeric(12, 2) not null,
  payment_method text not null,
  is_recurring boolean not null default false,
  status text not null default 'PAID' check (status in ('PAID', 'REFUNDED', 'PARTIALLY_REFUNDED', 'FAILED')),
  refunded_amount numeric(12, 2),
  refunded_count integer,
  paid_at timestamptz not null default now()
);

-- 출석/체크인
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  membership_id uuid references public.memberships (id) on delete set null,
  branch_name text not null,
  checked_in_at timestamptz not null default now()
);

-- 수업/PT 예약
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  trainer_id uuid references public.profiles (id) on delete set null,
  branch_name text not null,
  class_type text not null check (class_type in ('PT', 'GROUP_CLASS')),
  reserved_at timestamptz not null,
  status text not null default 'BOOKED' check (status in ('BOOKED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  created_at timestamptz not null default now()
);

-- RLS: 로그인한 CRM 스태프(관리자/트레이너)만 접근 가능하도록 제한합니다.
-- 지점별 접근 제한(자기 지점 데이터만 보기)은 branches가 정식 테이블로
-- 분리되는 다음 단계에서 추가할 예정입니다. 지금은 "로그인 여부"만 검사합니다.
alter table public.members enable row level security;
alter table public.memberships enable row level security;
alter table public.membership_pauses enable row level security;
alter table public.payments enable row level security;
alter table public.attendance enable row level security;
alter table public.reservations enable row level security;

create policy "members_all_authenticated" on public.members
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "memberships_all_authenticated" on public.memberships
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "membership_pauses_all_authenticated" on public.membership_pauses
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "payments_all_authenticated" on public.payments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "attendance_all_authenticated" on public.attendance
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "reservations_all_authenticated" on public.reservations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
