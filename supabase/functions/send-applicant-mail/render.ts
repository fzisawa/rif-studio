import { TPL, SUBJ } from "./tpl.ts";
export const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// 출신 지역 → 메일 언어: 한국=한국어, 일본=일본어, 그 외(영미권·기타·미입력)=영어
export const langOf = (region: unknown) => (region === "korea" ? "ko" : region === "japan" ? "ja" : "en");
const SIG = `<div style="border-top:2px solid #7c5cd6;margin-top:22px;padding-top:12px;line-height:1.4"><div style="font-size:20px;font-weight:700;letter-spacing:3px;color:#1d1b22">RIF STUDIO</div><div style="font-size:12px;letter-spacing:2px;color:#5b8f6e;margin-top:2px">リフ スタジオ</div><div style="font-size:11px;letter-spacing:2px;color:#7a7783;margin-top:6px">PANGYO • TOKYO • NEW YORK</div><div style="font-size:12px;margin-top:6px"><a href="https://rif-studio.com" style="color:#7c5cd6;text-decoration:none">rif-studio.com</a></div></div>`;
export function render(type: string, lang: string, rawName: string) {
  const paras = TPL[type][lang];
  const html = `<div style="font-family:'Noto Sans KR','Noto Sans JP','Hiragino Sans',Arial,sans-serif;font-size:15px;line-height:1.75;color:#1d1b22;max-width:600px">${paras
    .map((p) => `<p>${p.map((s) => esc(s).replace(/\{N\}/g, esc(rawName))).join("<br>")}</p>`).join("")}${SIG}</div>`;
  const text = paras.map((p) => p.map((s) => s.replace(/\{N\}/g, rawName)).join("\n")).join("\n\n") + "\n\nRIF STUDIO\nPANGYO / TOKYO / NEW YORK\nhttps://rif-studio.com";
  return { html, text, subject: SUBJ[type][lang] };
}
