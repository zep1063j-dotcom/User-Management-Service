import { useState } from 'react';
import {
  LayoutDashboard,
  ArrowLeft,
  Plus,
  Search,
  User,
  MoreHorizontal,
  Trash2,
  Download,
} from 'lucide-react';
import { deleteMember } from '../lib/members';
import { downloadCsv } from '../lib/csv';
import type { MemberWithMembership, MemberStatus } from '../types/domain';

interface MemberManagementProps {
  members: MemberWithMembership[];
  branches: string[];
  loading: boolean;
  loadError: string | null;
  onClose: () => void;
  onRegisterNew: () => void;
  onSelectMember: (memberId: string) => void;
  onDeleted: () => void;
}

const memberStatusLabel: Record<MemberStatus, string> = {
  ACTIVE: '활성',
  DORMANT: '휴면',
  WITHDRAWN: '탈퇴',
};

const memberStatusStyle: Record<MemberStatus, string> = {
  ACTIVE: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50',
  DORMANT: 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50',
  WITHDRAWN: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
};

const selectClass =
  'px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500';

export default function MemberManagement({
  members,
  branches,
  loading,
  loadError,
  onClose,
  onRegisterNew,
  onSelectMember,
  onDeleted,
}: MemberManagementProps) {
  const [branchFilter, setBranchFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | '전체'>('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (memberId: string) => {
    setDeletingId(memberId);
    setDeleteError(null);
    try {
      await deleteMember(memberId);
      setConfirmDeleteId(null);
      onDeleted();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = members.filter((member) => {
    const matchesBranch = branchFilter === '전체' || member.branch_name === branchFilter;
    const matchesStatus = statusFilter === '전체' || member.status === statusFilter;
    const term = searchTerm.trim();
    const matchesSearch =
      term === '' || member.name.includes(term) || member.phone.includes(term);
    return matchesBranch && matchesStatus && matchesSearch;
  });

  const handleExportCsv = () => {
    const headers = ['이름', '연락처', '지점', '회원 상태', '이용권', '만료일/잔여횟수', '가입일'];
    const rows = filtered.map((member) => {
      const membership = member.latestMembership;
      const membershipInfo = membership
        ? membership.type === 'PERIOD'
          ? (membership.end_date ?? '-')
          : `잔여 ${membership.remaining_count ?? 0}회`
        : '-';
      return [
        member.name,
        member.phone,
        member.branch_name,
        memberStatusLabel[member.status],
        membership ? membership.plan_name : '이용권 없음',
        membershipInfo,
        member.created_at.slice(0, 10),
      ];
    });
    downloadCsv(`회원목록_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
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

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">전체 회원 관리</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              모든 지점의 회원을 지점·상태별로 조회하고 관리합니다.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} className="shrink-0" />
              CSV 내보내기
            </button>
            <button
              onClick={onRegisterNew}
              className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 dark:shadow-none"
            >
              <Plus size={18} className="shrink-0" />
              새로운 회원 등록
            </button>
          </div>
        </div>

        {deleteError && (
          <p className="mb-4 text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 rounded-xl">
            {deleteError}
          </p>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50/50 dark:bg-slate-800/30">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className={selectClass}
            >
              <option value="전체">전체 지점</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as MemberStatus | '전체')
              }
              className={selectClass}
            >
              <option value="전체">전체 상태</option>
              {(Object.keys(memberStatusLabel) as MemberStatus[]).map((status) => (
                <option key={status} value={status}>
                  {memberStatusLabel[status]}
                </option>
              ))}
            </select>
            <div className="relative flex-1 sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search size={16} className="shrink-0" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="이름, 연락처로 검색..."
                className="w-full py-2 pl-10 pr-4 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
              />
            </div>
            <span className="text-xs font-bold text-slate-400 sm:ml-auto">
              총 {filtered.length}명
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/30 text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                    회원 프로필
                  </th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                    지점
                  </th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                    회원 상태
                  </th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                    이용권
                  </th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                    가입일
                  </th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      불러오는 중입니다...
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-rose-500 font-medium">
                      회원 목록을 불러오지 못했습니다: {loadError}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <User size={32} className="text-slate-300 dark:text-slate-700" />
                        <p className="font-bold text-slate-600 dark:text-slate-300 text-base">
                          조건에 맞는 회원이 없습니다.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((member) => (
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
                            <p className="font-bold text-slate-900 dark:text-white">{member.name}</p>
                            <p className="text-xs text-slate-400">{member.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                        {member.branch_name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md ${memberStatusStyle[member.status]}`}
                        >
                          {memberStatusLabel[member.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {member.latestMembership ? member.latestMembership.plan_name : '이용권 없음'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {member.created_at.slice(0, 10)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {confirmDeleteId === member.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                              정말 삭제할까요?
                            </span>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              취소
                            </button>
                            <button
                              onClick={() => handleDelete(member.id)}
                              disabled={deletingId === member.id}
                              className="px-2.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {deletingId === member.id ? '삭제 중...' : '삭제 확정'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setConfirmDeleteId(member.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            >
                              <Trash2 size={16} className="shrink-0" />
                            </button>
                            <button
                              onClick={() => onSelectMember(member.id)}
                              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <MoreHorizontal size={18} className="shrink-0" />
                            </button>
                          </div>
                        )}
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
