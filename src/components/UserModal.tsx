import React, { useState } from 'react';
import { X, UserPlus, BookOpen, KeyRound } from 'lucide-react';
import { CatalogItem, Role, User } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; email: string; role: Role; subject_id: number | null }) => void;
  catalogs: CatalogItem[];
  userToEdit?: User | null;
}

export const UserModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  catalogs,
  userToEdit,
}) => {
  if (!isOpen) return null;

  const subjects = catalogs.filter((c) => c.type === 'subjects');

  const [name, setName] = useState(userToEdit?.name || '');
  const [email, setEmail] = useState(userToEdit?.email || '');
  const [role, setRole] = useState<Role>(userToEdit?.role || 'dataEntry');
  const [subjectId, setSubjectId] = useState<number | null>(userToEdit?.subject_id || (subjects[0]?.id || null));
  const [password, setPassword] = useState('12345678');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (role === 'quality' && !subjectId) {
      alert('يجب تعيين مادة مسؤول عنها عضو فريق Quality.');
      return;
    }
    onSave({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      subject_id: role === 'quality' ? subjectId : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div>
            <span className="text-xs font-semibold text-indigo-600">
              {userToEdit ? 'تعديل بيانات الحساب' : 'عضو فريق جديد'}
            </span>
            <h2 className="text-base font-bold text-gray-900 mt-0.5">
              {userToEdit ? `تعديل حساب ${userToEdit.name}` : 'إنشاء حساب عضو جديد'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              اسم العضو *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: يوسف ممدوح"
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              البريد الإلكتروني *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={Boolean(userToEdit)}
              placeholder="user@elkheta.com"
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
              dir="ltr"
            />
          </div>

          {!userToEdit && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                كلمة المرور المؤقتة *
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                dir="ltr"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              الدور الوظيفي (Role) *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none font-semibold"
            >
              <option value="dataEntry">Data Entry</option>
              <option value="quality">Quality</option>
            </select>
          </div>

          {role === 'quality' && (
            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1">
                المادة المسؤولة (Subject) *
              </label>
              <select
                value={subjectId || ''}
                onChange={(e) => setSubjectId(Number(e.target.value))}
                required
                className="w-full bg-indigo-50/50 border border-indigo-300 rounded-xl px-3.5 py-2 text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              >
                <option value="">اختر المادة</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-gray-400 block mt-1">
                عضو الـ Quality يرى فقط المهام التابعة لهذه المادة ويمكنه رفع ملفات Raw فقط لها.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
            >
              {userToEdit ? 'حفظ التعديلات' : 'إنشاء الحساب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
