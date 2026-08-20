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
    title: "أدوات الفيديو أونلاين مجاناً — محرر فيديو وتسجيل شاشة وتكبير | Kraftoox",
    description: "قسم الفيديو في Kraftoox: محرر خط زمني مع تصدير Shotstack السحابي، تسجيل شاشة بتنزيل فوري، تكبير دقة حتى 4K وإزالة العلامات المائية.",
  },
  "/ai": {
    title: "توليد الصور والفيديو بالذكاء الاصطناعي بالعربية مجاناً | Kraftoox",
    description: "قسم الذكاء الاصطناعي في Kraftoox: ولّد صوراً احترافية من أوصاف عربية وفيديوهات يوتيوب كاملة — بلا حدود وبلا علامة مائية.",
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
  "/tool/image-host": {
    title: "رفع الصور والحصول على رابط مباشر مجاناً | Kraftoox",
    description: "ارفع صورتك واحصل فوراً على رابط مباشر وروابط HTML وMarkdown وBBCode للمشاركة في المنتديات والمواقع.",
  },
  "/tool/upscale-image": {
    title: "تكبير الصور وتحسين جودتها حتى 4 أضعاف مجاناً | Kraftoox",
    description: "كبّر صورك ×2 أو ×3 أو ×4 بدقة تصل إلى 7680 بكسل عبر محرك تكبير متدرج مع تعزيز الحواف — مجاناً وداخل متصفحك.",
  },
  "/tool/remove-watermark": {
    title: "إزالة العلامة المائية من الصور أونلاين مجاناً | Kraftoox",
    description: "لوّن فوق العلامة المائية بفرشاة دقيقة ودع خوارزمية الترميم الانتشاري تعيد بناء المنطقة — إزالة شعارات وحقوق من الصور محلياً.",
  },
  "/tool/photo-editor": {
    title: "محرر الصور أونلاين مجاناً — فوتوشوب الويب العربي | Kraftoox",
    description: "محرر صور متكامل في المتصفح: فرشاة، نصوص عربية، قص وتدوير، فلاتر وتعديلات لونية وتصدير PNG/JPG/WebP — بدون تسجيل.",
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
    title: "محرر الفيديو أونلاين مجاناً — قص وفلاتر ونصوص عربية وتصدير MP4 | Kraftoox",
    description: "حرّر فيديوهاتك على خط زمني حقيقي: قصّ دقيق، سرعة، فلاتر سينمائية ونصوص عربية. تصدير محلي مجاني فوراً أو رندر سحابي MP4 عبر Shotstack API بمفتاح مجاني.",
  },
  "/tool/screen-recorder": {
    title: "تسجيل الشاشة أونلاين مع تنزيل تلقائي — مجاني | Kraftoox",
    description: "سجّل شاشتك كاملة أو نافذة أو تبويباً مع صوت النظام والميكروفون، إيقاف مؤقت واستئناف، وتنزيل تلقائي فوري للفيديو عند الضغط على زر الإنهاء.",
  },
  "/tool/upscale-video": {
    title: "تكبير دقة الفيديو وتحسين جودته مجاناً | Kraftoox",
    description: "ارفع دقة فيديوهاتك حتى ×3 بإعادة ترميز إطاري داخل المتصفح مع الحفاظ على الصوت الأصلي — بدون رفع الفيديو لأي خادم.",
  },
  "/tool/remove-watermark-video": {
    title: "إزالة العلامة المائية من الفيديو أونلاين مجاناً | Kraftoox",
    description: "حدّد مكان العلامة المائية بمستطيل قابل للسحب وصدّر فيديو نظيفاً مع الصوت الأصلي — إزالة الشعارات من الفيديوهات داخل متصفحك.",
  },
  "/tool/ai-image": {
    title: "توليد الصور بالذكاء الاصطناعي بالعربية مجاناً وبلا حدود | Kraftoox",
    description: "حوّل أوصافك العربية إلى صور احترافية بنماذج FLUX وTurbo — مجاني بلا حدود، بدون علامة مائية وبدون مفاتيح API.",
  },
  "/tool/ai-video": {
    title: "توليد الفيديو بالذكاء الاصطناعي — شورتز وفيديوهات طويلة بالعربية | Kraftoox",
    description: "من فكرة إلى فيديو يوتيوب جاهز: سيناريو عربي، مشاهد مولّدة بالذكاء الاصطناعي وتعليقات — شورتز 9:16 أو فيديوهات حتى ساعة، بلا علامة مائية.",
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
