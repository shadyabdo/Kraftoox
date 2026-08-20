import { useEffect } from "react";

/* إدارة Meta Tags لكل مسار داخل تطبيق الصفحة الواحدة */

interface PageMeta {
  title: string;
  description: string;
}

const BASE = "FileTools | أدوات مجانية للصور وملفات PDF";

const META: Record<string, PageMeta> = {
  "/": {
    title: "FileTools | أدوات مجانية لضغط الصور وتحويلها ومعالجة ملفات PDF أونلاين",
    description:
      "منصة أدوات مجانية 100%: ضغط الصور، تغيير الحجم، تحويل الصيغ، رفع الصور برابط مباشر، ضغط ودمج PDF، تحويل الصور إلى PDF واستخراج الصور منه — داخل متصفحك وبدون رفع ملفاتك.",
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
