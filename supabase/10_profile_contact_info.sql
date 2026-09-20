-- 계정 화면에서 이름/이메일/전화번호를 하나로 묶어 관리하기 위해
-- profiles에 phone 컬럼을 추가하고, 회원가입 시 메타데이터의 phone도 함께 저장합니다.
alter table public.profiles
  add column if not exists phone text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, branch_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'branch_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;
