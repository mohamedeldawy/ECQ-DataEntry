import { CatalogItem, CatalogType, Role, Task, TaskFile, User } from '../types';
import { INITIAL_CATALOGS, INITIAL_TASKS, INITIAL_USERS } from './initialData';

const STORAGE_KEY_TASKS = 'elkheta_tasks_v1';
const STORAGE_KEY_CATALOGS = 'elkheta_catalogs_v1';
const STORAGE_KEY_USERS = 'elkheta_users_v1';
const STORAGE_KEY_CURRENT_USER = 'elkheta_current_user_v1';

export class Store {
  private tasks: Task[];
  private catalogs: CatalogItem[];
  private users: User[];
  private currentUser: User | null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.catalogs = this.load(STORAGE_KEY_CATALOGS, INITIAL_CATALOGS);
    this.users = this.load(STORAGE_KEY_USERS, INITIAL_USERS);
    this.tasks = this.load(STORAGE_KEY_TASKS, INITIAL_TASKS);
    this.currentUser = this.load(STORAGE_KEY_CURRENT_USER, this.users[0]); // default manager
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
    return fallback;
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY_CATALOGS, JSON.stringify(this.catalogs));
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(this.tasks));
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(this.currentUser));
    } catch (e) {
      console.warn('Could not write to localStorage', e);
    }
    this.notify();
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // Auth & Current User
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public setCurrentUser(user: User | null) {
    this.currentUser = user;
    this.persist();
  }

  public login(email: string): boolean {
    const found = this.users.find(
      (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.active
    );
    if (found) {
      this.setCurrentUser(found);
      return true;
    }
    return false;
  }

  public logout() {
    this.setCurrentUser(null);
  }

  // Catalogs
  public getCatalogs(): CatalogItem[] {
    return [...this.catalogs];
  }

  public getCatalogsByType(type: CatalogType): CatalogItem[] {
    return this.catalogs
      .filter((c) => c.type === type)
      .sort((a, b) => a.label.localeCompare(b.label, 'ar'));
  }

  public addCatalog(type: CatalogType, label: string): CatalogItem {
    const trimmed = label.trim();
    const existing = this.catalogs.find((c) => c.type === type && c.label.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      throw new Error(`العنصر "${trimmed}" موجود بالفعل في هذه القائمة.`);
    }
    const newItem: CatalogItem = {
      id: Date.now(),
      type,
      label: trimmed,
      created_at: new Date().toISOString().split('T')[0],
    };
    this.catalogs.push(newItem);
    this.persist();
    return newItem;
  }

  public updateCatalog(id: number, label: string) {
    const index = this.catalogs.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('العنصر غير موجود.');
    this.catalogs[index].label = label.trim();
    this.persist();
  }

  public deleteCatalog(id: number) {
    // Check if used in tasks
    const usedInTask = this.tasks.some(
      (t) =>
        t.teacher_id === id ||
        t.grade_id === id ||
        t.subject_id === id ||
        t.lecture_id === id
    );
    if (usedInTask) {
      throw new Error('لا يمكن حذف هذا العنصر لأنه مرتبط بمهام موجودة.');
    }
    this.catalogs = this.catalogs.filter((c) => c.id !== id);
    this.persist();
  }

  // Users
  public getUsers(): User[] {
    return [...this.users];
  }

  public addUser(name: string, email: string, role: Role, subject_id: number | null): User {
    const trimmedEmail = email.trim().toLowerCase();
    if (this.users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      throw new Error('البريد الإلكتروني مسجل بالفعل لمستخدم آخر.');
    }
    const newUser: User = {
      id: Date.now(),
      name: name.trim(),
      email: trimmedEmail,
      role,
      subject_id: role === 'quality' ? subject_id : null,
      active: true,
    };
    this.users.push(newUser);
    this.persist();
    return newUser;
  }

  public updateUser(id: number, name: string, role: Role, subject_id: number | null) {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error('المستخدم غير موجود.');
    user.name = name.trim();
    user.role = role;
    user.subject_id = role === 'quality' ? subject_id : null;
    this.persist();
  }

  public toggleUserActive(id: number) {
    const user = this.users.find((u) => u.id === id);
    if (!user) return;
    if (user.role === 'manager') {
      throw new Error('لا يمكن إيقاف حساب المدير.');
    }
    user.active = !user.active;
    this.persist();
  }

  // Tasks
  public getTasks(forUser?: User | null): Task[] {
    const currentUser = forUser !== undefined ? forUser : this.currentUser;
    let list = this.tasks.map((task) => {
      const teacher = this.catalogs.find((c) => c.id === task.teacher_id)?.label || '—';
      const grade = this.catalogs.find((c) => c.id === task.grade_id)?.label || '—';
      const subject = this.catalogs.find((c) => c.id === task.subject_id)?.label || '—';
      const lecture = this.catalogs.find((c) => c.id === task.lecture_id)?.label || '—';
      const quality = this.users.find((u) => u.id === task.quality_id)?.name || '—';
      const dataEntry = this.users.find((u) => u.id === task.data_entry_id)?.name || '—';

      return {
        ...task,
        teacher,
        grade,
        subject,
        lecture,
        quality_name: quality,
        data_entry_name: dataEntry,
      };
    });

    if (currentUser?.role === 'quality') {
      // Quality only sees their assigned subject
      list = list.filter((t) => t.subject_id === currentUser.subject_id);
      // Quality cannot see prepared files
      list = list.map((t) => ({ ...t, prepared_files: [] }));
    }

    return list;
  }

  public addTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'raw_files' | 'prepared_files'>) {
    const newTask: Task = {
      ...task,
      id: Date.now(),
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
      raw_files: [],
      prepared_files: [],
    };
    this.tasks.unshift(newTask);
    this.persist();
    return newTask;
  }

  public updateTask(id: number, data: Partial<Task>) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('المهمة غير موجودة.');
    this.tasks[index] = {
      ...this.tasks[index],
      ...data,
      updated_at: new Date().toISOString().split('T')[0],
    };
    this.persist();
  }

  public deleteTask(id: number) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.persist();
  }

  // Files
  public addFile(taskId: number, kind: 'raw' | 'prepared', file: File) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('المهمة غير موجودة.');

    const newFile: TaskFile = {
      id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      task_id: taskId,
      kind,
      name: file.name,
      size: file.size,
      uploaded_by: this.currentUser?.id || 1,
      uploaded_at: new Date().toLocaleString('ar-EG'),
      url: URL.createObjectURL(file),
    };

    if (kind === 'raw') {
      task.raw_files.push(newFile);
    } else {
      task.prepared_files.push(newFile);
    }
    this.persist();
    return newFile;
  }

  public replaceFile(fileId: string, newFile: File) {
    for (const task of this.tasks) {
      const rawIdx = task.raw_files.findIndex((f) => f.id === fileId);
      if (rawIdx !== -1) {
        task.raw_files[rawIdx] = {
          ...task.raw_files[rawIdx],
          name: newFile.name,
          size: newFile.size,
          uploaded_at: new Date().toLocaleString('ar-EG'),
          url: URL.createObjectURL(newFile),
        };
        this.persist();
        return;
      }
      const prepIdx = task.prepared_files.findIndex((f) => f.id === fileId);
      if (prepIdx !== -1) {
        task.prepared_files[prepIdx] = {
          ...task.prepared_files[prepIdx],
          name: newFile.name,
          size: newFile.size,
          uploaded_at: new Date().toLocaleString('ar-EG'),
          url: URL.createObjectURL(newFile),
        };
        this.persist();
        return;
      }
    }
  }

  public deleteFile(fileId: string) {
    for (const task of this.tasks) {
      task.raw_files = task.raw_files.filter((f) => f.id !== fileId);
      task.prepared_files = task.prepared_files.filter((f) => f.id !== fileId);
    }
    this.persist();
  }

  public resetToDefaults() {
    this.catalogs = INITIAL_CATALOGS;
    this.users = INITIAL_USERS;
    this.tasks = INITIAL_TASKS;
    this.currentUser = INITIAL_USERS[0];
    this.persist();
  }
}

export const appStore = new Store();
