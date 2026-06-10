# SBTS Sprint 10.3 — Professional Repair & Maintainability Pass

## هدف السبرنت
تنظيف النظام وترتيبه للصيانة المستقبلية مع معالجة الملاحظات التشغيلية المهمة التي ظهرت بعد Sprint 10.2.

## ما تم تنفيذه

### 1. User Profile
- إضافة صفحة `/profile`.
- المستخدم يقدر يعدل اسمه المعروض، Badge، بريد الاسترجاع، وصف تخصصه، صورة العرض بالرفع من الجهاز، والثيم المفضل.
- الصورة تحفظ كـ Data URL في Demo Mode، ومهيأة لاحقًا للتحويل إلى Object Storage.

### 2. Register Cleanup
- تنظيف صفحة تسجيل مستخدم جديد.
- إضافة Recovery Email.
- حذف Photo URL، Field Execution، Maintenance، Date من التسجيل.
- التخصص والصورة والوصف صاروا في User Profile بدل التسجيل.

### 3. Theme Engine
- تفعيل اختيار الثيم من إعدادات المستخدم:
  - Future / Modern
  - Classic SBTS
  - SAP Style
  - Custom Accent
- إضافة CSS classes للثيمات.

### 4. Dashboard
- تجميع Slip Blind Summary في Container واحد يشمل Total / Completed-Final / In Progress.

### 5. Project Dashboard
- إضافة Phase Summary لكامل الفيزات الحالية وقابل للتوسع مستقبلًا.
- قائمة أنواع البلايند صارت تقرأ من System Settings → Master Data بدل hard-coded فقط.

### 6. Settings Center
- إضافة Approval Profiles حسب نوع البلايند.
- إضافة Master Data / Catalogs للتحكم في Blind Types.
- رفع شعار التاق وشعار الشهادة من الجهاز بدل روابط URL.
- إضافة Hanging Hole Size.
- Live Tag Preview الآن يحتوي QR Preview.
- حذف Bilingual من خيارات الواجهة في Default Language.

### 7. Final Approval Profiles
- إضافة مفهوم Approval Profiles داخل Settings:
  - Blind
  - Slip Blind
  - Drop Spool
- Blind Details يعرض الأشخاص المطلوبين للـ Final Approval حسب نوع البلايند.

### 8. Tags / Printing
- Export Register صار PDF-ready print view بدل CSV فقط.
- Print Tags صار كل Tag قابل للطباعة كصفحة مستقلة.
- التاق يستخدم شعار الشركة المرفوع وحجم فتحة التعليق من Settings.

### 9. Reports Print View
- إضافة Print-only report layout مرتب بدل طباعة واجهة التطبيق مبعثرة.

### 10. Certificate Layout
- تحسين Header الشهادة ليكون أقرب لشهادة تشغيلية صفحة واحدة.
- استخدام شعار الشهادة من Settings.
- Final approval signature roles صارت مبنية على Approval Profile.

## ملاحظات هندسية
- Final Approval Profiles الآن System-level JSON في Settings. في النسخة الإنتاجية يفضل نقلها إلى جدول مستقل `approval_profiles` و `approval_profile_approvers`.
- رفع الصور حاليًا Demo-local data URL. في Production لازم تخزينها في S3 / SharePoint / internal object storage.
- User Profile الحالي local preference layer؛ في Sprint Production DB يتم ربطه بجداول المستخدمين.

## طريقة التشغيل
```powershell
pnpm install
pnpm dev
```

إذا pnpm غير موجود:
```powershell
npm install -g pnpm
pnpm install
pnpm dev
```
