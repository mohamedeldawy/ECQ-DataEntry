const appRoot = document.querySelector("#app");
const roles = { manager: "المدير", dataEntry: "Data Entry", quality: "Quality" };
const catalogTypes = {
  teachers: "Teacher",
  grades: "Grade",
  subjects: "Subject",
  lectures: "Lectures",
};

let isDemoMode = false;

const state = {
  user: null,
  csrfToken: "",
  tasks: [],
  catalogs: [],
  users: [],
  view: "overview",
  modal: null,
  error: "",
  toast: "",
  search: "",
};

// Initial starter catalogs for offline/demo mode
const STARTER_CATALOGS = [
  { id: 1, type: "grades", label: "Junior 4" },
  { id: 2, type: "grades", label: "Junior 5" },
  { id: 3, type: "grades", label: "Middle 1" },
  { id: 4, type: "grades", label: "Middle 2" },
  { id: 5, type: "grades", label: "Senior 1" },
  { id: 6, type: "subjects", label: "Science-Ar" },
  { id: 7, type: "subjects", label: "Science-En" },
  { id: 8, type: "subjects", label: "Math-Ar" },
  { id: 9, type: "subjects", label: "English" },
  { id: 10, type: "teachers", label: "مستر أحمد عبد السلام" },
  { id: 11, type: "teachers", label: "مستر محمد علي" },
  { id: 12, type: "teachers", label: "ميس فاطمة الزهراء" },
  { id: 13, type: "lectures", label: "Lecture 01" },
  { id: 14, type: "lectures", label: "Lecture 02" },
  { id: 15, type: "lectures", label: "Lecture 03" },
];

const STARTER_USERS = [
  { id: 1, name: "أحمد داوي (المدير)", email: "manager@elkheta.com", role: "manager", active: 1, subject_id: null },
  { id: 2, name: "سارة محمود (Data Entry)", email: "dataentry@elkheta.com", role: "dataEntry", active: 1, subject_id: null },
  { id: 3, name: "كريم الجوهري (Quality)", email: "quality@elkheta.com", role: "quality", active: 1, subject_id: 6 },
];

const STARTER_TASKS = [
  {
    id: 101,
    teacher_id: 11,
    grade_id: 3,
    subject_id: 6,
    lecture_id: 13,
    quality_id: 3,
    data_entry_id: 2,
    task_owner: "dataEntry",
    teacher: "مستر محمد علي",
    grade: "Middle 1",
    subject: "Science-Ar",
    lecture: "Lecture 01",
    quality_name: "كريم الجوهري (Quality)",
    data_entry_name: "سارة محمود (Data Entry)",
    start_date: "2025-01-10",
    delivery_date: "2025-01-25",
    lecture_schedule: "2025-01-28",
    asking_date: "2025-01-12",
    warning_date: "2025-01-14",
    shooting_date: "2025-01-20",
    raw_files: [],
    prepared_files: [],
  },
];

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));
const isManager = () => state.user?.role === "manager";
const isDataEntry = () => state.user?.role === "dataEntry";
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const formatDate = (value) => value
  ? new Date(`${value}T00:00:00`).toLocaleDateString("ar-EG")
  : "—";
const listCatalog = (type) => state.catalogs
  .filter((item) => item.type === type)
  .sort((a, b) => a.label.localeCompare(b.label, "ar"));
const profileSubject = (profile) => listCatalog("subjects")
  .find((item) => String(item.id) === String(profile.subject_id))?.label || "";
const currentFiles = (task, kind) => Array.isArray(task?.[`${kind}_files`])
  ? task[`${kind}_files`]
  : [];

async function api(path, options = {}) {
  if (isDemoMode) {
    return handleDemoApi(path, options);
  }
  const headers = new Headers(options.headers || {});
  if (state.csrfToken && !["GET", "HEAD"].includes((options.method || "GET").toUpperCase())) {
    headers.set("X-CSRF-Token", state.csrfToken);
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.body);
  }
  const response = await fetch(path, { credentials: "same-origin", ...options, headers });
  if (response.status === 204) return null;
  const type = response.headers.get("content-type") || "";
  const result = type.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    if (response.status === 401 && state.user) {
      state.user = null;
      state.tasks = [];
      state.users = [];
      state.catalogs = [];
      state.modal = null;
      render();
    }
    throw new Error(result?.error || `تعذر تنفيذ الطلب (${response.status}).`);
  }
  return result;
}

function handleDemoApi(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  if (path === "/api/session") {
    return { user: state.user, csrf_token: "demo-token" };
  }
  if (path === "/api/login") {
    const user = state.users.find((u) => u.email === options.body?.email) || state.users[0];
    state.user = user;
    return { user, csrf_token: "demo-token" };
  }
  if (path === "/api/logout") {
    state.user = null;
    return { success: true };
  }
  if (path === "/api/tasks") {
    if (method === "GET") return state.tasks;
    if (method === "POST") {
      const task = {
        ...options.body,
        id: Date.now(),
        teacher: state.catalogs.find((c) => String(c.id) === String(options.body.teacher_id))?.label,
        grade: state.catalogs.find((c) => String(c.id) === String(options.body.grade_id))?.label,
        subject: state.catalogs.find((c) => String(c.id) === String(options.body.subject_id))?.label,
        lecture: state.catalogs.find((c) => String(c.id) === String(options.body.lecture_id))?.label,
        quality_name: state.users.find((u) => String(u.id) === String(options.body.quality_id))?.name,
        data_entry_name: state.users.find((u) => String(u.id) === String(options.body.data_entry_id))?.name,
        raw_files: [],
        prepared_files: [],
      };
      state.tasks.unshift(task);
      return task;
    }
  }
  if (path.startsWith("/api/tasks/") && method === "PATCH") {
    const id = path.split("/")[3];
    const idx = state.tasks.findIndex((t) => String(t.id) === String(id));
    if (idx !== -1) {
      Object.assign(state.tasks[idx], options.body);
    }
    return { success: true };
  }
  if (path.startsWith("/api/tasks/") && method === "DELETE") {
    const id = path.split("/")[3];
    state.tasks = state.tasks.filter((t) => String(t.id) !== String(id));
    return { success: true };
  }
  if (path === "/api/catalogs") {
    if (method === "GET") return state.catalogs;
    if (method === "POST") {
      const item = { id: Date.now(), ...options.body };
      state.catalogs.push(item);
      return item;
    }
  }
  if (path.startsWith("/api/catalogs/") && method === "DELETE") {
    const id = path.split("/")[3];
    state.catalogs = state.catalogs.filter((c) => String(c.id) !== String(id));
    return { success: true };
  }
  if (path === "/api/users") {
    if (method === "GET") return state.users;
    if (method === "POST") {
      const user = { id: Date.now(), active: 1, ...options.body };
      state.users.push(user);
      return user;
    }
  }
  return {};
}

function setError(error) {
  console.error(error);
  state.error = error?.message || "حدث خطأ غير متوقع.";
  render();
}

function notify(message) {
  state.toast = message;
  render();
  window.setTimeout(() => {
    if (state.toast === message) {
      state.toast = "";
      render();
    }
  }, 3500);
}

function renderLogin() {
  if (!appRoot) return;
  appRoot.innerHTML = `
    <main class="login-screen">
      <section class="login-art">
        <div class="brand-lockup"><span class="brand-mark">خ</span><span>الخطة</span></div>
        <div><p class="eyebrow">منصة تعليمية · قسم الجودة</p>
          <h1>كل تفاصيل الإنتاج<br />في مكان واحد.</h1>
          <p class="login-art-copy">متابعة مواعيد التصوير والملخصات التعليمية من بداية المهمة وحتى التسليم.</p>
        </div>
        <div class="login-art-footer">إدارة موحدة للفريق · بيانات محفوظة على خادم النظام</div>
      </section>
      <section class="login-panel">
        ${isDemoMode ? `
        <div style="background:#fff9e6;border:1px solid #ffd166;padding:12px;border-radius:10px;margin-bottom:15px;font-size:12px;color:#7a5200;line-height:1.6;">
          ⚠️ <b>معاينة GitHub (بدون خادم بايثون):</b><br/>
          أنت تتصفح المشروع كصفحة ثابتة. تم تفعيل وضع المعاينة التجريبي. لتشغيل السيرفر بالكامل مع بايثون وقاعدة SQLite، ارفع المشروع إلى <b>PythonAnywhere</b>.
        </div>` : ""}
        <form class="login-form" id="login-form">
          <span class="form-kicker">مرحبًا بعودتك</span><h2>تسجيل الدخول</h2>
          <p class="muted">سجّل الدخول بحساب الفريق للمتابعة.</p>
          ${state.error ? `<div class="alert alert-error">${escapeHtml(state.error)}</div>` : ""}
          <label>البريد الإلكتروني<input name="email" type="email" autocomplete="username" value="${isDemoMode ? "manager@elkheta.com" : ""}" required /></label>
          <label>كلمة المرور<input name="password" type="password" autocomplete="current-password" value="${isDemoMode ? "12345678" : ""}" required /></label>
          <button class="button button-primary button-wide" type="submit">دخول إلى النظام</button>
        </form>
        ${isDemoMode ? `
        <div style="margin-top:20px;text-align:center;">
          <small style="color:#666;display:block;margin-bottom:8px;">دخول تجريبي سريع:</small>
          <button type="button" class="button button-secondary button-small" style="margin:2px;" onclick="window.quickDemoLogin('manager@elkheta.com')">المدير</button>
          <button type="button" class="button button-secondary button-small" style="margin:2px;" onclick="window.quickDemoLogin('dataentry@elkheta.com')">Data Entry</button>
          <button type="button" class="button button-secondary button-small" style="margin:2px;" onclick="window.quickDemoLogin('quality@elkheta.com')">Quality</button>
        </div>` : ""}
      </section>
    </main>`;
}

window.quickDemoLogin = (email) => {
  const user = state.users.find((u) => u.email === email) || state.users[0];
  state.user = user;
  render();
};

function render() {
  if (!appRoot) return;
  if (!state.user) return renderLogin();
  const views = isManager()
    ? [["overview", "نظرة عامة", "◫"], ["tasks", "المهام", "▤"], ["catalogs", "القوائم", "▦"], ["users", "أعضاء التيم", "♙"]]
    : [["overview", "نظرة عامة", "◫"], ["tasks", "المهام", "▤"]];
  if (!views.some(([id]) => id === state.view)) state.view = "overview";
  const page = state.view === "tasks" ? renderTasks()
    : state.view === "catalogs" ? renderCatalogs()
      : state.view === "users" ? renderUsers()
        : renderOverview();
  appRoot.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand-lockup sidebar-brand" href="#" data-action="view" data-view="overview"><span class="brand-mark">خ</span><span>الخطة</span></a>
        <div class="sidebar-caption">إدارة الإنتاج</div><nav class="side-nav">
          ${views.map(([id, label, icon]) => `<button class="nav-item ${state.view === id ? "active" : ""}" data-action="view" data-view="${id}"><span class="nav-icon">${icon}</span>${label}</button>`).join("")}
        </nav>
        <div class="sidebar-bottom">
          <div class="sidebar-user"><span class="avatar">${escapeHtml((state.user.name || "م").slice(0, 1))}</span>
            <span><b>${escapeHtml(state.user.name)}</b><small>${escapeHtml(roles[state.user.role] || "")}</small></span>
          </div>
          <button class="nav-item" data-action="change-password"><span class="nav-icon">♧</span>تغيير كلمة المرور</button>
          <button class="nav-item logout" data-action="logout"><span class="nav-icon">↪</span>تسجيل الخروج</button>
        </div>
      </aside>
      <main class="main-area">
        ${isDemoMode ? `
        <div style="background:#eef2ff;border:1px solid #c7d2fe;padding:10px 16px;border-radius:10px;margin-bottom:18px;font-size:12px;color:#3730a3;display:flex;justify-content:space-between;align-items:center;">
          <span>💡 <b>أنت في وضع استعراض GitHub:</b> هذا استعراض تفاعلي في المتصفح. لتفعيل سيرفر Flask وقاعدة SQLite، ارفع الكود إلى PythonAnywhere.</span>
        </div>` : ""}
        <header class="topbar"><div><p class="eyebrow">نظام متابعة الجودة والإنتاج</p><h1>${escapeHtml(views.find(([id]) => id === state.view)?.[1])}</h1></div>
          <div class="topbar-date">${new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        </header>
        ${state.error ? `<div class="alert alert-error">${escapeHtml(state.error)}<button data-action="dismiss-error">×</button></div>` : ""}
        ${page}
      </main>
      ${state.modal ? renderModal() : ""}
      ${state.toast ? `<div class="toast">${escapeHtml(state.toast)}</div>` : ""}
    </div>`;
}

function statCard(title, number, hint, color, icon) {
  return `<article class="stat-card"><span class="stat-icon ${color}">${icon}</span><div class="stat-content"><p>${title}</p><strong>${number}</strong><small>${hint}</small></div></article>`;
}

function renderOverview() {
  const tasks = state.tasks;
  const pendingRaw = tasks.filter((task) => currentFiles(task, "raw").length === 0).length;
  const pendingPrepared = tasks.filter((task) => currentFiles(task, "prepared").length === 0).length;
  const upcoming = tasks.filter((task) => task.shooting_date && task.shooting_date >= today())
    .sort((a, b) => a.shooting_date.localeCompare(b.shooting_date)).slice(0, 5);
  const overdue = tasks.filter((task) => task.task_owner === "dataEntry" &&
    task.warning_date && task.warning_date <= today() && currentFiles(task, "raw").length === 0);
  return `<section class="welcome-row"><div><h2>أهلًا ${escapeHtml(state.user.name)}،</h2><p>تابع مواعيد التصوير والملخصات وحالة تسليم الملفات.</p></div>
    ${isManager() ? `<button class="button button-primary" data-action="new-task">＋ إضافة مهمة</button>` : ""}</section>
    <section class="stats-grid">
      ${statCard("إجمالي المهام", tasks.length, "المهام المسجلة على النظام", "indigo", "▤")}
      ${statCard("بانتظار Raw", pendingRaw, "ملفات لم يتم رفعها بعد", "orange", "↑")}
      ${statCard("بانتظار Prepared", pendingPrepared, "ملفات لم يتم تجهيزها", "blue", "◷")}
      ${statCard("تصويرات قادمة", upcoming.length, "مواعيد تصوير مستقبلية", "green", "◷")}
    </section>
    ${overdue.length ? `<section class="panel overdue-panel"><div class="panel-heading"><div><span class="status-dot danger"></span><h3>تنبيهات تأخير</h3></div><span class="counter danger-counter">${overdue.length}</span></div>
      <p class="muted">حلّ موعد التحذير لهذه المهام ولم يتم رفع ملف Raw.</p>
      ${overdue.slice(0, 5).map((task) => `<div class="alert-row"><span><b>${escapeHtml(task.teacher)}</b> · ${escapeHtml(task.subject)} · ${escapeHtml(task.lecture)}</span><span>موعد التحذير: ${formatDate(task.warning_date)}</span></div>`).join("")}</section>` : ""}
    <section class="panel"><div class="panel-heading"><div><h3>أقرب مواعيد التصوير</h3><p class="muted">المهام القادمة حسب موعد التصوير</p></div>
      <button class="text-button" data-action="view" data-view="tasks">كل المهام ←</button></div>
      ${upcoming.length ? `<div class="table-wrap"><table><thead><tr><th>Teacher</th><th>Subject</th><th>Lecture</th><th>Quality</th><th>Shooting date</th><th>Delivery date</th></tr></thead>
      <tbody>${upcoming.map((task) => `<tr><td class="strong">${escapeHtml(task.teacher)}</td><td>${escapeHtml(task.subject)}</td><td>${escapeHtml(task.lecture)}</td><td>${escapeHtml(task.quality_name || "—")}</td><td>${formatDate(task.shooting_date)}</td><td>${formatDate(task.delivery_date)}</td></tr>`).join("")}</tbody></table></div>` :
      `<div class="empty-state"><span class="empty-icon">◷</span><b>لا توجد مواعيد تصوير قادمة</b><p>ستظهر المهام هنا عند إضافتها.</p></div>`}</section>`;
}

function fileControls(task, kind) {
  if (state.user.role === "quality" && kind === "prepared") return `<span class="muted">—</span>`;
  const files = currentFiles(task, kind);
  const canUpload = isManager() || isDataEntry() || (state.user.role === "quality" && kind === "raw");
  const canDelete = isManager() || isDataEntry();
  return `<div class="file-cell">
    ${files.map((file) => `<div class="file-entry"><div class="file-link">
      <button class="file-name" data-action="download-file" data-file-id="${file.id}">${escapeHtml(file.name)}</button>
      ${canDelete ? `<button class="icon-button delete-file" data-action="delete-file" data-file-id="${file.id}" title="حذف الملف">×</button>` : ""}
      </div>${canUpload ? `<label class="text-button replace-file">استبدال<input type="file" data-file-id="${file.id}" /></label>` : ""}</div>`).join("")}
    ${canUpload ? `<label class="upload-button">＋ رفع ملف<input type="file" data-task-id="${task.id}" data-kind="${kind}" /></label>` : ""}
    ${!files.length && !canUpload ? `<span class="muted">لا يوجد ملف</span>` : ""}
  </div>`;
}

function renderTasks() {
  const term = state.search.trim().toLocaleLowerCase("ar");
  const tasks = state.tasks.filter((task) => !term ||
    [task.teacher, task.grade, task.subject, task.lecture, task.quality_name, task.data_entry_name]
      .some((value) => String(value || "").toLocaleLowerCase("ar").includes(term)))
    .sort((a, b) => (a.delivery_date || "9999").localeCompare(b.delivery_date || "9999"));
  return `<section class="toolbar"><label class="search-box"><span>⌕</span><input id="task-search" value="${escapeHtml(state.search)}" placeholder="ابحث بالمدرس أو المادة أو الحصة..." /></label>
    <span class="results-count">${tasks.length} مهمة</span>${isManager() ? `<button class="button button-primary" data-action="new-task">＋ إضافة مهمة</button>` : ""}</section>
    <section class="panel table-panel"><div class="table-wrap"><table class="tasks-table">
      <thead><tr><th>Teacher / Grade</th><th>Subject / Lecture</th><th>By</th><th>Quality</th><th>Start date</th><th>Delivery date</th><th>Lecture schedule</th><th>Asking / Warning</th><th>Shooting date</th><th>Raw data</th><th>Prepared data</th>${isManager() ? "<th>إجراء</th>" : ""}</tr></thead>
      <tbody>${tasks.length ? tasks.map((task) => `<tr>
        <td><b>${escapeHtml(task.teacher || "—")}</b><small>${escapeHtml(task.grade || "—")}</small></td>
        <td><b>${escapeHtml(task.subject || "—")}</b><small>${escapeHtml(task.lecture || "—")}</small></td>
        <td><span class="owner-chip">${task.task_owner === "quality" ? "Quality" : "Data Entry"}</span><small>${escapeHtml(task.task_owner === "quality" ? task.quality_name || "" : task.data_entry_name || "")}</small></td>
        <td>${escapeHtml(task.quality_name || "—")}</td><td>${formatDate(task.start_date)}</td><td>${formatDate(task.delivery_date)}</td><td>${formatDate(task.lecture_schedule)}</td>
        <td>${task.task_owner === "dataEntry" ? `<span class="date-line">طلب ${formatDate(task.asking_date)}</span><span class="date-line ${task.warning_date && task.warning_date <= today() && !currentFiles(task, "raw").length ? "late" : ""}">تحذير ${formatDate(task.warning_date)}</span>` : "—"}</td>
        <td>${formatDate(task.shooting_date)}</td><td>${fileControls(task, "raw")}</td><td>${fileControls(task, "prepared")}</td>
        ${isManager() ? `<td><div class="row-actions"><button class="icon-button" data-action="edit-task" data-task-id="${task.id}" title="تعديل">✎</button><button class="icon-button danger-text" data-action="delete-task" data-task-id="${task.id}" title="حذف">×</button></div></td>` : ""}
      </tr>`).join("") : `<tr><td colspan="${isManager() ? 12 : 11}"><div class="empty-state"><b>لا توجد مهام مطابقة</b><p>جرّب تغيير كلمات البحث.</p></div></td></tr>`}</tbody>
    </table></div></section>`;
}

function renderCatalogs() {
  return `<section class="page-intro"><div><h2>القوائم المرجعية</h2><p>إدارة المدرسين والصفوف والمواد وأرقام الحصص.</p></div></section>
    <div class="catalog-layout">${Object.entries(catalogTypes).map(([type, title]) => {
      const items = listCatalog(type);
      return `<section class="panel catalog-card"><div class="panel-heading"><div><span class="catalog-tag">${title}</span><h3>${title}</h3></div>
        <button class="button button-secondary button-small" data-action="new-catalog" data-type="${type}">＋ إضافة</button></div>
        <div class="catalog-list">${items.length ? items.map((item) => `<div class="catalog-row"><span>${escapeHtml(item.label)}</span><div>
          <button class="icon-button" data-action="edit-catalog" data-item-id="${item.id}" title="تعديل">✎</button>
          <button class="icon-button danger-text" data-action="delete-catalog" data-item-id="${item.id}" title="حذف">×</button></div></div>`).join("") : `<p class="empty-inline">لا توجد عناصر بعد.</p>`}</div>
        <p class="catalog-count">${items.length} عنصر</p></section>`;
    }).join("")}</div>`;
}

function renderUsers() {
  const members = state.users.filter((item) => item.role !== "manager");
  return `<section class="page-intro"><div><h2>أعضاء التيم والحسابات</h2><p>أنشئ حساب Data Entry أو Quality واربط عضو الجودة بمادته.</p></div>
    <button class="button button-primary" data-action="new-user">＋ إضافة عضو</button></section>
    <section class="panel"><div class="table-wrap"><table><thead><tr><th>الاسم</th><th>الدور</th><th>المادة</th><th>البريد الإلكتروني</th><th>إجراء</th></tr></thead>
      <tbody>${members.length ? members.map((user) => `<tr class="${user.active ? "" : "inactive-row"}"><td class="strong">${escapeHtml(user.name)}${user.active ? "" : `<small>موقوف</small>`}</td>
        <td><span class="role-chip ${user.role}">${roles[user.role]}</span></td><td>${escapeHtml(profileSubject(user) || "—")}</td>
        <td>${escapeHtml(user.email)}</td><td><div class="row-actions"><button class="icon-button" data-action="edit-user" data-user-id="${user.id}" title="تعديل">✎</button>
        <button class="text-button" data-action="reset-password" data-user-id="${user.id}">تغيير كلمة المرور</button>
        <button class="text-button" data-action="${user.active ? "remove-member" : "activate-member"}" data-user-id="${user.id}">${user.active ? "إيقاف الصلاحية" : "إعادة التفعيل"}</button></div></td></tr>`).join("") :
        `<tr><td colspan="5"><div class="empty-state"><b>لا يوجد أعضاء مضافون</b><p>أضف حسابات الفريق لبدء توزيع المهام.</p></div></td></tr>`}</tbody></table></div></section>
    <p class="footnote">إيقاف العضو يمنع وصوله للنظام مع الاحتفاظ بالمهام المسندة إليه.</p>`;
}

function selectOptions(type, selected = "") {
  return `<option value="">اختر ${catalogTypes[type]}</option>${listCatalog(type)
    .map((item) => `<option value="${item.id}" ${String(item.id) === String(selected) ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}`;
}

function renderModal() {
  if (state.modal.type === "task") return renderTaskModal(state.modal.task || {});
  if (state.modal.type === "catalog") return renderCatalogModal(state.modal.item || {});
  if (state.modal.type === "user") return renderUserModal(state.modal.user || {});
  return "";
}

function renderTaskModal(task) {
  const editing = Boolean(task.id);
  const subjectId = task.subject_id || "";
  const qualityMembers = state.users.filter((item) => item.active && item.role === "quality" &&
    (!subjectId || String(item.subject_id) === String(subjectId)));
  const dataEntries = state.users.filter((item) => item.active && item.role === "dataEntry");
  const owner = task.task_owner || "dataEntry";
  return `<div class="modal-backdrop" data-action="close-modal"><section class="modal modal-wide" role="dialog" aria-modal="true" data-modal-content>
    <div class="modal-header"><div><span class="form-kicker">${editing ? "تحديث بيانات المهمة" : "مهمة جديدة"}</span><h2>${editing ? "تعديل المهمة" : "إضافة مهمة"}</h2></div>
      <button class="icon-button" data-action="close-modal">×</button></div>
    <form id="task-form" data-task-id="${task.id || ""}"><div class="form-grid">
      <label>Teacher<select name="teacher_id" required>${selectOptions("teachers", task.teacher_id)}</select></label>
      <label>Grade<select name="grade_id" required>${selectOptions("grades", task.grade_id)}</select></label>
      <label>Subject<select name="subject_id" required>${selectOptions("subjects", subjectId)}</select></label>
      <label>Lectures<select name="lecture_id" required>${selectOptions("lectures", task.lecture_id)}</select></label>
      <label>Quality<select name="quality_id" required><option value="">اختر عضو Quality</option>${qualityMembers.map((item) => `<option value="${item.id}" ${String(item.id) === String(task.quality_id) ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></label>
      <label>By<select name="task_owner" id="task-owner"><option value="dataEntry" ${owner === "dataEntry" ? "selected" : ""}>Data Entry</option><option value="quality" ${owner === "quality" ? "selected" : ""}>Quality</option></select></label>
      <label data-entry-owner class="${owner === "dataEntry" ? "" : "hidden"}">By Data Entry<select name="data_entry_id"><option value="">اختر Data Entry</option>${dataEntries.map((item) => `<option value="${item.id}" ${String(item.id) === String(task.data_entry_id) ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></label>
      <div class="form-divider">مواعيد المهمة</div>
      <label>Start date on system<input name="start_date" type="date" value="${task.start_date || ""}" /></label>
      <label>Delivery date on system<input name="delivery_date" type="date" value="${task.delivery_date || ""}" /></label>
      <label>Lecture Schedule on front<input name="lecture_schedule" type="date" value="${task.lecture_schedule || ""}" /></label>
      <label>Shooting date<input name="shooting_date" type="date" value="${task.shooting_date || ""}" /></label>
      <label data-entry-date class="${owner === "dataEntry" ? "" : "hidden"}">Asking date<input name="asking_date" type="date" value="${task.asking_date || ""}" /></label>
      <label data-entry-date class="${owner === "dataEntry" ? "" : "hidden"}">Warning date<input name="warning_date" type="date" value="${task.warning_date || ""}" /></label>
    </div><p class="form-note">حقلا Asking date وWarning date يظهران فقط عند اختيار Data Entry مسؤولًا عن المهمة.</p>
      <div class="modal-actions"><button class="button button-secondary" type="button" data-action="close-modal">إلغاء</button>
      <button class="button button-primary" type="submit">حفظ المهمة</button></div></form></section></div>`;
}

function renderCatalogModal(item) {
  return `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" data-modal-content>
    <div class="modal-header"><div><span class="form-kicker">${item.id ? "تعديل عنصر" : "عنصر جديد"}</span><h2>${item.id ? "تعديل القائمة" : `إضافة ${catalogTypes[item.type]}`}</h2></div>
      <button class="icon-button" data-action="close-modal">×</button></div>
    <form id="catalog-form" data-item-id="${item.id || ""}" data-type="${item.type}">
      <label>${catalogTypes[item.type]}<input name="label" value="${escapeHtml(item.label || "")}" required maxlength="100" /></label>
      <div class="modal-actions"><button class="button button-secondary" type="button" data-action="close-modal">إلغاء</button><button class="button button-primary" type="submit">حفظ</button></div>
    </form></section></div>`;
}

function renderUserModal(user) {
  const editing = Boolean(user.id);
  return `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" data-modal-content>
    <div class="modal-header"><div><span class="form-kicker">${editing ? "تعديل بيانات العضو" : "إضافة عضو جديد"}</span><h2>حساب التيم</h2></div>
      <button class="icon-button" data-action="close-modal">×</button></div>
    <form id="user-form" data-user-id="${user.id || ""}">
      <label>الاسم<input name="name" value="${escapeHtml(user.name || "")}" required maxlength="100" /></label>
      ${editing ? `<label>البريد الإلكتروني<input value="${escapeHtml(user.email || "")}" disabled /></label>` :
        `<label>البريد الإلكتروني<input name="email" type="email" required /></label><label>كلمة مرور مؤقتة<input name="password" type="password" minlength="8" required /></label>`}
      <label>الدور<select name="role" id="user-role"><option value="dataEntry" ${user.role === "dataEntry" ? "selected" : ""}>Data Entry</option>
        <option value="quality" ${user.role === "quality" ? "selected" : ""}>Quality</option></select></label>
      <label id="quality-subject-label" class="${user.role === "quality" ? "" : "hidden"}">المادة المسؤولة<select name="subject_id">
        <option value="">اختر المادة</option>${listCatalog("subjects").map((item) => `<option value="${item.id}" ${String(item.id) === String(user.subject_id) ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></label>
      <div class="modal-actions"><button class="button button-secondary" type="button" data-action="close-modal">إلغاء</button>
        <button class="button button-primary" type="submit">${editing ? "حفظ التعديلات" : "إنشاء الحساب"}</button></div>
    </form></section></div>`;
}

function openModal(modal) {
  state.modal = modal;
  render();
}

async function loadData() {
  if (!state.user) return;
  const [tasks, catalogs, users] = await Promise.all([
    api("/api/tasks"),
    api("/api/catalogs"),
    isManager() ? api("/api/users") : Promise.resolve([]),
  ]);
  state.tasks = tasks || [];
  state.catalogs = catalogs || [];
  state.users = users || [];
  state.error = "";
  render();
}

function taskPayload(form) {
  const values = Object.fromEntries(new FormData(form));
  return {
    teacher_id: values.teacher_id,
    grade_id: values.grade_id,
    subject_id: values.subject_id,
    lecture_id: values.lecture_id,
    quality_id: values.quality_id,
    task_owner: values.task_owner,
    data_entry_id: values.task_owner === "dataEntry" ? values.data_entry_id : null,
    start_date: values.start_date || null,
    delivery_date: values.delivery_date || null,
    lecture_schedule: values.lecture_schedule || null,
    shooting_date: values.shooting_date || null,
    asking_date: values.task_owner === "dataEntry" ? values.asking_date || null : null,
    warning_date: values.task_owner === "dataEntry" ? values.warning_date || null : null,
  };
}

async function saveTask(form) {
  const taskId = form.dataset.taskId;
  await api(taskId ? `/api/tasks/${taskId}` : "/api/tasks", {
    method: taskId ? "PATCH" : "POST",
    body: taskPayload(form),
  });
  state.modal = null;
  await loadData();
  notify(taskId ? "تم تحديث المهمة." : "تمت إضافة المهمة.");
}

async function saveMember(form) {
  const values = Object.fromEntries(new FormData(form));
  const userId = form.dataset.userId;
  const body = {
    name: values.name.trim(),
    role: values.role,
    subject_id: values.role === "quality" ? values.subject_id : null,
  };
  if (userId) {
    await api(`/api/users/${userId}`, { method: "PATCH", body });
  } else {
    await api("/api/users", {
      method: "POST",
      body: { ...body, email: values.email.trim().toLowerCase(), password: values.password },
    });
  }
  state.modal = null;
  await loadData();
  notify(userId ? "تم تحديث بيانات العضو." : "تم إنشاء حساب العضو.");
}

async function saveCatalog(form) {
  const type = form.dataset.type;
  const itemId = form.dataset.itemId;
  const label = new FormData(form).get("label").trim();
  await api(itemId ? `/api/catalogs/${itemId}` : "/api/catalogs", {
    method: itemId ? "PATCH" : "POST",
    body: itemId ? { label } : { type, label },
  });
  state.modal = null;
  await loadData();
  notify("تم حفظ القائمة.");
}

async function uploadFile(input, existingId = null) {
  const file = input.files?.[0];
  if (!file) return;
  if (isDemoMode) {
    const task = state.tasks.find((t) => String(t.id) === String(input.dataset.taskId));
    if (task) {
      const f = { id: String(Date.now()), name: file.name, size: file.size };
      if (input.dataset.kind === "raw") task.raw_files.push(f);
      else task.prepared_files.push(f);
    }
    render();
    notify("تم رفع الملف بنجاح (وضع المعاينة).");
    return;
  }
  const form = new FormData();
  form.append("file", file);
  if (existingId) {
    await api(`/api/files/${existingId}`, { method: "PUT", body: form });
  } else {
    form.append("kind", input.dataset.kind);
    await api(`/api/tasks/${input.dataset.taskId}/files`, { method: "POST", body: form });
  }
  await loadData();
  notify(existingId ? "تم استبدال الملف." : "تم رفع الملف.");
}

async function downloadFile(fileId) {
  if (isDemoMode) {
    alert("تنزيل الملفات الحقيقية متاح عند تشغيل السيرفر على PythonAnywhere.");
    return;
  }
  const response = await fetch(`/api/files/${fileId}/download`, { credentials: "same-origin" });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "تعذر تنزيل الملف.");
  }
  const file = state.tasks.flatMap((task) => [...currentFiles(task, "raw"), ...currentFiles(task, "prepared")])
    .find((item) => String(item.id) === String(fileId));
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = file?.name || "download";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

async function handleAction(target) {
  const { action } = target.dataset;
  if (action === "view") { state.view = target.dataset.view; state.error = ""; render(); }
  else if (action === "logout") {
    await api("/api/logout", { method: "POST", body: {} });
    state.user = null;
    state.view = "overview";
    render();
  } else if (action === "dismiss-error") { state.error = ""; render(); }
  else if (action === "new-task") openModal({ type: "task" });
  else if (action === "edit-task") openModal({ type: "task", task: state.tasks.find((item) => String(item.id) === target.dataset.taskId) });
  else if (action === "delete-task") {
    const task = state.tasks.find((item) => String(item.id) === target.dataset.taskId);
    if (task && window.confirm(`حذف مهمة ${task.teacher} - ${task.subject} والملفات المرفوعة؟`)) {
      await api(`/api/tasks/${task.id}`, { method: "DELETE" });
      await loadData();
      notify("تم حذف المهمة وملفاتها.");
    }
  } else if (action === "new-catalog") openModal({ type: "catalog", item: { type: target.dataset.type } });
  else if (action === "edit-catalog") openModal({ type: "catalog", item: state.catalogs.find((item) => String(item.id) === target.dataset.itemId) });
  else if (action === "delete-catalog") {
    const item = state.catalogs.find((entry) => String(entry.id) === target.dataset.itemId);
    if (item && window.confirm(`حذف "${item.label}" من القائمة؟`)) {
      await api(`/api/catalogs/${item.id}`, { method: "DELETE" });
      await loadData();
      notify("تم حذف العنصر.");
    }
  } else if (action === "new-user") openModal({ type: "user" });
  else if (action === "edit-user") openModal({ type: "user", user: state.users.find((item) => String(item.id) === target.dataset.userId) });
  else if (action === "remove-member" || action === "activate-member") {
    const userId = target.dataset.userId;
    const member = state.users.find((item) => String(item.id) === userId);
    if (action === "remove-member" && !window.confirm(`إيقاف صلاحية ${member?.name || "العضو"}؟`)) return;
    await api(action === "remove-member" ? `/api/users/${userId}` : `/api/users/${userId}/activate`, {
      method: action === "remove-member" ? "DELETE" : "POST",
      ...(action === "activate-member" ? { body: {} } : {}),
    });
    await loadData();
    notify(action === "remove-member" ? "تم إيقاف صلاحية العضو." : "تمت إعادة تفعيل العضو.");
  } else if (action === "reset-password") {
    const password = window.prompt("أدخل كلمة المرور المؤقتة الجديدة (8 أحرف على الأقل):");
    if (password === null) return;
    await api(`/api/users/${target.dataset.userId}/password`, { method: "POST", body: { password } });
    notify("تم تغيير كلمة مرور العضو.");
  } else if (action === "change-password") {
    const password = window.prompt("أدخل كلمة المرور الجديدة (8 أحرف على الأقل):");
    if (password === null) return;
    await api("/api/change-password", { method: "POST", body: { password } });
    notify("تم تغيير كلمة المرور.");
  } else if (action === "download-file") await downloadFile(target.dataset.fileId);
  else if (action === "delete-file") {
    const fileId = target.dataset.fileId;
    if (window.confirm("حذف الملف المرفوع؟")) {
      if (isDemoMode) {
        state.tasks.forEach((t) => {
          t.raw_files = (t.raw_files || []).filter((f) => f.id !== fileId);
          t.prepared_files = (t.prepared_files || []).filter((f) => f.id !== fileId);
        });
        render();
      } else {
        await api(`/api/files/${fileId}`, { method: "DELETE" });
        await loadData();
      }
      notify("تم حذف الملف.");
    }
  } else if (action === "close-modal" && (target.matches(".modal-backdrop") || target.closest("[data-modal-content]"))) {
    state.modal = null;
    render();
  }
}

if (appRoot) {
  appRoot.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    event.preventDefault();
    try { await handleAction(target); } catch (error) { setError(error); }
  });

  appRoot.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    try {
      if (form.id === "login-form") {
        state.error = "";
        const response = await api("/api/login", {
          method: "POST",
          body: { email: form.elements.email.value.trim(), password: form.elements.password.value },
        });
        state.user = response.user;
        state.csrfToken = response.csrf_token;
        await loadData();
      } else if (form.id === "task-form") await saveTask(form);
      else if (form.id === "catalog-form") await saveCatalog(form);
      else if (form.id === "user-form") await saveMember(form);
    } catch (error) { setError(error); }
  });

  appRoot.addEventListener("change", async (event) => {
    const target = event.target;
    try {
      if (target.id === "task-owner") {
        document.querySelectorAll("[data-entry-date]").forEach((item) => item.classList.toggle("hidden", target.value !== "dataEntry"));
        document.querySelector("[data-entry-owner]")?.classList.toggle("hidden", target.value !== "dataEntry");
      } else if (target.id === "user-role") {
        document.querySelector("#quality-subject-label")?.classList.toggle("hidden", target.value !== "quality");
      } else if (target.name === "subject_id" && target.closest("#task-form")) {
        const quality = state.users.filter((item) => item.active && item.role === "quality" &&
          String(item.subject_id) === target.value);
        const select = document.querySelector('#task-form select[name="quality_id"]');
        if (select) {
          select.innerHTML = `<option value="">اختر عضو Quality</option>${quality.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("")}`;
        }
      } else if (target.matches('input[type="file"][data-file-id]')) {
        await uploadFile(target, target.dataset.fileId);
      } else if (target.matches('input[type="file"][data-task-id][data-kind]')) {
        await uploadFile(target);
      }
    } catch (error) { setError(error); }
    finally {
      if (target.matches('input[type="file"]')) target.value = "";
    }
  });

  appRoot.addEventListener("input", (event) => {
    if (event.target.id === "task-search") {
      state.search = event.target.value;
      const cursor = event.target.selectionStart;
      render();
      const input = document.querySelector("#task-search");
      input?.focus();
      input?.setSelectionRange(cursor, cursor);
    }
  });
}

function enableClientDemoMode() {
  isDemoMode = true;
  state.catalogs = STARTER_CATALOGS;
  state.users = STARTER_USERS;
  state.tasks = STARTER_TASKS;
  state.user = STARTER_USERS[0]; // Manager by default for demonstration
  render();
}

async function start() {
  try {
    const response = await api("/api/session");
    state.user = response.user;
    state.csrfToken = response.csrf_token;
    if (state.user) await loadData();
    else render();
  } catch (error) {
    console.warn("Backend API not reachable. Switching to GitHub Pages Demo Mode.", error);
    enableClientDemoMode();
  }
}

if (!isDemoMode) {
  window.setInterval(() => {
    if (state.user && !state.modal && !isDemoMode) loadData().catch(setError);
  }, 30_000);
}

start();
