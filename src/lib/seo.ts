import { useEffect } from "react";

/* إدارة Meta Tags لكل مسار داخل تطبيق الصفحة الواحدة — Kraftoox */

interface PageMeta {
  title: string;
  description: string;
}

const BASE = "Kraftoox | ورشة مجانية للصور والفيديو وملفات PDF";

const META: Record<string, PageMeta> = {
  "/": {
    title: "Kraftoox | ورشة مجانية: صور، فيديو، PDF، تسجيل شاشة وذكاء اصطناعي",
    description:
      "Kraftoox — 17 أداة مجانية: ضغط وتحويل وتكبير الصور، إزالة العلامات المائية، محرر فيديو بخط زمني، تسجيل شاشة بتنزيل تلقائي، معالجة PDF، وتوليد صور وفيديوهات يوتيوب بالذكاء الاصطناعي بالعربية — بلا حدود وبلا علامة مائية.",
  },
  "/images": {
    title: "أدوات الصور أونلاين مجاناً — ضغط وتحويل وتكبير ومحرر فوتوشوب | Kraftoox",
    description: "قسم الصور في Kraftoox: ضغط، تغيير حجم، تحويل صيغ، روابط مباشرة، تكبير حتى 4K، إزالة علامات مائية ومحرر صور متكامل — داخل متصفحك.",
  },
  "/pdf": {
    title: "أدوات PDF أونلاين مجاناً — ضغط ودمج وتحويل واستخراج | Kraftoox",
    description: "قسم PDF في Kraftoox: ضغط بإعادة ترميز الصور، دمج بلا فقدان، تحويل الصور إلى PDF واستخراج الصور بدقة أصلية — محلياً داخل متصفحك.",
  },
  "/video": {
    title: "أدوات الفيديو أونلاين مجاناً — محرر فيديو احترافي في المتصفح | Kraftoox",
    description: "قسم الفيديو في Kraftoox: محرر فيديو احترافي بخط زمني، قصّ ودمج، نصوص وعناوين متحركة وموسيقى وانتقالات، يعمل داخل المتصفح ويصدّر MP4.",
  },
  "/tools": {
    title: "كل الأدوات | Kraftoox — 17 أداة مجانية للصور والفيديو وPDF",
    description: "تصفح جميع أدوات Kraftoox المجانية: صور، فيديو، ملفات PDF وذكاء اصطناعي — المعالجة داخل المتصفح.",
  },
  "/about": {
    title: "من نحن | Kraftoox",
    description: "تعرف على Kraftoox: ورشة أدوات مجانية تعمل بالكامل داخل متصفحك، كيف نعمل، ولماذا خصوصيتك محمية بالمعمارية لا بالوعود.",
  },
  "/privacy": {
    title: "سياسة الخصوصية | Kraftoox",
    description: "سياسة خصوصية Kraftoox: ملفاتك لا تغادر جهازك، المعالجة محلية بالكامل، وما البيانات القليلة التي نحفظها في متصفحك.",
  },
  "/contact": {
    title: "اتصل بنا | Kraftoox",
    description: "تواصل مع فريق Kraftoox — استفسارات، اقتراحات، شراكات أو بلاغ عن مشكلة.",
  },
  "/tool/compress-image": {
    title: "ضغط الصور أونلاين مجاناً (JPG, PNG, WebP) | Kraftoox",
    description: "اضغط صور JPG وPNG وWebP وقلّل حجمها حتى 90% مع الحفاظ على الجودة — المعالجة داخل متصفحك وبدون رفع الصور لأي خادم.",
  },
  "/tool/resize-image": {
    title: "تغيير حجم الصور أونلاين مع الحفاظ على الأبعاد | Kraftoox",
    description: "صغّر أو كبّر صورك بالنسبة المئوية أو بأبعاد دقيقة مع قفل نسبة الأبعاد — مجاناً وبدون علامة مائية.",
  },
  "/tool/convert-image": {
    title: "تحويل صيغ الصور (JPG ↔ PNG ↔ WebP) مجاناً | Kraftoox",
    description: "حوّل صورك بين صيغ JPG وPNG وWebP بجودة قابلة للتحكم — تحويل فوري داخل المتصفح.",
  },
  "/tool/upscale-image": {
    title: "تكبير الصور وتحسين جودتها حتى 4 أضعاف مجاناً | Kraftoox",
    description: "كبّر صورك ×2 أو ×3 أو ×4 بدقة تصل إلى 7680 بكسل عبر محرك تكبير متدرج مع تعزيز الحواف — مجاناً وداخل متصفحك.",
  },
  "/tool/image-translator": {
    title: "ترجمة الصور بالذكاء الاصطناعي (Gemini) إلى العربية أونلاين | Kraftoox",
    description: "ارفع صورة فيها نصوص واطلب نسخة معرَّبة — تفهم نماذج Gemini من Google التصميم وتترجم نصوصه مع الحفاظ على ستايل الكتابة والتخطيط، بمفتاح مجاني من AI Studio ومقارنة وتنزيل فوري.",
  },
  "/tool/compress-pdf": {
    title: "ضغط ملفات PDF وتقليل حجمها مجاناً | Kraftoox",
    description: "قلّل حجم ملفات PDF الكبيرة بإعادة ضغط الصور المضمنة وتحسين البنية — محلياً داخل متصفحك.",
  },
  "/tool/merge-pdf": {
    title: "دمج ملفات PDF في ملف واحد مجاناً | Kraftoox",
    description: "ادمج عدة ملفات PDF في ملف واحد بالترتيب الذي تختاره — بدون رفع ملفاتك لأي خادم.",
  },
  "/tool/images-to-pdf": {
    title: "تحويل الصور إلى PDF مجاناً | Kraftoox",
    description: "حوّل مجموعة صور (JPG, PNG, WebP) إلى ملف PDF واحد بمقاس A4 أو بمقاس الصور، مع هوامش قابلة للتحكم.",
  },
  "/tool/extract-pdf-images": {
    title: "استخراج الصور من ملفات PDF مجاناً | Kraftoox",
    description: "استخرج كل الصور المضمنة داخل ملف PDF بصيغتها الأصلية وحمّلها دفعة واحدة كملف ZIP.",
  },
  "/tool/video-editor": {
    title: "محرر الفيديو الاحترافي أونلاين مجاناً — خط زمني وقصّ ودمج وتصدير MP4 | Kraftoox",
    description: "محرر فيديو بمستوى الاستوديوهات يعمل داخل متصفحك عبر محرك CreativeEditor: خط زمني، قصّ ودمج، نصوص وعناوين متحركة، موسيقى وانتقالات، وتصدير MP4 جاهز للنشر.",
  },
  "/tool/json-formatter": {
    title: "تنسيق JSON أونلاين مجاناً | Kraftoox",
    description: "نسّق وجمّل بيانات JSON تلقائياً مع التحقق من الصحة وإبراز الأخطاء — يعمل بالكامل في متصفحك.",
  },
  "/tool/base64-encoder": {
    title: "ترميز Base64 أونلاين مجاناً | Kraftoox",
    description: "رمّز النصوص والملفات إلى Base64 أو فك الترميز — سريع ومحلي بالكامل في متصفحك.",
  },
  "/tool/hash-generator": {
    title: "مولد Hash أونلاين مجاناً — MD5, SHA-256 | Kraftoox",
    description: "ولّد MD5 وSHA-1 وSHA-256 وSHA-512 من أي نص — فوري ومحلي باستخدام Web Crypto API.",
  },
  "/tool/password-generator": {
    title: "مولد كلمات المرور القوية أونلاين مجاناً | Kraftoox",
    description: "ولّد كلمات مرور قوية وآمنة بطول مخصص وخيارات متعددة — محلي بالكامل باستخدام crypto API.",
  },
  "/tool/uuid-generator": {
    title: "مولد UUID أونلاين مجاناً | Kraftoox",
    description: "ولّد معرفات فريدة (UUID v4) بكميات كبيرة — فوري ومحلي باستخدام crypto.randomUUID().",
  },
  "/tool/word-counter": {
    title: "عداد الكلمات أونلاين مجاناً | Kraftoox",
    description: "عد الكلمات والأحرف والجمل والفقرات فوراً — مع إحصائيات القراءة ووقت التقدير.",
  },
  "/tool/text-case-converter": {
    title: "محول حالة النص أونلاين مجاناً | Kraftoox",
    description: "حوّل النص بين الحروف الكبيرة والصغيرة والعناوين وcamelCase وsnake_case — فوري ومحلي.",
  },
  "/tool/lorem-ipsum": {
    title: "مولد Lorem Ipsum أونلاين مجاناً | Kraftoox",
    description: "ولّد نصاً عشوائياً (Lorem Ipsum) للفقرات والجمل والكلمات — مثالي للتجارب والتصاميم.",
  },
  "/tool/color-converter": {
    title: "محول الألوان أونلاين مجاناً — HEX, RGB, HSL | Kraftoox",
    description: "حوّل الألوان بين HEX وRGB وHSL مع معاينة فورية ومنتقي ألوان — مثالي للمصممين ومطوري الويب.",
  },
  "/tool/number-base-converter": {
    title: "محول الأنظمة العددية أونلاين مجاناً | Kraftoox",
    description: "حوّل الأرقام بين Binary وDecimal وOctal وHexadecimal — فوري ومحلي بالكامل.",
  },
  "/tool/youtube-downloader": {
    title: "تنزيل فيديوهات يوتيوب مجاناً — MP4 وMP3 | Kraftoox",
    description: "نزّل أي فيديو من يوتيوب بالجودة التي تريدها أو استخرج الصوت فقط — سريع، مجاني، وبدون علامة مائية عبر خدمة Snapscooper.",
  },
  "/tool/ai-cv-generator": {
    title: "مولد السيرة الذاتية بالذكاء الاصطناعي متوافق مع ATS | Kraftoox",
    description: "أنشئ سيرة ذاتية احترافية متوافقة مع أنظمة تتبع المتقدمين (ATS) بالذكاء الاصطناعي — تصميم بسيط، كلمات مفتاحية محسّنة، وتصدير PDF جاهز.",
  },
};

function setMetaTag(selector: string, attr: string, value: string): void {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

export function usePageMeta(path: string): void {
  useEffect(() => {
    const meta = META[path] ?? { title: BASE, description: META["/"].description };
    document.title = meta.title;
    setMetaTag('meta[name="description"]', "content", meta.description);
    setMetaTag('meta[property="og:title"]', "content", meta.title);
    setMetaTag('meta[property="og:description"]', "content", meta.description);
    setMetaTag('meta[name="twitter:title"]', "content", meta.title);
    setMetaTag('meta[name="twitter:description"]', "content", meta.description);
  }, [path]);
}

/* حقن Schema.org لأداة محددة داخل صفحتها */
export function useToolJsonLd(tool: { slug: string; name: string; desc: string } | null): void {
  useEffect(() => {
    const id = "ft-tool-jsonld";
    document.getElementById(id)?.remove();
    if (!tool) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.name,
      url: `https://kraftoox.app/#/tool/${tool.slug}`,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Web",
      inLanguage: "ar",
      description: tool.desc,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, [tool]);
}
