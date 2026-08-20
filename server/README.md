# Kraftoox Server — روابط دائمة بميزانية صفرية

خادم اختياري صغير يضيف **روابط صور دائمة** لأداة «رفع الصور برابط مباشر».
الواجهة الأمامية للموقع لا تحتاجه إطلاقاً — كل أدوات المعالجة تعمل داخل المتصفح.

## لماذا يوجد؟

أداة الروابط المباشرة تستخدم خدمة مجانية بروابط **مؤقتة** (tmpfiles.org) افتراضياً.
إن أردت روابط **دائمة ومجانية**، اربط الواجهة بهذا الخادم.

## التشغيل مجاناً بالكامل

### 1) التخزين — Supabase (خطة مجانية)

1. أنشئ مشروعاً مجانياً على [supabase.com](https://supabase.com).
2. من **Storage** أنشئ Bucket عاماً باسم `images`.
3. انسخ `Project URL` و`service_role key` من **Settings → API**.

### 2) تشغيل الخادم

```bash
cd server
npm install express cors multer @supabase/supabase-js dotenv
echo "SUPABASE_URL=https://xxxx.supabase.co" > .env
echo "SUPABASE_SERVICE_KEY=your_service_role_key" >> .env
echo "BUCKET=images" >> .env
node index.cjs
```

### 3) النشر مجاناً

- **Render.com** (خطة مجانية): اربط المستودع، أمر البدء `node server/index.cjs`.
- أو **Railway** / **Fly.io** — جميعها تكفي لهذا الحمل الصغير.

### 4) ربط الواجهة

في `src/lib/host.ts` استبدل دالة `uploadToTmpfiles` بنداء لخادمك:

```ts
export async function uploadPermanent(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("https://your-server/api/upload", { method: "POST", body: fd });
  const json = await res.json();
  return json.url;
}
```

## ملاحظات الأمان

- لا تودع `service_role key` في كود الواجهة إطلاقاً — تبقى في الخادم فقط.
- حدّد حجم الرفع (10MB هنا) وفلتر الصيغ المسموحة كما في المثال.
- الخطة المجانية من Supabase تمنحك 1GB تخزين و2GB نقل شهرياً — أكثر من كافٍ للبداية.
