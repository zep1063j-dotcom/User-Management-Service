import { useState } from 'react';
import { LayoutDashboard, ShieldCheck } from 'lucide-react';
import { changePassword } from '../lib/account';

interface ResetPasswordProps {
  onCompleted: () => void;
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800';

export default function ResetPassword({ onCompleted }: ResetPasswordProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newPassword !== confirmPassword) {
      setFormError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 6) {
      setFormError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(newPassword);
      setDone(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex flex-col">
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
              <LayoutDashboard size={18} className="shrink-0" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              CRM System
            </span>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm w-full max-w-sm">
          {done ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck size={28} className="shrink-0" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  비밀번호가 변경되었습니다
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  새 비밀번호로 계속 이용하실 수 있습니다.
                </p>
              </div>
              <button
                onClick={onCompleted}
                className="w-full mt-2 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
              >
                계속하기
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  새 비밀번호 설정
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  이메일 인증이 확인되었습니다. 새 비밀번호를 입력해주세요.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="newPassword"
                    className="text-sm font-bold text-slate-700 dark:text-slate-300"
                  >
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요 (6자 이상)"
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="confirmNewPassword"
                    className="text-sm font-bold text-slate-700 dark:text-slate-300"
                  >
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    id="confirmNewPassword"
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
                  {isSubmitting ? '변경 중...' : '비밀번호 변경'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
