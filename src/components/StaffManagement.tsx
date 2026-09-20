import { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';
import { fetchAllProfiles, updateStaffRoleAndBranch } from '../lib/staff';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh';
import type { Profile, StaffRole } from '../types/domain';

interface StaffManagementProps {
  branches: string[];
  onClose: () => void;
}

const roleLabel: Record<StaffRole, string> = {
  admin: '관리자',
  trainer: '트레이너',
  member: '일반',
};

const selectClass =
  'px-2.5 py-1.5 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500';

export default function StaffManagement({ branches, onClose }: StaffManagementProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfiles(await fetchAllProfiles());
    } catch (err) {
      setError(err instanceof Error ? err.message : '스태프 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useRealtimeRefresh('profiles', loadProfiles);

  const handleChange = async (
    profile: Profile,
    role: StaffRole,
    branchName: string
  ) => {
    setSavingId(profile.id);
    setError(null);
    try {
      await updateStaffRoleAndBranch(profile.id, role, branchName);
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id ? { ...p, role, branch_name: branchName } : p
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '변경 중 오류가 발생했습니다.');
    } finally {
      setSavingId(null);
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

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">스태프 관리</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            스태프 계정의 역할과 소속 지점을 관리합니다. 트레이너로 지정하면
            예약 화면의 트레이너 목록에 표시됩니다.
          </p>
        </div>

        {error && (
          <p className="mb-4 text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 rounded-xl">
            {error}
          </p>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/30 text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs">
                    이름
                  </th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs">
                    역할
                  </th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs">
                    소속 지점
                  </th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs">
                    가입일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                      불러오는 중...
                    </td>
                  </tr>
                ) : profiles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                      스태프 계정이 없습니다.
                    </td>
                  </tr>
                ) : (
                  profiles.map((profile) => (
                    <tr key={profile.id}>
                      <td className="px-6 py-3 font-bold text-slate-900 dark:text-white">
                        {profile.name || '(이름 없음)'}
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={profile.role}
                          disabled={savingId === profile.id}
                          onChange={(e) =>
                            handleChange(
                              profile,
                              e.target.value as StaffRole,
                              profile.branch_name
                            )
                          }
                          className={selectClass}
                        >
                          {(Object.keys(roleLabel) as StaffRole[]).map((role) => (
                            <option key={role} value={role}>
                              {roleLabel[role]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={profile.branch_name}
                          disabled={savingId === profile.id}
                          onChange={(e) =>
                            handleChange(profile, profile.role, e.target.value)
                          }
                          className={selectClass}
                        >
                          {!branches.includes(profile.branch_name) &&
                            profile.branch_name && (
                              <option value={profile.branch_name}>
                                {profile.branch_name}
                              </option>
                            )}
                          {branches.map((branch) => (
                            <option key={branch} value={branch}>
                              {branch}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                        {profile.created_at.slice(0, 10)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
