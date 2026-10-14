import React, { useState } from 'react';
import { X, FolderTree } from 'lucide-react';
import { CatalogItem, CatalogType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (label: string) => void;
  type: CatalogType;
  itemToEdit?: CatalogItem | null;
}

export const CatalogModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  type,
  itemToEdit,
}) => {
  if (!isOpen) return null;

  const [label, setLabel] = useState(itemToEdit?.label || '');

  const typeNames: Record<CatalogType, string> = {
    teachers: 'مدرس جديد',
    grades: 'صف دراسي',
    subjects: 'مادة تعليمية',
    lectures: 'رقم / مسمى حصة',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    onSave(label.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div>
            <span className="text-xs font-semibold text-indigo-600">
              {itemToEdit ? 'تعديل عنصر' : 'عنصر جديد بالقائمة'}
            </span>
            <h2 className="text-base font-bold text-gray-900 mt-0.5">
              {itemToEdit ? `تعديل ${itemToEdit.label}` : `إضافة ${typeNames[type]}`}
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
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              الاسم / التسمية *
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`مثال: ${
                type === 'teachers'
                  ? 'مستر حسام خليل'
                  : type === 'subjects'
                  ? 'Chemistry-En'
                  : type === 'grades'
                  ? 'Senior 2'
                  : 'Lecture 05'
              }`}
              required
              maxLength={100}
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
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
              {itemToEdit ? 'حفظ التعديل' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
