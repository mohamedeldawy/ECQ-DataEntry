import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Rocket,
  Download,
  Copy,
  Check,
  Terminal,
  FolderTree,
  FileCode,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Server,
  AlertTriangle,
  Lightbulb,
  FileWarning
} from 'lucide-react';

interface Props {
  onClose?: () => void;
  defaultTab?: 'github-fix' | 'steps' | 'files' | 'faq';
}

export const PythonAnywhereGuide: React.FC<Props> = ({ onClose, defaultTab = 'github-fix' }) => {
  const [username, setUsername] = useState('dawy');
  const [githubUrl, setGithubUrl] = useState('https://github.com/dawy/Quiz-PaperSummary-Dashboard.git');
  const [projectName, setProjectName] = useState('Quiz-PaperSummary-Dashboard');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [activeTab, setActiveTab] = useState<'github-fix' | 'steps' | 'files' | 'faq'>(defaultTab);
  const [selectedFile, setSelectedFile] = useState<'app.py' | 'wsgi' | 'requirements' | 'app.js' | 'styles.css' | 'index.html'>('wsgi');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  const cleanUser = username.trim() || 'YOUR_USERNAME';
  const cleanProject = projectName.trim() || 'Quiz-PaperSummary-Dashboard';
  const projectHome = `/home/${cleanUser}/${cleanProject}`;
  const privateDataHome = `/home/${cleanUser}/.quality-dashboard`;

  const wsgiCode = `import os
import sys

# إعداد المسارات الخاصة بحسابك على PythonAnywhere
PROJECT_HOME = "${projectHome}"
PRIVATE_DATA_HOME = "${privateDataHome}"

os.environ.setdefault("QUALITY_DASHBOARD_DATA_DIR", PRIVATE_DATA_HOME)
os.environ.setdefault("QUALITY_DASHBOARD_COOKIE_SECURE", "1")
sys.path.insert(0, PROJECT_HOME)

from app import app as application
`;

  const appPyCode = `# app.py - كود Flask الكامل مع قاعدة بيانات SQLite
import argparse
import hmac
import logging
import os
import secrets
import sqlite3
from datetime import date, timedelta
from functools import wraps
from pathlib import Path

from flask import (
    Flask,
    abort,
    g,
    jsonify,
    render_template,
    request,
    send_from_directory,
    send_file,
    session,
)
from werkzeug.security import check_password_hash, generate_password_hash

ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("QUALITY_DASHBOARD_DATA_DIR", ROOT / "instance"))
UPLOAD_DIR = Path(os.environ.get("QUALITY_DASHBOARD_UPLOAD_DIR", DATA_DIR / "uploads"))
DATABASE = Path(os.environ.get("QUALITY_DASHBOARD_DATABASE", DATA_DIR / "dashboard.sqlite3"))
MAX_UPLOAD_BYTES = 50 * 1024 * 1024
CATALOGS = {"teachers", "grades", "subjects", "lectures"}

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config.update(
    MAX_CONTENT_LENGTH=MAX_UPLOAD_BYTES + 1024 * 1024,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("QUALITY_DASHBOARD_COOKIE_SECURE", "1") != "0",
    PERMANENT_SESSION_LIFETIME=timedelta(hours=12),
)
`;

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      const [appPyRes, stylesRes, appJsRes, indexRes, readmeRes, reqRes] = await Promise.all([
        fetch('/python_backend/app.py').then((r) => r.text()).catch(() => appPyCode),
        fetch('/python_backend/static/styles.css').then((r) => r.text()).catch(() => ''),
        fetch('/python_backend/static/app.js').then((r) => r.text()).catch(() => ''),
        fetch('/python_backend/templates/index.html').then((r) => r.text()).catch(() => ''),
        fetch('/python_backend/README.md').then((r) => r.text()).catch(() => ''),
        fetch('/python_backend/requirements.txt').then((r) => r.text()).catch(() => 'Flask>=3.0,<4.0\n'),
      ]);

      zip.file('app.py', appPyRes || appPyCode);
      zip.file('pythonanywhere_wsgi.py', wsgiCode);
      zip.file('requirements.txt', reqRes || 'Flask>=3.0,<4.0\n');
      zip.file('README.md', readmeRes);
      zip.file('.gitignore', `__pycache__/\n*.py[cod]\n.venv/\nvenv/\ninstance/\n*.sqlite3\nuploads/\n.env\n`);

      // Root index.html fallback for GitHub Pages
      zip.file('index.html', indexRes);

      const staticFolder = zip.folder('static');
      if (staticFolder) {
        staticFolder.file('styles.css', stylesRes);
        staticFolder.file('app.js', appJsRes);
      }

      const templatesFolder = zip.folder('templates');
      if (templatesFolder) {
        templatesFolder.file('index.html', indexRes);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `elkheta-quality-pythonanywhere-${cleanUser}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إنشاء ملف ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  const steps = [
    {
      id: 1,
      title: 'إنشاء مجلد المشروع ورفع الملفات إلى PythonAnywhere',
      desc: 'سجّل الدخول إلى PythonAnywhere وافتح شاشة Consoles، ثم افتح طرفية Bash ونفذ التالي:',
      command: `cd /home/${cleanUser}
git clone ${githubUrl || `https://github.com/YOUR_GITHUB_USERNAME/${cleanProject}.git`}
# أو إذا حمّلت ملف ZIP، يمكنك رفعه وفك ضغطه في: /home/${cleanUser}/${cleanProject}`,
      notes: 'تأكد من أن اسم المجلد يطابق اسم المشروع.',
    },
    {
      id: 2,
      title: 'إنشاء البيئة الافتراضية (Virtualenv) وتثبيت Flask',
      desc: 'قم بإنشاء بيئة Python 3.10 وتثبيت متطلبات Flask داخل طرفية Bash:',
      command: `mkvirtualenv --python=/usr/bin/python3.10 quality-dashboard
pip install -r ${projectHome}/requirements.txt`,
      notes: 'سيتم تثبيت Flask الإصدار 3 بنجاح داخل البيئة الافتراضية.',
    },
    {
      id: 3,
      title: 'تهيئة مجلد البيانات وقاعدة SQLite وإنشاء حساب المدير الأول',
      desc: 'نفذ الأمرين التاليين لتهيئة قاعدة البيانات وحفظ الملفات في مسار آمن وإنشاء حسابك:',
      command: `mkdir -p ${privateDataHome}
cd ${projectHome}
QUALITY_DASHBOARD_DATA_DIR=${privateDataHome} python app.py init-db
QUALITY_DASHBOARD_DATA_DIR=${privateDataHome} python app.py create-manager --name "أحمد داوي" --email "${cleanUser}@elkheta.com"`,
      notes: 'سيطلب منك موجه الأوامر إدخال كلمة مرور للمدير (8 خانات على الأقل).',
    },
    {
      id: 4,
      title: 'إنشاء Web App وضبط ملف WSGI في PythonAnywhere',
      desc: 'افتح تبويب Web من لوحة التحكم في PythonAnywhere:',
      substeps: [
        `اضغط "Add a new web app" واختر نطاقك المجاني (${cleanUser}.pythonanywhere.com).`,
        'اختر "Manual configuration" ثم اختر Python 3.10.',
        `في خانة Virtualenv اكتب المسار: /home/${cleanUser}/.virtualenvs/quality-dashboard`,
        'اضغط على رابط WSGI configuration file واستبدل المحتوى بالكامل بكود WSGI المجهز لك في الخطوة التالية.',
      ],
      command: wsgiCode,
      notes: 'ملف WSGI هو حلقة الوصل بين سيرفر PythonAnywhere وتطبيق Flask.',
    },
    {
      id: 5,
      title: 'إعادة تشغيل التطبيق وتأكيد الإطلاق (Reload)',
      desc: 'في صفحة Web بـ PythonAnywhere اضغط على الزر الأخضر الكبير:',
      command: `# اضغط زر: [ Reload ${cleanUser}.pythonanywhere.com ] في صفحة Web
# ثم افتح الرابط: https://${cleanUser}.pythonanywhere.com`,
      notes: 'مبروك! النظام سيعمل مباشرة ويمكنك الدخول بحساب المدير وإضافة أعضاء الجودة والداتا إنتري.',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-xl overflow-hidden mb-8 transition-all">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-indigo-900 via-indigo-800 to-[#171d39] text-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-3xl shadow-lg shrink-0">
              🚀
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold mb-2 border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                دليل النشر التفاعلي المخصص لـ PythonAnywhere
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                كيفية رفع وتشغيل نظام الخطة بنجاح
              </h2>
              <p className="text-indigo-200 text-sm mt-1 max-w-2xl leading-relaxed">
                كل الأوامر ومسارات السيرفر أدناه مُحدثة ديناميكيًا باسم حسابك ومسارات PythonAnywhere، مع إمكانية تحميل حزمة المشروع المحدثة بالكامل (.zip) بنقرة واحدة!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isZipping ? 'جارٍ تجميع الملفات...' : 'تحميل حزمة السيرفر المحدثة (.zip)'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all"
              >
                إغلاق الدليل
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Variables Customizer */}
        <div className="mt-6 pt-6 border-t border-indigo-700/50 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-indigo-200 mb-1.5">
              اسم مستخدم PythonAnywhere (Username):
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: dawy"
                className="w-full bg-white/10 border border-indigo-400/30 rounded-lg px-3.5 py-2 text-white placeholder-indigo-300/60 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                dir="ltr"
              />
            </div>
            <span className="text-[11px] text-indigo-300/70 mt-1 block">
              سيتم استبدال المسار إلى: <code className="text-amber-300 font-mono">/home/{cleanUser}</code>
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-indigo-200 mb-1.5">
              اسم مجلد المشروع (Project Folder):
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-white/10 border border-indigo-400/30 rounded-lg px-3.5 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-indigo-200 mb-1.5">
              رابط GitHub الخاص بك (اختياري للـ Clone):
            </label>
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full bg-white/10 border border-indigo-400/30 rounded-lg px-3.5 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-gray-50/80 px-6 flex flex-wrap gap-2 md:gap-4">
        <button
          onClick={() => setActiveTab('github-fix')}
          className={`py-3.5 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'github-fix'
              ? 'border-rose-600 text-rose-700 bg-white -mb-px rounded-t-lg'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          لماذا تظهر صفحة بيضاء على GitHub؟ (الحل الفوري)
        </button>

        <button
          onClick={() => setActiveTab('steps')}
          className={`py-3.5 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'steps'
              ? 'border-indigo-600 text-indigo-600 bg-white -mb-px rounded-t-lg'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          خطوات النشر الـ 5 على PythonAnywhere
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`py-3.5 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'files'
              ? 'border-indigo-600 text-indigo-600 bg-white -mb-px rounded-t-lg'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileCode className="w-4 h-4" />
          معاينة ونسخ ملفات المشروع
        </button>

        <button
          onClick={() => setActiveTab('faq')}
          className={`py-3.5 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'faq'
              ? 'border-indigo-600 text-indigo-600 bg-white -mb-px rounded-t-lg'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          نصائح هامة وملاحظات الأمان
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6 md:p-8">
        {/* GitHub Fix Tab */}
        {activeTab === 'github-fix' && (
          <div className="space-y-6">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-black text-rose-900">
                    سبب ظهور الصفحة البيضاء عند فتح المشروع من GitHub:
                  </h3>
                  <p className="text-sm text-rose-800 mt-2 leading-relaxed">
                    يحدث هذا بسبب أمرين رئيسيين في طبيعة استضافة GitHub وطريقة كتابة مسارات الملفات:
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-1.5">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-mono">1</span>
                    GitHub لا يشغل سيرفر بايثون (Flask / Python)
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    منصة GitHub و GitHub Pages مخصصة فقط لعرض الملفات الثابتة (Static HTML/CSS). بينما هذا المشروع يحتوي على خادم Flask وقاعدة بيانات SQLite لتوثيق المهام ورفع الملفات ومصادقة المستخدمين عبر طلبات <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-600">/api/session</code>.
                    <strong className="block text-rose-700 mt-1">
                      👈 الحل: تشغيل المشروع على خادم بايثون حقيقي مثل PythonAnywhere.
                    </strong>
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-1.5">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-mono">2</span>
                    مشكلة المسارات المطلقة (/app.js و /styles.css)
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    كان ملف <code className="bg-gray-100 px-1 rounded text-gray-800 font-mono">index.html</code> يستدعي الملفات بمسار مطلق <code className="text-rose-600 font-mono">/app.js</code>، فعند رفعه على GitHub يطلب الملف من جذر الموقع فيعطي خطأ 404 وتظل شاشة <code className="font-mono text-gray-800">&lt;div id="app"&gt;&lt;/div&gt;</code> فارغة تماماً.
                    <strong className="block text-emerald-700 mt-1">
                      ✅ تم حل هذا الآن: قمنا بتحديث مسارات الاستدعاء لتصبح نسبية ومرنة.
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Solution Summary */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-bold text-emerald-950">
                    كيف حلت التحديثات الجديدة المشكلة نهائيًا؟
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    لقد قمنا بتعديل كود الملفات بحيث:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
                  <strong className="text-emerald-900 block font-bold mb-1">1. وضع المعاينة التلقائي (Demo Mode)</strong>
                  إذا تم فتح الملف على GitHub بدون خادم بايثون، لن تظهر صفحة بيضاء؛ بل سيكتشف كود الجافاسكريبت ذلك فورًا ويعرض واجهة النظام التفاعلية مع بيانات تجريبية وتنبيه إرشادي.
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
                  <strong className="text-emerald-900 block font-bold mb-1">2. شاشة تحميل أولية Branded</strong>
                  تم تضمين واجهة تحميل مسبقة داخل <code className="font-mono">#app</code> حتى لا تبقى الصفحة بيضاء أثناء تحميل الملفات أو في حال تأخر الاتصال.
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
                  <strong className="text-emerald-900 block font-bold mb-1">3. حزمة ZIP المحدثة</strong>
                  اضغط على الزر الأخضر بالأسفل لتحميل الكود المصحح كاملًا، واستبدل الملفات القديمة على GitHub و PythonAnywhere.
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDownloadZip}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  تحميل الحزمة المصححة بالكامل (.zip)
                </button>

                <button
                  onClick={() => setActiveTab('steps')}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
                >
                  <Rocket className="w-4 h-4" />
                  الانتقال لخطوات النشر على PythonAnywhere
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Steps Tab */}
        {activeTab === 'steps' && (
          <div className="space-y-8">
            {steps.map((step) => (
              <div
                key={step.id}
                className="relative flex flex-col md:flex-row gap-5 p-5 md:p-6 rounded-xl border border-gray-200/80 bg-gray-50/40 hover:bg-white hover:border-indigo-200 transition-all shadow-sm"
              >
                <div className="flex md:flex-col items-center gap-2 shrink-0">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    {step.id}
                  </div>
                  <span className="text-xs font-semibold text-gray-500">خطوة</span>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{step.desc}</p>
                  </div>

                  {step.substeps && (
                    <ul className="space-y-1.5 bg-white p-3.5 rounded-lg border border-gray-100 text-xs text-gray-700">
                      {step.substeps.map((sub, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                          <span>{sub}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="relative group rounded-xl overflow-hidden border border-gray-800 bg-[#161a29] text-gray-100 shadow-inner">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#202538] border-b border-gray-700/60 text-xs text-gray-400 font-mono">
                      <span className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                        Bash Terminal / WSGI Config
                      </span>
                      <button
                        onClick={() => copyToClipboard(step.command, `step-${step.id}`)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-sans transition-all"
                      >
                        {copiedKey === `step-${step.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>تم النسخ!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ الأمر</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre
                      className="p-4 text-xs md:text-sm font-mono overflow-x-auto text-emerald-400 leading-relaxed"
                      dir="ltr"
                    >
                      {step.command}
                    </pre>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{step.notes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                ملفات المشروع الأساسية
              </h4>
              {[
                { id: 'wsgi', name: 'pythonanywhere_wsgi.py', badge: 'مهم جدًا' },
                { id: 'app.py', name: 'app.py (Flask Server)', badge: 'Backend' },
                { id: 'requirements', name: 'requirements.txt', badge: 'Dependencies' },
                { id: 'app.js', name: 'static/app.js', badge: 'Frontend' },
                { id: 'styles.css', name: 'static/styles.css', badge: 'Design' },
                { id: 'index.html', name: 'templates/index.html', badge: 'HTML' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFile(f.id as any)}
                  className={`w-full text-right p-3 rounded-xl border text-sm font-medium flex items-center justify-between transition-all ${
                    selectedFile === f.id
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-mono text-xs">{f.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-sans">
                    {f.badge}
                  </span>
                </button>
              ))}

              <div className="pt-4">
                <button
                  onClick={handleDownloadZip}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  تحميل كل الملفات دفعة واحدة
                </button>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-[#161a29]">
                <div className="flex items-center justify-between px-4 py-3 bg-[#202538] border-b border-gray-700 text-xs text-gray-300">
                  <span className="font-mono text-amber-300">
                    {selectedFile === 'wsgi' && 'pythonanywhere_wsgi.py (مع المسارات المخصصة لك)'}
                    {selectedFile === 'app.py' && 'app.py (سيرفر فلاسك وقاعدة البيانات)'}
                    {selectedFile === 'requirements' && 'requirements.txt'}
                    {selectedFile === 'app.js' && 'static/app.js (كود التفاعل مع السيرفر + Demo Fallback)'}
                    {selectedFile === 'styles.css' && 'static/styles.css (تنسيقات منصة الخطة)'}
                    {selectedFile === 'index.html' && 'templates/index.html'}
                  </span>
                  <button
                    onClick={() => {
                      const code = selectedFile === 'wsgi' ? wsgiCode : appPyCode;
                      copyToClipboard(code, 'file-view');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all"
                  >
                    {copiedKey === 'file-view' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ كود الملف</span>
                      </>
                    )}
                  </button>
                </div>
                <pre
                  className="p-5 text-xs font-mono text-gray-200 overflow-x-auto max-h-[460px] leading-relaxed"
                  dir="ltr"
                >
                  {selectedFile === 'wsgi' ? wsgiCode : appPyCode}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                أين يتم حفظ الملفات المرفوعة وقاعدة البيانات؟
              </h4>
              <p className="text-gray-600 text-xs leading-relaxed">
                في المسار المخصص: <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono text-indigo-700">{privateDataHome}</code>.
                هذا المجلد موجود خارج مجلد الكود البرمجي لضمان عدم فقده عند عمل أي <code className="font-mono">git pull</code> أو تحديث للكود.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ما هو الحد الأقصى للملفات المرفوعة؟
              </h4>
              <p className="text-gray-600 text-xs leading-relaxed">
                الحد الأقصى لكل ملف Raw أو Prepared هو 50 ميجابايت، ويتم التشفير والتخزين باسم عشوائي لمنع تعارض أسماء الملفات.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                كيف أتحكم في الصلاحيات بين Quality وData Entry؟
              </h4>
              <p className="text-gray-600 text-xs leading-relaxed">
                - <strong>المدير:</strong> لديه كامل الصلاحيات لإنشاء المهام وإدارة القوائم وحسابات الفريق.<br />
                - <strong>Data Entry:</strong> يرفع ويستبدل ويحذف ملفات Raw وPrepared.<br />
                - <strong>Quality:</strong> يرى فقط مهام مادته المخصصة ويرفع ملفات Raw فقط.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                كيف أقوم بعمل نسخة احتياطية (Backup)؟
              </h4>
              <p className="text-gray-600 text-xs leading-relaxed">
                من خلال تبويب Files في PythonAnywhere، يمكنك تنزيل المجلد <code className="font-mono bg-gray-200 px-1 rounded">{privateDataHome}</code> بالكامل لحفظ قاعدة بيانات المهام وكل الملفات.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
