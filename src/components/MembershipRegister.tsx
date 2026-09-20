import { useState } from 'react';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';
import { createMembership } from '../lib/members';
import { createPayment } from '../lib/payments';
import type { MemberWithMembership, MembershipType } from '../types/domain';

interface MembershipRegisterProps {
  member: MemberWithMembership;
  onClose: () => void;
  onRegistered: () => void;
}

const todayString = () => new Date().toISOString().slice(0, 10);
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors';
const labelClass = 'text-sm font-bold text-slate-700 dark:text-slate-300';

export default function MembershipRegister({
  member,
  onClose,
  onRegistered,
}: MembershipRegisterProps) {
  const [planName, setPlanName] = useState('');
  const [type, setType] = useState<MembershipType>('PERIOD');
  const [startDate, setStartDate] = useState(todayString());
  const [durationMonths, setDurationMonths] = useState(1);
  const [totalCount, setTotalCount] = useState(10);
  const [autoRenew, setAutoRenew] = useState(false);
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('카드');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const membership = await createMembership({
        member_id: member.id,
        plan_name: planName,
        type,
        start_date: startDate,
        durationMonths: type === 'PERIOD' ? durationMonths : undefined,
        totalCount: type === 'COUNT' ? totalCount : undefined,
        auto_renew: autoRenew,
      });

      if (amount > 0) {
        await createPayment({
          member_id: member.id,
          membership_id: membership.id,
          amount,
          payment_method: paymentMethod,
          is_recurring: isRecurring,
        });
      }

      onRegistered();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : '이용권 등록 중 오류가 발생했습니다.'
      );
    } finally {
      setIsSubmitting(false);
    }
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

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">이용권 등록</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-bold text-slate-700 dark:text-slate-300">{member.name}</span>{' '}
            ({member.phone}) 회원에게 새 이용권을 발급합니다.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="planName" className={labelClass}>
              이용권 이름 *
            </label>
            <input
              type="text"
              id="planName"
              required
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="예: 1개월 헬스 이용권"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>이용권 유형 *</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType('PERIOD')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-colors ${
                  type === 'PERIOD'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                기간제
              </button>
              <button
                type="button"
                onClick={() => setType('COUNT')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-colors ${
                  type === 'COUNT'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                횟수제
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="startDate" className={labelClass}>
                시작일 *
              </label>
              <input
                type="date"
                id="startDate"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`${inputClass} text-slate-600 dark:text-slate-300`}
              />
            </div>

            {type === 'PERIOD' ? (
              <div className="flex flex-col gap-2">
                <label htmlFor="durationMonths" className={labelClass}>
                  이용 기간 (개월) *
                </label>
                <input
                  type="number"
                  id="durationMonths"
                  required
                  min={1}
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label htmlFor="totalCount" className={labelClass}>
                  총 횟수 *
                </label>
                <input
                  type="number"
                  id="totalCount"
                  required
                  min={1}
                  value={totalCount}
                  onChange={(e) => setTotalCount(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            )}
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
            />
            <span className={labelClass}>자동 갱신</span>
          </label>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className={`${labelClass} mb-4`}>결제 정보 (선택)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="amount" className={labelClass}>
                  결제 금액 (원)
                </label>
                <input
                  type="number"
                  id="amount"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="paymentMethod" className={labelClass}>
                  결제 수단
                </label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={inputClass}
                >
                  <option value="카드">카드</option>
                  <option value="현금">현금</option>
                  <option value="계좌이체">계좌이체</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer w-fit mt-4">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span className={labelClass}>정기결제</span>
            </label>
          </div>

          {formError && (
            <p className="text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 rounded-xl">
              {formError}
            </p>
          )}

          <div className="mt-4 flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '등록 중...' : '이용권 발급'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
