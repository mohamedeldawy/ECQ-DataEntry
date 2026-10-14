/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { appStore } from './data/store';
import { CatalogItem, CatalogType, Role, Task, User } from './types';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { OverviewView } from './components/OverviewView';
import { TasksView } from './components/TasksView';
import { CatalogsView } from './components/CatalogsView';
import { UsersView } from './components/UsersView';
import { PythonAnywhereGuide } from './components/PythonAnywhereGuide';
import { TaskModal } from './components/TaskModal';
import { CatalogModal } from './components/CatalogModal';
import { UserModal } from './components/UserModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { LoginScreen } from './components/LoginScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(appStore.getCurrentUser());
  const [tasks, setTasks] = useState<Task[]>(appStore.getTasks());
  const [catalogs, setCatalogs] = useState<CatalogItem[]>(appStore.getCatalogs());
  const [users, setUsers] = useState<User[]>(appStore.getUsers());
  const [currentView, setCurrentView] = useState<'overview' | 'tasks' | 'catalogs' | 'users'>('overview');

  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);
  const [deployGuideTab, setDeployGuideTab] = useState<'github-fix' | 'steps' | 'files' | 'faq'>('github-fix');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogType, setCatalogType] = useState<CatalogType>('teachers');
  const [catalogToEdit, setCatalogToEdit] = useState<CatalogItem | null>(null);

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordModalTargetUser, setPasswordModalTargetUser] = useState<User | null>(null);

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      const u = appStore.getCurrentUser();
      setCurrentUser(u ? { ...u } : null);
      setTasks(appStore.getTasks());
      setCatalogs(appStore.getCatalogs());
      setUsers(appStore.getUsers());
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Auth
  const handleLogin = (email: string) => {
    const success = appStore.login(email);
    if (success) {
      showToast('مرحبًا بك في نظام الخطة');
    }
    return success;
  };

  const handleLogout = () => {
    appStore.logout();
    showToast('تم تسجيل الخروج بنجاح');
  };

  const handleSwitchRole = (newUser: User) => {
    appStore.setCurrentUser(newUser);
    showToast(`تم التبديل إلى حساب: ${newUser.name}`);
  };

  // Task Actions
  const handleOpenNewTask = () => {
    setTaskToEdit(null);
    setTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setTaskToEdit(task);
    setTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: any) => {
    try {
      if (taskToEdit) {
        appStore.updateTask(taskToEdit.id, taskData);
        showToast('تم تحديث بيانات المهمة بنجاح');
      } else {
        appStore.addTask(taskData);
        showToast('تمت إضافة المهمة بنجاح');
      }
      setTaskModalOpen(false);
    } catch (e: any) {
      alert(e.message || 'حدث خطأ أثناء حفظ المهمة.');
    }
  };

  const handleDeleteTask = (taskId: number) => {
    appStore.deleteTask(taskId);
    showToast('تم حذف المهمة');
  };

  // Files
  const handleUploadFile = (taskId: number, kind: 'raw' | 'prepared', file: File) => {
    try {
      appStore.addFile(taskId, kind, file);
      showToast(`تم رفع ملف ${kind === 'raw' ? 'الـ Raw' : 'الـ Prepared'}: ${file.name}`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReplaceFile = (fileId: string, file: File) => {
    try {
      appStore.replaceFile(fileId, file);
      showToast(`تم استبدال الملف بـ: ${file.name}`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    appStore.deleteFile(fileId);
    showToast('تم حذف الملف');
  };

  // Catalogs
  const handleOpenNewCatalog = (type: CatalogType) => {
    setCatalogType(type);
    setCatalogToEdit(null);
    setCatalogModalOpen(true);
  };

  const handleOpenEditCatalog = (item: CatalogItem) => {
    setCatalogType(item.type);
    setCatalogToEdit(item);
    setCatalogModalOpen(true);
  };

  const handleSaveCatalog = (label: string) => {
    try {
      if (catalogToEdit) {
        appStore.updateCatalog(catalogToEdit.id, label);
        showToast('تم تحديث العنصر بنجاح');
      } else {
        appStore.addCatalog(catalogType, label);
        showToast('تمت إضافة العنصر للقائمة');
      }
      setCatalogModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteCatalog = (id: number) => {
    try {
      appStore.deleteCatalog(id);
      showToast('تم حذف العنصر من القائمة');
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Users
  const handleOpenNewUser = () => {
    setUserToEdit(null);
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setUserToEdit(user);
    setUserModalOpen(true);
  };

  const handleSaveUser = (data: { name: string; email: string; role: Role; subject_id: number | null }) => {
    try {
      if (userToEdit) {
        appStore.updateUser(userToEdit.id, data.name, data.role, data.subject_id);
        showToast('تم تحديث بيانات العضو');
      } else {
        appStore.addUser(data.name, data.email, data.role, data.subject_id);
        showToast('تم إنشاء حساب العضو بنجاح');
      }
      setUserModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleUserActive = (id: number) => {
    try {
      appStore.toggleUserActive(id);
      showToast('تم تحديث حالة الحساب');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleOpenResetPassword = (user: User) => {
    setPasswordModalTargetUser(user);
    setPasswordModalOpen(true);
  };

  const handleSavePassword = (password: string) => {
    showToast('تم تحديث كلمة المرور بنجاح');
    setPasswordModalOpen(false);
  };

  if (!currentUser) {
    return (
      <>
        <LoginScreen
          onLogin={handleLogin}
          users={users}
          onOpenDeployGuide={(tab) => {
            setDeployGuideTab(tab || 'github-fix');
            setIsDeployGuideOpen(true);
          }}
        />
        {isDeployGuideOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-5xl my-8">
              <PythonAnywhereGuide
                defaultTab={deployGuideTab}
                onClose={() => setIsDeployGuideOpen(false)}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#172033]" dir="rtl">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view as any)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onChangePassword={() => handleOpenResetPassword(currentUser)}
        onOpenDeployGuide={() => {
          setDeployGuideTab('steps');
          setIsDeployGuideOpen(true);
        }}
        onSwitchRole={handleSwitchRole}
        allUsers={users}
      />

      {/* Main Area */}
      <main className="mr-64 p-6 md:p-8 min-h-screen">
        <TopBar
          currentView={currentView}
          currentUser={currentUser}
          onOpenDeployGuide={(tab) => {
            setDeployGuideTab(tab || 'github-fix');
            setIsDeployGuideOpen(true);
          }}
          onRefresh={() => {
            setTasks(appStore.getTasks());
            showToast('تم تحديث البيانات');
          }}
        />

        {/* PythonAnywhere Guide (can be opened inline or via modal) */}
        {isDeployGuideOpen && (
          <PythonAnywhereGuide
            defaultTab={deployGuideTab}
            onClose={() => setIsDeployGuideOpen(false)}
          />
        )}

        {/* Dynamic Views */}
        {currentView === 'overview' && (
          <OverviewView
            tasks={tasks}
            currentUser={currentUser}
            onNewTask={handleOpenNewTask}
            onGoToTasks={() => setCurrentView('tasks')}
          />
        )}

        {currentView === 'tasks' && (
          <TasksView
            tasks={tasks}
            currentUser={currentUser}
            onNewTask={handleOpenNewTask}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
            onUploadFile={handleUploadFile}
            onReplaceFile={handleReplaceFile}
            onDeleteFile={handleDeleteFile}
          />
        )}

        {currentView === 'catalogs' && currentUser.role === 'manager' && (
          <CatalogsView
            catalogs={catalogs}
            onNewCatalog={handleOpenNewCatalog}
            onEditCatalog={handleOpenEditCatalog}
            onDeleteCatalog={handleDeleteCatalog}
          />
        )}

        {currentView === 'users' && currentUser.role === 'manager' && (
          <UsersView
            users={users}
            catalogs={catalogs}
            onNewUser={handleOpenNewUser}
            onEditUser={handleOpenEditUser}
            onToggleActive={handleToggleUserActive}
            onResetPassword={handleOpenResetPassword}
          />
        )}
      </main>

      {/* Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        catalogs={catalogs}
        users={users}
      />

      {/* Catalog Modal */}
      <CatalogModal
        isOpen={catalogModalOpen}
        onClose={() => setCatalogModalOpen(false)}
        onSave={handleSaveCatalog}
        type={catalogType}
        itemToEdit={catalogToEdit}
      />

      {/* User Modal */}
      <UserModal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        onSave={handleSaveUser}
        catalogs={catalogs}
        userToEdit={userToEdit}
      />

      {/* Password Modal */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSave={handleSavePassword}
        title={
          passwordModalTargetUser?.id === currentUser.id
            ? 'تغيير كلمة المرور الخاصة بك'
            : `تغيير كلمة المرور لـ ${passwordModalTargetUser?.name || 'العضو'}`
        }
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#171d39] text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold border border-indigo-500/30 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
