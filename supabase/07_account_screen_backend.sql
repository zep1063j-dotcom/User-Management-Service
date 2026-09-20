-- 계정 화면 백엔드
--
-- 보안 수정: profiles_update_own 정책(01_auth_and_profiles.sql)은 "내 행인지"만
-- 검사할 뿐, 어떤 컬럼이 바뀌는지는 검사하지 않습니다. 그래서 일반 회원이 REST API를
-- 직접 호출하면 자기 role을 'admin'으로 바꾸는 권한 상승이 가능했습니다.
-- 트리거로 막습니다: 관리자가 아니면 role/branch_name은 원래 값으로 강제 유지됩니다.
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
  return new;
end;
$$;

drop trigger if exists profiles_prevent_privilege_escalation on public.profiles;
create trigger profiles_prevent_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_self_privilege_escalation();
