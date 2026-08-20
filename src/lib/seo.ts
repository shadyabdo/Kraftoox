import { useEffect } from "react";

/* إدارة Meta Tags لكل مسار داخل تطبيق الصفحة الواحدة */

interface PageMeta {
  title: string;
  description: string;
}

const BASE = "FileTools | أدوات مجانية للصور وملفات PDF";

const META: Record<string, PageMeta> = {
  "/": {
    title: "FileTools | ورشة مجانية للصور والفيديو وPDF وتوليد المحتوى بالذكاء الاصطناعي",
    description:
      "17 أداة مجانية في 4 أقسام: أدوات صور، أدوات PDF، أدوات فيديو (محرر فيديو أونلاين، تكبير الدقة، إزالة العلامة المائية، تسجيل الشاشة) وتوليد صور وفيديوهات يوتيوب بالذكاء الاصطناعي بالعربية — بلا حدود وبلا علامة مائية، والمعالجة داخل متصفحك.",
  },
  "/images": {
    title: "أدوات الصور أونلاين مجاناً — ضغط وتحويل وتكبير ومحرر فوتوشوب | FileTools",
    description: "قسم أدوات الصور: ضغط، تغيير حجم، تحويل صيغ، روابط مباشرة، تكبير حتى 4K، إزالة علامات مائية ومحرر صور متكامل — كلها مجانية وداخل متصفحك.",
  },
  "/pdf": {
    title: "أدوات PDF أونلاين مجاناً — ضغط ودمج وتحويل واستخراج | FileTools",
    description: "قسم أدوات PDF: ضغط الملفات، دمجها، تحويل الصور إلى PDF واستخراج الصور منه — بمحرك pdf-lib يعمل داخل متصفحك بدون رفع ملفاتك.",
  },
  "/video": {
    title: "أدوات الفيديو أونلاين مجاناً — محرر فيديو وتسجيل شاشة وتكبير | FileTools",
    description: "قسم أدوات الفيديو: محرر فيديو أونلاين بخط زمني وتصدير عبر Shotstack API، تكبير دقة حتى 4K، إزالة العلامة المائية، ومسجّل شاشة بتنزيل تلقائي.",
  },
  "/ai": {
    title: "توليد الصور والفيديو بالذكاء الاصطناعي بالعربية مجاناً | FileTools",
    description: "قسم الذكاء الاصطناعي: ولّد صوراً احترافية من أوصاف عربية بنماذج FLUX، وأنشئ فيديوهات يوتيوب وشورتز بسيناريو عربي كامل — بلا حدود وبلا علامة مائية.",
  },
  "/tools": {
    title: "كل الأدوات | FileTools — أدوات الصور وملفات PDF",
    description: "تصفح جميع أدوات FileTools المجانية لمعالجة الصور وملفات PDF داخل المتصفح.",
  },
  "/about": {
    title: "من نحن | FileTools",
    description:
      "تعرف على FileTools: منصة أدوات مجانية تعمل بالكامل داخل متصفحك، كيف نعمل، ولماذا خصوصيتك محمية.",
  },
  "/privacy": {
    title: "سياسة الخصوصية | FileTools",
    description:
      "سياسة خصوصية FileTools: ملفاتك لا تغادر جهازك، المعالجة محلية بالكامل، وما البيانات القليلة التي نحفظها.",
  },
  "/contact": {
    title: "اتصل بنا | FileTools",
    description: "تواصل مع فريق FileTools — استفسارات، اقتراحات، شراكات أو بلاغ عن مشكلة.",
  },
  "/tool/compress-image": {
    title: "ضغط الصور أونلاين مجاناً (JPG, PNG, WebP) | FileTools",
    description:
      "اضغط صور JPG وPNG وWebP وقلّل حجمها حتى 90% مع الحفاظ على الجودة — المعالجة داخل متصفحك وبدون رفع الصور لأي خادم.",
  },
  "/tool/resize-image": {
    title: "تغيير حجم الصور أونلاين مع الحفاظ على الأبعاد | FileTools",
    description: "صغّر أو كبّر صورك بالنسبة المئوية أو بأبعاد دقيقة مع قفل نسبة الأبعاد — مجاناً وبدون علامة مائية.",
  },
  "/tool/convert-image": {
    title: "تحويل صيغ الصور (JPG ↔ PNG ↔ WebP) مجاناً | FileTools",
    description: "حوّل صورك بين صيغ JPG وPNG وWebP بجودة قابلة للتحكم — تحويل فوري داخل المتصفح.",
  },
  "/tool/image-host": {
    title: "رفع الصور والحصول على رابط مباشر مجاناً | FileTools",
    description: "ارفع صورتك واحصل فوراً على رابط مباشر وروابط HTML وMarkdown وBBCode للمشاركة في المنتديات والمواقع.",
  },
  "/tool/compress-pdf": {
    title: "ضغط ملفات PDF وتقليل حجمها مجاناً | FileTools",
    description: "قلّل حجم ملفات PDF الكبيرة بإعادة ضغط الصور المضمنة وتحسين البنية — محلياً داخل متصفحك.",
  },
  "/tool/merge-pdf": {
    title: "دمج ملفات PDF في ملف واحد مجاناً | FileTools",
    description: "ادمج عدة ملفات PDF في ملف واحد بالترتيب الذي تختاره — بدون رفع ملفاتك لأي خادم.",
  },
  "/tool/images-to-pdf": {
    title: "تحويل الصور إلى PDF مجاناً | FileTools",
    description: "حوّل مجموعة صور (JPG, PNG, WebP) إلى ملف PDF واحد بمقاس A4 أو بمقاس الصور، مع هوامش قابلة للتحكم.",
  },
  "/tool/extract-pdf-images": {
    title: "استخراج الصور من ملفات PDF مجاناً | FileTools",
    description: "استخرج كل الصور المضمنة داخل ملف PDF بصيغتها الأصلية وحمّلها دفعة واحدة كملف ZIP.",
  },
  "/tool/upscale-image": {
    title: "تكبير الصور وتحسين جودتها حتى 4 أضعاف مجاناً | FileTools",
    description: "كبّر صورك ×2 أو ×3 أو ×4 بدقة تصل إلى 7680 بكسل عبر محرك تكبير متدرج مع تعزيز الحواف — مجاناً وداخل متصفحك.",
  },
  "/tool/upscale-video": {
    title: "تكبير دقة الفيديو وتحسين جودته مجاناً | FileTools",
    description: "ارفع دقة فيديوهاتك حتى ×3 بإعادة ترميز إطاري داخل المتصفح مع الحفاظ على الصوت الأصلي — بدون رفع الفيديو لأي خادم.",
  },
  "/tool/remove-watermark": {
    title: "إزالة العلامة المائية من الصور أونلاين مجاناً | FileTools",
    description: "لوّن فوق العلامة المائية بفرشاة دقيقة ودع خوارزمية الترميم الانتشاري تعيد بناء المنطقة — إزالة شعارات وحقوق من الصور محلياً.",
  },
  "/tool/remove-watermark-video": {
    title: "إزالة العلامة المائية من الفيديو أونلاين مجاناً | FileTools",
    description: "حدّد مكان العلامة المائية بمستطيل قابل للسحب وصدّر فيديو نظيفاً مع الصوت الأصلي — إزالة الشعارات من الفيديوهات داخل متصفحك.",
  },
  "/tool/photo-editor": {
    title: "محرر الصور أونلاين مجاناً — فوتوشوب الويب العربي | FileTools",
    description: "محرر صور متكامل في المتصفح: فرشاة، نصوص عربية، قص وتدوير، فلاتر وتعديلات لونية وتصدير PNG/JPG/WebP — بدون تسجيل.",
  },
  "/tool/ai-image": {
    title: "توليد الصور بالذكاء الاصطناعي بالعربية مجاناً وبلا حدود | FileTools",
    description: "حوّل أوصافك العربية إلى صور احترافية بنماذج FLUX وTurbo — مجاني بلا حدود، بدون علامة مائية وبدون مفاتيح API.",
  },
  "/tool/ai-video": {
    title: "توليد الفيديو بالذكاء الاصطناعي — شورتز وفيديوهات طويلة بالعربية | FileTools",
    description: "من فكرة إلى فيديو يوتيوب جاهز: سيناريو عربي، مشاهد مولّدة بالذكاء الاصطناعي وتعليقات — شورتز 9:16 أو فيديوهات حتى ساعة، بلا علامة مائية.",
  },
  "/tool/video-editor": {
    title: "محرر الفيديو أونلاين مجاناً — قص وفلاتر ونصوص عربية وتصدير MP4 | FileTools",
    description: "حرّر فيديوهاتك على خط زمني حقيقي: قصّ دقيق، سرعة، فلاتر سينمائية ونصوص عربية. تصدير محلي مجاني فوراً أو رندر سحابي MP4 عبر Shotstack API بمفتاح مجاني.",
  },
  "/tool/screen-recorder": {
    title: "تسجيل الشاشة أونلاين مع تنزيل تلقائي — مجاني | FileTools",
    description: "سجّل شاشتك كاملة أو نافذة أو تبويباً مع صوت النظام والميكروفون، إيقاف مؤقت واستئناف، وتنزيل تلقائي فوري للفيديو عند الضغط على زر الإنهاء.",
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
      url: `https://filetools.app/#/tool/${tool.slug}`,
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
