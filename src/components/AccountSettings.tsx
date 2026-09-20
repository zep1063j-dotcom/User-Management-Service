import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LayoutDashboard, ArrowLeft, ShieldCheck, Plus } from 'lucide-react';
import { updateMyProfile, sendPasswordResetEmail, signOutOtherSessions } from '../lib/account';
import { createBranch } from '../lib/branches';
import type { Profile } from '../types/domain';

interface AccountSettingsProps {
  session: Session;
  profile: Profile | null;
  onClose: () => void;
  onProfileUpdated: () => void;
  onBranchAdded: () => void;
}

const inputClass =
  'px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors';
const cardClass =
  'bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4';

export default function AccountSettings({
  session,
  profile,
  onClose,
  onProfileUpdated,
  onBranchAdded,
}: AccountSettingsProps) {
  const [name, setName] = useState(
    profile?.name ?? (session.user.user_metadata?.name as string | undefined) ?? ''
  );
  const [email, setEmail] = useState(session.user.email ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState<string | null>(null);

  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [addBranchSaving, setAddBranchSaving] = useState(false);
  const [addBranchError, setAddBranchError] = useState<string | null>(null);
  const [addBranchDone, setAddBranchDone] = useState(false);

  const [passwordEmailSending, setPasswordEmailSending] = useState(false);
  const [passwordEmailError, setPasswordEmailError] = useState<string | null>(null);
  const [passwordEmailSent, setPasswordEmailSent] = useState(false);

  const [signOutOthersBusy, setSignOutOthersBusy] = useState(false);
  const [signOutOthersError, setSignOutOthersError] = useState<string | null>(null);
  const [signOutOthersDone, setSignOutOthersDone] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSaved(null);
    setProfileSaving(true);
    const trimmedEmail = email.trim();
    const emailChanged = trimmedEmail !== (session.user.email ?? '');
    try {
      await updateMyProfile({
        userId: session.user.id,
        name: name.trim(),
        phone: phone.trim(),
        email: emailChanged ? trimmedEmail : undefined,
      });
      onProfileUpdated();
      setProfileSaved(
        emailChanged
          ? '저장되었습니다. 이메일 변경은 새 주소로 전송된 확인 메일을 클릭해야 최종 반영됩니다.'
          : '저장되었습니다.'
      );
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newBranchName.trim();
    if (!trimmed) return;

    setAddBranchSaving(true);
    setAddBranchError(null);
    setAddBranchDone(false);
    try {
      await createBranch(trimmed);
      setNewBranchName('');
      setAddBranchDone(true);
      onBranchAdded();
    } catch (err) {
      setAddBranchError(
        err instanceof Error ? err.message : '지점 추가 중 오류가 발생했습니다.'
      );
    } finally {
      setAddBranchSaving(false);
    }
  };

  const handleSendPasswordResetEmail = async () => {
    setPasswordEmailError(null);
    setPasswordEmailSent(false);
    setPasswordEmailSending(true);
    try {
      await sendPasswordResetEmail(session.user.email ?? '');
      setPasswordEmailSent(true);
    } catch (err) {
      setPasswordEmailError(
        err instanceof Error ? err.message : '인증 메일 전송에 실패했습니다.'
      );
    } finally {
      setPasswordEmailSending(false);
    }
  };

  const handleSignOutOthers = async () => {
    setSignOutOthersError(null);
    setSignOutOthersDone(false);
    setSignOutOthersBusy(true);
    try {
      await signOutOtherSessions();
      setSignOutOthersDone(true);
    } catch (err) {
      setSignOutOthersError(
        err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.'
      );
    } finally {
      setSignOutOthersBusy(false);
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">계정</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              내 프로필 정보와 로그인 보안을 관리합니다.
            </p>
          </div>
          {profile?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setShowAddBranch((prev) => !prev)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors shrink-0"
            >
              <Plus size={16} className="shrink-0" />
              지점 추가하기
            </button>
          )}
        </div>

        {showAddBranch && profile?.role === 'admin' && (
          <form onSubmit={handleAddBranch} className={cardClass}>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              새 지점 추가
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                required
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="지점 이름 (예: 잠실점)"
                className={`flex-1 ${inputClass}`}
              />
              <button
                type="submit"
                disabled={addBranchSaving || !newBranchName.trim()}
                className="px-5 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {addBranchSaving ? '추가 중...' : '추가'}
              </button>
            </div>
            {addBranchError && (
              <p className="text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 rounded-xl">
                {addBranchError}
              </p>
            )}
            {addBranchDone && (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                지점이 추가되었습니다.
              </p>
            )}
          </form>
        )}

        {/* 프로필 요약 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {profile?.name ??
                (session.user.user_metadata?.name as string | undefined) ??
                session.user.email}
              님
            </span>
            {profile && (
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                {profile.branch_name}
              </span>
            )}
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-400">{session.user.email}</span>
        </div>

        {/* 기본 정보: 이름/이메일/전화번호를 하나로 묶어 함께 저장합니다 */}
        <form onSubmit={handleProfileSubmit} className={cardClass}>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">기본 정보</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">이름</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">이메일</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">전화번호</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                className={inputClass}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={profileSaving || !name.trim() || !email.trim()}
            className="self-start px-5 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {profileSaving ? '저장 중...' : '저장'}
          </button>
          {profileError && (
            <p className="text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 rounded-xl">
              {profileError}
            </p>
          )}
          {profileSaved && (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{profileSaved}</p>
          )}
        </form>

        {/* 비밀번호 변경: 보안을 위해 이메일 인증 링크를 통해서만 변경할 수 있습니다 */}
        <div className={cardClass}>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">비밀번호 변경</h2>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              보안을 위해 {session.user.email}로 전송되는 인증 메일의 링크를 눌러야 새 비밀번호를
              설정할 수 있습니다.
            </p>
            <button
              onClick={handleSendPasswordResetEmail}
              disabled={passwordEmailSending}
              className="px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 shrink-0"
            >
              {passwordEmailSending ? '전송 중...' : '인증 메일 보내기'}
            </button>
          </div>
          {passwordEmailError && (
            <p className="text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 rounded-xl">
              {passwordEmailError}
            </p>
          )}
          {passwordEmailSent && (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              인증 메일을 보냈습니다. 메일함에서 링크를 눌러 새 비밀번호를 설정해주세요.
            </p>
          )}
        </div>

        {/* 보안 */}
        <div className={cardClass}>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-slate-400 shrink-0" />
            보안
          </h2>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              이 기기를 제외한 다른 모든 기기에서 로그아웃합니다.
            </p>
            <button
              onClick={handleSignOutOthers}
              disabled={signOutOthersBusy}
              className="px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 shrink-0"
            >
              {signOutOthersBusy ? '처리 중...' : '다른 기기 로그아웃'}
            </button>
          </div>
          {signOutOthersError && (
            <p className="text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 rounded-xl">
              {signOutOthersError}
            </p>
          )}
          {signOutOthersDone && (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              다른 기기의 로그인이 종료되었습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
