-- 지점(Branch)을 정식 테이블로 분리합니다. 지금까지 프론트엔드에 4개
-- 지점이 하드코딩되어 있었는데, 이 테이블이 지점 목록의 단일 출처(source
-- of truth)가 되고 관리자가 "지점 관리" 화면에서 지점을 추가/삭제할 수
-- 있게 됩니다.
--
-- members/profiles/attendance/reservations의 branch_name 컬럼은 여전히
-- 자유 텍스트입니다(외래키로 묶지 않음) — 기존 데이터/코드를 건드리지
-- 않기 위한 의도적인 선택입니다. 이 테이블은 "어떤 지점 이름이 유효한가"
-- 를 프론트엔드에 알려주는 역할만 합니다.

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.branches (name)
values ('강남점'), ('홍대점'), ('건대점'), ('판교점')
on conflict (name) do nothing;

alter table public.branches enable row level security;

create policy "branches_select_authenticated" on public.branches
  for select using (auth.role() = 'authenticated');

create policy "branches_insert_admin" on public.branches
  for insert with check (public.is_admin());

create policy "branches_delete_admin" on public.branches
  for delete using (public.is_admin());
