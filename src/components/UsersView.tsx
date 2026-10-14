import React from 'react';
import { Plus, Edit3, KeyRound, UserX, UserCheck, Users, Shield, BookOpen } from 'lucide-react';
import { CatalogItem, User } from '../types';

interface Props {
  users: User[];
  catalogs: CatalogItem[];
  onNewUser: () => void;
  onEditUser: (user: User) => void;
  onToggleActive: (id: number) => void;
  onResetPassword: (user: User) => void;
}

export const UsersView: React.FC<Props> = ({
  users,
  catalogs,
  onNewUser,
  onEditUser,
  onToggleActive,
  onResetPassword,
}) => {
  const teamMembers = users.filter((u) => u.role !== 'manager');
  const subjects = catalogs.filter((c) => c.type === 'subjects');

  const getSubjectName = (subjectId: number | null) => {
    if (!subjectId) return '—';
    return subjects.find((s) => s.id === subjectId)?.label || '—';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">أعضاء التيم والحسابات</h2>
          <p className="text-sm text-gray-500 mt-1">
            أنشئ حسابات Data Entry أو Quality واربط كل عضو جودة بمادته المسؤولة.
          </p>
        </div>

        <button
          onClick={onNewUser}
          className="inline-flex items-center gap-2 bg-[#4f46e5] hover:bg-[#4038c8] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عضو جديد</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#fafbfe] border-b border-gray-200 text-gray-500 text-[11px] font-semibold">
                <th className="py-3.5 px-4">الاسم</th>
                <th className="py-3.5 px-4">الدور الوظيفي</th>
                <th className="py-3.5 px-4">المادة المسؤولة</th>
                <th className="py-3.5 px-4">البريد الإلكتروني</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">إجراءات الحساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <tr
                    key={member.id}
                    className={`hover:bg-indigo-50/20 transition-colors ${
                      !member.active ? 'opacity-60 bg-gray-50' : ''
                    }`}
                  >
                    {/* Name */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {member.name.slice(0, 1)}
                        </div>
                        <div>
                          <strong className="text-gray-900 font-bold block">{member.name}</strong>
                          {!member.active && (
                            <span className="text-[10px] text-rose-600 font-semibold block">
                              حساب موقوف
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          member.role === 'quality'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {member.role === 'quality' ? 'Quality' : 'Data Entry'}
                      </span>
                    </td>

                    {/* Assigned Subject */}
                    <td className="py-4 px-4">
                      {member.role === 'quality' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg">
                          <BookOpen className="w-3 h-3" />
                          {getSubjectName(member.subject_id)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="py-4 px-4 font-mono text-gray-600">{member.email}</td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {member.active ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          نشط
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-600 font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                          معطل
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEditUser(member)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                          title="تعديل البيانات"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onResetPassword(member)}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold transition-colors"
                        >
                          كلمة المرور
                        </button>

                        <button
                          onClick={() => onToggleActive(member.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                            member.active
                              ? 'text-rose-700 hover:bg-rose-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {member.active ? 'إيقاف الصلاحية' : 'إعادة التفعيل'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    لا يوجد أعضاء مسجلون في الفريق حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50/70 border-t border-gray-100 text-[11px] text-gray-500">
          💡 ملاحظة: إيقاف صلاحية العضو يمنعه من تسجيل الدخول إلى النظام مع الحفاظ على كل المهام والملفات المسندة إليه دون حذف.
        </div>
      </div>
    </div>
  );
};
