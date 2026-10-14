import React, { useState, useEffect } from 'react';
import { X, Calendar, User, BookOpen, GraduationCap, Video, AlertCircle } from 'lucide-react';
import { CatalogItem, Task, User as UserModel } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => void;
  taskToEdit?: Task | null;
  catalogs: CatalogItem[];
  users: UserModel[];
}

export const TaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  catalogs,
  users,
}) => {
  if (!isOpen) return null;

  const teachers = catalogs.filter((c) => c.type === 'teachers');
  const grades = catalogs.filter((c) => c.type === 'grades');
  const subjects = catalogs.filter((c) => c.type === 'subjects');
  const lectures = catalogs.filter((c) => c.type === 'lectures');

  const [teacherId, setTeacherId] = useState<number>(taskToEdit?.teacher_id || (teachers[0]?.id || 0));
  const [gradeId, setGradeId] = useState<number>(taskToEdit?.grade_id || (grades[0]?.id || 0));
  const [subjectId, setSubjectId] = useState<number>(taskToEdit?.subject_id || (subjects[0]?.id || 0));
  const [lectureId, setLectureId] = useState<number>(taskToEdit?.lecture_id || (lectures[0]?.id || 0));
  const [taskOwner, setTaskOwner] = useState<'dataEntry' | 'quality'>(taskToEdit?.task_owner || 'dataEntry');
  const [qualityId, setQualityId] = useState<number>(taskToEdit?.quality_id || 0);
  const [dataEntryId, setDataEntryId] = useState<number | null>(taskToEdit?.data_entry_id || null);

  const [startDate, setStartDate] = useState(taskToEdit?.start_date || '');
  const [deliveryDate, setDeliveryDate] = useState(taskToEdit?.delivery_date || '');
  const [lectureSchedule, setLectureSchedule] = useState(taskToEdit?.lecture_schedule || '');
  const [shootingDate, setShootingDate] = useState(taskToEdit?.shooting_date || '');
  const [askingDate, setAskingDate] = useState(taskToEdit?.asking_date || '');
  const [warningDate, setWarningDate] = useState(taskToEdit?.warning_date || '');

  // Filter Quality members by chosen subject
  const availableQuality = users.filter(
    (u) => u.active && u.role === 'quality' && (!subjectId || u.subject_id === subjectId)
  );

  const availableDataEntry = users.filter((u) => u.active && u.role === 'dataEntry');

  useEffect(() => {
    // If current quality member is not valid for new subject, auto-select first matching
    if (!availableQuality.some((q) => q.id === qualityId)) {
      setQualityId(availableQuality[0]?.id || 0);
    }
  }, [subjectId, availableQuality, qualityId]);

  useEffect(() => {
    if (taskOwner === 'dataEntry' && !dataEntryId && availableDataEntry.length > 0) {
      setDataEntryId(availableDataEntry[0].id);
    }
  }, [taskOwner, dataEntryId, availableDataEntry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !gradeId || !subjectId || !lectureId || !qualityId) {
      alert('يرجى ملء جميع الحقول المطلوبة واختيار عضو Quality المناسب.');
      return;
    }
    if (taskOwner === 'dataEntry' && !dataEntryId) {
      alert('يرجى اختيار عضو Data Entry المسؤول عن المهمة.');
      return;
    }

    onSave({
      teacher_id: Number(teacherId),
      grade_id: Number(gradeId),
      subject_id: Number(subjectId),
      lecture_id: Number(lectureId),
      quality_id: Number(qualityId),
      task_owner: taskOwner,
      data_entry_id: taskOwner === 'dataEntry' ? Number(dataEntryId) : null,
      start_date: startDate || null,
      delivery_date: deliveryDate || null,
      lecture_schedule: lectureSchedule || null,
      shooting_date: shootingDate || null,
      asking_date: taskOwner === 'dataEntry' ? askingDate || null : null,
      warning_date: taskOwner === 'dataEntry' ? warningDate || null : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div>
            <span className="text-xs font-semibold text-indigo-600">
              {taskToEdit ? 'تحديث بيانات المهمة' : 'تسجيل مهمة جديدة'}
            </span>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">
              {taskToEdit ? 'تعديل المهمة' : 'إضافة مهمة تصوير وملخص'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Teacher */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Teacher (المدرس) *
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(Number(e.target.value))}
                required
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              >
                <option value="">اختر المدرس</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Grade (الصف الدراسي) *
              </label>
              <select
                value={gradeId}
                onChange={(e) => setGradeId(Number(e.target.value))}
                required
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              >
                <option value="">اختر الصف</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Subject (المادة) *
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(Number(e.target.value))}
                required
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              >
                <option value="">اختر المادة</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Lecture */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Lectures (رقم الحصة) *
              </label>
              <select
                value={lectureId}
                onChange={(e) => setLectureId(Number(e.target.value))}
                required
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              >
                <option value="">اختر الحصة</option>
                {lectures.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quality Member */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                عضو Quality المسؤول عن المادة *
              </label>
              <select
                value={qualityId}
                onChange={(e) => setQualityId(Number(e.target.value))}
                required
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              >
                <option value="">اختر مسؤول الجودة</option>
                {availableQuality.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name}
                  </option>
                ))}
              </select>
              {availableQuality.length === 0 && (
                <span className="text-[10px] text-amber-600 block mt-1">
                  تنبيه: لا يوجد عضو Quality معين لهذه المادة. يرجى تعيين عضو من شاشة "أعضاء التيم".
                </span>
              )}
            </div>

            {/* Task Owner */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                By (المسؤول عن تسليم المهمة) *
              </label>
              <select
                value={taskOwner}
                onChange={(e) => setTaskOwner(e.target.value as any)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none font-bold"
              >
                <option value="dataEntry">Data Entry</option>
                <option value="quality">Quality</option>
              </select>
            </div>

            {/* Data Entry Member (conditional) */}
            {taskOwner === 'dataEntry' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  عضو Data Entry المكلف *
                </label>
                <select
                  value={dataEntryId || ''}
                  onChange={(e) => setDataEntryId(Number(e.target.value))}
                  required
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                >
                  <option value="">اختر مدخل البيانات</option>
                  {availableDataEntry.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Dates Divider */}
          <div className="pt-3 border-t border-gray-100">
            <h4 className="text-xs font-bold text-indigo-700 mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              مواعيد وجدول المهمة
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start date on system
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Delivery date on system
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none font-bold text-indigo-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Lecture Schedule on front
                </label>
                <input
                  type="date"
                  value={lectureSchedule}
                  onChange={(e) => setLectureSchedule(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Shooting date (موعد التصوير)
                </label>
                <input
                  type="date"
                  value={shootingDate}
                  onChange={(e) => setShootingDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-emerald-400 focus:outline-none font-bold text-emerald-800"
                />
              </div>

              {/* Data Entry specific dates */}
              {taskOwner === 'dataEntry' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Asking date (تاريخ الطلب)
                    </label>
                    <input
                      type="date"
                      value={askingDate}
                      onChange={(e) => setAskingDate(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-rose-700 font-bold mb-1">
                      Warning date (تاريخ التحذير للتأخير)
                    </label>
                    <input
                      type="date"
                      value={warningDate}
                      onChange={(e) => setWarningDate(e.target.value)}
                      className="w-full bg-rose-50/50 border border-rose-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-rose-400 focus:outline-none text-rose-900 font-bold"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              حقول Asking date و Warning date مخصصة فقط لمهام Data Entry لإصدار تنبيهات التأخير التلقائية عند عدم رفع ملف Raw قبل تاريخ التحذير.
            </span>
          </div>

          {/* Modal Actions */}
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
              {taskToEdit ? 'حفظ التعديلات' : 'إضافة المهمة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
