-- 설정 화면의 "회원 탈퇴" 기능을 위해, 자기 자신의 프로필은 스스로
-- 삭제할 수 있도록 허용합니다 (01_auth_and_profiles.sql에는 SELECT/UPDATE
-- 정책만 있고 DELETE 정책이 없었습니다).
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);
