import React, { useState } from 'react';
import { X, KeyRound, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (password: string) => void;
  title?: string;
}

export const ChangePasswordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  title = 'تغيير كلمة المرور',
}) => {
  if (!isOpen) return null;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('يجب ألا تقل كلمة المرور عن 8 خانات.');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }
    onSave(password);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2 text-indigo-700">
            <KeyRound className="w-4 h-4" />
            <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              كلمة المرور الجديدة (8 خانات فأكثر) *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              required
              minLength={8}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              dir="ltr"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              تأكيد كلمة المرور الجديدة *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              required
              minLength={8}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              dir="ltr"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
            >
              حفظ كلمة المرور
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
