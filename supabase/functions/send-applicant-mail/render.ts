import { TPL, SUBJ } from "./tpl.ts";
export const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// 출신 지역 → 메일 언어: 한국=한국어, 일본=일본어, 영미권·기타=영어, 미입력(예전 지원서)=한국어→일본어→영어 한 통(multi)
export const langOf = (region: unknown) =>
  region === "korea" ? "ko" : region === "japan" ? "ja" : region === "english" || region === "other" ? "en" : "multi";
const SIG = `<div style="border-top:2px solid #7c5cd6;margin-top:22px;padding-top:12px;line-height:1.4"><div style="font-size:20px;font-weight:700;letter-spacing:3px;color:#1d1b22">RIF STUDIO</div><div style="font-size:12px;letter-spacing:2px;color:#5b8f6e;margin-top:2px">リフ スタジオ</div><div style="font-size:11px;letter-spacing:2px;color:#7a7783;margin-top:6px">PANGYO • TOKYO • NEW YORK</div><div style="font-size:12px;margin-top:6px"><a href="https://rif-studio.com" style="color:#7c5cd6;text-decoration:none">rif-studio.com</a></div></div>`;
const ORDER = ["ko", "ja", "en"];
const bare = (s: string) => s.replace(/^\s*(\[RIF STUDIO\]|【RIF STUDIO】)\s*/, "");
// inner: 본문+서명 HTML (바깥 div 없이). 발송할 때 바깥 div 안에 읽음 확인 픽셀을 넣어요.
export function render(type: string, lang: string, rawName: string) {
  const langs = lang === "multi" ? ORDER : [lang];
  const block = (l: string) =>
    TPL[type][l].map((p) => `<p>${p.map((s) => esc(s).replace(/\{N\}/g, esc(rawName))).join("<br>")}</p>`).join("");
  const textBlock = (l: string) => TPL[type][l].map((p) => p.map((s) => s.replace(/\{N\}/g, rawName)).join("\n")).join("\n\n");
  const HR = `<hr style="border:0;border-top:1px dashed #c9c5d3;margin:26px 0">`;
  const open = `<div style="font-family:'Noto Sans KR','Noto Sans JP','Hiragino Sans',Arial,sans-serif;font-size:15px;line-height:1.75;color:#1d1b22;max-width:600px">`;
  const inner = langs.map(block).join(HR) + SIG;
  const text = langs.map(textBlock).join("\n\n----------\n\n") + "\n\nRIF STUDIO\nPANGYO / TOKYO / NEW YORK\nhttps://rif-studio.com";
  const subject = lang === "multi" ? "[RIF STUDIO] " + ORDER.map((l) => bare(SUBJ[type][l])).join(" / ") : SUBJ[type][lang];
  return { open, inner, html: open + inner + "</div>", text, subject };
}
