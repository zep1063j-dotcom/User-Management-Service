-- 지점별 데이터 접근 제한
-- 지금까지는 "로그인만 하면" 모든 지점의 회원/이용권/결제/출석/예약을 볼 수
-- 있었습니다. 이 스크립트는 스태프가 자기 소속 지점(profiles.branch_name)의
-- 데이터만 보고 쓸 수 있도록 제한하고, role='admin'인 계정만 전체 지점을
-- 볼 수 있게 합니다.

create or replace function public.my_branch_name()
returns text
language sql
security definer
stable
as $$
  select branch_name from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
$$;

alter policy "members_all_authenticated" on public.members
  using (public.is_admin() or branch_name = public.my_branch_name())
  with check (public.is_admin() or branch_name = public.my_branch_name());

alter policy "memberships_all_authenticated" on public.memberships
  using (
    public.is_admin() or exists (
      select 1 from public.members m
      where m.id = memberships.member_id and m.branch_name = public.my_branch_name()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.members m
      where m.id = memberships.member_id and m.branch_name = public.my_branch_name()
    )
  );

alter policy "membership_pauses_all_authenticated" on public.membership_pauses
  using (
    public.is_admin() or exists (
      select 1 from public.memberships ms
      join public.members m on m.id = ms.member_id
      where ms.id = membership_pauses.membership_id
        and m.branch_name = public.my_branch_name()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.memberships ms
      join public.members m on m.id = ms.member_id
      where ms.id = membership_pauses.membership_id
        and m.branch_name = public.my_branch_name()
    )
  );

alter policy "payments_all_authenticated" on public.payments
  using (
    public.is_admin() or exists (
      select 1 from public.members m
      where m.id = payments.member_id and m.branch_name = public.my_branch_name()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.members m
      where m.id = payments.member_id and m.branch_name = public.my_branch_name()
    )
  );

alter policy "attendance_all_authenticated" on public.attendance
  using (public.is_admin() or branch_name = public.my_branch_name())
  with check (public.is_admin() or branch_name = public.my_branch_name());

alter policy "reservations_all_authenticated" on public.reservations
  using (public.is_admin() or branch_name = public.my_branch_name())
  with check (public.is_admin() or branch_name = public.my_branch_name());

-- 관리자만 다른 스태프의 role/branch_name을 변경할 수 있도록 허용합니다.
-- (profiles_select_authenticated는 그대로 두고 UPDATE 정책만 추가합니다)
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());
