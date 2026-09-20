import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
  AlertTriangle,
  Users,
  Copy,
  Check,
} from 'lucide-react';
import type { ThemeMode } from '../hooks/useTheme';
import { countAdmins, withdrawMyAccount } from '../lib/account';
import { fetchMyOrganization } from '../lib/organizations';
import type { Profile, Organization } from '../types/domain';

interface AppSettingsProps {
  session: Session;
  profile: Profile | null;
  mode: ThemeMode;
  onSetMode: (mode: ThemeMode) => void;
  onClose: () => void;
  onWithdrawn: () => void;
}

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: '라이트', icon: Sun },
  { value: 'dark', label: '다크', icon: Moon },
  { value: 'system', label: '시스템', icon: Monitor },
];

export default function AppSettings({
  session,
  profile,
  mode,
  onSetMode,
  onClose,
  onWithdrawn,
}: AppSettingsProps) {
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);

  const loadOrganization = useCallback(async () => {
    setOrgLoading(true);
    try {
      setOrganization(await fetchMyOrganization());
    } catch {
      setOrganization(null);
    } finally {
      setOrgLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  const handleCopyCode = async () => {
    if (!organization) return;
    try {
      await navigator.clipboard.writeText(organization.invite_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // 클립보드 권한이 없는 환경에서도 화면의 코드는 그대로 보이므로 조용히 무시합니다.
    }
  };

  const handleWithdraw = async () => {
    setWithdrawBusy(true);
    setWithdrawError(null);
    try {
      if (profile?.role === 'admin') {
        const adminCount = await countAdmins();
        if (adminCount <= 1) {
          setWithdrawError(
            '마지막 남은 관리자 계정이라 탈퇴할 수 없습니다. 스태프 관리에서 다른 계정을 관리자로 먼저 지정해주세요.'
          );
          setWithdrawBusy(false);
          return;
        }
      }
      await withdrawMyAccount(session.user.id);
      onWithdrawn();
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : '탈퇴 중 오류가 발생했습니다.');
      setWithdrawBusy(false);
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

      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">설정</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            화면 테마와 계정 탈퇴를 관리합니다.
          </p>
        </div>

        {/* 테마 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">화면 테마</h2>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map(({ value, label, icon: Icon }) => {
              const isActive = mode === value;
              return (
                <button
                  key={value}
                  onClick={() => onSetMode(value)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-colors ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className="text-sm font-bold">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 초대 코드 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <Users size={18} className="text-slate-400 shrink-0" />
            초대 코드
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            새 스태프가 우리 업체에 합류하려면 회원가입 화면에서 이 코드를 입력하면 됩니다.
          </p>
          {orgLoading ? (
            <p className="text-sm text-slate-400">불러오는 중...</p>
          ) : organization ? (
            <div className="flex items-center gap-3">
              <span className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-black tracking-widest text-slate-900 dark:text-white text-center">
                {organization.invite_code}
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                {codeCopied ? (
                  <>
                    <Check size={16} className="shrink-0 text-emerald-500" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy size={16} className="shrink-0" />
                    복사
                  </>
                )}
              </button>
            </div>
          ) : (
            <p className="text-sm text-rose-500">업체 정보를 불러오지 못했습니다.</p>
          )}
        </div>

        {/* 회원 탈퇴 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-sm">
          <h2 className="text-base font-extrabold text-rose-600 flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="shrink-0" />
            회원 탈퇴
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            탈퇴하면 이 계정의 이름·역할·소속 지점 정보가 삭제되고 즉시
            로그아웃되며, 이후 로그인해도 이 CRM에 접근할 수 없습니다.
          </p>

          {withdrawError && (
            <p className="mb-4 text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 rounded-xl">
              {withdrawError}
            </p>
          )}

          {!confirmWithdraw ? (
            <button
              onClick={() => setConfirmWithdraw(true)}
              className="px-5 py-3 text-sm font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors"
            >
              탈퇴하기
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmWithdraw(false)}
                disabled={withdrawBusy}
                className="px-5 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawBusy}
                className="px-5 py-3 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {withdrawBusy ? '처리 중...' : '정말 탈퇴합니다'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
