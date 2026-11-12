import { TPL, SUBJ } from "./tpl.ts";
export const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// 출신 지역 → 메일 언어: 한국=한국어, 일본=일본어, 영미권·기타=영어, 미입력(예전 지원서)=한국어→일본어→영어 한 통(multi)
export const langOf = (region: unknown) =>
  region === "korea" ? "ko" : region === "japan" ? "ja" : region === "english" || region === "other" ? "en" : "multi";
const SIG = `<div style="border-top:2px solid #7c5cd6;margin-top:22px;padding-top:12px;line-height:1.4"><div style="font-size:20px;font-weight:700;letter-spacing:3px;color:#1d1b22">RIF STUDIO</div><div style="font-size:12px;letter-spacing:2px;color:#5b8f6e;margin-top:2px">リフ スタジオ</div><div style="font-size:11px;letter-spacing:2px;color:#7a7783;margin-top:6px">PANGYO • TOKYO • NEW YORK</div><div style="font-size:12px;margin-top:6px"><a href="https://rif-studio.com" style="color:#7c5cd6;text-decoration:none">rif-studio.com</a></div></div>`;

// 지원 분야 표기 (사이트 지원 폼의 값 → 메일 언어별 이름)
const FN: Record<string, Record<string, string>> = {
  ko: { vocal: "보컬", composition: "작곡·편곡", directing: "디렉팅", mixing: "믹싱", mastering: "마스터링", illustration: "일러스트", design: "디자인·굿즈", writer: "작가(스토리·작사)", streamer: "스트리머", video: "영상", management: "매니지먼트", sales: "영업·운영" },
  ja: { vocal: "ボーカル", composition: "作曲・編曲", directing: "ディレクティング", mixing: "ミキシング", mastering: "マスタリング", illustration: "イラスト", design: "デザイン・グッズ", writer: "作家（ストーリー・作詞）", streamer: "ストリーマー", video: "映像", management: "マネジメント", sales: "営業・運営" },
  en: { vocal: "Vocals", composition: "Composition & Arrangement", directing: "Directing", mixing: "Mixing", mastering: "Mastering", illustration: "Illustration", design: "Design & Merch", writer: "Writing (story & lyrics)", streamer: "Streaming", video: "Video", management: "Management", sales: "Sales & Operations" },
};
function fieldText(l: string, fields: unknown, other: unknown): string {
  const raw = String(fields || "").split(",").map((x) => x.trim()).filter(Boolean);
  const names = raw.map((x) => (x === "etc" ? String(other || "").trim() : FN[l][x] || "")).filter(Boolean);
  if (!names.length) return "";
  if (l === "ja") return names.join("、");
  if (l === "en") return names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0];
  return names.join(", ");
}
// 지원 분야를 넣는 문장 (원문 → 분야 포함 문장). 원문을 못 찾으면 그대로 두어요.
const REPL: Record<string, Record<string, [string, string]>> = {
  thanks: {
    ko: ["RIF STUDIO에 지원해 주셔서 진심으로 감사드립니다.", "{F} 분야로 RIF STUDIO에 지원해 주셔서 진심으로 감사드립니다."],
    ja: ["このたびはRIF STUDIOにご応募いただき、誠にありがとうございます。", "このたびは{F}の分野でRIF STUDIOにご応募いただき、誠にありがとうございます。"],
    en: ["Thank you so much for applying to RIF STUDIO.", "Thank you so much for applying to RIF STUDIO for {F}."],
  },
  interview: {
    ko: ["보내주신 지원서와 작업물을 잘 살펴보았습니다.", "{F} 분야로 보내주신 지원서와 작업물을 잘 살펴보았습니다."],
    ja: ["お送りいただいた応募書類と作品を拝見しました。", "{F}の分野でお送りいただいた応募書類と作品を拝見しました。"],
    en: ["We've had a good look at your application and your work,", "We've had a good look at your {F} application and your work,"],
  },
  reject: {
    ko: ["먼저 RIF STUDIO에 관심을 가져 주시고,", "먼저 {F} 분야로 RIF STUDIO에 지원해 주시고,"],
    ja: ["RIF STUDIOに関心をお寄せいただき、", "{F}の分野でRIF STUDIOにご応募いただき、"],
    en: ["thank you so much for your interest in RIF STUDIO", "thank you so much for applying to RIF STUDIO for {F}"],
  },
  hire: {
    ko: ["이제 RIF STUDIO와 함께하게 되었어요!", "이제 {F} 분야로 RIF STUDIO와 함께하게 되었어요!"],
    ja: ["今日からRIF STUDIOの仲間です！", "今日から{F}分野でRIF STUDIOの仲間です！"],
    en: ["You're officially part of RIF STUDIO!", "You're officially part of RIF STUDIO, joining us for {F}!"],
  },
};
const ORDER = ["ko", "ja", "en"];
const bare = (s: string) => s.replace(/^\s*(\[RIF STUDIO\]|【RIF STUDIO】)\s*/, "");
// inner: 본문+서명 HTML (바깥 div 없이). 발송할 때 바깥 div 안에 읽음 확인 픽셀을 넣어요.
export function render(type: string, lang: string, rawName: string, fields: unknown = "", other: unknown = "") {
  const langs = lang === "multi" ? ORDER : [lang];
  // 지원 분야 문장 반영 (분야 정보가 없으면 원문 그대로)
  const para = (l: string): string[][] => {
    const f = fieldText(l, fields, other), rp = REPL[type]?.[l];
    if (!f || !rp) return TPL[type][l];
    return TPL[type][l].map((p) => p.map((s) => (s.includes(rp[0]) ? s.replace(rp[0], rp[1].replace("{F}", f)) : s)));
  };
  const block = (l: string) =>
    para(l).map((p) => `<p>${p.map((s) => esc(s).replace(/\{N\}/g, esc(rawName))).join("<br>")}</p>`).join("");
  const textBlock = (l: string) => para(l).map((p) => p.map((s) => s.replace(/\{N\}/g, rawName)).join("\n")).join("\n\n");
  const HR = `<hr style="border:0;border-top:1px dashed #c9c5d3;margin:26px 0">`;
  const open = `<div style="font-family:'Noto Sans KR','Noto Sans JP','Hiragino Sans',Arial,sans-serif;font-size:15px;line-height:1.75;color:#1d1b22;max-width:600px">`;
  const inner = langs.map(block).join(HR) + SIG;
  const text = langs.map(textBlock).join("\n\n----------\n\n") + "\n\nRIF STUDIO\nPANGYO / TOKYO / NEW YORK\nhttps://rif-studio.com";
  const subject = lang === "multi" ? "[RIF STUDIO] " + ORDER.map((l) => bare(SUBJ[type][l])).join(" / ") : SUBJ[type][lang];
  return { open, inner, html: open + inner + "</div>", text, subject };
}
