# الخطة | متابعة الجودة والإنتاج

نظام ويب مشترك لمتابعة مهام تصوير الدروس وإنتاج الملخصات التعليمية. يعمل من خلال تطبيق Flask على PythonAnywhere، ويحفظ بيانات الفريق في قاعدة SQLite وملفات التصوير في مساحة حساب الاستضافة. لا يستخدم `localStorage` ولا يحتاج إلى Firebase أو Supabase.

## الخصائص والصلاحيات

- إدارة المدرسين والصفوف والمواد وأرقام الحصص، مع إضافة العناصر وتعديلها وحذفها.
- تسجيل مهام التصوير والملخصات ومواعيد بدء المهمة وتسليمها وفتح الحصة والتصوير.
- تسجيل Asking date وWarning date لمهام Data Entry فقط، وإظهار تنبيهات التأخير.
- رفع وتنزيل واستبدال ملفات Raw وPrepared ضمن حد 50 ميجابايت للملف.
- إنشاء حسابات الفريق وإيقافها وإعادة تفعيلها وتغيير كلمات المرور.
- المدير يدير المهام والقوائم والحسابات. Data Entry يرفع ويستبدل ويحذف ملفات Raw وPrepared. Quality يرى مهام مادته فقط، ويرفع أو يستبدل ملفات Raw فقط.
- تتحدث بيانات اللوحة تلقائيًا كل 30 ثانية، وتظهر التغييرات المحفوظة على الخادم لبقية أعضاء الفريق.

## قبل النشر

يحتاج النظام إلى حساب PythonAnywhere وخطة تتيح إنشاء تطبيق ويب Flask. لا تفترض أن حسابك المجاني يتضمن هذه الميزة أو أن حصص التخزين مناسبة لكم؛ راجع [الخطط الحالية](https://www.pythonanywhere.com/pricing/) ولوحة حسابك قبل الاعتماد على النظام. لا توجد رسوم إضافية داخل هذا الكود، لكن PythonAnywhere قد يفرض رسومًا أو حدودًا بحسب الخطة واستخدامك.

قاعدة البيانات والملفات تحفظ على مساحة حساب PythonAnywhere نفسها. هذا مناسب لفريق صغير على تطبيق واحد، لكنه ليس تخزينًا سحابيًا مستقلًا أو متعدد الخوادم. راقب المساحة المتاحة، وخذ نسخة احتياطية منتظمة من مجلد البيانات الخاص. الحد الأقصى للملف الواحد 50 ميجابايت.

## خطوات النشر على PythonAnywhere

1. ارفع المستودع إلى حساب GitHub الخاص بك، ثم سجّل الدخول إلى PythonAnywhere وافتح **Consoles** وأنشئ وحدة **Bash**.
2. نزّل المشروع إلى مجلد حسابك. استبدل `YOUR_GITHUB_USERNAME` باسم المستخدم الصحيح:

   ```bash
   cd /home/YOUR_USERNAME
   git clone https://github.com/YOUR_GITHUB_USERNAME/Quiz-PaperSummary-Dashboard.git
   ```

3. أنشئ بيئة Python افتراضية وثبّت المتطلبات:

   ```bash
   mkvirtualenv --python=/usr/bin/python3.10 quality-dashboard
   pip install -r /home/YOUR_USERNAME/Quiz-PaperSummary-Dashboard/requirements.txt
   ```

   إذا لم يتوفر Python 3.10 في حسابك، اختر إصدارًا متاحًا يدعمه Flask، ثم اختر الإصدار نفسه في إعداد تطبيق الويب.
4. أنشئ مجلد البيانات الخاص خارج مجلد المشروع، وهيّئ قاعدة البيانات:

   ```bash
   mkdir -p /home/YOUR_USERNAME/.quality-dashboard
   cd /home/YOUR_USERNAME/Quiz-PaperSummary-Dashboard
   QUALITY_DASHBOARD_DATA_DIR=/home/YOUR_USERNAME/.quality-dashboard python app.py init-db
   ```

5. أنشئ حساب المدير الأول. أدخل اسم المدير وبريده، ثم اكتب كلمة مرور لا تقل عن 8 أحرف عندما تطلبها وحدة الأوامر:

   ```bash
   QUALITY_DASHBOARD_DATA_DIR=/home/YOUR_USERNAME/.quality-dashboard python app.py create-manager --name "اسم المدير" --email "manager@example.com"
   ```

6. افتح صفحة **Web** في PythonAnywhere واختر **Add a new web app**، ثم اختر نطاق PythonAnywhere الخاص بك، و**Manual configuration**، وإصدار Python الذي استخدمته في الخطوة 3.
7. من صفحة إعدادات Web أنشئ مسار **Virtualenv** إلى:

   ```text
   /home/YOUR_USERNAME/.virtualenvs/quality-dashboard
   ```

8. افتح ملف WSGI من رابط **WSGI configuration file** في صفحة Web. استبدل محتواه بنسخة الملف `pythonanywhere_wsgi.py` الموجود في المشروع، ثم غيّر `YOUR_USERNAME` في المسارين إلى اسم حساب PythonAnywhere بالضبط.
9. اضغط **Reload** في صفحة Web، ثم افتح رابط الموقع وسجّل الدخول بحساب المدير.
10. أضف المدرسين وأرقام الحصص، ثم أنشئ حسابات Data Entry وQuality واربط كل عضو Quality بمادته. بعد ذلك أضف المهام ووزّعها على الفريق.

## مكان البيانات والنسخ الاحتياطي

- قاعدة البيانات: `/home/YOUR_USERNAME/.quality-dashboard/dashboard.sqlite3`
- ملفات Raw وPrepared ومفتاح جلسات الدخول: داخل مجلد `.quality-dashboard`.
- لا ترفع هذا المجلد إلى GitHub، ولا تحذفه عند تحديث ملفات المشروع. ملف `.gitignore` يستثني ملفات البيانات المحلية تلقائيًا.
- لأخذ نسخة احتياطية، نزّل مجلد `.quality-dashboard` من PythonAnywhere إلى جهاز موثوق. لا تشارك النسخة؛ فهي تحتوي بيانات الفريق والملفات ومفتاح الجلسات.

## تحديث التطبيق

من وحدة Bash، حدّث ملفات المشروع ثم أعد تحميل تطبيق الويب:

```bash
cd /home/YOUR_USERNAME/Quiz-PaperSummary-Dashboard
git pull
```

بعدها اضغط **Reload** من صفحة Web. احتفظ بنسخة احتياطية من مجلد البيانات قبل تحديثات التطبيق.
