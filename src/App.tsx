import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Search,
  Plus,
  Users,
  CreditCard,
  Activity,
  Bell,
  CheckCircle2,
  Clock,
  AlertOctagon,
  MoreHorizontal,
  LayoutDashboard,
  Settings,
  User,
  UserCog,
  Building2,
  LogOut,
  History as HistoryIcon,
  X,
} from 'lucide-react';
// 분리해둔 컴포넌트 임포트 (경로 확인 필요)
import Login from './components/Login';
import SignUp from './components/SignUp';
import MemberRegister from './components/MemberRegister';
import MembershipRegister from './components/MembershipRegister';
import MemberDetail from './components/MemberDetail';
import BranchSelector from './components/BranchSelector';
import StaffManagement from './components/StaffManagement';
import BranchManagement from './components/BranchManagement';
import AccountSettings from './components/AccountSettings';
import MemberManagement from './components/MemberManagement';
import AppSettings from './components/AppSettings';
import History from './components/History';
import ResetPassword from './components/ResetPassword';
import { useTheme } from './hooks/useTheme';
import { useRealtimeRefresh } from './hooks/useRealtimeRefresh';
import { supabase } from './lib/supabaseClient';
import { fetchMembersWithMembership } from './lib/members';
import { fetchMyProfile } from './lib/staff';
import { fetchBranches } from './lib/branches';
import { fetchPaymentsSince, fetchPendingPayments, isOverdue } from './lib/payments';
import type { MemberWithMembership, MembershipStatus, Profile, Payment } from './types/domain';

export default function App() {
  const [members, setMembers] = useState<MemberWithMembership[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 상태 관리: 멀티 지점 선택, 사이드바, 뷰 라우팅
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [showLoginView, setShowLoginView] = useState<boolean>(false);
  const [showSignUpView, setShowSignUpView] = useState<boolean>(false);
  const [showRegisterView, setShowRegisterView] = useState<boolean>(false);
  const [membershipTargetMemberId, setMembershipTargetMemberId] = useState<
    string | null
  >(null);
  const [detailTargetMemberId, setDetailTargetMemberId] = useState<string | null>(
    null
  );
  const [showStaffView, setShowStaffView] = useState<boolean>(false);
  const [showBranchView, setShowBranchView] = useState<boolean>(false);
  const [showAccountView, setShowAccountView] = useState<boolean>(false);
  const [showMemberManagementView, setShowMemberManagementView] =
    useState<boolean>(false);
  const [showSettingsView, setShowSettingsView] = useState<boolean>(false);
  const [showHistoryView, setShowHistoryView] = useState<boolean>(false);
  const { mode: themeMode, setMode: setThemeMode } = useTheme();

  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [showResetPasswordView, setShowResetPasswordView] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') {
        setShowResetPasswordView(true);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const loadMyProfile = useCallback(async () => {
    if (!session) {
      setMyProfile(null);
      return;
    }
    try {
      setMyProfile(await fetchMyProfile(session.user.id));
    } catch {
      setMyProfile(null);
    }
  }, [session]);

  useEffect(() => {
    loadMyProfile();
  }, [loadMyProfile]);

  const loadBranches = useCallback(async () => {
    try {
      const data = await fetchBranches();
      const names = data.map((b) => b.name);
      setBranches(names);
      setSelectedBranch((current) =>
        current && names.includes(current) ? current : names[0] ?? ''
      );
    } catch {
      // 지점 목록 로드 실패는 대시보드 전체를 막지 않고 조용히 무시합니다.
    }
  }, []);

  useEffect(() => {
    if (session) loadBranches();
  }, [session, loadBranches]);

  const [monthlyPayments, setMonthlyPayments] = useState<Payment[]>([]);

  const loadMonthlyPayments = useCallback(async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    try {
      setMonthlyPayments(await fetchPaymentsSince(startOfMonth));
    } catch {
      // 매출 통계는 부가 정보이므로 실패해도 대시보드 전체를 막지 않습니다.
    }
  }, []);

  useEffect(() => {
    if (session) loadMonthlyPayments();
  }, [session, loadMonthlyPayments]);

  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);

  const loadPendingPayments = useCallback(async () => {
    try {
      setPendingPayments(await fetchPendingPayments());
    } catch {
      // 미납 통계도 부가 정보이므로 실패해도 대시보드 전체를 막지 않습니다.
    }
  }, []);

  useEffect(() => {
    if (session) loadPendingPayments();
  }, [session, loadPendingPayments]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchMembersWithMembership();
      setMembers(data);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : '회원 목록을 불러오지 못했습니다.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) loadMembers();
  }, [session, loadMembers]);

  // 실시간 업데이트: 다른 탭/기기/직접 DB 수정으로 데이터가 바뀌면 자동으로
  // 다시 불러옵니다 (새로고침 없이도 최신 상태 유지).
  const hasSession = !!session;
  useRealtimeRefresh('members', loadMembers, hasSession);
  useRealtimeRefresh('memberships', loadMembers, hasSession);
  useRealtimeRefresh('payments', loadMonthlyPayments, hasSession);
  useRealtimeRefresh('payments', loadPendingPayments, hasSession);
  useRealtimeRefresh('branches', loadBranches, hasSession);
  useRealtimeRefresh('profiles', loadMyProfile, hasSession);

  const membershipTargetMember =
    members.find((m) => m.id === membershipTargetMemberId) ?? null;
  const detailTargetMember =
    members.find((m) => m.id === detailTargetMemberId) ?? null;

  const visibleMembers = members.filter((member) => {
    const matchesBranch = member.branch_name === selectedBranch;
    const term = searchTerm.trim();
    const matchesSearch =
      term === '' || member.name.includes(term) || member.phone.includes(term);
    return matchesBranch && matchesSearch;
  });

  // 이번 달 매출 = 선택된 지점 회원의 결제 중 (결제액 - 환불액) 합계
  // (검색어 필터는 매출 통계에 영향을 주지 않도록 visibleMembers가 아닌 지점 기준으로 계산합니다)
  const branchMemberIds = new Set(
    members.filter((m) => m.branch_name === selectedBranch).map((m) => m.id)
  );
  const monthlyRevenue = monthlyPayments
    .filter(
      (p) =>
        branchMemberIds.has(p.member_id) &&
        (p.status === 'PAID' ||
          p.status === 'PARTIALLY_REFUNDED' ||
          p.status === 'REFUNDED')
    )
    .reduce((sum, p) => sum + (p.amount - (p.refunded_amount ?? 0)), 0);

  // 결제 지연/미납 = 선택된 지점 회원의 청구 중 마감일이 지난 건수
  const overdueCount = pendingPayments.filter(
    (p) => branchMemberIds.has(p.member_id) && isOverdue(p)
  ).length;

  const getStatusBadge = (status: MembershipStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-lg whitespace-nowrap">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />{' '}
            정상 이용중
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-700 bg-amber-100 rounded-lg whitespace-nowrap">
            <Clock size={13} className="text-amber-500 shrink-0" /> 일시 정지
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-rose-700 bg-rose-100 rounded-lg whitespace-nowrap">
            <AlertOctagon size={13} className="text-rose-500 shrink-0" /> 결제
            만료
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  // 컴포넌트 라우팅 처리
  if (showResetPasswordView) {
    return <ResetPassword onCompleted={() => setShowResetPasswordView(false)} />;
  }

  if (showLoginView) {
    return (
      <Login
        onClose={() => setShowLoginView(false)}
        onNavigateToSignUp={() => {
          setShowLoginView(false);
          setShowSignUpView(true);
        }}
        onLoginSuccess={() => setShowLoginView(false)}
      />
    );
  }

  if (showSignUpView) {
    return (
      <SignUp
        onClose={() => setShowSignUpView(false)}
        onNavigateToLogin={() => {
          setShowSignUpView(false);
          setShowLoginView(true);
        }}
      />
    );
  }

  if (showRegisterView) {
    return (
      <MemberRegister
        branchName={selectedBranch}
        onClose={() => setShowRegisterView(false)}
        onRegistered={() => {
          setShowRegisterView(false);
          loadMembers();
        }}
      />
    );
  }

  if (membershipTargetMember) {
    return (
      <MembershipRegister
        member={membershipTargetMember}
        onClose={() => setMembershipTargetMemberId(null)}
        onRegistered={() => {
          setMembershipTargetMemberId(null);
          loadMembers();
          loadMonthlyPayments();
        }}
      />
    );
  }

  if (detailTargetMember) {
    return (
      <MemberDetail
        member={detailTargetMember}
        onClose={() => setDetailTargetMemberId(null)}
        onUpdated={() => {
          loadMembers();
          loadMonthlyPayments();
          loadPendingPayments();
        }}
        onRegisterMembership={() =>
          setMembershipTargetMemberId(detailTargetMember.id)
        }
      />
    );
  }

  if (showMemberManagementView) {
    return (
      <MemberManagement
        members={members}
        branches={branches}
        loading={loading}
        loadError={loadError}
        onClose={() => setShowMemberManagementView(false)}
        onRegisterNew={() => setShowRegisterView(true)}
        onSelectMember={(id) => setDetailTargetMemberId(id)}
        onDeleted={loadMembers}
      />
    );
  }

  if (showHistoryView) {
    return (
      <History
        members={members}
        selectedBranch={selectedBranch}
        onClose={() => setShowHistoryView(false)}
      />
    );
  }

  if (showStaffView && myProfile?.role === 'admin') {
    return (
      <StaffManagement branches={branches} onClose={() => setShowStaffView(false)} />
    );
  }

  if (showBranchView && myProfile?.role === 'admin') {
    return (
      <BranchManagement
        onClose={() => setShowBranchView(false)}
        onChanged={loadBranches}
      />
    );
  }

  // 로그인 전에는 대시보드에 접근할 수 없습니다.
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-sm font-bold text-slate-400">불러오는 중...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <Login
        onClose={() => {}}
        onNavigateToSignUp={() => setShowSignUpView(true)}
        onLoginSuccess={() => {}}
        showBackButton={false}
      />
    );
  }

  if (showAccountView) {
    return (
      <AccountSettings
        session={session}
        profile={myProfile}
        onClose={() => setShowAccountView(false)}
        onProfileUpdated={loadMyProfile}
        onBranchAdded={loadBranches}
      />
    );
  }

  if (showSettingsView) {
    return (
      <AppSettings
        session={session}
        profile={myProfile}
        mode={themeMode}
        onSetMode={setThemeMode}
        onClose={() => setShowSettingsView(false)}
        onWithdrawn={() => setShowSettingsView(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 pb-20 overflow-x-hidden">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
              <LayoutDashboard size={18} className="shrink-0" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              CRM System
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* 대시보드는 로그인 상태에서만 렌더링되므로 session은 항상 존재합니다 */}
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={() => setShowAccountView(true)}
                className="px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                {myProfile?.name ??
                  (session.user.user_metadata?.name as string | undefined) ??
                  session.user.email}
                님
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <LogOut size={16} className="shrink-0" />
                로그아웃
              </button>
            </div>
            <button
              onClick={() => alert('알림이 없습니다.')}
              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Bell size={20} className="shrink-0" />
            </button>
            {/* 2줄 커스텀 메뉴 버튼 */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-[4px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 ml-1"
            >
              <span className="w-4 h-[2px] bg-current rounded-full" />
              <span className="w-4 h-[2px] bg-current rounded-full" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header Section (멀티 지점 선택 적용) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <BranchSelector
              branches={branches}
              selected={selectedBranch}
              onSelect={setSelectedBranch}
            />
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              실시간 {selectedBranch} 회원 상태 및 결제 지표를 모니터링합니다.
            </p>
          </div>
          <button
            onClick={() => setShowRegisterView(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 shrink-0"
          >
            <Plus size={18} className="shrink-0" />
            새로운 회원 등록
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 mb-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <Users size={24} className="shrink-0" />
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                0%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400">총 활성 회원</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {visibleMembers.filter((m) => m.status === 'ACTIVE').length}
                </span>
                <span className="text-xs font-bold text-slate-400">명</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHistoryView(true)}
            className="text-left bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                <CreditCard size={24} className="shrink-0" />
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                기록 보기
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400">이번 달 매출</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {monthlyRevenue.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-400">원</span>
              </div>
            </div>
          </button>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
                <AlertOctagon size={24} className="shrink-0" />
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                0건
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400">
                결제 지연 / 미납
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {overdueCount}
                </span>
                <span className="text-xs font-bold text-slate-400">건</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-black p-6 rounded-2xl text-white shadow-sm relative dark:border dark:border-slate-800">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-white/10 text-emerald-400 rounded-xl flex items-center justify-center">
                <Activity size={24} className="shrink-0" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400">시스템 가동률</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">100</span>
                <span className="text-xs font-bold text-slate-400">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {selectedBranch} 회원 데이터베이스
            </h2>

            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search size={16} className="shrink-0" />
              </span>
              <input
                type="text"
                className="w-full py-2 pl-10 pr-4 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
                placeholder="이름, 연락처로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/30 text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                    회원 프로필
                  </th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                    플랜
                  </th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                    상태
                  </th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                    만료일 / 잔여횟수
                  </th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-400 font-medium"
                    >
                      {selectedBranch} 데이터를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-rose-500 font-medium"
                    >
                      회원 목록을 불러오지 못했습니다: {loadError}
                    </td>
                  </tr>
                ) : visibleMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <User size={32} className="text-slate-300 dark:text-slate-700" />
                        <p className="font-bold text-slate-600 dark:text-slate-300 text-base">
                          등록된 회원이 없습니다.
                        </p>
                        <p className="text-xs text-slate-400">
                          새로운 회원을 등록해서 데이터를 채워보세요!
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleMembers.map((member) => {
                    const membership = member.latestMembership;
                    return (
                      <tr
                        key={member.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                              <User size={16} className="shrink-0" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {member.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {member.phone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs">
                            {membership ? membership.plan_name : '이용권 없음'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {membership ? (
                            getStatusBadge(membership.status)
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg whitespace-nowrap">
                              미등록
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                          {membership
                            ? membership.type === 'PERIOD'
                              ? membership.end_date ?? '-'
                              : `잔여 ${membership.remaining_count ?? 0}회`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setMembershipTargetMemberId(member.id)}
                              className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors whitespace-nowrap"
                            >
                              이용권 등록
                            </button>
                            <button
                              onClick={() => setDetailTargetMemberId(member.id)}
                              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <MoreHorizontal size={18} className="shrink-0" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 우측 슬라이드 아웃 사이드바 영역 */}
      <div
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <span className="font-black text-lg text-slate-900 dark:text-white">메뉴</span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-2 overflow-y-auto">
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              setShowAccountView(true);
            }}
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
          >
            <User size={18} className="shrink-0 text-slate-400" />
            계정
          </button>
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              setShowMemberManagementView(true);
            }}
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
          >
            <Users size={18} className="shrink-0 text-slate-400" />
            회원관리
          </button>
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              setShowHistoryView(true);
            }}
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
          >
            <HistoryIcon size={18} className="shrink-0 text-slate-400" />
            기록
          </button>
          {myProfile?.role === 'admin' && (
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                setShowStaffView(true);
              }}
              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
            >
              <UserCog size={18} className="shrink-0 text-slate-400" />
              스태프 관리
            </button>
          )}
          {myProfile?.role === 'admin' && (
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                setShowBranchView(true);
              }}
              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
            >
              <Building2 size={18} className="shrink-0 text-slate-400" />
              지점 관리
            </button>
          )}
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              setShowSettingsView(true);
            }}
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
          >
            <Settings size={18} className="shrink-0 text-slate-400" />
            설정
          </button>
        </div>
      </div>
    </div>
  );
}
