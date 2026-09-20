-- 예약 등록 화면에서 트레이너 목록을 보여주려면, 스태프가 서로의
-- 이름/역할/소속 지점을 조회할 수 있어야 합니다. 01_auth_and_profiles.sql의
-- profiles_select_own 정책(자기 자신만 조회 가능)은 그대로 두고, 로그인한
-- 스태프라면 누구나 프로필 목록을 볼 수 있는 정책을 추가합니다.
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');
