import React, { useState } from 'react';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Download,
  FileText,
  AlertCircle,
  FileCheck2,
  RefreshCw,
  CheckCircle2,
  X
} from 'lucide-react';
import { Task, TaskFile, User } from '../types';

interface Props {
  tasks: Task[];
  currentUser: User;
  onNewTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onUploadFile: (taskId: number, kind: 'raw' | 'prepared', file: File) => void;
  onReplaceFile: (fileId: string, file: File) => void;
  onDeleteFile: (fileId: string) => void;
}

export const TasksView: React.FC<Props> = ({
  tasks,
  currentUser,
  onNewTask,
  onEditTask,
  onDeleteTask,
  onUploadFile,
  onReplaceFile,
  onDeleteFile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isManager = currentUser.role === 'manager';
  const isDataEntry = currentUser.role === 'dataEntry';
  const isQuality = currentUser.role === 'quality';

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter((t) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (t.teacher || '').toLowerCase().includes(term) ||
      (t.grade || '').toLowerCase().includes(term) ||
      (t.subject || '').toLowerCase().includes(term) ||
      (t.lecture || '').toLowerCase().includes(term) ||
      (t.quality_name || '').toLowerCase().includes(term) ||
      (t.data_entry_name || '').toLowerCase().includes(term)
    );
  });

  const formatDate = (val: string | null) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleDateString('ar-EG');
    } catch {
      return val;
    }
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    taskId: number,
    kind: 'raw' | 'prepared',
    existingFileId?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (existingFileId) {
      onReplaceFile(existingFileId, file);
    } else {
      onUploadFile(taskId, kind, file);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم المدرس، المادة، الصف، أو رقم الحصة..."
            className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              مسح
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
            {filteredTasks.length} مهمة معروضة
          </span>

          {isManager && (
            <button
              onClick={onNewTask}
              className="inline-flex items-center gap-2 bg-[#4f46e5] hover:bg-[#4038c8] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مهمة جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tasks Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#fafbfe] border-b border-gray-200 text-gray-500 text-[11px] font-semibold">
                <th className="py-3 px-3.5">Teacher / Grade</th>
                <th className="py-3 px-3.5">Subject / Lecture</th>
                <th className="py-3 px-3.5">By</th>
                <th className="py-3 px-3.5">Quality</th>
                <th className="py-3 px-3.5">Start date</th>
                <th className="py-3 px-3.5">Delivery date</th>
                <th className="py-3 px-3.5">Lecture schedule</th>
                <th className="py-3 px-3.5">Asking / Warning</th>
                <th className="py-3 px-3.5">Shooting date</th>
                <th className="py-3 px-3.5 min-w-[140px]">Raw data</th>
                <th className="py-3 px-3.5 min-w-[140px]">Prepared data</th>
                {isManager && <th className="py-3 px-3.5 text-center">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const isLateWarning =
                    task.task_owner === 'dataEntry' &&
                    task.warning_date &&
                    task.warning_date <= todayStr &&
                    (task.raw_files?.length || 0) === 0;

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-[#fbfcfe] transition-colors ${
                        isLateWarning ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Teacher / Grade */}
                      <td className="py-3.5 px-3.5">
                        <strong className="text-gray-900 block font-bold">{task.teacher}</strong>
                        <span className="text-[10px] text-gray-500 block mt-0.5">{task.grade}</span>
                      </td>

                      {/* Subject / Lecture */}
                      <td className="py-3.5 px-3.5">
                        <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {task.subject}
                        </span>
                        <span className="text-[11px] text-gray-600 block mt-1 font-medium">
                          {task.lecture}
                        </span>
                      </td>

                      {/* By Owner */}
                      <td className="py-3.5 px-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            task.task_owner === 'quality'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {task.task_owner === 'quality' ? 'Quality' : 'Data Entry'}
                        </span>
                        <span className="block text-[10px] text-gray-500 mt-0.5 truncate max-w-[110px]">
                          {task.task_owner === 'quality'
                            ? task.quality_name
                            : task.data_entry_name || '—'}
                        </span>
                      </td>

                      {/* Quality */}
                      <td className="py-3.5 px-3.5 text-gray-700 font-medium">
                        {task.quality_name || '—'}
                      </td>

                      {/* Start date */}
                      <td className="py-3.5 px-3.5 text-gray-600 font-mono text-[11px]">
                        {formatDate(task.start_date)}
                      </td>

                      {/* Delivery date */}
                      <td className="py-3.5 px-3.5 text-gray-700 font-bold font-mono text-[11px]">
                        {formatDate(task.delivery_date)}
                      </td>

                      {/* Lecture schedule */}
                      <td className="py-3.5 px-3.5 text-gray-600 font-mono text-[11px]">
                        {formatDate(task.lecture_schedule)}
                      </td>

                      {/* Asking / Warning */}
                      <td className="py-3.5 px-3.5 text-[10px]">
                        {task.task_owner === 'dataEntry' ? (
                          <div className="space-y-0.5">
                            <span className="block text-gray-600">
                              طلب: {formatDate(task.asking_date)}
                            </span>
                            <span
                              className={`block font-bold ${
                                isLateWarning ? 'text-rose-600 animate-pulse' : 'text-gray-500'
                              }`}
                            >
                              تحذير: {formatDate(task.warning_date)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Shooting date */}
                      <td className="py-3.5 px-3.5 font-bold text-emerald-700 font-mono text-[11px]">
                        {formatDate(task.shooting_date)}
                      </td>

                      {/* Raw Files */}
                      <td className="py-3.5 px-3.5">
                        <div className="space-y-1.5">
                          {task.raw_files?.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between gap-1 bg-indigo-50/60 p-1.5 rounded-lg border border-indigo-100"
                            >
                              <a
                                href={file.url || '#'}
                                download={file.name}
                                title={file.name}
                                className="text-[11px] font-medium text-indigo-700 hover:underline truncate max-w-[110px] block"
                              >
                                {file.name}
                              </a>
                              <div className="flex items-center gap-1 shrink-0">
                                {/* Replace */}
                                {(isManager || isDataEntry || isQuality) && (
                                  <label className="cursor-pointer text-[10px] text-gray-400 hover:text-indigo-600 p-0.5">
                                    <RefreshCw className="w-3 h-3" />
                                    <input
                                      type="file"
                                      className="hidden"
                                      onChange={(e) =>
                                        handleFileInputChange(e, task.id, 'raw', file.id)
                                      }
                                    />
                                  </label>
                                )}
                                {/* Delete */}
                                {(isManager || isDataEntry) && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`هل أنت متأكد من حذف الملف "${file.name}"؟`)) {
                                        onDeleteFile(file.id);
                                      }
                                    }}
                                    className="text-gray-400 hover:text-rose-600 p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                          {(isManager || isDataEntry || isQuality) && (
                            <label className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-dashed border-indigo-300 bg-indigo-50/30 text-indigo-700 hover:bg-indigo-50 text-[10px] font-semibold cursor-pointer transition-colors">
                              <Upload className="w-3 h-3" />
                              <span>رفع Raw</span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleFileInputChange(e, task.id, 'raw')}
                              />
                            </label>
                          )}
                        </div>
                      </td>

                      {/* Prepared Files */}
                      <td className="py-3.5 px-3.5">
                        {isQuality ? (
                          <span className="text-gray-300 text-xs">—</span>
                        ) : (
                          <div className="space-y-1.5">
                            {task.prepared_files?.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between gap-1 bg-emerald-50/60 p-1.5 rounded-lg border border-emerald-100"
                              >
                                <a
                                  href={file.url || '#'}
                                  download={file.name}
                                  title={file.name}
                                  className="text-[11px] font-medium text-emerald-800 hover:underline truncate max-w-[110px] block"
                                >
                                  {file.name}
                                </a>
                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Replace */}
                                  {(isManager || isDataEntry) && (
                                    <label className="cursor-pointer text-[10px] text-gray-400 hover:text-emerald-700 p-0.5">
                                      <RefreshCw className="w-3 h-3" />
                                      <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) =>
                                          handleFileInputChange(e, task.id, 'prepared', file.id)
                                        }
                                      />
                                    </label>
                                  )}
                                  {/* Delete */}
                                  {(isManager || isDataEntry) && (
                                    <button
                                      onClick={() => {
                                        if (confirm(`هل أنت متأكد من حذف الملف "${file.name}"؟`)) {
                                          onDeleteFile(file.id);
                                        }
                                      }}
                                      className="text-gray-400 hover:text-rose-600 p-0.5"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}

                            {(isManager || isDataEntry) && (
                              <label className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-dashed border-emerald-300 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-50 text-[10px] font-semibold cursor-pointer transition-colors">
                                <Upload className="w-3 h-3" />
                                <span>رفع Prepared</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => handleFileInputChange(e, task.id, 'prepared')}
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      {isManager && (
                        <td className="py-3.5 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onEditTask(task)}
                              title="تعديل المهمة"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`هل تريد حذف مهمة ${task.teacher} - ${task.subject}؟`)) {
                                  onDeleteTask(task.id);
                                }
                              }}
                              title="حذف المهمة"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isManager ? 12 : 11} className="py-12 text-center text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold text-gray-600">لا توجد مهام مطابقة للبحث</p>
                    <p className="text-xs text-gray-400 mt-1">جرّب تغيير كلمات البحث أو أضف مهمة جديدة.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
