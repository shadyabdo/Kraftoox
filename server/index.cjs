/**
 * FileTools — Backend اختياري (Node.js + Express + Supabase)
 * ============================================================
 * الغرض: توفير روابط «دائمة» للصور بميزانية صفرية.
 * الواجهة الأمامية تعمل بالكامل بدون هذا الخادم — هذا مجرد إضافة اختيارية
 * لأداة «رفع الصور برابط مباشر» عندما تريد روابط لا تنتهي.
 *
 * التشغيل:
 *   npm install express cors multer @supabase/supabase-js dotenv
 *   node index.cjs
 *
 * المتغيرات البيئية (.env):
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY=service_role_key
 *   BUCKET=images
 *   PORT=8080
 */

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — الخطة المجانية من Supabase تتسع
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    cb(ok ? null : new Error("Unsupported file type"), ok);
  },
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const BUCKET = process.env.BUCKET || "images";

app.use(cors());
app.use(express.json());

// استضافة الواجهة المبنية (اختياري)
app.use(express.static(path.join(__dirname, "..", "dist")));

/**
 * POST /api/upload
 * body: FormData بحقل "file"
 * يرجع: { url } — رابط عام دائم من Supabase Storage
 */
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const ext = path.extname(req.file.originalname) || ".png";
    const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(name, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(name);
    res.json({ url: data.publicUrl });
  } catch (err) {
    console.error("Upload failed:", err.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`FileTools API listening on :${PORT}`));
