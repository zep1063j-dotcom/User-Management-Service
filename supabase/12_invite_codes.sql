-- 업체명 중복 문제 해결
--
-- 지금까지는 회원가입 시 입력한 "업체명"이 기존 이름과 완전히 같으면
-- 자동으로 그 업체에 합류하는 방식이었습니다. 서로 관련 없는 두 업체가
-- 우연히 같은 이름을 쓰면 데이터가 섞이는 문제가 있어, 이름은 그냥
-- 표시용 라벨로 바꾸고 실제 "합류 여부"는 업체마다 고유하게 생성되는
-- 초대 코드로만 판단하도록 변경합니다.

-- 1. organizations.name 전역 unique 제거 (이름 중복 허용, 그냥 라벨)
alter table public.organizations drop constraint if exists organizations_name_key;

-- 2. invite_code 컬럼 추가
alter table public.organizations add column if not exists invite_code text;

-- 3. 고유 초대 코드 생성 함수
create or replace function public.generate_invite_code()
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_code text;
  v_exists boolean;
begin
  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    select exists(select 1 from public.organizations where invite_code = v_code) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$;

-- 4. 기존 업체들에 코드 백필 후 not null + unique 제약
update public.organizations
set invite_code = public.generate_invite_code()
where invite_code is null;

alter table public.organizations alter column invite_code set not null;
alter table public.organizations drop constraint if exists organizations_invite_code_key;
alter table public.organizations add constraint organizations_invite_code_key unique (invite_code);

-- 5. 회원가입 트리거 재정의: 업체명이 아니라 초대 코드로 "기존 업체 합류" 여부를 판단합니다.
--    가입 코드가 있으면 그 업체의 'member'로 합류, 없으면(업체명 입력) 새 업체를
--    만들고 그 사람이 최초 관리자(admin)가 됩니다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_org_id uuid;
  v_org_name text := trim(coalesce(new.raw_user_meta_data ->> 'organization_name', ''));
  v_invite_code text := upper(trim(coalesce(new.raw_user_meta_data ->> 'invite_code', '')));
  v_branch_name text := trim(coalesce(new.raw_user_meta_data ->> 'branch_name', ''));
  v_role text := 'member';
begin
  if v_invite_code <> '' then
    select id into v_org_id from public.organizations where invite_code = v_invite_code;
    if v_org_id is null then
      raise exception '유효하지 않은 가입 코드입니다.';
    end if;
  else
    if v_org_name = '' then
      raise exception '업체명을 입력해주세요.';
    end if;

    insert into public.organizations (name, invite_code)
    values (v_org_name, public.generate_invite_code())
    returning id into v_org_id;
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
