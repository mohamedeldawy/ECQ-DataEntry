import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Sparkles, LogIn, ArrowLeft } from 'lucide-react';
import { User } from '../types';

interface Props {
  onLogin: (email: string) => boolean;
  users: User[];
  onOpenDeployGuide: (tab?: 'github-fix' | 'steps') => void;
}

export const LoginScreen: React.FC<Props> = ({
  onLogin,
  users,
  onOpenDeployGuide,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('12345678');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('يرجى كتابة البريد الإلكتروني.');
      return;
    }
    const success = onLogin(email.trim());
    if (!success) {
      setError('البريد الإلكتروني غير مسجل أو الحساب معطل.');
    }
  };

  const handleQuickLogin = (userEmail: string) => {
    onLogin(userEmail);
  };

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Art Side Panel */}
      <section className="lg:col-span-6 bg-gradient-to-br from-[#1b2142] via-[#171d39] to-[#0f1325] text-white p-8 md:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#5148d9]/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Brand */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5148d9] to-[#827bff] text-white flex items-center justify-center font-bold text-2xl shadow-xl shadow-[#5148d9]/40">
              خ
            </div>
            <div>
              <span className="text-2xl font-black tracking-wider text-white block">الخطة</span>
              <span className="text-xs text-indigo-300 font-medium">منصة تعليمية · قسم الجودة</span>
            </div>
          </div>

          <button
            onClick={() => onOpenDeployGuide('github-fix')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white text-xs font-semibold backdrop-blur-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>دليل PythonAnywhere & حل صفحة GitHub</span>
          </button>
        </div>

        {/* Hero Copy */}
        <div className="my-12 relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold border border-indigo-400/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            نظام متكامل لتتبع مهام التصوير والملخصات
          </div>

          <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight text-white">
            كل تفاصيل الإنتاج<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-300 to-white">
              في مكان واحد.
            </span>
          </h1>

          <p className="text-indigo-200/90 text-sm md:text-base leading-relaxed max-w-lg">
            متابعة مواعيد التصوير والملخصات التعليمية لفرق الجودة والداتا إنتري من بداية المهمة وحتى التسليم النهائي للطلاب.
          </p>

          <div className="pt-4 grid grid-cols-2 gap-3 text-xs text-indigo-200">
            <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
              <span className="font-bold block text-white text-sm mb-0.5">صلاحيات محكمة</span>
              فصل مهام الـ Quality والـ Data Entry مع حماية ملفات Prepared.
            </div>
            <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
              <span className="font-bold block text-white text-sm mb-0.5">جاهز للـ PythonAnywhere</span>
              قاعدة بيانات SQLite وتوافق تام مع خوادم WSGI.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-indigo-300/70 border-t border-white/10 pt-4 relative z-10 flex items-center justify-between">
          <span>إدارة موحدة للفريق · بيانات محفوظة على خادم النظام</span>
          <span className="font-mono text-[11px]">v1.0.0</span>
        </div>
      </section>

      {/* Login Form Panel */}
      <section className="lg:col-span-6 flex items-center justify-center p-8 md:p-14 bg-[#f8fafc]">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-xl shadow-gray-200/40">
            <div className="mb-6">
              <span className="text-xs font-bold text-indigo-600 block uppercase tracking-wider mb-1">
                مرحبًا بعودتك
              </span>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">تسجيل الدخول</h2>
              <p className="text-xs text-gray-500 mt-1">سجّل الدخول بحساب الفريق للمتابعة.</p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="name@elkheta.com"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono focus:ring-2 focus:ring-indigo-400 focus:bg-white focus:outline-none transition-all"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono focus:ring-2 focus:ring-indigo-400 focus:bg-white focus:outline-none transition-all"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#4f46e5] hover:bg-[#4038c8] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>دخول إلى النظام</span>
              </button>
            </form>

            {/* Quick Demo Logins for instant preview */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 block mb-3 text-center">
                أو سجّل الدخول التجريبي السريع بنقرة واحدة:
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('dawy@elkheta.com')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-xs font-semibold text-indigo-900 transition-colors text-right"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <span>أحمد داوي (المدير العام)</span>
                  </div>
                  <span className="text-[10px] text-indigo-700 bg-white px-2 py-0.5 rounded font-bold">
                    كامل الصلاحيات
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('sara.entry@elkheta.com')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-xs font-semibold text-amber-900 transition-colors text-right"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    <span>سارة محمود (Data Entry)</span>
                  </div>
                  <span className="text-[10px] text-amber-700 bg-white px-2 py-0.5 rounded font-bold">
                    رفع وحذف Raw & Prepared
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('karim.quality@elkheta.com')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-xs font-semibold text-emerald-900 transition-colors text-right"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>كريم الجوهري (Quality - Science)</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded font-bold">
                    مهام Science فقط + رفع Raw
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
