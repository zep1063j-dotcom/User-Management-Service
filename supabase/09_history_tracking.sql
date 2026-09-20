-- 기록(History) 화면 백엔드
--
-- "이번 달/월별 그만둔 사람" 집계를 하려면 회원이 탈퇴 상태가 된 시점이 필요한데,
-- members 테이블에는 현재 상태(status)만 있고 언제 그 상태가 되었는지는 기록되지 않습니다.
-- withdrawn_at 컬럼을 추가하고, 트리거로 status가 WITHDRAWN으로 바뀔 때 자동 기록합니다
-- (반대로 WITHDRAWN에서 다른 상태로 되돌리면 초기화합니다).
alter table public.members
  add column if not exists withdrawn_at timestamptz;

create or replace function public.track_member_withdrawn_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'WITHDRAWN' and old.status is distinct from 'WITHDRAWN' then
    new.withdrawn_at := now();
  elsif new.status is distinct from 'WITHDRAWN' and old.status = 'WITHDRAWN' then
    new.withdrawn_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists members_track_withdrawn_at on public.members;
create trigger members_track_withdrawn_at
  before update on public.members
  for each row execute function public.track_member_withdrawn_at();
