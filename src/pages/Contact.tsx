import { useState, type FormEvent } from "react";
import { Link } from "../lib/router";
import { usePageMeta } from "../lib/seo";
import { copyText, cx, showToast } from "../lib/utils";
import { Icon } from "../components/Icons";
import { Reveal } from "../components/Reveal";
import { CopyBtn } from "../components/bits";

const EMAIL = "support@filetools.app";

export default function Contact() {
  usePageMeta("/contact");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("استفسار عام");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "أدخل اسمك الكامل";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "أدخل بريداً إلكترونياً صحيحاً";
    if (message.trim().length < 10) e.message = "اكتب رسالة من 10 أحرف على الأقل";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      showToast("راجع الحقول المظللة بالأحمر", "err");
      return;
    }
    setSent(true);
    showToast("جهّزنا رسالتك — أكمل الإرسال من بريدك");
  };

  const mailtoHref = `mailto:${EMAIL}?subject=${encodeURIComponent(
    `[FileTools] ${subject} — ${name}`
  )}&body=${encodeURIComponent(`الاسم: ${name}\nالبريد: ${email}\n\n${message}`)}`;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-10">
      <nav className="flex items-center gap-1.5 py-5 text-xs c-muted" aria-label="مسار التنقل">
        <Link to="/" className="transition-colors hover:text-[var(--teal)]">الرئيسية</Link>
        <Icon name="arrow" size={12} className="opacity-50" />
        <span className="font-semibold c-teal">اتصل بنا</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        {/* النموذج */}
        <Reveal>
          <p className="font-display flex items-center gap-2 text-sm font-semibold c-teal">
            <Icon name="mail" size={16} />
            راسلنا
          </p>
          <h1 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">
            نسمعك <span className="c-teal">خلال 24 ساعة</span>
          </h1>
          <p className="c-muted mt-3 max-w-md text-sm leading-relaxed">
            استفسار، اقتراح أداة جديدة، مشكلة واجهتها، أو عرض شراكة — كل الرسائل تصلنا مباشرة
            ونرد على جميعها.
          </p>

          {!sent ? (
            <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="mb-1.5 block text-xs font-semibold c-muted">الاسم *</label>
                  <input
                    id="c-name"
                    className={cx("input", errors.name && "!border-[var(--red)]")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اسمك الكريم"
                  />
                  {errors.name && <p className="c-red mt-1 text-xs">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="c-email" className="mb-1.5 block text-xs font-semibold c-muted">البريد الإلكتروني *</label>
                  <input
                    id="c-email"
                    type="email"
                    dir="ltr"
                    className={cx("input text-left", errors.email && "!border-[var(--red)]")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="c-red mt-1 text-xs">{errors.email}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="c-subject" className="mb-1.5 block text-xs font-semibold c-muted">الموضوع</label>
                <select id="c-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  <option>استفسار عام</option>
                  <option>مشكلة في أداة</option>
                  <option>اقتراح أداة جديدة</option>
                  <option>شراكة أو إعلان</option>
                  <option>طلب حذف بيانات</option>
                </select>
              </div>
              <div>
                <label htmlFor="c-msg" className="mb-1.5 block text-xs font-semibold c-muted">الرسالة *</label>
                <textarea
                  id="c-msg"
                  rows={5}
                  className={cx("input resize-y", errors.message && "!border-[var(--red)]")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب تفاصيل رسالتك هنا…"
                />
                {errors.message && <p className="c-red mt-1 text-xs">{errors.message}</p>}
              </div>
              <button type="submit" className="btn btn-teal !px-7 !py-3">
                <Icon name="send" size={17} />
                تجهيز الرسالة
              </button>
            </form>
          ) : (
            <div className="anim-pop card mt-7 p-6">
              <div className="flex items-center gap-3">
                <span className="c-teal grid h-11 w-11 place-items-center rounded-full bg-[var(--teal-soft)]">
                  <Icon name="check" size={22} />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold">رسالتك جاهزة يا {name.split(" ")[0]}</h2>
                  <p className="c-muted text-sm">أكمل الإرسال بضغطة واحدة عبر بريدك:</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={mailtoHref} className="btn btn-teal">
                  <Icon name="send" size={16} />
                  فتح في تطبيق البريد
                </a>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setSent(false);
                    setName("");
                    setEmail("");
                    setMessage("");
                  }}
                >
                  <Icon name="refresh" size={16} />
                  رسالة أخرى
                </button>
              </div>
            </div>
          )}
        </Reveal>

        {/* بطاقات معلومات */}
        <div className="space-y-4">
          <Reveal delay={100}>
            <div className="card p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--teal-soft)] c-teal">
                    <Icon name="mail" size={21} />
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-bold">البريد المباشر</h3>
                    <p className="font-mono text-xs c-muted" dir="ltr">{EMAIL}</p>
                  </div>
                </div>
                <CopyBtn
                  text={EMAIL}
                  small
                  label=""
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={170}>
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--amber-soft)] c-amber">
                  <Icon name="bolt" size={21} />
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold">زمن الرد</h3>
                  <p className="c-muted text-xs">خلال 24 ساعة عمل — غالباً أسرع بكثير</p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={240}>
            <div className="card p-6">
              <h3 className="font-display mb-3 flex items-center gap-2 text-sm font-bold">
                <span className="c-teal"><Icon name="info" size={16} /></span>
                قبل أن تراسلنا — قد تجد جوابك هنا
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/privacy" className="linkish">هل تُرفع ملفاتي لخوادمكم؟</Link>
                </li>
                <li>
                  <Link to="/about" className="linkish">كيف يعمل الموقع تقنياً؟</Link>
                </li>
                <li>
                  <a href="#/?focus=search" className="linkish">أبحث عن أداة معينة</a>
                </li>
              </ul>
            </div>
          </Reveal>

          <Reveal delay={310}>
            <div className="card p-6">
              <h3 className="font-display mb-3 flex items-center gap-2 text-sm font-bold">
                <span className="c-amber"><Icon name="heart" size={16} /></span>
                أحببت الموقع؟
              </h3>
              <p className="c-muted mb-3 text-xs leading-relaxed">
                أفضل دعم تقدمه لنا هو مشاركة الموقع — كل مستخدم جديد يدفعنا لإضافة أدوات أكثر.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost !px-3 !py-2 !text-xs"
                  onClick={async () => {
                    const ok = await copyText("https://filetools.app/");
                    if (ok) showToast("تم نسخ رابط الموقع");
                  }}
                >
                  <Icon name="link" size={14} />
                  نسخ الرابط
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent("FileTools — أدوات مجانية لمعالجة الصور وPDF داخل المتصفح: https://filetools.app/")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost !px-3 !py-2 !text-xs"
                >
                  <Icon name="send" size={14} />
                  واتساب
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
