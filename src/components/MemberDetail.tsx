import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  UserCheck,
  CalendarPlus,
  Plus,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import type {
  MemberWithMembership,
  MemberStatus,
  Payment,
  Attendance,
  Reservation,
  ReservationClassType,
  Trainer,
} from '../types/domain';
import { updateMemberStatus } from '../lib/members';
import {
  fetchPaymentsForMember,
  fetchLatestPaymentForMembership,
  calculateRefundAmount,
  refundMembership,
  createPendingPayment,
  markPaymentPaid,
  isOverdue,
} from '../lib/payments';
import { pauseMembership, resumeMembership } from '../lib/pauses';
import { checkIn, fetchAttendanceForMember } from '../lib/attendance';
import {
  fetchTrainers,
  createReservation,
  fetchReservationsForMember,
} from '../lib/reservations';

interface MemberDetailProps {
  member: MemberWithMembership;
  onClose: () => void;
  onUpdated: () => void;
  onRegisterMembership: () => void;
}

const memberStatusLabel: Record<MemberStatus, string> = {
  ACTIVE: '활성',
  DORMANT: '휴면',
  WITHDRAWN: '탈퇴',
};

const membershipStatusLabel: Record<string, string> = {
  ACTIVE: '정상 이용중',
  PAUSED: '일시 정지',
  EXPIRED: '만료',
  CANCELLED: '취소/환불',
};

const reservationStatusLabel: Record<string, string> = {
  BOOKED: '예약됨',
  COMPLETED: '완료',
  CANCELLED: '취소',
  NO_SHOW: '노쇼',
};

const paymentStatusLabel: Record<string, string> = {
  PENDING: '청구됨',
  PAID: '결제완료',
  REFUNDED: '환불',
  PARTIALLY_REFUNDED: '부분환불',
  FAILED: '실패',
};

const todayString = () => new Date().toISOString().slice(0, 10);
const cardClass =
  'bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm';
const inputClass =
  'px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500';

export default function MemberDetail({
  member,
  onClose,
  onUpdated,
  onRegisterMembership,
}: MemberDetailProps) {
  const membership = member.latestMembership;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showRefundPanel, setShowRefundPanel] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);

  const [reservationTrainerId, setReservationTrainerId] = useState('');
  const [reservationClassType, setReservationClassType] =
    useState<ReservationClassType>('PT');
  const [reservationDateTime, setReservationDateTime] = useState('');

  const [showBillForm, setShowBillForm] = useState(false);
  const [billAmount, setBillAmount] = useState(0);
  const [billMethod, setBillMethod] = useState('카드');
  const [billDueDate, setBillDueDate] = useState(todayString());
  const [billIsRecurring, setBillIsRecurring] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [paymentsData, attendanceData, reservationsData, trainersData] =
        await Promise.all([
          fetchPaymentsForMember(member.id),
          fetchAttendanceForMember(member.id),
          fetchReservationsForMember(member.id),
          fetchTrainers(member.branch_name),
        ]);
      setPayments(paymentsData);
      setAttendance(attendanceData);
      setReservations(reservationsData);
      setTrainers(trainersData);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : '상세 정보를 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }, [member.id, member.branch_name]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const runAction = async (action: () => Promise<void>) => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      onUpdated();
      await loadDetail();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : '작업 중 오류가 발생했습니다.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = (status: MemberStatus) => {
    runAction(() => updateMemberStatus(member.id, status));
  };

  const handlePause = () => {
    if (!membership) return;
    runAction(() => pauseMembership(membership));
  };

  const handleResume = () => {
    if (!membership) return;
    runAction(() => resumeMembership(membership));
  };

  const openRefundPanel = async () => {
    if (!membership) return;
    const payment = await fetchLatestPaymentForMembership(membership.id);
    setRefundAmount(payment ? calculateRefundAmount(membership, payment) : 0);
    setShowRefundPanel(true);
  };

  const handleRefund = () => {
    if (!membership) return;
    runAction(async () => {
      const payment = await fetchLatestPaymentForMembership(membership.id);
      await refundMembership({ membership, payment, refundAmount });
      setShowRefundPanel(false);
    });
  };

  const handleCheckIn = () => {
    runAction(async () => {
      await checkIn(member.id, member.branch_name, membership);
    });
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (billAmount <= 0) return;
    runAction(async () => {
      await createPendingPayment({
        member_id: member.id,
        membership_id: membership?.id,
        amount: billAmount,
        payment_method: billMethod,
        is_recurring: billIsRecurring,
        due_date: billDueDate,
      });
      setShowBillForm(false);
      setBillAmount(0);
    });
  };

  const handleMarkPaid = (paymentId: string) => {
    runAction(() => markPaymentPaid(paymentId));
  };

  const handleReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationDateTime) return;
    runAction(async () => {
      await createReservation({
        member_id: member.id,
        trainer_id: reservationTrainerId || undefined,
        branch_name: member.branch_name,
        class_type: reservationClassType,
        reserved_at: new Date(reservationDateTime).toISOString(),
      });
      setReservationDateTime('');
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 pb-20">
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            type="button"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
              <LayoutDashboard size={18} className="shrink-0" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowLeft size={18} className="text-slate-400" />
              홈으로
            </span>
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-6">
        {/* 회원 정보 헤더 */}
        <div
          className={`${cardClass} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}
        >
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {member.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {member.phone} · {member.branch_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">회원 상태</span>
            <select
              value={member.status}
              onChange={(e) =>
                handleStatusChange(e.target.value as MemberStatus)
              }
              disabled={busy}
              className={`font-bold ${inputClass}`}
            >
              {(Object.keys(memberStatusLabel) as MemberStatus[]).map(
                (status) => (
                  <option key={status} value={status}>
                    {memberStatusLabel[status]}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {actionError && (
          <p className="text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 rounded-xl">
            {actionError}
          </p>
        )}

        {/* 이용권 카드 */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              이용권
            </h2>
            <button
              onClick={onRegisterMembership}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
            >
              <Plus size={14} className="shrink-0" />새 이용권 등록
            </button>
          </div>

          {!membership ? (
            <p className="text-sm text-slate-400">등록된 이용권이 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-slate-900 dark:text-white">
                  {membership.plan_name}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                  {membershipStatusLabel[membership.status] ??
                    membership.status}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {membership.type === 'PERIOD'
                    ? `만료일 ${membership.end_date ?? '-'}`
                    : `잔여 ${membership.remaining_count ?? 0} / ${membership.total_count ?? 0}회`}
                </span>
                {membership.auto_renew && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-md">
                    자동갱신
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {membership.status === 'ACTIVE' && (
                  <button
                    onClick={handlePause}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-950 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Pause size={14} className="shrink-0" />
                    일시정지
                  </button>
                )}
                {membership.status === 'PAUSED' && (
                  <button
                    onClick={handleResume}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-950 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Play size={14} className="shrink-0" />
                    재개
                  </button>
                )}
                {(membership.status === 'ACTIVE' ||
                  membership.status === 'PAUSED') && (
                  <button
                    onClick={openRefundPanel}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-950 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <RotateCcw size={14} className="shrink-0" />
                    환불
                  </button>
                )}
              </div>

              {showRefundPanel && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    잔여{' '}
                    {membership.type === 'COUNT'
                      ? `횟수(${membership.remaining_count ?? 0}회)`
                      : '기간'}{' '}
                    기준으로 계산된 환불 예상 금액입니다. 필요 시 직접
                    수정하세요.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      className={`w-40 ${inputClass}`}
                    />
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      원
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRefundPanel(false)}
                      className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleRefund}
                      disabled={busy}
                      className="px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50"
                    >
                      환불 확정
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 결제 내역 */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              결제 내역
            </h2>
            <button
              onClick={() => setShowBillForm((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
            >
              <Receipt size={14} className="shrink-0" />
              청구 등록
            </button>
          </div>

          {showBillForm && (
            <form
              onSubmit={handleCreateBill}
              className="mb-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              <input
                type="number"
                min={1}
                required
                value={billAmount || ''}
                onChange={(e) => setBillAmount(Number(e.target.value))}
                placeholder="청구 금액"
                className={inputClass}
              />
              <select
                value={billMethod}
                onChange={(e) => setBillMethod(e.target.value)}
                className={inputClass}
              >
                <option value="카드">카드</option>
                <option value="현금">현금</option>
                <option value="계좌이체">계좌이체</option>
              </select>
              <input
                type="date"
                required
                value={billDueDate}
                onChange={(e) => setBillDueDate(e.target.value)}
                className={inputClass}
              />
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                청구 생성
              </button>
              <label className="col-span-2 sm:col-span-4 flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={billIsRecurring}
                  onChange={(e) => setBillIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  정기결제
                </span>
              </label>
            </form>
          )}

          {loading ? (
            <p className="text-sm text-slate-400">불러오는 중...</p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-slate-400">결제 내역이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-400 text-xs">
                  <tr>
                    <th className="py-2 pr-4 font-bold">금액</th>
                    <th className="py-2 pr-4 font-bold">수단</th>
                    <th className="py-2 pr-4 font-bold">상태</th>
                    <th className="py-2 pr-4 font-bold">환불액</th>
                    <th className="py-2 pr-4 font-bold">날짜</th>
                    <th className="py-2 font-bold text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((payment) => {
                    const overdue = isOverdue(payment);
                    return (
                      <tr key={payment.id}>
                        <td className="py-2 pr-4 font-bold text-slate-700 dark:text-slate-200">
                          {payment.amount.toLocaleString()}원
                        </td>
                        <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">
                          {payment.payment_method}
                        </td>
                        <td className="py-2 pr-4">
                          {overdue ? (
                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/50 rounded-md">
                              미납
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md ${
                                payment.status === 'PENDING'
                                  ? 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50'
                                  : payment.status === 'PAID'
                                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50'
                                    : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                              }`}
                            >
                              {paymentStatusLabel[payment.status] ??
                                payment.status}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">
                          {payment.refunded_amount != null
                            ? `${payment.refunded_amount.toLocaleString()}원`
                            : '-'}
                        </td>
                        <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">
                          {payment.status === 'PENDING'
                            ? `마감 ${payment.due_date ?? '-'}`
                            : payment.paid_at.slice(0, 10)}
                        </td>
                        <td className="py-2 text-right">
                          {payment.status === 'PENDING' && (
                            <button
                              onClick={() => handleMarkPaid(payment.id)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 size={13} className="shrink-0" />
                              결제 확인
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 출석 */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              출석
            </h2>
            <button
              onClick={handleCheckIn}
              disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <UserCheck size={14} className="shrink-0" />
              체크인
            </button>
          </div>
          {attendance.length === 0 ? (
            <p className="text-sm text-slate-400">출석 기록이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {attendance.map((record) => (
                <li
                  key={record.id}
                  className="text-sm text-slate-600 dark:text-slate-300"
                >
                  {new Date(record.checked_in_at).toLocaleString('ko-KR')}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 예약 */}
        <div className={cardClass}>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
            수업/PT 예약
          </h2>
          <form
            onSubmit={handleReservationSubmit}
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5"
          >
            <select
              value={reservationClassType}
              onChange={(e) =>
                setReservationClassType(e.target.value as ReservationClassType)
              }
              className={inputClass}
            >
              <option value="PT">PT</option>
              <option value="GROUP_CLASS">그룹 수업</option>
            </select>
            <select
              value={reservationTrainerId}
              onChange={(e) => setReservationTrainerId(e.target.value)}
              className={inputClass}
            >
              <option value="">트레이너 미지정</option>
              {trainers.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              required
              value={reservationDateTime}
              onChange={(e) => setReservationDateTime(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={busy}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <CalendarPlus size={14} className="shrink-0" />
              예약 등록
            </button>
          </form>

          {reservations.length === 0 ? (
            <p className="text-sm text-slate-400">예약 내역이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {reservations.map((reservation) => (
                <li
                  key={reservation.id}
                  className="flex items-center justify-between text-sm border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5"
                >
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    {new Date(reservation.reserved_at).toLocaleString('ko-KR')}{' '}
                    · {reservation.class_type === 'PT' ? 'PT' : '그룹 수업'}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                    {reservationStatusLabel[reservation.status] ??
                      reservation.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
