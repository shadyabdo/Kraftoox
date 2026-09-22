import { useState } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { copyText, showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("hash-generator")!;

export default function HashGenerator() {
  const { t, isAr } = useI18n();
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});

  const generateHashes = async () => {
    if (!input.trim()) return;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    const algorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
    const results: Record<string, string> = {};
    
    for (const algo of algorithms) {
      const hashBuffer = await crypto.subtle.digest(algo, data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      results[algo] = hashHex;
    }
    
    // MD5 (simple implementation)
    results["MD5"] = simpleMD5(input);
    
    setHashes(results);
    showToast(t("تم توليد Hash", "Hash generated"));
  };

  // Simple MD5 implementation
  const simpleMD5 = (str: string): string => {
    const rotateLeft = (lValue: number, shift: number) => (lValue << shift) | (lValue >>> (32 - shift));
    
    const addUnsigned = (x: number, y: number) => {
      const lX8 = x & 0x80000000;
      const lY8 = y & 0x80000000;
      const lX4 = x & 0x40000000;
      const lY4 = y & 0x40000000;
      const lRes = (x & 0x3fffffff) + (y & 0x3fffffff);
      if (lX4 & lY4) return lRes ^ 0x80000000 ^ lX8 ^ lY8;
      if (lX4 | lY4) return lRes & 0x40000000 ? lRes ^ 0xc0000000 ^ lX8 ^ lY8 : lRes ^ 0x40000000 ^ lX8 ^ lY8;
      return lRes ^ lX8 ^ lY8;
    };

    const f = (x: number, y: number, z: number) => (x & y) | (~x & z);
    const g = (x: number, y: number, z: number) => (x & z) | (y & ~z);
    const h = (x: number, y: number, z: number) => x ^ y ^ z;
    const i = (x: number, y: number, z: number) => y ^ (x | ~z);

    const ff = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
      a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    const gg = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
      a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    const hh = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
      a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    const ii = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
      a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    const convertToWordArray = (str: string) => {
      let lWordCount = ((str.length + 8 - ((str.length + 8) % 64)) / 4) + 2;
      const lWordArray = new Array(lWordCount - 1);
      let lBytePosition = 0;
      let lByteCount = 0;
      
      while (lByteCount < str.length) {
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition);
        lByteCount++;
      }
      
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
      lWordArray[lWordArray.length - 2] = str.length << 3;
      lWordArray[lWordArray.length - 1] = str.length >>> 29;
      
      return lWordArray;
    };

    const wordToHex = (value: number) => {
      let wordToHexValue = "", wordToHexValueTemp = "", byte, count;
      for (count = 0; count <= 3; count++) {
        byte = (value >>> (count * 8)) & 255;
        wordToHexValueTemp = "0" + byte.toString(16);
        wordToHexValue = wordToHexValue + wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2);
      }
      return wordToHexValue;
    };

    const x = convertToWordArray(str);
    let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;

    const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

    for (let k = 0; k < x.length; k += 16) {
      const AA = a, BB = b, CC = c, DD = d;
      a = ff(a, b, c, d, x[k + 0], S11, 0xd76aa478);
      d = ff(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
      c = ff(c, d, a, b, x[k + 2], S13, 0x242070db);
      b = ff(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
      a = ff(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
      d = ff(d, a, b, c, x[k + 5], S12, 0x4787c62a);
      c = ff(c, d, a, b, x[k + 6], S13, 0xa8304613);
      b = ff(b, c, d, a, x[k + 7], S14, 0xfd469501);
      a = ff(a, b, c, d, x[k + 8], S11, 0x698098d8);
      d = ff(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
      c = ff(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
      b = ff(b, c, d, a, x[k + 11], S14, 0x895cd7be);
      a = ff(a, b, c, d, x[k + 12], S11, 0x6b901122);
      d = ff(d, a, b, c, x[k + 13], S12, 0xfd987193);
      c = ff(c, d, a, b, x[k + 14], S13, 0xa679438e);
      b = ff(b, c, d, a, x[k + 15], S14, 0x49b40821);
      a = gg(a, b, c, d, x[k + 1], S21, 0xf61e2562);
      d = gg(d, a, b, c, x[k + 6], S22, 0xc040b340);
      c = gg(c, d, a, b, x[k + 11], S23, 0x265e5a51);
      b = gg(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
      a = gg(a, b, c, d, x[k + 5], S21, 0xd62f105d);
      d = gg(d, a, b, c, x[k + 10], S22, 0x2441453);
      c = gg(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
      b = gg(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
      a = gg(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
      d = gg(d, a, b, c, x[k + 14], S22, 0xc33707d6);
      c = gg(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
      b = gg(b, c, d, a, x[k + 8], S24, 0x455a14ed);
      a = gg(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
      d = gg(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
      c = gg(c, d, a, b, x[k + 7], S23, 0x676f02d9);
      b = gg(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
      a = hh(a, b, c, d, x[k + 5], S31, 0xfffa3942);
      d = hh(d, a, b, c, x[k + 8], S32, 0x8771f681);
      c = hh(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
      b = hh(b, c, d, a, x[k + 14], S34, 0xfde5380c);
      a = hh(a, b, c, d, x[k + 1], S31, 0xa4beea44);
      d = hh(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
      c = hh(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
      b = hh(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
      a = hh(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
      d = hh(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
      c = hh(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
      b = hh(b, c, d, a, x[k + 6], S34, 0x4881d05);
      a = hh(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
      d = hh(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
      c = hh(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
      b = hh(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
      a = ii(a, b, c, d, x[k + 0], S41, 0xf4292244);
      d = ii(d, a, b, c, x[k + 7], S42, 0x432aff97);
      c = ii(c, d, a, b, x[k + 14], S43, 0xab9423a7);
      b = ii(b, c, d, a, x[k + 5], S44, 0xfc93a039);
      a = ii(a, b, c, d, x[k + 12], S41, 0x655b59c3);
      d = ii(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
      c = ii(c, d, a, b, x[k + 10], S43, 0xffeff47d);
      b = ii(b, c, d, a, x[k + 1], S44, 0x85845dd1);
      a = ii(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
      d = ii(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
      c = ii(c, d, a, b, x[k + 6], S43, 0xa3014314);
      b = ii(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
      a = ii(a, b, c, d, x[k + 4], S41, 0xf7537e82);
      d = ii(d, a, b, c, x[k + 11], S42, 0xbd3af235);
      c = ii(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
      b = ii(b, c, d, a, x[k + 9], S44, 0xeb86d391);
      a = addUnsigned(a, AA);
      b = addUnsigned(b, BB);
      c = addUnsigned(c, CC);
      d = addUnsigned(d, DD);
    }

    return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
  };

  const handleCopy = async (hash: string) => {
    const success = await copyText(hash);
    if (success) {
      showToast(t("تم النسخ", "Copied"));
    }
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold">
            {t("أدخل النص", "Enter text")}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("اكتب النص هنا...", "Type text here...")}
            className="input min-h-[150px]"
          />
        </div>

        <button
          type="button"
          onClick={generateHashes}
          disabled={!input.trim()}
          className="btn btn-primary mb-4"
        >
          <Icon name="wand" size={16} />
          {t("ولّد Hash", "Generate Hash")}
        </button>

        {Object.keys(hashes).length > 0 && (
          <div className="space-y-3">
            {Object.entries(hashes).map(([algo, hash]) => (
              <div key={algo} className="rounded-lg bg-[var(--surface2)] p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold">{algo}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(hash)}
                    className="btn btn-ghost !py-1 !px-2 !text-xs"
                  >
                    <Icon name="copy" size={14} />
                  </button>
                </div>
                <code className="text-xs font-mono break-all c-muted" dir="ltr">
                  {hash}
                </code>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
