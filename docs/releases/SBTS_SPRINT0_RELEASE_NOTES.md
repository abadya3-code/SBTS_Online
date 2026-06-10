# SBTS Sprint 0 — Stable Baseline

## هدف هذه النسخة
تثبيت التطبيق الحالي كنسخة تشغيل أولية قبل الدخول في بناء قاعدة البيانات والصفحات التشغيلية الحقيقية.

## ما تم إصلاحه

1. إضافة مكون `AppShell`
   - Sidebar احترافي للنسخة المكتبية.
   - Top bar للموبايل والتابلت.
   - Navigation موحد لكل صفحات SBTS الحالية.
   - إطار بصري ثابت باسم Field Workflow MVP.

2. إضافة مكون `PageHeader`
   - عنوان موحد لكل صفحة.
   - Eyebrow / description / action buttons.
   - تصميم متناسق مع Industrial Command Center Minimalism.

3. تحسين قابلية التشغيل المحلي
   - `accessControl.model` صار public للعرض التجريبي المحلي.
   - `workflow.list` و `workflow.get` صارت public للعرض التجريبي المحلي.
   - `workflow.save` يقبل local demo user عند عدم وجود تسجيل دخول.

4. إضافة fallback data عند عدم وجود DATABASE_URL
   - Access Control يرجع seed roles/permissions بدل الفشل.
   - Workflow Studio يرجع seed workflow templates بدل الفشل.
   - Save workflow يقبل العملية demo-mode بدل تعطيل الصفحة.

## الصفحات الموجودة في هذه النسخة

- Dashboard
- Projects & Areas
- Blinds Registry
- Workflow Studio
- Access Control Center

## ملاحظات هندسية مهمة

هذه النسخة لا تعتبر MVP نهائي. هي Stable Base للبدء. البيانات لا تزال demo/seed في معظم الصفحات.

## الأولوية التالية — Sprint 1

1. بناء جداول حقيقية لـ Areas / Projects / Blinds.
2. إنشاء API للـ CRUD الأساسي.
3. بناء صفحة Blind Details.
4. ربط Dashboard بالبيانات الحقيقية.
5. إضافة Activity Log حقيقي.

## طريقة التشغيل المقترحة

يفضل استخدام pnpm حسب packageManager الموجود في المشروع:

```bash
pnpm install
pnpm dev
```

أو باستخدام npm عند عدم توفر pnpm:

```bash
npm install
npm run dev
```

إذا لم يتم وضع `DATABASE_URL` سيعمل التطبيق في Demo Mode باستخدام seed data.
