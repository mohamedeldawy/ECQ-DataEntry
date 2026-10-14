import React from 'react';
import {
  ListTodo,
  UploadCloud,
  FileCheck,
  CalendarDays,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Video,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Task, User } from '../types';

interface Props {
  tasks: Task[];
  currentUser: User;
  onNewTask: () => void;
  onGoToTasks: () => void;
}

export const OverviewView: React.FC<Props> = ({
  tasks,
  currentUser,
  onNewTask,
  onGoToTasks,
}) => {
  const isManager = currentUser.role === 'manager';
  const todayStr = new Date().toISOString().split('T')[0];

  const pendingRaw = tasks.filter((t) => (t.raw_files?.length || 0) === 0).length;
  const pendingPrepared = tasks.filter((t) => (t.prepared_files?.length || 0) === 0).length;
  const upcoming = tasks
    .filter((t) => t.shooting_date && t.shooting_date >= todayStr)
    .sort((a, b) => (a.shooting_date || '').localeCompare(b.shooting_date || ''))
    .slice(0, 5);

  const overdue = tasks.filter(
    (t) =>
      t.task_owner === 'dataEntry' &&
      t.warning_date &&
      t.warning_date <= todayStr &&
      (t.raw_files?.length || 0) === 0
  );

  const formatDate = (val: string | null) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleDateString('ar-EG');
    } catch {
      return val;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            أهلًا بك، {currentUser.name} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            تابع مواعيد التصوير وجداول الإنتاج، وحالة تسليم ملفات الـ Raw والـ Prepared.
          </p>
        </div>
        {isManager && (
          <button
            onClick={onNewTask}
            className="inline-flex items-center gap-2 bg-[#4f46e5] hover:bg-[#4038c8] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مهمة جديدة</span>
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">إجمالي المهام</p>
            <strong className="text-2xl font-black text-gray-900 block my-0.5">
              {tasks.length}
            </strong>
            <small className="text-[11px] text-gray-400 block">المهام المسجلة على النظام</small>
          </div>
        </div>

        {/* Pending Raw */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">بانتظار Raw</p>
            <strong className="text-2xl font-black text-gray-900 block my-0.5">
              {pendingRaw}
            </strong>
            <small className="text-[11px] text-amber-600 font-medium block">
              ملفات لم يتم رفعها بعد
            </small>
          </div>
        </div>

        {/* Pending Prepared */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">بانتظار Prepared</p>
            <strong className="text-2xl font-black text-gray-900 block my-0.5">
              {pendingPrepared}
            </strong>
            <small className="text-[11px] text-blue-600 font-medium block">
              ملفات لم يتم تجهيزها
            </small>
          </div>
        </div>

        {/* Upcoming Shooting */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">تصويرات قادمة</p>
            <strong className="text-2xl font-black text-gray-900 block my-0.5">
              {upcoming.length}
            </strong>
            <small className="text-[11px] text-emerald-600 font-medium block">
              مواعيد تصوير مستقبلية
            </small>
          </div>
        </div>
      </div>

      {/* Overdue Warnings Panel */}
      {overdue.length > 0 && (
        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-rose-200/70 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
              <h3 className="font-bold text-rose-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                تنبيهات تأخير (Warning Date Overdue)
              </h3>
            </div>
            <span className="bg-rose-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {overdue.length} مهام متأخرة
            </span>
          </div>
          <p className="text-xs text-rose-800 mb-3">
            حلّ موعد التحذير (Warning Date) لهذه المهام الخاصة بـ Data Entry ولم يتم رفع ملف الـ Raw حتى الآن:
          </p>
          <div className="space-y-2">
            {overdue.map((task) => (
              <div
                key={task.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white border border-rose-200 text-xs"
              >
                <div>
                  <strong className="text-gray-900 ml-1">{task.teacher}</strong> ·{' '}
                  <span className="text-indigo-600 font-semibold">{task.subject}</span> ·{' '}
                  <span className="text-gray-600">{task.lecture}</span>
                  <span className="block text-[11px] text-gray-400 mt-0.5">
                    المسؤول: {task.data_entry_name || 'Data Entry'} | الجودة: {task.quality_name}
                  </span>
                </div>
                <div className="text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 self-start sm:self-auto">
                  موعد التحذير: {formatDate(task.warning_date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Shootings Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-base">أقرب مواعيد التصوير</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              المهام القادمة حسب موعد التصوير (Shooting Date)
            </p>
          </div>
          <button
            onClick={onGoToTasks}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-all"
          >
            <span>عرض كل المهام</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcoming.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500">
                  <th className="py-3 px-4 font-semibold">Teacher</th>
                  <th className="py-3 px-4 font-semibold">Subject</th>
                  <th className="py-3 px-4 font-semibold">Lecture</th>
                  <th className="py-3 px-4 font-semibold">Quality Member</th>
                  <th className="py-3 px-4 font-semibold">Shooting Date</th>
                  <th className="py-3 px-4 font-semibold">Delivery Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {upcoming.map((task) => (
                  <tr key={task.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{task.teacher}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-medium text-[11px]">
                        {task.subject}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 font-medium">{task.lecture}</td>
                    <td className="py-3.5 px-4 text-gray-600">{task.quality_name || '—'}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {formatDate(task.shooting_date)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {formatDate(task.delivery_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 text-xs">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-600">لا توجد مواعيد تصوير مستقبلية حاليًا</p>
            <p className="text-gray-400 mt-1">ستظهر المهام هنا تلقائيًا عند تحديد تاريخ التصوير.</p>
          </div>
        )}
      </div>
    </div>
  );
};
