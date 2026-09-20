-- 업체(Organization) 단위 멀티테넌시
--
-- 지금까지는 "관리자(admin)"가 전역 권한이라 다른 업체(학원/헬스장 등)의
-- 스태프·회원 데이터까지 다 보였습니다. 서로 관련 없는 여러 업체가 같은
-- 앱을 함께 쓰게 되면서, "업체"라는 상위 개념을 새로 만들고 모든 접근
-- 권한을 업체 경계 안으로 한정합니다. 한 업체는 여러 지점을 가질 수
-- 있고, 그 업체의 관리자는 자기 업체의 모든 지점을 관리할 수 있지만
-- 다른 업체는 전혀 볼 수 없습니다.

-- 1. organizations 테이블
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);
alter table public.organizations enable row level security;

-- 2. profiles.organization_id (일단 nullable, 아래에서 백필 후 not null)
alter table public.profiles
  add column if not exists organization_id uuid references public.organizations (id);

-- 3. my_organization_id(): profiles.organization_id에 의존하므로 먼저 정의
create or replace function public.my_organization_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- 4. branches.organization_id (신규 지점은 만든 사람의 업체로 자동 지정)
--    my_organization_id()가 이미 정의되어 있어야 default로 쓸 수 있습니다.
alter table public.branches
  add column if not exists organization_id uuid references public.organizations (id)
  default public.my_organization_id();

-- branch_in_my_org(): branches.organization_id가 이미 있어야 하므로 이 뒤에 정의
create or replace function public.branch_in_my_org(p_branch_name text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.branches b
    where b.name = p_branch_name and b.organization_id = public.my_organization_id()
  )
$$;

-- 5. 기존 데이터 백필: 지금까지 만들어진 지점/스태프는 하나의 기본 업체로 묶습니다.
insert into public.organizations (name)
values ('기본 업체')
on conflict (name) do nothing;

update public.branches
set organization_id = (select id from public.organizations where name = '기본 업체')
where organization_id is null;

update public.profiles
set organization_id = (select id from public.organizations where name = '기본 업체')
where organization_id is null;

alter table public.branches alter column organization_id set not null;
alter table public.profiles alter column organization_id set not null;

-- 6. branches.name 전역 unique -> 업체별 unique로 변경 (서로 다른 업체가 같은 지점 이름을 써도 되도록)
alter table public.branches drop constraint if exists branches_name_key;
alter table public.branches
  add constraint branches_org_name_key unique (organization_id, name);

-- 7. organizations RLS: 내 업체만 조회 가능 (client에서 새로 만들거나 수정할 순 없음 - 가입 트리거만 생성)
drop policy if exists "organizations_select_own" on public.organizations;
create policy "organizations_select_own" on public.organizations
  for select using (id = public.my_organization_id());

-- 8. profiles RLS 재정의: 같은 업체 사람만 서로 볼 수 있음
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select using (organization_id = public.my_organization_id());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin() and organization_id = public.my_organization_id());

-- 9. branches RLS 재정의: 업체 범위로 제한
drop policy if exists "branches_select_authenticated" on public.branches;
create policy "branches_select_authenticated" on public.branches
  for select using (organization_id = public.my_organization_id());

drop policy if exists "branches_insert_admin" on public.branches;
create policy "branches_insert_admin" on public.branches
  for insert with check (public.is_admin() and organization_id = public.my_organization_id());

drop policy if exists "branches_delete_admin" on public.branches;
create policy "branches_delete_admin" on public.branches
  for delete using (public.is_admin() and organization_id = public.my_organization_id());

-- 10. members/memberships/membership_pauses/payments/attendance/reservations:
--     "관리자는 같은 업체의 모든 지점, 스태프는 자기 지점만" 으로 재정의합니다.
alter policy "members_all_authenticated" on public.members
  using ((public.is_admin() and public.branch_in_my_org(branch_name)) or branch_name = public.my_branch_name())
  with check ((public.is_admin() and public.branch_in_my_org(branch_name)) or branch_name = public.my_branch_name());

alter policy "memberships_all_authenticated" on public.memberships
  using (
    exists (
      select 1 from public.members m
      where m.id = memberships.member_id
        and ((public.is_admin() and public.branch_in_my_org(m.branch_name)) or m.branch_name = public.my_branch_name())
    )
  )
  with check (
    exists (
      select 1 from public.members m
      where m.id = memberships.member_id
        and ((public.is_admin() and public.branch_in_my_org(m.branch_name)) or m.branch_name = public.my_branch_name())
    )
  );

alter policy "membership_pauses_all_authenticated" on public.membership_pauses
  using (
    exists (
      select 1 from public.memberships ms
      join public.members m on m.id = ms.member_id
      where ms.id = membership_pauses.membership_id
        and ((public.is_admin() and public.branch_in_my_org(m.branch_name)) or m.branch_name = public.my_branch_name())
    )
  )
  with check (
    exists (
      select 1 from public.memberships ms
      join public.members m on m.id = ms.member_id
      where ms.id = membership_pauses.membership_id
        and ((public.is_admin() and public.branch_in_my_org(m.branch_name)) or m.branch_name = public.my_branch_name())
    )
  );

alter policy "payments_all_authenticated" on public.payments
  using (
    exists (
      select 1 from public.members m
      where m.id = payments.member_id
        and ((public.is_admin() and public.branch_in_my_org(m.branch_name)) or m.branch_name = public.my_branch_name())
    )
  )
  with check (
    exists (
      select 1 from public.members m
      where m.id = payments.member_id
        and ((public.is_admin() and public.branch_in_my_org(m.branch_name)) or m.branch_name = public.my_branch_name())
    )
  );

alter policy "attendance_all_authenticated" on public.attendance
  using ((public.is_admin() and public.branch_in_my_org(branch_name)) or branch_name = public.my_branch_name())
  with check ((public.is_admin() and public.branch_in_my_org(branch_name)) or branch_name = public.my_branch_name());

alter policy "reservations_all_authenticated" on public.reservations
  using ((public.is_admin() and public.branch_in_my_org(branch_name)) or branch_name = public.my_branch_name())
  with check ((public.is_admin() and public.branch_in_my_org(branch_name)) or branch_name = public.my_branch_name());

-- 11. organization_id는 관리자를 포함해 그 누구도 바꿀 수 없도록 트리거 보강
--     (기존에는 role/branch_name만 막았는데, 업체를 옮겨 타는 것도 막아야 합니다)
create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.branch_name := old.branch_name;
  end if;
  new.organization_id := old.organization_id;
  return new;
end;
$$;

-- 12. 회원가입 트리거 재정의: 메타데이터의 업체명이 이미 있으면 그 업체의
--     'member'로 합류시키고, 없으면 새 업체를 만들면서 그 사람이 최초
--     관리자(admin)가 됩니다. 지점도 없으면 해당 업체 소속으로 자동 생성합니다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_org_id uuid;
  v_org_name text := trim(coalesce(new.raw_user_meta_data ->> 'organization_name', ''));
  v_branch_name text := trim(coalesce(new.raw_user_meta_data ->> 'branch_name', ''));
  v_role text := 'member';
begin
  if v_org_name = '' then
    raise exception '업체명을 입력해주세요.';
  end if;

  select id into v_org_id from public.organizations where name = v_org_name;

  if v_org_id is null then
    insert into public.organizations (name) values (v_org_name) returning id into v_org_id;
    v_role := 'admin';
  end if;

  if v_branch_name <> '' and not exists (
    select 1 from public.branches where organization_id = v_org_id and name = v_branch_name
  ) then
    insert into public.branches (organization_id, name) values (v_org_id, v_branch_name);
  end if;

  insert into public.profiles (id, name, branch_name, phone, organization_id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    v_branch_name,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    v_org_id,
    v_role
  );
  return new;
end;
$$;
