import type { ReactNode } from "react";
import { Link } from "../lib/router";
import { usePageMeta } from "../lib/seo";
import { Icon, type IconName } from "../components/Icons";
import { Reveal } from "../components/Reveal";

function Section({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="card p-6 sm:p-7">
      <h2 className="font-display flex items-center gap-2.5 text-lg font-bold">
        <span className="c-teal"><Icon name={icon} size={20} /></span>
        {title}
      </h2>
      <div className="c-muted mt-3 space-y-3 text-sm leading-loose">{children}</div>
    </section>
  );
}

export default function Privacy() {
  usePageMeta("/privacy");

  return (
    <main className="mx-auto max-w-3xl px-4 pb-10">
      <nav className="flex items-center gap-1.5 py-5 text-xs c-muted" aria-label="مسار التنقل">
        <Link to="/" className="transition-colors hover:text-[var(--teal)]">الرئيسية</Link>
        <Icon name="arrow" size={12} className="opacity-50" />
        <span className="font-semibold c-teal">سياسة الخصوصية</span>
      </nav>

      <Reveal>
        <header>
          <p className="font-display flex items-center gap-2 text-sm font-semibold c-teal">
            <Icon name="shield" size={16} />
            سياسة الخصوصية
          </p>
          <h1 className="font-display mt-2 text-4xl font-extrabold sm:text-5xl">
            خصوصيتك <span className="c-teal">مضمونة بالتصميم</span>
          </h1>
          <p className="c-muted mt-3 text-sm">
            آخر تحديث: <b>15 يناير 2026</b> — تنطبق هذه السياسة على موقع
            <span className="font-mono" dir="ltr"> kraftoox.app </span> وجميع أدواته.
          </p>
        </header>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-8 rounded-2xl border-2 p-5 sm:p-6" style={{ borderColor: "var(--teal)", background: "var(--teal-soft)" }}>
          <p className="flex items-start gap-3 text-sm font-semibold leading-relaxed sm:text-base">
            <span className="c-teal mt-0.5 shrink-0"><Icon name="check" size={20} /></span>
            النسخة المختصرة: ملفاتك لا تُرفع إلى خوادمنا إطلاقاً. المعالجة كلها تحدث داخل متصفحك،
            ولا نخزن أي ملفات ولا نطّلع على أي محتوى. ما نحفظه هو تفضيل الوضع الليلي/الفاتح في
            متصفحك فقط.
          </p>
        </div>
      </Reveal>

      <div className="mt-8 space-y-5">
        <Reveal delay={120}>
          <Section icon="file" title="1. ملفاتك ومعالجتها">
            <p>
              جميع أدوات الموقع (ضغط الصور، تغيير الحجم، تحويل الصيغ، ضغط PDF، الدمج، التحويل من
              الصور، استخراج الصور) تعمل <b>داخل متصفحك بالكامل</b> باستخدام تقنيات JavaScript
              تعمل على جهازك (Canvas API وpdf-lib وpako وWeb Workers).
            </p>
            <p>
              هذا يعني تقنياً أن ملفاتك <b>لا تغادر جهازك</b> أثناء استخدام هذه الأدوات: لا رفع
              إلى خوادمنا ولا إلى أي خادم وسيط، ويمكنك التحقق من ذلك بقطع اتصال الإنترنت بعد
              تحميل الصفحة — ستستمر الأدوات في العمل.
            </p>
            <p>
              الاستثناء الوحيد الاختياري: أداة «رفع الصور برابط مباشر» توفر زراً اختيارياً لنشر
              رابط عام مؤقت، وعند استخدامه يُرسل الملف <b>مباشرة من جهازك</b> إلى خدمة الاستضافة
              الخارجية المجانية (tmpfiles.org) وليس إلى خوادمنا، وتخضع الروابط الناتجة لسياسة تلك
              الخدمة ومدد احتفاظها. استخدام هذا الزر اختياري تماماً.
            </p>
          </Section>
        </Reveal>

        <Reveal delay={140}>
          <Section icon="device" title="2. البيانات التي نحفظها محلياً لديك">
            <p>نستخدم التخزين المحلي لمتصفحك (LocalStorage) لحفظ ما يلي فقط:</p>
            <ul className="list-inside space-y-1.5">
              <li>• تفضيل الوضع الليلي أو الفاتح.</li>
              <li>• عدّاد الملفات التي عالجتها على جهازك (يُعرض في الصفحة الرئيسية ولا يُرسل لأي جهة).</li>
            </ul>
            <p>لا نستخدم ملفات تعريف ارتباط (Cookies) تشغيلية خاصة بنا، ويمكنك مسح هذه البيانات في أي وقت من إعدادات متصفحك.</p>
          </Section>
        </Reveal>

        <Reveal delay={160}>
          <Section icon="eye" title="3. التحليلات والإعلانات">
            <p>
              لا نشغّل حالياً أي أدوات تتبع سلوكي ولا نجمع بيانات تحليلية شخصية. إذا أضفنا مستقبلاً
              إعلانات (مثل Google AdSense) لدعم استمرارية الخدمة المجانية، فسنفعل ذلك بشفافية:
              قد تستخدم شبكات الإعلان ملفات تعريف ارتباط لعرض إعلانات ذات صلة، ويمكنك التحكم بها
              من <span dir="ltr" className="font-mono">adssettings.google.com</span> أو تعطيل
              التخصيص كلياً، دون أن يؤثر ذلك على عمل أي أداة.
            </p>
          </Section>
        </Reveal>

        <Reveal delay={180}>
          <Section icon="link" title="4. الروابط الخارجية">
            <p>
              قد يحتوي الموقع على روابط لمواقع خارجية (مثل أزرار المشاركة الاجتماعية أو خدمة
              الروابط المؤقتة). نحن غير مسؤولين عن ممارسات الخصوصية لتلك المواقع، وننصح بالاطلاع
              على سياساتها عند زيارتها.
            </p>
          </Section>
        </Reveal>

        <Reveal delay={200}>
          <Section icon="shield" title="5. حقوقك">
            <p>
              بما أننا لا نخزن ملفاتك ولا بياناتك الشخصية على خوادمنا، فلا يوجد ما تحتاج طلب حذفه
              منا. بياناتك المتبقية (تفضيل السمة والعدّاد) تقع بالكامل تحت سيطرتك داخل متصفحك.
              لأي استفسار متعلق بالخصوصية راسلنا عبر صفحة
              <Link to="/contact" className="linkish"> اتصل بنا</Link> وسنرد خلال 24 ساعة.
            </p>
          </Section>
        </Reveal>

        <Reveal delay={220}>
          <Section icon="refresh" title="6. تحديثات هذه السياسة">
            <p>
              إذا غيّرنا طريقة عمل الموقع مستقبلاً (مثل إضافة تحليلات أو إعلانات) سنحدّث هذه
              الصفحة ونشير إلى تاريخ التحديث في أعلاها قبل سريان التغيير. استمرارك في استخدام
              الموقع بعد التحديث يعني موافقتك عليه.
            </p>
          </Section>
        </Reveal>
      </div>

      <Reveal className="mt-10">
        <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
          <p className="font-display text-lg font-bold">أسئلة عن خصوصيتك؟</p>
          <Link to="/contact" className="btn btn-teal">
            <Icon name="mail" size={17} />
            راسلنا مباشرة
          </Link>
        </div>
      </Reveal>
    </main>
  );
}
