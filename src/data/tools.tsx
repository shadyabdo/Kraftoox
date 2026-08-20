import type { IconName } from "../components/Icons";

export interface ToolDef {
  slug: string;
  name: string;
  short: string;
  long: string;
  category: "image" | "pdf";
  icon: IconName;
  color: string;
  accept: string;
  multiple: boolean;
  badge: string;
  keywords: string;
  features: string[];
}

export const TOOLS: ToolDef[] = [
  {
    slug: "compress-image",
    name: "ضغط الصور",
    short: "قلّل حجم صور JPG وPNG وWebP حتى 90% مع الحفاظ على جودة ممتازة.",
    long: "اضغط صورك محلياً داخل المتصفح عبر خوارزمية بحث متكررة عن أفضل جودة عند الحجم المستهدف — مثالية للويب والمتاجر ومنصات التواصل.",
    category: "image",
    icon: "image",
    color: "#0c7a63",
    accept: "image/jpeg,image/png,image/webp",
    multiple: true,
    badge: "JPG · PNG · WEBP",
    keywords: "ضغط الصور تصغير الصور تقليل حجم الصورة compress image jpg png webp optimizer تخفيف الصور للواتس",
    features: [
      "تحديد حجم مستهدف بالميغابايت أو جودة يدوية",
      "معالجة دفعات كاملة دفعة واحدة",
      "مقارنة فورية بين الحجم قبل وبعد",
      "تحميل النتائج فرادى أو كملف ZIP",
    ],
  },
  {
    slug: "resize-image",
    name: "تغيير حجم الصور",
    short: "صغّر أو كبّر صورك بالنسبة المئوية أو بأبعاد دقيقة مع قفل نسبة الأبعاد.",
    long: "غيّر أبعاد صورك بدقة البكسل أو بالنسبة المئوية، مع الحفاظ التلقائي على نسبة الأبعاد وجودة إعادة عينات عالية.",
    category: "image",
    icon: "resize",
    color: "#1d8a8a",
    accept: "image/jpeg,image/png,image/webp,image/gif",
    multiple: true,
    badge: "JPG · PNG · WEBP · GIF",
    keywords: "تغيير حجم الصورة تصغير ابعاد الصورة resize image dimensions تكبير الصورة مقاس الصورة",
    features: [
      "وضع النسبة المئوية (25%، 50%، 75% أو مخصص)",
      "أبعاد دقيقة بالبكسل مع قفل نسبة الأبعاد",
      "إعادة عينات عالية الجودة High-Quality Resampling",
      "يعالج عدة صور في نفس الوقت",
    ],
  },
  {
    slug: "convert-image",
    name: "تحويل صيغ الصور",
    short: "حوّل صورك بين JPG وPNG وWebP بجودة قابلة للتحكم الكامل.",
    long: "تحويل فوري بين الصيغ الثلاث الأشهر: انتقل إلى WebP لتوفير الحجم، أو PNG للجودة، أو JPG للتوافق — مع تحكم كامل بالجودة وخلفية بيضاء تلقائية للصور الشفافة.",
    category: "image",
    icon: "convert",
    color: "#35845c",
    accept: "image/jpeg,image/png,image/webp",
    multiple: true,
    badge: "JPG ↔ PNG ↔ WEBP",
    keywords: "تحويل الصور تحويل صيغة الصورة convert image jpg to png webp to jpg تحويل webp الى jpg",
    features: [
      "تحويل جماعي لعدة صور معاً",
      "شريط تحكم بجودة الناتج",
      "معالجة ذكية للشفافية عند التحويل إلى JPG",
      "تحميل ZIP لكل النتائج",
    ],
  },
  {
    slug: "image-host",
    name: "رفع الصور برابط مباشر",
    short: "ارفع صورتك واحصل فوراً على رابط مباشر وروابط HTML وMarkdown وBBCode.",
    long: "احصل على روابط جاهزة للمشاركة: رابط مباشر، كود HTML، رابط Markdown للمنتديات التقنية، وBBCode للمنتديات العربية — مع خيار نشر مؤقت عبر خدمة مجانية.",
    category: "image",
    icon: "link",
    color: "#e8930c",
    accept: "image/jpeg,image/png,image/webp,image/gif",
    multiple: false,
    badge: "رابط مباشر · HTML · MD · BBCode",
    keywords: "رفع الصور رفع صور برابط مباشر استضافة الصور direct image link رفع صورة والحصول على رابط image hosting",
    features: [
      "رابط مباشر فوري للمعاينة والمشاركة",
      "أكواد جاهزة: HTML وMarkdown وBBCode",
      "نشر اختياري لرابط مؤقت قابل للمشاركة العامة",
      "معاينة الصورة قبل المشاركة",
    ],
  },
  {
    slug: "compress-pdf",
    name: "ضغط ملفات PDF",
    short: "قلّل حجم ملفات PDF الكبيرة بإعادة ضغط الصور المضمنة وتحسين بنية الملف.",
    long: "محرك ضغط يعمل على مستويين: إعادة ترميز الصور المضمنة داخل الملف بجودة تختارها، وتحسين بنية الملف الداخلية (Object Streams) وإزالة البيانات الوصفية الزائدة.",
    category: "pdf",
    icon: "pdf",
    color: "#d64550",
    accept: "application/pdf,.pdf",
    multiple: false,
    badge: "PDF",
    keywords: "ضغط pdf تصغير حجم pdf تقليل حجم ملف pdf compress pdf pdf compressor تخفيف pdf",
    features: [
      "ثلاثة مستويات ضغط: خفيف، متوازن، أقصى",
      "إعادة ترميز الصور المضمنة داخل الملف",
      "إزالة البيانات الوصفية الزائدة",
      "تقرير شفاف: كم صورة عُولجت وكم وُفّر",
    ],
  },
  {
    slug: "merge-pdf",
    name: "دمج ملفات PDF",
    short: "ادمج عدة ملفات PDF في ملف واحد بالترتيب الذي تختاره.",
    long: "أضف ملفاتك، رتّبها بأسهم الترتيب أو بالسحب، ثم ادمجها في ملف PDF واحد منظم — بدون فقدان أي صفحة وبدون رفع الملفات لأي خادم.",
    category: "pdf",
    icon: "merge",
    color: "#e0762e",
    accept: "application/pdf,.pdf",
    multiple: true,
    badge: "PDF + PDF → PDF",
    keywords: "دمج pdf دمج ملفات pdf جمع ملفات pdf merge pdf combine pdf تجميع pdf",
    features: [
      "دمج عدد غير محدود من الملفات",
      "إعادة ترتيب الملفات قبل الدمج",
      "عرض عدد صفحات كل ملف",
      "ملف ناتج واحد محسّن البنية",
    ],
  },
  {
    slug: "images-to-pdf",
    name: "تحويل الصور إلى PDF",
    short: "حوّل مجموعة صور إلى ملف PDF واحد بمقاس A4 أو بمقاس الصور نفسها.",
    long: "اجمع صورك في مستند PDF أنيق: صورة في كل صفحة، بمقاس A4 أو بمقاس الصور نفسها، مع تحكم بالاتجاه والهوامش — مثالي للمستندات الممسوحة والألبومات.",
    category: "pdf",
    icon: "img2pdf",
    color: "#c04a78",
    accept: "image/jpeg,image/png,image/webp",
    multiple: true,
    badge: "JPG · PNG · WEBP → PDF",
    keywords: "تحويل الصور الى pdf تحويل صورة الى pdf images to pdf jpg to pdf انشاء pdf من الصور",
    features: [
      "مقاس A4 أو مقاس مطابق لكل صورة",
      "اتجاه تلقائي حسب شكل الصورة",
      "هوامش قابلة للتحكم",
      "ترتيب الصور بالسحب أو بالأسهم",
    ],
  },
  {
    slug: "extract-pdf-images",
    name: "استخراج الصور من PDF",
    short: "استخرج كل الصور المضمنة في ملف PDF وحمّلها دفعة واحدة كملف ZIP.",
    long: "يفكك محركنا بنية ملف PDF ويعثر على كل الصور المضمنة — صور JPEG تُستخرج بصيغتها الأصلية، والصور المضغوطة تُفك وتُعاد بصيغة PNG — ثم يجمعها لك في ملف ZIP واحد.",
    category: "pdf",
    icon: "extract",
    color: "#9c4040",
    accept: "application/pdf,.pdf",
    multiple: false,
    badge: "PDF → JPG · PNG · ZIP",
    keywords: "استخراج الصور من pdf سحب الصور من pdf extract images from pdf تحميل الصور من ملف pdf",
    features: [
      "استخراج الصور بدقة أصلية بدون فقدان",
      "معاينة كل صورة مستخرجة مع أبعادها",
      "تحميل جماعي بصيغة ZIP",
      "تحميل فردي لأي صورة",
    ],
  },
];

export const IMAGE_TOOLS = TOOLS.filter((t) => t.category === "image");
export const PDF_TOOLS = TOOLS.filter((t) => t.category === "pdf");

export function getTool(slug: string): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
