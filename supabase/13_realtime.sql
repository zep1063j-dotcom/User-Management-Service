-- 실시간 업데이트를 위해 관련 테이블을 Supabase Realtime 발행 목록에 추가합니다.
-- RLS는 실시간 알림에도 그대로 적용되므로, 이미 보이지 않는 데이터(다른 업체/지점)의
-- 변경은 애초에 알림이 오지 않습니다.
alter publication supabase_realtime add table
  public.members,
  public.memberships,
  public.payments,
  public.branches,
  public.profiles;
