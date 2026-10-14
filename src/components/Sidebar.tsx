import React from 'react';
import {
  LayoutDashboard,
  ListTodo,
  FolderTree,
  Users,
  LogOut,
  KeyRound,
  Rocket,
  ShieldAlert,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { User, Role } from '../types';

interface Props {
  currentView: string;
  onViewChange: (view: string) => void;
  currentUser: User;
  onLogout: () => void;
  onChangePassword: () => void;
  onOpenDeployGuide: () => void;
  onSwitchRole: (user: User) => void;
  allUsers: User[];
}

export const Sidebar: React.FC<Props> = ({
  currentView,
  onViewChange,
  currentUser,
  onLogout,
  onChangePassword,
  onOpenDeployGuide,
  onSwitchRole,
  allUsers,
}) => {
  const isManager = currentUser.role === 'manager';

  const navItems = isManager
    ? [
        { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
        { id: 'tasks', label: 'جدول المهام', icon: ListTodo },
        { id: 'catalogs', label: 'القوائم المرجعية', icon: FolderTree },
        { id: 'users', label: 'أعضاء التيم', icon: Users },
      ]
    : [
        { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
        { id: 'tasks', label: 'مهامي والملفات', icon: ListTodo },
      ];

  const roleLabels: Record<Role, string> = {
    manager: 'المدير العام',
    dataEntry: 'Data Entry',
    quality: 'Quality',
  };

  const roleColors: Record<Role, string> = {
    manager: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    dataEntry: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    quality: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-30 w-64 bg-[#171d39] text-[#dfe4ff] flex flex-col p-5 shadow-2xl border-l border-indigo-900/30">
      {/* Brand */}
      <div className="flex items-center gap-3 pb-6 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5148d9] to-[#827bff] text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-[#5148d9]/40 shrink-0">
          خ
        </div>
        <div>
          <span className="text-xl font-extrabold tracking-wide text-white block">الخطة</span>
          <span className="text-[11px] text-indigo-300/80 block">متابعة الجودة والإنتاج</span>
        </div>
      </div>

      {/* Deploy Helper Button */}
      <div className="my-4">
        <button
          onClick={onOpenDeployGuide}
          className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-3 rounded-xl flex items-center gap-2.5 text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98]"
        >
          <Rocket className="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
          <div className="text-right flex-1">
            <span className="block leading-tight">دليل رفع PythonAnywhere</span>
            <span className="text-[10px] text-emerald-200 font-normal">أوامر Bash + ملف ZIP</span>
          </div>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">5 خطوات</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">
        إدارة العمليات
      </div>
      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#5148d9] text-white shadow-lg shadow-[#5148d9]/30 translate-x-[-2px]'
                  : 'text-[#c1c9e5] hover:bg-white/[0.07] hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Role Switcher for Testing Preview */}
      <div className="mt-4 p-3 rounded-xl bg-white/[0.04] border border-white/5">
        <div className="flex items-center justify-between text-[11px] text-indigo-300 mb-2">
          <span className="flex items-center gap-1 font-semibold">
            <ArrowRightLeft className="w-3 h-3 text-indigo-400" />
            تبديل الحساب للمعاينة:
          </span>
        </div>
        <select
          value={currentUser.id}
          onChange={(e) => {
            const user = allUsers.find((u) => u.id === Number(e.target.value));
            if (user) onSwitchRole(user);
          }}
          className="w-full bg-[#20274c] text-xs text-white border border-indigo-500/30 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
        >
          {allUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({roleLabels[u.role]})
            </option>
          ))}
        </select>
        <span className="text-[10px] text-gray-400 block mt-1 leading-tight">
          يتيح لك فحص شاشات Data Entry وQuality فورًا.
        </span>
      </div>

      {/* User Info & Footer */}
      <div className="mt-auto pt-4 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.04]">
          <div className="w-9 h-9 rounded-full bg-[#343c68] text-white font-bold flex items-center justify-center text-sm shrink-0 border border-white/10">
            {currentUser.name.slice(0, 1)}
          </div>
          <div className="overflow-hidden flex-1 text-right">
            <span className="font-bold text-xs text-white block truncate">{currentUser.name}</span>
            <span
              className={`inline-block text-[10px] px-2 py-0.5 rounded-full border mt-0.5 ${
                roleColors[currentUser.role]
              }`}
            >
              {roleLabels[currentUser.role]}
            </span>
          </div>
        </div>

        <button
          onClick={onChangePassword}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-indigo-200 hover:text-white hover:bg-white/[0.07] transition-colors"
        >
          <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
          <span>تغيير كلمة المرور</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:text-rose-100 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
};
