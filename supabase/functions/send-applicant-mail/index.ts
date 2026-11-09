import { createClient } from "npm:@supabase/supabase-js@2";
import { render, langOf } from "./render.ts";

const ADMIN = "takanashi@rif-studio.com";
const FROM = "RIF STUDIO <support@rif-studio.com>";
const REPLY_TO = "support@rif-studio.com";
const COL: Record<string, string> = { thanks: "mail_thanks", interview: "mail_interview", reject: "mail_reject", hire: "mail_hire" };
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer /i, "");
    const { data: u, error: ue } = await sb.auth.getUser(token);
    if (ue || (u.user?.email || "").toLowerCase() !== ADMIN) return json({ error: "관리자만 보낼 수 있어요" }, 401);

    const b = await req.json().catch(() => ({}));
    const type = String(b.type || "");
    const col = COL[type];
    if (!col) return json({ error: "알 수 없는 메일 종류예요" }, 400);
    const id = String(b.id || "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "지원서 ID가 올바르지 않아요" }, 400);

    const { data: r, error: re } = await sb.from("join_requests").select("*").eq("id", id).single();
    if (re || !r) return json({ error: "지원서를 찾을 수 없어요" }, 404);
    if (r[col]) return json({ error: "이미 이 메일을 보낸 지원자예요" }, 409);
    const to = String(r.email || "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return json({ error: "이메일 주소가 올바르지 않아요" }, 400);

    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) return json({ error: "메일 서비스(Resend) 키가 아직 설정되지 않았어요" }, 503);

    const lang = langOf(r.region);
    const { html, text, subject } = render(type, lang, String(r.nickname || r.name || to.split("@")[0]));
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], bcc: [REPLY_TO], reply_to: REPLY_TO, subject, html, text }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("resend", res.status, detail);
      return json({ error: "메일 발송에 실패했어요 (" + res.status + "). 도메인 인증과 API 키를 확인해 주세요" }, 502);
    }
    const { error: upe } = await sb.from("join_requests").update({ [col]: true }).eq("id", id);
    if (upe) return json({ ok: true, lang, warn: "메일은 보냈지만 체크 저장에 실패했어요" });
    return json({ ok: true, lang });
  } catch (e) {
    console.error(e);
    return json({ error: "서버 오류가 났어요" }, 500);
  }
});
