import type { IconName } from "../components/Icons";

export type ToolCategory = "image" | "pdf" | "video";

export interface ToolDef {
  slug: string;
  name: string;
  nameEn: string;
  short: string;
  shortEn: string;
  long: string;
  longEn: string;
  category: ToolCategory;
  icon: IconName;
  color: string;
  accept: string;
  multiple: boolean;
  badge: string;
  badgeEn: string;
  keywords: string;
  keywordsEn: string;
  features: string[];
  featuresEn: string[];
  drop: [string, string];
  dropSub: [string, string];
  action: [string, string];
  note: [string, string];
  isNew?: boolean;
}

export const TOOLS: ToolDef[] = [
  {
    slug: "compress-image",
    name: "ضغط الصور",
    nameEn: "Image Compressor",
    short: "قلّل حجم صور JPG وPNG وWebP حتى 90% مع الحفاظ على جودة ممتازة — دفعة واحدة.",
    shortEn: "Shrink JPG, PNG & WebP files by up to 90% while keeping great quality — in batches.",
    long: "محرك ضغط يعمل داخل متصفحك عبر Web Workers: حدد حجماً مستهدفاً أو جودة يدوية، وأضف عشرات الصور لتُضغط جميعاً دفعة واحدة مع مقارنة الحجم قبل وبعد.",
    longEn: "An in-browser compression engine powered by Web Workers: pick a target size or manual quality, drop dozens of images and compress them all at once with before/after size comparison.",
    category: "image",
    icon: "image",
    color: "var(--teal)",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    multiple: true,
    badge: "JPG · PNG · WEBP",
    badgeEn: "JPG · PNG · WEBP",
    keywords: "ضغط الصور تصغير حجم الصورة compress image تصغير الصور للجوال",
    keywordsEn: "compress image shrink photo reduce image size jpg compressor",
    features: [
      "حجم مستهدف أو جودة يدوية",
      "ضغط جماعي بلا حدود عدد",
      "تحويل اختياري إلى WebP",
      "تنزيل فردي أو ZIP واحد",
    ],
    featuresEn: [
      "Target size or manual quality",
      "Unlimited batch processing",
      "Optional WebP output",
      "Single download or one ZIP",
    ],
    drop: ["اسحب صورك هنا لبدء الضغط", "Drop your images here to compress"],
    dropSub: ["JPG · PNG · WebP — معالجة جماعية، وكل شيء يبقى في جهازك", "JPG · PNG · WebP — batch processing, everything stays on your device"],
    action: ["اضغط الصور الآن", "Compress images now"],
    note: [
      "الصور تُعالج بالكامل داخل متصفحك باستخدام Web Workers — لا تُرفع إلى أي خادم. وضع «الحجم المستهدف» يبحث تلقائياً عن أفضل جودة تحقق الوزن المطلوب.",
      "Images are processed entirely in your browser via Web Workers — nothing is uploaded. “Target size” mode automatically searches for the best quality that hits your weight.",
    ],
  },
  {
    slug: "resize-image",
    name: "تغيير حجم الصور",
    nameEn: "Image Resizer",
    short: "صغّر أو كبّر صورك بالنسبة المئوية أو بأبعاد دقيقة مع قفل نسبة الأبعاد.",
    shortEn: "Scale images by percentage or exact pixels, with aspect-ratio locking.",
    long: "تقرأ الأداة أبعاد كل صورة تلقائياً، ثم تغيّرها بالنسبة المئوية أو بأبعاد دقيقة مع الحفاظ على نسبة الأبعاد اختيارياً — وتُعيد عينات عالية الجودة للحواف.",
    longEn: "The tool reads each image's dimensions automatically, then resizes by percentage or exact pixels with optional aspect-ratio lock — using high-quality edge resampling.",
    category: "image",
    icon: "resize",
    color: "#35845c",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    multiple: true,
    badge: "نسبة · أبعاد · قفل",
    badgeEn: "% · PX · LOCK",
    keywords: "تغيير حجم الصورة تصغير ابعاد الصورة resize image",
    keywordsEn: "resize image scale photo change dimensions image resizer",
    features: ["نسبة مئوية أو أبعاد دقيقة", "قفل نسبة الأبعاد", "معالجة جماعية", "جودة إعادة عينات عالية"],
    featuresEn: ["Percentage or exact pixels", "Aspect-ratio lock", "Batch processing", "High-quality resampling"],
    drop: ["اسحب الصور لتغيير أبعادها", "Drop images to resize them"],
    dropSub: ["تُقرأ أبعاد كل صورة تلقائياً عند الإضافة", "Dimensions are read automatically when added"],
    action: ["غيّر الحجم الآن", "Resize now"],
    note: [
      "عند تفعيل قفل نسبة الأبعاد، يُحسب البعد الثاني تلقائياً بناءً على أول صورة في القائمة.",
      "With aspect-ratio lock on, the second dimension is computed automatically from the first image in the list.",
    ],
  },
  {
    slug: "convert-image",
    name: "تحويل صيغ الصور",
    nameEn: "Image Converter",
    short: "حوّل بين JPG وPNG وWebP بجودة قابلة للتحكم وخلفية بيضاء للشفافية.",
    shortEn: "Convert between JPG, PNG & WebP with controllable quality and white background for transparency.",
    long: "تحويل فوري بين الصيغ الثلاث داخل المتصفح: عند التحويل إلى JPG تُستبدل الشفافية بخلفية بيضاء، وعند التحويل إلى WebP تحصل على أصغر حجم ممكن للويب.",
    longEn: "Instant in-browser conversion between the three formats: converting to JPG replaces transparency with a white background; converting to WebP gives you the smallest possible web weight.",
    category: "image",
    icon: "convert",
    color: "#7a8f3c",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    multiple: true,
    badge: "JPG ↔ PNG ↔ WEBP",
    badgeEn: "JPG ↔ PNG ↔ WEBP",
    keywords: "تحويل الصور تحويل jpg الى png convert image webp",
    keywordsEn: "convert image jpg to png png to webp image converter",
    features: ["ثلاث صيغ رئيسية", "تحكم بالجودة", "معالجة جماعية", "تنزيل ZIP دفعة واحدة"],
    featuresEn: ["Three major formats", "Quality control", "Batch processing", "One-click ZIP download"],
    drop: ["اسحب الصور لتحويل صيغتها", "Drop images to convert them"],
    dropSub: ["JPG · PNG · WebP — التحويل يتم محلياً خلال ثوانٍ", "JPG · PNG · WebP — conversion happens locally in seconds"],
    action: ["حوّل الصور الآن", "Convert images now"],
    note: [
      "صيغة WebP توفر عادة 25–35% من الحجم مقارنة بـJPG — الخيار الأفضل للمواقع الحديثة.",
      "WebP typically saves 25–35% over JPG — the best pick for modern websites.",
    ],
  },
  {
    slug: "image-host",
    name: "رفع الصور برابط مباشر",
    nameEn: "Image Direct Link",
    short: "ارفع صورة واحصل فوراً على رابط مباشر وأكواد HTML وMarkdown وBBCode.",
    shortEn: "Upload an image and instantly get a direct link plus HTML, Markdown & BBCode snippets.",
    long: "تولّد الأداة روابط محلية فورية لجلستك، وتوفر نشراً اختيارياً لرابط عام مؤقت عبر خدمة مجانية — مع أكواد جاهزة للمشاركة في المنتديات والمواقع.",
    longEn: "The tool generates instant local links for your session and offers optional publishing to a temporary public link via a free service — with ready-made snippets for forums and websites.",
    category: "image",
    icon: "link",
    color: "#c77a06",
    accept: "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif",
    multiple: false,
    badge: "Direct · HTML · MD · BB",
    badgeEn: "Direct · HTML · MD · BB",
    keywords: "رفع الصور رابط مباشر image hosting مركز تحميل الصور",
    keywordsEn: "image hosting direct link upload image free image host",
    features: ["رابط مباشر فوري", "أكواد جاهزة للمشاركة", "نشر عام مؤقت اختياري", "معاينة قبل المشاركة"],
    featuresEn: ["Instant direct link", "Ready share snippets", "Optional temp public link", "Preview before sharing"],
    drop: ["اسحب صورتك للحصول على رابط مباشر", "Drop your image to get a direct link"],
    dropSub: ["ستحصل فوراً على رابط مباشر وأكواد جاهزة للمشاركة", "You'll instantly get a direct link and ready-made share codes"],
    action: ["انشر رابطاً مؤقتاً عاماً", "Publish a temp public link"],
    note: [
      "الرابط المحلي يعمل فوراً في جلسة متصفحك الحالية. للنشر العام نستخدم خدمة tmpfiles.org المجانية بروابط مؤقتة — الروابط الدائمة متاحة عبر الخادم المرفق مع Supabase المجاني.",
      "The local link works instantly in your current browser session. For public sharing we use the free tmpfiles.org service with temporary links — permanent links are available via the bundled server with free Supabase.",
    ],
  },
  {
    slug: "image-to-url",
    name: "صورة إلى رابط دائم",
    nameEn: "Image to Permanent URL",
    short: "ارفع صورة واحصل على رابط CDN دائم لا ينتهي عبر Image2URL — مع أكواد HTML وMarkdown وBBCode وتحويل اختياري إلى SVG.",
    shortEn: "Upload an image and get a never-expiring CDN link via Image2URL — with HTML, Markdown & BBCode codes plus optional SVG conversion.",
    long: "ترفع صورتك مباشرة من متصفحك إلى خدمة Image2URL المجانية فترجع لك رابط CDN دائم لا ينتهي، مع قصاصات جاهزة للمشاركة. الصور الأكبر من 2MB تُضغط محلياً تلقائياً. ولمن يملك مفتاح Image2URL API يمكن تحويل الصورة المرفوعة إلى SVG عبر الواجهة الخارجية v1.",
    longEn: "Your image is uploaded straight from your browser to the free Image2URL service, which returns a permanent, never-expiring CDN link with ready share snippets. Images over 2MB are auto-compressed locally. With an Image2URL API key you can also vectorize the hosted image to SVG via the external v1 API.",
    category: "image",
    icon: "link",
    color: "var(--blue)",
    accept: "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif",
    multiple: false,
    badge: "CDN · HTML · MD · SVG",
    badgeEn: "CDN · HTML · MD · SVG",
    keywords: "صورة إلى رابط image to url رفع صور رابط دائم مركز رفع الصور image hosting permanent link",
    keywordsEn: "image to url upload image permanent link free image hosting cdn link",
    features: [
      "رابط CDN دائم لا ينتهي",
      "أكواد HTML وMarkdown وBBCode",
      "ضغط تلقائي للصور الكبيرة",
      "تحويل اختياري إلى SVG",
    ],
    featuresEn: [
      "Permanent never-expiring CDN link",
      "HTML, Markdown & BBCode snippets",
      "Auto-compress for large images",
      "Optional SVG vectorization",
    ],
    drop: ["اسحب صورة للحصول على رابط دائم", "Drop an image to get a permanent link"],
    dropSub: [
      "ستحصل على رابط CDN دائم لا ينتهي مع أكواد جاهزة للمشاركة",
      "You'll get a permanent, never-expiring CDN link with ready share codes",
    ],
    action: ["ارفع واحصل على الرابط", "Upload & get link"],
    note: [
      "الرفع يتم مباشرة من متصفحك إلى Image2URL (بدون خوادمنا) والروابط دائمة. التحويل إلى SVG يتطلب مفتاح API مجانياً من لوحة Image2URL ويُحفظ المفتاح محلياً فقط.",
      "Uploads go directly from your browser to Image2URL (not our servers) and links are permanent. SVG conversion requires a free API key from the Image2URL dashboard; the key is stored locally only.",
    ],
    isNew: true,
  },
  {
    slug: "upscale-image",
    name: "تكبير الصور",
    nameEn: "Image Upscaler",
    short: "كبّر صورك ×2 أو ×3 أو ×4 بدقة تصل إلى 7680 بكسل مع تعزيز للحواف.",
    shortEn: "Upscale images ×2, ×3 or ×4 up to 7680px with edge enhancement.",
    long: "محرك تكبير متدرج متعدد المراحل: يُضاعف الصورة على خطوات صغيرة متتالية للحفاظ على الحواف، ثم يعزز التفاصيل — مع منزلق مقارنة قبل/بعد.",
    longEn: "A multi-stage progressive upscaler: enlarges the image in small successive steps to preserve edges, then enhances detail — with a before/after comparison slider.",
    category: "image",
    icon: "expand",
    color: "#1d8a8a",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    multiple: false,
    badge: "×2 · ×3 · ×4",
    badgeEn: "×2 · ×3 · ×4",
    keywords: "تكبير الصور تحسين جودة الصورة upscale image",
    keywordsEn: "upscale image enhance photo enlarge picture image upscaler",
    features: ["تكبير متدرج متعدد المراحل", "تعزيز الحواف والتفاصيل", "حتى 7680 بكسل", "مقارنة قبل/بعد منزلقة"],
    featuresEn: ["Progressive multi-pass upscale", "Edge & detail enhancement", "Up to 7680px", "Before/after slider"],
    drop: ["اسحب صورة لتكبيرها حتى 4 أضعاف", "Drop an image to upscale up to 4×"],
    dropSub: ["تكبير متدرج متعدد المراحل مع تعزيز للحواف — يصل حتى 7680 بكسل", "Progressive multi-pass upscaling with edge enhancement — up to 7680px"],
    action: ["كبّر الآن", "Upscale now"],
    note: [
      "اسحب المؤشر على الصورة للمقارنة بين الأصل والمكبّرة. مثالي لتجهيز صور الطباعة والعروض الكبيرة.",
      "Drag the handle over the image to compare original and upscaled. Ideal for preparing print and large-display images.",
    ],
  },
  {
    slug: "remove-watermark",
    name: "إزالة العلامة المائية من الصور",
    nameEn: "Image Watermark Remover",
    short: "لوّن فوق العلامة بفرشاة دقيقة ودع خوارزمية الترميم الانتشاري تعيد بناء المنطقة.",
    shortEn: "Paint over the mark with a precise brush and let diffusion inpainting rebuild the area.",
    long: "تحدد العلامة المائية بفرشاة قابلة للتحكم، ثم تعيد خوارزمية انتشارية بناء البكسلات من محيط المنطقة تدريجياً — أفضل النتائج مع العلامات شبه الشفافة والخلفيات المتجانسة.",
    longEn: "You mark the watermark with an adjustable brush, then a diffusion algorithm progressively rebuilds pixels from the surrounding area — best results with semi-transparent marks and uniform backgrounds.",
    category: "image",
    icon: "eraser",
    color: "#2f7d5c",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    multiple: false,
    badge: "Inpainting · فرشاة",
    badgeEn: "Inpainting · Brush",
    keywords: "ازالة العلامة المائية من الصورة remove watermark image مسح الشعار من الصورة",
    keywordsEn: "remove watermark from photo erase logo image watermark remover",
    features: ["فرشاة تحديد دقيقة", "ترميم انتشاري للبكسلات", "مقارنة قبل/بعد", "معالجة محلية بالكامل"],
    featuresEn: ["Precise selection brush", "Diffusion pixel inpainting", "Before/after comparison", "Fully local processing"],
    drop: ["اسحب الصورة ثم لوّن فوق العلامة المائية", "Drop the image, then paint over the watermark"],
    dropSub: ["JPG · PNG · WebP — خوارزمية ترميم انتشاري تملأ المنطقة من محيطها", "JPG · PNG · WebP — diffusion inpainting fills the area from its surroundings"],
    action: ["أزل العلامة المائية", "Remove watermark"],
    note: [
      "أفضل النتائج مع العلامات شبه الشفافة والخلفيات المتجانسة. حدّد المنطقة بدقة قريبة من حجم العلامة.",
      "Best results with semi-transparent marks and uniform backgrounds. Keep the selection close to the mark's size.",
    ],
  },
  {
    slug: "photo-editor",
    name: "فوتوشوب أونلاين",
    nameEn: "Photoshop Online (Photopea)",
    short: "محرر Photopea الاحترافي كامل الإمكانات داخل المنصة: طبقات، أقنعة، أدوات تحديد وفرش، ودعم PSD وAI وSketch وXD.",
    shortEn: "The full-power Photopea professional editor embedded in the platform: layers, masks, selection & brush tools, with PSD, AI, Sketch and XD support.",
    long: "نعرض داخل المنصة خدمة Photopea — أشهر محرر صور احترافي على الويب — عبر واجهتها البرمجية الرسمية: اختر صورتك أو ملف PSD فيُفتح داخل المحرر مباشرة، عدّل بالطبقات والأقنعة والأدوات الذكية، وعند الحفظ تصلك النتيجة فوراً لتنزيلها. بلا تسجيل وبلا تثبيت.",
    longEn: "We embed Photopea — the web's most popular professional image editor — inside the platform through its official API: pick your image or PSD and it opens straight in the editor. Edit with layers, masks and smart tools, and receive the result instantly for download when you save. No sign-up, no install.",
    category: "image",
    icon: "brush",
    color: "#8a4fc0",
    accept: "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.psd",
    multiple: false,
    badge: "PSD · Layers · Masks",
    badgeEn: "PSD · Layers · Masks",
    keywords: "فوتوشوب اونلاين photopea عربي محرر صور احترافي طبقات psd اونلاين تعديل الصور مجانا",
    keywordsEn: "photoshop online free photopea psd editor online layers masks edit photos",
    features: ["محرر Photopea الاحترافي كامل الأدوات", "طبقات وأقنعة وأدوات تحديد ذكية", "يفتح PSD وAI وSketch وXD وRAW", "النتيجة جاهزة للتنزيل فور الحفظ"],
    featuresEn: ["Full professional Photopea editor", "Layers, masks & smart selection tools", "Opens PSD, AI, Sketch, XD & RAW", "Download-ready result the moment you save"],
    drop: ["افتح صورة أو ملف PSD في الفوتوشوب", "Open an image or PSD in Photoshop"],
    dropSub: ["JPG · PNG · WebP · PSD وأكثر — يُفتح ملفك داخل محرر Photopea مباشرة", "JPG · PNG · WebP · PSD and more — your file opens straight inside Photopea"],
    action: ["احفظ النتيجة", "Save the result"],
    note: [
      "المحرر يعمل عبر خدمة Photopea المجانية المدمجة. عند الانتهاء اضغط Ctrl+S (أو File → Save as) وستصلك النتيجة هنا للتنزيل فوراً.",
      "The editor runs on the embedded free Photopea service. When finished, press Ctrl+S (or File → Save as) and the result lands here for instant download.",
    ],
  },
  {
    slug: "image-translator",
    name: "ترجمة الصور بالذكاء الاصطناعي",
    nameEn: "AI Image Translator (Gemini)",
    short: "ارفع صورة واطلب نسخة معرَّبة — يفهم Gemini التصميم ويترجم نصوصه مع الحفاظ على ستايل الكتابة والتخطيط.",
    shortEn: "Upload an image and ask for a translated version — Gemini reads the design and translates its text while preserving the typography style and layout.",
    long: "ترفع صورة فيها نصوص (بوستر، لقطة شاشة، إنفوجرافيك…) وتكتب ما تريده — مثلاً «هات نسخة بالعربي مع الحفاظ على ستايل الكتابة» — فيرسلها الموقع إلى نماذج Gemini لتوليد الصور من Google التي تفهم الصورة وتعيد رسمها بالنصوص المترجمة بنفس الألوان والخطوط والمواضع، ثم تقارن الأصل بالنسخة المعرَّبة وتنزّلها. مفتاح Gemini مجاني من AI Studio ويُحفظ محلياً ولا يمر على أي خادم تابع لنا.",
    longEn: "Upload an image with text (a poster, screenshot, infographic…) and type what you want — e.g. “give me an Arabic version keeping the writing style” — and the site sends it to Google's Gemini image models, which understand the image and redraw it with translated text in the same colors, fonts and positions. Compare the original with the result and download it. Your Gemini key is free from AI Studio, stored locally and never touches our servers.",
    category: "image",
    icon: "globe",
    color: "var(--amber)",
    accept: "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif",
    multiple: false,
    badge: "AI · Gemini · OCR",
    badgeEn: "AI · Gemini · OCR",
    keywords: "ترجمة الصور ترجمة صورة بالعربي ترجمة الصور بالذكاء الاصطناعي gemini ترجمة image translation translate image text ai image translator تعريب الصور",
    keywordsEn: "gemini translate image text ai image translation translate picture text to arabic ocr translate",
    features: [
      "يفهم التصميم ويحافظ على الستايل والتخطيط",
      "ترجمة إلى العربية وخمس لغات أخرى",
      "نماذج Gemini لتوليد الصور من Google",
      "مقارنة الأصل بالمعرَّب قبل التنزيل",
    ],
    featuresEn: [
      "Understands the design, keeps style & layout",
      "Translate to Arabic plus five more languages",
      "Google Gemini image-generation models",
      "Compare original vs translated before download",
    ],
    drop: ["اسحب صورة فيها نصوص لترجمتها", "Drop an image with text to translate"],
    dropSub: ["بوستر · لقطة شاشة · إنفوجرافيك — سيترجم Gemini نصوصها بنفس الستايل", "Poster · screenshot · infographic — Gemini will translate its text in the same style"],
    action: ["ترجم الصورة", "Translate image"],
    note: [
      "تحتاج مفتاح Gemini API مجانياً من Google AI Studio (يُحفظ في متصفحك فقط). النماذج تعمل ضمن حصتك المجانية في Google.",
      "Requires a free Gemini API key from Google AI Studio (stored only in your browser). Models run within your free Google quota.",
    ],
    isNew: true,
  },
  {
    slug: "compress-pdf",
    name: "ضغط ملفات PDF",
    nameEn: "PDF Compressor",
    short: "قلّل حجم PDF بإعادة ترميز الصور المضمنة وتحسين بنية الملف الداخلية.",
    shortEn: "Shrink PDFs by re-encoding embedded images and optimizing the file structure.",
    long: "يفكك المحرك الصور المضمنة داخل الملف ويعيد ترميزها بالجودة التي تختارها، ثم يعيد بناء الملف ببنية محسّنة — مع تقرير شفاف بعدد الصور المعالجة.",
    longEn: "The engine decodes the embedded images, re-encodes them at your chosen quality, then rebuilds the file with an optimized structure — with a transparent report of processed images.",
    category: "pdf",
    icon: "pdf",
    color: "var(--red)",
    accept: "application/pdf,.pdf",
    multiple: false,
    badge: "JpegRecompress",
    badgeEn: "JpegRecompress",
    keywords: "ضغط pdf تصغير حجم pdf compress pdf",
    keywordsEn: "compress pdf reduce pdf size shrink pdf file",
    features: ["ثلاثة مستويات ضغط", "إعادة ترميز الصور المضمنة", "تحسين بنية الملف", "تقرير شفاف بالنتائج"],
    featuresEn: ["Three compression levels", "Embedded image re-encoding", "Structure optimization", "Transparent result report"],
    drop: ["اسحب ملف PDF لبدء الضغط", "Drop a PDF file to compress"],
    dropSub: ["يعيد المحرك ترميز الصور المضمنة ويحسّن بنية الملف الداخلية", "The engine re-encodes embedded images and optimizes the internal structure"],
    action: ["اضغط الملف الآن", "Compress file now"],
    note: [
      "أفضل النتائج مع الملفات التي تحتوي صوراً ممسوحة أو لقطات شاشة. الملفات النصية البحتة يكون توفيرها أقل لأن النص مضغوط أصلاً.",
      "Best results with scanned documents or screenshots. Text-only files save less because text is already compressed.",
    ],
  },
  {
    slug: "merge-pdf",
    name: "دمج ملفات PDF",
    nameEn: "Merge PDF",
    short: "ادمج عدة ملفات PDF في ملف واحد بالترتيب الذي تختاره — بدون فقدان.",
    shortEn: "Combine multiple PDFs into one file in your chosen order — losslessly.",
    long: "تُقرأ صفحات كل ملف وتُنسخ إلى مستند جديد بالترتيب الذي ترتبه بالأسهم — نسخ مباشر للصفحات بدون إعادة ترميز، فلا تفقد أي صفحة جودتها.",
    longEn: "Pages from each file are copied into a new document in the order you arrange with arrows — direct page copying without re-encoding, so no page loses quality.",
    category: "pdf",
    icon: "merge",
    color: "#9c4040",
    accept: "application/pdf,.pdf",
    multiple: true,
    badge: "Lossless · ترتيب",
    badgeEn: "Lossless · Order",
    keywords: "دمج pdf دمج ملفات pdf merge pdf",
    keywordsEn: "merge pdf combine pdf files pdf merger",
    features: ["ترتيب حر بالأسهم", "نسخ صفحات بلا فقدان", "عدد الصفحات لكل ملف", "ملف واحد نهائي"],
    featuresEn: ["Free reordering with arrows", "Lossless page copying", "Per-file page counts", "Single final document"],
    drop: ["اسحب ملفات PDF هنا", "Drop PDF files here"],
    dropSub: ["أضف ملفين أو أكثر ثم رتّبها بالأسهم قبل الدمج", "Add two or more files, then reorder with arrows before merging"],
    action: ["ادمج الملفات", "Merge files"],
    note: [
      "تُنسخ الصفحات بالترتيب الذي تراه في القائمة — استخدم الأسهم لإعادة الترتيب. الدمج محلي عبر pdf-lib دون فقدان جودة.",
      "Pages are copied in the order shown in the list — use arrows to reorder. Merging is local via pdf-lib with zero quality loss.",
    ],
  },
  {
    slug: "images-to-pdf",
    name: "تحويل الصور إلى PDF",
    nameEn: "Images to PDF",
    short: "حوّل مجموعة صور إلى ملف PDF واحد بمقاس A4 أو بمقاس الصور نفسها.",
    shortEn: "Turn a set of images into a single PDF — A4 pages or image-sized pages.",
    long: "كل صورة تصبح صفحة: اختر مقاس A4 باتجاه تلقائي وهوامش قابلة للتحكم، أو دع الصفحة تأخذ أبعاد الصورة نفسها للطباعة عالية الجودة.",
    longEn: "Every image becomes a page: choose A4 with auto orientation and adjustable margins, or let pages match the image dimensions for high-quality printing.",
    category: "pdf",
    icon: "img2pdf",
    color: "#b0653a",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    multiple: true,
    badge: "A4 · Fit · هوامش",
    badgeEn: "A4 · Fit · Margins",
    keywords: "تحويل الصور الى pdf صور الى pdf images to pdf",
    keywordsEn: "images to pdf convert photos to pdf jpg to pdf",
    features: ["كل صورة صفحة مستقلة", "مقاس A4 أو مطابق للصورة", "اتجاه تلقائي وهوامش", "ترتيب الصفحات بالسحب"],
    featuresEn: ["Each image = one page", "A4 or image-fit pages", "Auto orientation + margins", "Reorder pages easily"],
    drop: ["اسحب الصور لتحويلها إلى PDF", "Drop images to convert them to PDF"],
    dropSub: ["كل صورة تصبح صفحة — رتّب الصور كما تريد ترتيب الصفحات", "Each image becomes a page — order images the way you want pages"],
    action: ["أنشئ ملف PDF", "Create PDF file"],
    note: [
      "صور WebP تُحوّل تلقائياً إلى PNG قبل التضمين لضمان التوافق مع كل قارئات PDF.",
      "WebP images are automatically converted to PNG before embedding to guarantee compatibility with all PDF readers.",
    ],
  },
  {
    slug: "extract-pdf-images",
    name: "استخراج الصور من PDF",
    nameEn: "Extract PDF Images",
    short: "استخرج كل الصور المضمنة داخل ملف PDF بدقة أصلية وحمّلها ZIP.",
    shortEn: "Extract every embedded image from a PDF at original quality, download as ZIP.",
    long: "يفكك المحرك بنية الملف ويعثر على تيارات الصور: JPEG تُستخرج كما هي بفقدان صفر، والمضغوطة بخوارزمية Flate تُفكّك وتُحفظ PNG.",
    longEn: "The engine walks the file structure and finds image streams: JPEGs are extracted as-is with zero loss; Flate-compressed ones are decoded and saved as PNG.",
    category: "pdf",
    icon: "extract",
    color: "#8d3f57",
    accept: "application/pdf,.pdf",
    multiple: false,
    badge: "JPEG · Flate",
    badgeEn: "JPEG · Flate",
    keywords: "استخراج الصور من pdf extract images from pdf",
    keywordsEn: "extract images from pdf get pictures from pdf pdf image extractor",
    features: ["استخراج بدقة أصلية", "فك ضغط Flate إلى PNG", "معاينة قبل التنزيل", "تنزيل فردي أو ZIP"],
    featuresEn: ["Original-quality extraction", "Flate decoding to PNG", "Preview before download", "Individual or ZIP download"],
    drop: ["اسحب ملف PDF لاستخراج صوره", "Drop a PDF to extract its images"],
    dropSub: ["يفكك المحرك بنية الملف ويعثر على كل الصور المضمنة بدقة أصلية", "The engine walks the file structure and finds every embedded image at original quality"],
    action: ["استخرج الصور الآن", "Extract images now"],
    note: [
      "صور JPEG المضمنة تُستخرج بدون أي إعادة ترميز (فقدان صفر). الصور المتكررة في عدة صفحات تُستخرج مرة واحدة فقط.",
      "Embedded JPEGs are extracted without any re-encoding (zero loss). Images repeated across pages are extracted just once.",
    ],
  },
  {
    slug: "video-editor",
    name: "محرر الفيديو الاحترافي",
    nameEn: "Professional Video Editor",
    short: "محرر فيديو بمستوى الاستوديوهات يعمل داخل متصفحك: خط زمني، قصّ ودمج، نصوص وحركات، وتصدير MP4.",
    shortEn: "A studio-grade video editor that runs inside your browser: timeline, trim & merge, text & motion, and MP4 export.",
    long: "نُشغّل داخل المنصة محرك CreativeEditor الشهير (من img.ly) — نفس فكرة فوتوشوب الويب لكن للفيديو: خط زمني متعدد المقاطع، قصّ وتقطيع ودمج، نصوص عربية وعناوين متحركة، موسيقى، فلاتر وانتقالات، وكل المعالجة تتم داخل متصفحك مع تصدير MP4 جاهز للنشر.",
    longEn: "We run the renowned CreativeEditor engine (by img.ly) inside the platform — the same idea as web Photoshop, but for video: a multi-clip timeline, trimming, cutting & merging, Arabic text and animated titles, music, filters and transitions — all processed in your browser with MP4 export ready to publish.",
    category: "video",
    icon: "timeline",
    color: "var(--blue)",
    accept: "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov",
    multiple: false,
    badge: "Timeline · MP4 · In-browser",
    badgeEn: "Timeline · MP4 · In-browser",
    keywords: "محرر فيديو اونلاين مونتاج اونلاين تحرير الفيديو في المتصفح online video editor free timeline editor قص الفيديو",
    keywordsEn: "online video editor free browser video editing timeline editor trim merge video mp4 export",
    features: [
      "خط زمني احترافي بمقاطع متعددة",
      "قصّ وتقطيع ودمج بدقة الإطار",
      "نصوص وعناوين وموسيقى وانتقالات",
      "يعمل داخل المتصفح ويصدّر MP4",
    ],
    featuresEn: [
      "Professional multi-clip timeline",
      "Frame-accurate trim, cut & merge",
      "Text, titles, music & transitions",
      "Runs in the browser, exports MP4",
    ],
    drop: ["اسحب فيديو لفتحه في المحرر", "Drop a video to open it in the editor"],
    dropSub: ["MP4 · WebM · MOV — أو افتح المحرر فارغاً وابدأ مشروعاً جديداً", "MP4 · WebM · MOV — or open the editor empty and start a new project"],
    action: ["افتح الفيديو في المحرر", "Open video in editor"],
    note: [
      "المحرر يعمل بالكامل داخل متصفحك ولا يُرفع ملفك لأي خادم تابع لنا. التصدير من زر Export داخل المحرر بصيغة MP4. يُنصح بمتصفح كروم أو إيدج حديث لأفضل أداء.",
      "The editor runs entirely in your browser and your file is never uploaded to our servers. Export via the Export button inside the editor as MP4. A recent Chrome or Edge is recommended for best performance.",
    ],
    isNew: true,
  },
];

export const IMAGE_TOOLS = TOOLS.filter((t) => t.category === "image");
export const PDF_TOOLS = TOOLS.filter((t) => t.category === "pdf");
export const VIDEO_TOOLS = TOOLS.filter((t) => t.category === "video");

export function getTool(slug: string): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

/* ===== أقسام الخدمات — لكل قسم صفحته الخاصة ===== */
export interface CategoryDef {
  id: ToolCategory;
  slug: string;
  name: string;
  nameEn: string;
  icon: IconName;
  color: string;
  tagline: string;
  taglineEn: string;
  desc: string;
  descEn: string;
  useCases: string[];
  useCasesEn: string[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "image",
    slug: "images",
    name: "أدوات الصور",
    nameEn: "Image Tools",
    icon: "image",
    color: "var(--teal)",
    tagline: "من الضغط إلى التكبير — كل ما تحتاجه صورك",
    taglineEn: "From compression to upscaling — everything your images need",
    desc: "سبع أدوات تتعامل مع صورك بمعالجة محلية بالكامل: ضغط ذكي بحجم مستهدف، تغيير أبعاد، تحويل صيغ، روابط مشاركة، تكبير متعدد المراحل، إزالة علامات مائية، ومحرر متكامل.",
    descEn: "Seven tools that handle your images with fully local processing: smart target-size compression, resizing, format conversion, share links, multi-pass upscaling, watermark removal and a full editor.",
    useCases: [
      "تجهيز صور المنتجات للمتاجر الإلكترونية",
      "تصغير صور الواتساب والبريد دون فقدان الجودة الملحوظ",
      "تحويل لقطات الشاشة إلى WebP خفيفة للمواقع",
      "تكبير صور قديمة للطباعة أو العروض",
    ],
    useCasesEn: [
      "Preparing product photos for online stores",
      "Shrinking WhatsApp/email photos without visible quality loss",
      "Converting screenshots to lightweight WebP for websites",
      "Upscaling old photos for print or large displays",
    ],
  },
  {
    id: "pdf",
    slug: "pdf",
    name: "أدوات PDF",
    nameEn: "PDF Tools",
    icon: "pdf",
    color: "var(--red)",
    tagline: "مستنداتك تبقى عندك — والمعالجة في متصفحك",
    taglineEn: "Your documents stay yours — processed in your browser",
    desc: "أربع أدوات مبنية على محرك pdf-lib تعمل داخل المتصفح: ضغط بإعادة ترميز الصور المضمنة، دمج بلا فقدان، تحويل الصور إلى مستندات PDF أنيقة، واستخراج الصور بدقة أصلية.",
    descEn: "Four tools built on the pdf-lib engine, running inside the browser: compression via embedded-image re-encoding, lossless merging, elegant images-to-PDF conversion and original-quality image extraction.",
    useCases: [
      "تصغير ملفات PDF الكبيرة للإرسال بالبريد",
      "جمع فواتير الشهر في ملف واحد مرتب",
      "تحويل الأوراق الممسوحة إلى مستند PDF",
      "سحب الصور من المراجع والأبحاث دفعة واحدة",
    ],
    useCasesEn: [
      "Shrinking large PDFs for email attachments",
      "Collecting the month's invoices into one tidy file",
      "Turning scanned papers into a PDF document",
      "Pulling images out of references and papers in one go",
    ],
  },
  {
    id: "video",
    slug: "video",
    name: "أدوات الفيديو",
    nameEn: "Video Tools",
    icon: "timeline",
    color: "var(--blue)",
    tagline: "مونتاج بمستوى الاستوديوهات — داخل متصفحك",
    taglineEn: "Studio-grade editing — right in your browser",
    desc: "محرر فيديو احترافي مبني على محرك CreativeEditor يعمل داخل المتصفح: خط زمني، قصّ ودمج، نصوص وعناوين متحركة، موسيقى وانتقالات، وتصدير MP4 جاهز ليوتيوب والتيك توك.",
    descEn: "A professional video editor built on the CreativeEditor engine, running in the browser: timeline, trim & merge, animated text and titles, music and transitions, and MP4 export ready for YouTube and TikTok.",
    useCases: [
      "مونتاج سريع لمقاطع السوشيال ميديا",
      "قصّ الإعلانات من الفيديوهات قبل النشر",
      "إضافة عناوين ونصوص عربية للمقاطع",
      "دمج لقطات متفرقة في فيديو واحد",
    ],
    useCasesEn: [
      "Quick edits for social-media clips",
      "Trimming footage before publishing",
      "Adding Arabic titles and captions to clips",
      "Merging separate shots into one video",
    ],
  },
];

export function getCategory(slug: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function toolsOf(category: ToolCategory): ToolDef[] {
  return TOOLS.filter((t) => t.category === category);
}
