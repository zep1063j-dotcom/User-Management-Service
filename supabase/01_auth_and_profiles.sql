-- CRM 로그인 계정(관리자/트레이너/회원용 스태프 계정) 스키마
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null default 'member' check (role in ('admin', 'trainer', 'member')),
  branch_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- 회원가입 폼에서 입력한 이름/소속 지점(raw_user_meta_data)을 이용해
-- auth.users 에 계정이 생성될 때 자동으로 profiles 행을 만들어줍니다.
-- (클라이언트에서 직접 insert하지 않아도 되므로, 이메일 확인 절차가 있어도 안전하게 동작합니다.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, branch_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'branch_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
