import { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  membershipStatus: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';
  nextPaymentDate: string;
  consentSms: boolean;
  plan: string;
}

export default function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setTimeout(() => {
        // 💡 여기에 빈 배열([])을 넣으면 데이터가 없는(비어있는) 상태를 볼 수 있어!
        setMembers([]);
        setLoading(false);
      }, 500);
    };
    fetchMembers();
  }, [searchTerm]);

  const getStatusBadge = (status: string) => {
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

  const handleRegisterClick = () => {
    alert('새로운 회원을 등록하는 창(모달)이 열립니다! 🚀');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <LayoutDashboard size={18} className="shrink-0" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">
              CRM System
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('알림이 없습니다.')}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <Bell size={20} className="shrink-0" />
            </button>
            <button
              onClick={() => alert('설정 메뉴')}
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <Settings size={18} className="text-slate-600 shrink-0" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              강남점 오퍼레이션
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              실시간 회원 상태 및 결제 지표를 모니터링합니다.
            </p>
          </div>
          <button
            onClick={handleRegisterClick}
            className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 shrink-0"
          >
            <Plus size={18} className="shrink-0" />
            새로운 회원 등록
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 mb-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Users size={24} className="shrink-0" />
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                0%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400">총 활성 회원</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">0</span>
                <span className="text-xs font-bold text-slate-400">명</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <CreditCard size={24} className="shrink-0" />
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                0%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400">
                이번 달 예상 매출
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">0</span>
                <span className="text-xs font-bold text-slate-400">백만원</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <AlertOctagon size={24} className="shrink-0" />
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                0건
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400">
                결제 지연 / 미납
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">0</span>
                <span className="text-xs font-bold text-slate-400">건</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-sm relative">
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <h2 className="text-base font-extrabold text-slate-900">
              회원 데이터베이스
            </h2>

            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search size={16} className="shrink-0" />
              </span>
              <input
                type="text"
                className="w-full py-2 pl-10 pr-4 text-sm font-medium bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
                placeholder="이름, 연락처로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-400 border-b border-slate-200">
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
                    다음 결제일
                  </th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-400 font-medium"
                    >
                      데이터를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <User size={32} className="text-slate-300" />
                        <p className="font-bold text-slate-600 text-base">
                          등록된 회원이 없습니다.
                        </p>
                        <p className="text-xs text-slate-400">
                          새로운 회원을 등록해서 데이터를 채워보세요!
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <User size={16} className="shrink-0" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {member.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {member.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-xs">
                          {member.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(member.membershipStatus)}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {member.nextPaymentDate}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => alert(`${member.name} 회원 상세 정보`)}
                          className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <MoreHorizontal size={18} className="shrink-0" />
                        </button>
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
