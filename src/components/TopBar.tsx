import React from 'react';
import { Calendar, Rocket, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { User } from '../types';

interface Props {
  currentView: string;
  currentUser: User;
  onOpenDeployGuide: (tab?: 'github-fix' | 'steps') => void;
  onRefresh: () => void;
}

export const TopBar: React.FC<Props> = ({
  currentView,
  currentUser,
  onOpenDeployGuide,
  onRefresh,
}) => {
  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'نظرة عامة على الإنتاج',
      subtitle: 'متابعة مواعيد التصوير، ملخصات المواد، وتنبيهات المهام المتأخرة',
    },
    tasks: {
      title: 'جدول المهام وملفات الـ Raw و Prepared',
      subtitle: 'إدارة وتسليم ومراجعة ملفات التصوير والحصص التعليمية',
    },
    catalogs: {
      title: 'القوائم المرجعية (Catalogs)',
      subtitle: 'إدارة المدرسين، الصفوف الدراسية، المواد، وأرقام الحصص',
    },
    users: {
      title: 'أعضاء التيم والحسابات',
      subtitle: 'إدارة حسابات فريق الجودة والداتا إنتري وتوزيع المواد',
    },
  };

  const viewInfo = titles[currentView] || titles.overview;

  const todayStr = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          نظام الخطة التعليمي · قسم الجودة والإنتاج
        </div>
        <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
          {viewInfo.title}
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">{viewInfo.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => onOpenDeployGuide('github-fix')}
          className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>حل مشكلة صفحة GitHub البيضاء</span>
        </button>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 px-3.5 py-2 rounded-xl text-xs font-medium">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span>{todayStr}</span>
        </div>

        <button
          onClick={onRefresh}
          title="تحديث البيانات"
          className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={() => onOpenDeployGuide('steps')}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Rocket className="w-4 h-4 text-indigo-200" />
          <span>دليل PythonAnywhere 🚀</span>
        </button>
      </div>
    </header>
  );
};
