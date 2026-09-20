import { useState } from 'react';
import { LayoutDashboard, ArrowLeft, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { sendPasswordResetEmail } from '../lib/account';

interface LoginProps {
  onClose: () => void;
  onNavigateToSignUp: () => void;
  onLoginSuccess: () => void;
  showBackButton?: boolean;
}

export default function Login({
  onClose,
  onNavigateToSignUp,
  onLoginSuccess,
  showBackButton = true,
}: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSending(true);
    try {
      await sendPasswordResetEmail(resetEmail.trim());
      setResetSent(true);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : '인증 메일 전송에 실패했습니다.');
    } finally {
      setResetSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);

    if (error) {
      setFormError(
        error.message === 'Invalid login credentials'
          ? '아이디 또는 비밀번호가 올바르지 않습니다.'
          : error.message
      );
      return;
    }

    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {showBackButton ? (
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
          ) : (
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
              <LayoutDashboard size={18} className="shrink-0" />
            </div>
          )}
        </div>
      </nav>

      {/* Login Form Section */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm w-full max-w-sm">
          {showForgotPassword ? (
            resetSent ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck size={28} className="shrink-0" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 dark:text-white">
                    인증 메일을 보냈습니다
                  </h1>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {resetEmail} 메일함에서 링크를 눌러 새 비밀번호를 설정해주세요.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setResetEmail('');
                  }}
                  className="w-full mt-2 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
                >
                  로그인으로 돌아가기
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8 text-center">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                    비밀번호 재설정
                  </h1>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    가입하신 이메일로 재설정 링크를 보내드립니다.
                  </p>
                </div>

                <form onSubmit={handleResetSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="resetEmail"
                      className="text-sm font-bold text-slate-700 dark:text-slate-300"
                    >
                      이메일
                    </label>
                    <input
                      type="email"
                      id="resetEmail"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                    />
                  </div>

                  {resetError && (
                    <p className="text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 rounded-xl">
                      {resetError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={resetSending}
                    className="w-full mt-4 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetSending ? '전송 중...' : '재설정 메일 보내기'}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline transition-colors"
                    type="button"
                  >
                    로그인으로 돌아가기
                  </button>
                </div>
              </>
            )
          ) : (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">로그인</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  멀티 지점 CRM 시스템에 접속합니다.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="userId" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    이메일
                  </label>
                  <input
                    type="email"
                    id="userId"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      비밀번호
                    </label>
                    <button
                      onClick={() => {
                        setShowForgotPassword(true);
                        setResetEmail(email);
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline transition-colors"
                      type="button"
                    >
                      비밀번호를 잊으셨나요?
                    </button>
                  </div>
                  <input
                    type="password"
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
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
                  {isSubmitting ? '로그인 중...' : '로그인'}
                </button>
              </form>

              {/* 하단 회원가입 유도 */}
              <div className="mt-8 text-center">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  아직 계정이 없으신가요?{' '}
                  <button
                    onClick={onNavigateToSignUp}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline transition-colors ml-1"
                    type="button"
                  >
                    회원가입
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
