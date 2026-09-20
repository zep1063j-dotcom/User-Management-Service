import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  UserPlus,
  UserMinus,
  Download,
} from 'lucide-react';
import { fetchPaymentsSince } from '../lib/payments';
import { buildMonthlyHistory, recentMonthKeys } from '../lib/history';
import { downloadCsv } from '../lib/csv';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh';
import type { MemberWithMembership, Payment } from '../types/domain';

interface HistoryProps {
  members: MemberWithMembership[];
  selectedBranch: string;
  onClose: () => void;
}

const MONTHS_BACK = 6;

const cardClass =
  'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm';

function formatWon(amount: number): string {
  return `${amount.toLocaleString()}원`;
}

function formatCompactWon(amount: number): string {
  if (amount === 0) return '0';
  return `${Math.round(amount / 10000).toLocaleString()}만`;
}

export default function History({ members, selectedBranch, onClose }: HistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const keys = recentMonthKeys(MONTHS_BACK);
      const [firstYear, firstMonth] = keys[0].split('-').map(Number);
      const sinceIso = new Date(firstYear, firstMonth - 1, 1).toISOString();
      setPayments(await fetchPaymentsSince(sinceIso));
    } catch (err) {
      setError(err instanceof Error ? err.message : '매출 기록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useRealtimeRefresh('payments', loadPayments);

  const branchMembers = members.filter((m) => m.branch_name === selectedBranch);
  const branchMemberIds = new Set(branchMembers.map((m) => m.id));
  const branchPayments = payments.filter((p) => branchMemberIds.has(p.member_id));

  const stats = buildMonthlyHistory(branchMembers, branchPayments, MONTHS_BACK);
  const thisMonth = stats[stats.length - 1];
  const lastMonth = stats[stats.length - 2];
  const maxRevenue = Math.max(...stats.map((s) => s.revenue), 1);

  const growthPercent =
    lastMonth && lastMonth.revenue > 0
      ? Math.round(((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100)
      : null;

  const handleExportCsv = () => {
    const headers = ['월', '매출', '신규 등록', '탈퇴'];
    const rows = stats.map((s) => [s.label, s.revenue, s.newMembers, s.withdrawnMembers]);
    downloadCsv(`매출기록_${selectedBranch}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
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

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">매출 기록</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {selectedBranch} 지점의 월별 매출 추이와 신규 등록·탈퇴 현황을 확인합니다.
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            disabled={loading || stats.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Download size={18} className="shrink-0" />
            CSV 내보내기
          </button>
        </div>

        {error && (
          <p className="mb-6 text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 rounded-xl">
            {error}
          </p>
        )}

        {loading ? (
          <div className={`${cardClass} px-6 py-16 text-center text-slate-400 font-medium`}>
            불러오는 중입니다...
          </div>
        ) : (
          <>
            {/* 저번 달 / 이번 달 매출 카드 */}
            <div className="grid grid-cols-2 gap-4 mb-6 max-w-xl">
              <div className={`${cardClass} p-6`}>
                <p className="text-xs font-bold text-slate-400">
                  저번 달 매출 ({lastMonth?.label ?? '-'})
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {(lastMonth?.revenue ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-400">원</span>
                </div>
              </div>

              <div className="bg-slate-900 dark:bg-black p-6 rounded-2xl text-white shadow-sm dark:border dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400">
                    이번 달 매출 ({thisMonth?.label ?? '-'})
                  </p>
                  {growthPercent !== null && (
                    <span
                      className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${
                        growthPercent > 0
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : growthPercent < 0
                            ? 'text-rose-400 bg-rose-500/10'
                            : 'text-slate-400 bg-white/10'
                      }`}
                    >
                      {growthPercent > 0 ? (
                        <TrendingUp size={12} className="shrink-0" />
                      ) : growthPercent < 0 ? (
                        <TrendingDown size={12} className="shrink-0" />
                      ) : (
                        <Minus size={12} className="shrink-0" />
                      )}
                      {growthPercent > 0 ? '+' : ''}
                      {growthPercent}%
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">
                    {(thisMonth?.revenue ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-400">원</span>
                </div>
              </div>
            </div>

            {/* 월별 매출 그래프 */}
            <div className={`${cardClass} p-6 mb-6`}>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white mb-6">
                최근 {MONTHS_BACK}개월 매출 추이
              </h2>
              <div className="flex items-end gap-3 h-48">
                {stats.map((s) => {
                  const heightPct = Math.max(4, Math.round((s.revenue / maxRevenue) * 100));
                  const isCurrent = s.key === thisMonth?.key;
                  return (
                    <div key={s.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {formatCompactWon(s.revenue)}
                      </span>
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          isCurrent
                            ? 'bg-indigo-600'
                            : 'bg-indigo-200 dark:bg-indigo-950'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span
                        className={`text-xs font-bold ${
                          isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 월별 신규 등록 / 탈퇴 상세 */}
            <div className={`${cardClass} overflow-hidden`}>
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  월별 회원 변동
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/30 text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs">월</th>
                      <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs">매출</th>
                      <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs">
                        신규 등록
                      </th>
                      <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs">
                        탈퇴
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stats.map((s) => (
                      <tr key={s.key} className={s.key === thisMonth?.key ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}>
                        <td className="px-6 py-3 font-bold text-slate-900 dark:text-white">
                          {s.label}
                        </td>
                        <td className="px-6 py-3 text-slate-600 dark:text-slate-300">
                          {formatWon(s.revenue)}
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                            <UserPlus size={14} className="shrink-0" />
                            {s.newMembers}명
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold">
                            <UserMinus size={14} className="shrink-0" />
                            {s.withdrawnMembers}명
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
