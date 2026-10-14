import { CatalogItem, Task, User } from '../types';

export const INITIAL_CATALOGS: CatalogItem[] = [
  // Grades
  { id: 1, type: 'grades', label: 'Junior 4', created_at: '2025-01-01' },
  { id: 2, type: 'grades', label: 'Junior 5', created_at: '2025-01-01' },
  { id: 3, type: 'grades', label: 'Junior 6', created_at: '2025-01-01' },
  { id: 4, type: 'grades', label: 'Middle 1', created_at: '2025-01-01' },
  { id: 5, type: 'grades', label: 'Middle 2', created_at: '2025-01-01' },
  { id: 6, type: 'grades', label: 'Middle 3', created_at: '2025-01-01' },
  { id: 7, type: 'grades', label: 'Senior 1', created_at: '2025-01-01' },
  { id: 8, type: 'grades', label: 'Senior 2', created_at: '2025-01-01' },
  { id: 9, type: 'grades', label: 'Senior 3', created_at: '2025-01-01' },

  // Subjects
  { id: 10, type: 'subjects', label: 'Science-Ar', created_at: '2025-01-01' },
  { id: 11, type: 'subjects', label: 'Science-En', created_at: '2025-01-01' },
  { id: 12, type: 'subjects', label: 'Math-Ar', created_at: '2025-01-01' },
  { id: 13, type: 'subjects', label: 'Math-En', created_at: '2025-01-01' },
  { id: 14, type: 'subjects', label: 'Arabic', created_at: '2025-01-01' },
  { id: 15, type: 'subjects', label: 'English', created_at: '2025-01-01' },
  { id: 16, type: 'subjects', label: 'Social-Studies', created_at: '2025-01-01' },
  { id: 17, type: 'subjects', label: 'Integrated-Science-Ar', created_at: '2025-01-01' },
  { id: 18, type: 'subjects', label: 'History', created_at: '2025-01-01' },
  { id: 19, type: 'subjects', label: 'Geography', created_at: '2025-01-01' },

  // Teachers
  { id: 20, type: 'teachers', label: 'مستر أحمد عبد السلام', created_at: '2025-01-01' },
  { id: 21, type: 'teachers', label: 'مستر محمد علي', created_at: '2025-01-01' },
  { id: 22, type: 'teachers', label: 'ميس فاطمة الزهراء', created_at: '2025-01-01' },
  { id: 23, type: 'teachers', label: 'د. طارق شاكر', created_at: '2025-01-01' },
  { id: 24, type: 'teachers', label: 'مستر إسلام فهمي', created_at: '2025-01-01' },

  // Lectures
  { id: 25, type: 'lectures', label: 'Lecture 01 - مقدمة وتأسيس', created_at: '2025-01-01' },
  { id: 26, type: 'lectures', label: 'Lecture 02 - الوحدة الأولى', created_at: '2025-01-01' },
  { id: 27, type: 'lectures', label: 'Lecture 03 - تدريبات ومسائل', created_at: '2025-01-01' },
  { id: 28, type: 'lectures', label: 'Lecture 04 - ملخص شامل واختبار', created_at: '2025-01-01' },
];

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    name: 'أحمد داوي (المدير)',
    email: 'dawy@elkheta.com',
    role: 'manager',
    subject_id: null,
    active: true,
  },
  {
    id: 2,
    name: 'سارة محمود (Data Entry)',
    email: 'sara.entry@elkheta.com',
    role: 'dataEntry',
    subject_id: null,
    active: true,
  },
  {
    id: 3,
    name: 'كريم الجوهري (Quality - Science)',
    email: 'karim.quality@elkheta.com',
    role: 'quality',
    subject_id: 10, // Science-Ar
    active: true,
  },
  {
    id: 4,
    name: 'نهى سمير (Quality - Math)',
    email: 'noha.quality@elkheta.com',
    role: 'quality',
    subject_id: 12, // Math-Ar
    active: true,
  },
  {
    id: 5,
    name: 'عمر شريف (Data Entry)',
    email: 'omar.entry@elkheta.com',
    role: 'dataEntry',
    subject_id: null,
    active: true,
  },
];

const today = new Date();
const formatDateOffset = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 101,
    teacher_id: 21, // مستر محمد علي
    grade_id: 4,    // Middle 1
    subject_id: 10, // Science-Ar
    lecture_id: 25, // Lecture 01
    quality_id: 3,  // كريم الجوهري
    data_entry_id: 2, // سارة محمود
    task_owner: 'dataEntry',
    start_date: formatDateOffset(-4),
    delivery_date: formatDateOffset(5),
    lecture_schedule: formatDateOffset(8),
    asking_date: formatDateOffset(-3),
    warning_date: formatDateOffset(-1), // late warning triggered!
    shooting_date: formatDateOffset(2),
    created_at: '2025-01-10',
    updated_at: '2025-01-10',
    raw_files: [],
    prepared_files: [],
  },
  {
    id: 102,
    teacher_id: 20, // مستر أحمد عبد السلام
    grade_id: 7,    // Senior 1
    subject_id: 12, // Math-Ar
    lecture_id: 26, // Lecture 02
    quality_id: 4,  // نهى سمير
    data_entry_id: 2,
    task_owner: 'quality',
    start_date: formatDateOffset(-6),
    delivery_date: formatDateOffset(3),
    lecture_schedule: formatDateOffset(6),
    asking_date: null,
    warning_date: null,
    shooting_date: formatDateOffset(1),
    created_at: '2025-01-08',
    updated_at: '2025-01-08',
    raw_files: [
      {
        id: 'f-1',
        task_id: 102,
        kind: 'raw',
        name: 'Math_Senior1_Lecture02_RawNotes.pdf',
        size: 1420500,
        uploaded_by: 4,
        uploaded_at: '2025-01-09 14:20',
      },
    ],
    prepared_files: [
      {
        id: 'f-2',
        task_id: 102,
        kind: 'prepared',
        name: 'Math_Senior1_FinalSummary_V1.pdf',
        size: 3200150,
        uploaded_by: 1,
        uploaded_at: '2025-01-11 10:15',
      },
    ],
  },
  {
    id: 103,
    teacher_id: 22, // ميس فاطمة الزهراء
    grade_id: 5,    // Middle 2
    subject_id: 10, // Science-Ar
    lecture_id: 27, // Lecture 03
    quality_id: 3,  // كريم الجوهري
    data_entry_id: 5, // عمر شريف
    task_owner: 'dataEntry',
    start_date: formatDateOffset(-1),
    delivery_date: formatDateOffset(7),
    lecture_schedule: formatDateOffset(10),
    asking_date: formatDateOffset(1),
    warning_date: formatDateOffset(3),
    shooting_date: formatDateOffset(4),
    created_at: '2025-01-12',
    updated_at: '2025-01-12',
    raw_files: [
      {
        id: 'f-3',
        task_id: 103,
        kind: 'raw',
        name: 'Science_Middle2_Slides_Raw.pptx',
        size: 4520300,
        uploaded_by: 5,
        uploaded_at: '2025-01-12 16:30',
      },
    ],
    prepared_files: [],
  },
  {
    id: 104,
    teacher_id: 23, // د. طارق شاكر
    grade_id: 9,    // Senior 3
    subject_id: 12, // Math-Ar
    lecture_id: 28, // Lecture 04
    quality_id: 4,  // نهى سمير
    data_entry_id: 2,
    task_owner: 'dataEntry',
    start_date: formatDateOffset(1),
    delivery_date: formatDateOffset(12),
    lecture_schedule: formatDateOffset(15),
    asking_date: formatDateOffset(3),
    warning_date: formatDateOffset(5),
    shooting_date: formatDateOffset(7),
    created_at: '2025-01-13',
    updated_at: '2025-01-13',
    raw_files: [],
    prepared_files: [],
  },
];
