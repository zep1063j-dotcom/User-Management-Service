import { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, ArrowLeft, Plus, Trash2, Building2 } from 'lucide-react';
import { fetchBranches, createBranch, deleteBranch } from '../lib/branches';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh';
import type { Branch } from '../types/domain';

interface BranchManagementProps {
  onClose: () => void;
  onChanged: () => void;
}

export default function BranchManagement({ onClose, onChanged }: BranchManagementProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBranches(await fetchBranches());
    } catch (err) {
      setError(err instanceof Error ? err.message : '지점 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useRealtimeRefresh('branches', loadBranches);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newBranchName.trim();
    if (!name) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createBranch(name);
      setNewBranchName('');
      await loadBranches();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : '지점 추가 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (branch: Branch) => {
    setDeletingId(branch.id);
    setError(null);
    try {
      await deleteBranch(branch);
      await loadBranches();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : '지점 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">지점 관리</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            새로운 지점을 등록하거나, 회원이 없는 지점을 삭제할 수 있습니다.
          </p>
        </div>

        <form
          onSubmit={handleAdd}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 mb-6"
        >
          <input
            type="text"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder="새 지점 이름 (예: 잠실점)"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newBranchName.trim()}
            className="flex items-center gap-1.5 px-5 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Plus size={16} className="shrink-0" />
            추가
          </button>
        </form>

        {error && (
          <p className="mb-4 text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 rounded-xl">
            {error}
          </p>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              불러오는 중...
            </p>
          ) : branches.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              등록된 지점이 없습니다.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {branches.map((branch) => (
                <li
                  key={branch.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <span className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white">
                    <Building2 size={16} className="text-slate-400 shrink-0" />
                    {branch.name}
                  </span>
                  <button
                    onClick={() => handleDelete(branch)}
                    disabled={deletingId === branch.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} className="shrink-0" />
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
