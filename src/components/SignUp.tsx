import { useState } from 'react';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface SignUpProps {
  onClose: () => void;
  onNavigateToLogin: () => void;
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800';

export default function SignUp({ onClose, onNavigateToLogin }: SignUpProps) {
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [branch, setBranch] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!inviteCode.trim() && !organizationName.trim()) {
      setFormError('가입 코드 또는 업체명 중 하나는 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          invite_code: inviteCode,
          organization_name: organizationName,
          branch_name: branch,
          phone,
        },
      },
    });
    setIsSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    if (!data.session) {
      alert('가입이 완료되었습니다. 이메일로 전송된 인증 링크를 확인해주세요.');
    } else {
      alert('가입이 완료되었습니다.');
    }
    onNavigateToLogin();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
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

      {/* Sign Up Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 py-10">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">회원가입</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              멀티 지점 CRM 시스템 계정을 생성합니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                이름
              </label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="inviteCode" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                가입 코드 (선택)
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="기존 업체 관리자에게 받은 코드"
                className={inputClass}
              />
              <p className="text-xs text-slate-400">
                이미 있는 업체에 합류하는 거라면 여기에 코드를 입력하세요 (업체명은 비워두셔도
                됩니다). 새 업체를 만드는 거라면 비워두고 아래 업체명만 입력하세요.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="organizationName" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                업체명 {!inviteCode.trim() && '(신규 업체 생성 시 필수)'}
              </label>
              <input
                type="text"
                id="organizationName"
                required={!inviteCode.trim()}
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="예: OO헬스장, OO어학원"
                className={inputClass}
              />
              <p className="text-xs text-slate-400">
                가입 코드 없이 새 이름을 입력하면 업체가 새로 만들어지고 회원님이 최초 관리자가
                됩니다.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                전화번호
              </label>
              <input
                type="tel"
                id="phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="branch" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                소속 지점
              </label>
              <input
                type="text"
                id="branch"
                required
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="소속 지점을 입력하세요 (예: 강남점)"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="signUpEmail" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                이메일
              </label>
              <input
                type="email"
                id="signUpEmail"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="signUpPassword" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                비밀번호
              </label>
              <input
                type="password"
                id="signUpPassword"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요 (6자 이상)"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                비밀번호 확인
              </label>
              <input
                type="password"
                id="confirmPassword"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className={inputClass}
              />
            </div>

            {formError && (
              <p className="text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 rounded-xl">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '가입 처리 중...' : '가입하기'}
            </button>
          </form>

          {/* 하단 로그인 유도 */}
          <div className="mt-8 text-center">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              이미 계정이 있으신가요?{' '}
              <button
                onClick={onNavigateToLogin}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline transition-colors ml-1"
                type="button"
              >
                로그인
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
