-- 결제 지연/미납 추적을 위한 스키마 확장
--
-- 지금까지 payments는 "이용권 등록과 동시에 즉시 결제 완료"만 표현할 수
-- 있었습니다. 실제 결제 게이트웨이 연동 전까지는 카드 자동 청구를 할 수
-- 없으므로, "청구(예정)" 상태를 추가해 스태프가 직접 청구를 만들고,
-- 입금/결제를 확인하면 수동으로 완료 처리하는 흐름으로 설계합니다.
--
-- - status에 'PENDING' 추가 (청구는 만들었지만 아직 결제되지 않음)
-- - due_date: 결제 마감 예정일. status='PENDING' AND due_date < 오늘 이면
--   "미납/연체"로 간주합니다 (별도 상태 컬럼 없이 계산으로 판정).

alter table public.payments
  add column if not exists due_date date;

alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check
  check (status in ('PENDING', 'PAID', 'REFUNDED', 'PARTIALLY_REFUNDED', 'FAILED'));
