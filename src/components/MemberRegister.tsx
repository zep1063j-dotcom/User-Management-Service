import { useState } from 'react';
import { Camera, LayoutDashboard, ArrowLeft, AlertCircle } from 'lucide-react';
import { createMember } from '../lib/members';

interface MemberRegisterProps {
  branchName: string;
  onClose: () => void;
  onRegistered: () => void;
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors';
const labelClass = 'text-sm font-bold text-slate-700 dark:text-slate-300';

export default function MemberRegister({
  branchName,
  onClose,
  onRegistered,
}: MemberRegisterProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // 폼 제출 상태 관리를 위한 State 추가
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData(e.currentTarget);
    // 사진은 아직 Storage 연동 전이라 미리보기 용도로만 사용하고 저장하지 않습니다.
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const birthdate = formData.get('birthdate') as string;
    const address = formData.get('address') as string;
    const memo = formData.get('memo') as string;

    try {
      await createMember({
        branch_name: branchName,
        name,
        phone,
        birthdate: birthdate || undefined,
        address: address || undefined,
        memo: memo || undefined,
      });
      alert('회원 등록이 성공적으로 완료되었습니다.');
      onRegistered();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : '회원 등록 중 오류가 발생했습니다.'
      );
    } finally {
      setIsSubmitting(false); // 제출 완료 후 버튼 비활성화 해제
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 pb-20">
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

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            새로운 회원 등록
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            신규 회원의 기본 정보를 입력해주세요.
          </p>
        </div>

        {/* 에러 발생 시 폼 상단에 메시지 표시 */}
        {submitError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900 flex items-start gap-3">
            <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-rose-700 dark:text-rose-400">{submitError}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6"
        >
          {/* 사진 (선택) */}
          <div className="flex flex-col items-center sm:items-start gap-2">
            <label className={`block ${labelClass}`}>
              사진 (선택)
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera size={28} className="text-slate-400" />
                )}
              </div>
              <label className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <span>사진 업로드</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                  name="photo"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* 이름 */}
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className={labelClass}>
                이름 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="홍길동"
                className={inputClass}
              />
            </div>

            {/* 전화번호 */}
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className={labelClass}>
                전화번호 *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                placeholder="010-0000-0000"
                className={inputClass}
              />
            </div>
          </div>

          {/* 생년월일 */}
          <div className="flex flex-col gap-2">
            <label htmlFor="birthdate" className={labelClass}>
              생년월일
            </label>
            <input
              type="date"
              id="birthdate"
              name="birthdate"
              className={`${inputClass} text-slate-600 dark:text-slate-300`}
            />
          </div>

          {/* 주소 */}
          <div className="flex flex-col gap-2">
            <label htmlFor="address" className={labelClass}>
              주소
            </label>
            <input
              type="text"
              id="address"
              name="address"
              placeholder="서울특별시 강남구..."
              className={inputClass}
            />
          </div>

          {/* 메모 */}
          <div className="flex flex-col gap-2">
            <label htmlFor="memo" className={labelClass}>
              메모
            </label>
            <textarea
              id="memo"
              name="memo"
              rows={5}
              placeholder="특이사항이나 참고할 내용을 자유롭게 적어주세요."
              className={`${inputClass} resize-y`}
            ></textarea>
          </div>

          {/* 하단 버튼 */}
          <div className="mt-4 flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed min-w-[120px]"
            >
              {isSubmitting ? '제출 중...' : '작성완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
