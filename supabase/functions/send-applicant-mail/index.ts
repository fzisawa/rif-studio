import { createClient } from "npm:@supabase/supabase-js@2";
import { render, langOf } from "./render.ts";

// 지원자 메일: support@ 이름으로 나가고, 버튼을 누른 사람(경영지원팀·대표)의 '보낸 편지함'에 기록돼요.
// 숨은참조(bcc) 없이 보내고, 읽음 여부는 mail-open 픽셀로 보낸 편지함에 표시돼요.
const FROM = "RIF STUDIO <support@rif-studio.com>";
const SUPPORT = "support@rif-studio.com";
const OPEN_URL = "https://noqtyhmgdfzziymfclnx.supabase.co/functions/v1/mail-open";
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
    const URL_ = Deno.env.get("SUPABASE_URL")!;
    const sb = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const auth = req.headers.get("Authorization") || "";
    const { data: u, error: ue } = await sb.auth.getUser(auth.replace(/^Bearer /i, ""));
    const email = (u?.user?.email || "").toLowerCase();
    if (ue || !email) return json({ error: "로그인이 필요해요" }, 401);
    // 권한: 경영지원팀 또는 대표 (DB의 is_mgmt를 로그인한 사람 기준으로 확인)
    const asUser = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: ok } = await asUser.rpc("is_mgmt");
    if (!ok) return json({ error: "경영지원팀·대표만 보낼 수 있어요" }, 403);

    const b = await req.json().catch(() => ({}));
    const type = String(b.type || "");
    const col = COL[type];
    if (!col) return json({ error: "알 수 없는 메일 종류예요" }, 400);
    const id = String(b.id || "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "지원서 ID가 올바르지 않아요" }, 400);

    const { data: r, error: re } = await sb.from("join_requests").select("*").eq("id", id).single();
    if (re || !r) return json({ error: "지원서를 찾을 수 없어요" }, 404);
    if (r[col]) return json({ error: "이미 이 메일을 보낸(체크된) 지원자예요" }, 409);
    const to = String(r.email || "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return json({ error: "지원자 이메일 주소가 올바르지 않아요" }, 400);
    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) return json({ error: "메일 서비스(Resend) 키가 설정되지 않았어요" }, 503);

    const { data: st } = await sb.from("mail_staff").select("name").ilike("email", email).maybeSingle();
    const author = String(st?.name || email.split("@")[0]);
    const lang = langOf(r.region);
    const m = render(type, lang, String(r.nickname || r.name || to.split("@")[0]));

    const { data: row, error: ie } = await sb.from("mail_outbox").insert({
      sender: SUPPORT, sender_name: "support@ (공용)", author_email: email, author_name: author,
      to_email: to, subject: m.subject, body: m.text, body_html: m.inner,
    }).select("id,token").single();
    if (ie || !row) { console.error(ie); return json({ error: "보낸 편지함 기록을 만들지 못했어요" }, 500); }

    const pixel = `<img src="${OPEN_URL}?t=${row.token}" width="1" height="1" alt="" style="width:1px;height:1px;border:0">`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], reply_to: SUPPORT, subject: m.subject, html: m.open + m.inner + pixel + "</div>", text: m.text }),
    });
    if (!res.ok) {
      console.error("resend", res.status, await res.text().catch(() => ""));
      await sb.from("mail_outbox").delete().eq("id", row.id);
      return json({ error: "메일 발송에 실패했어요 (" + res.status + ")" }, 502);
    }
    const rj = await res.json().catch(() => ({}));
    if (rj?.id) await sb.from("mail_outbox").update({ resend_id: rj.id }).eq("id", row.id);
    const { error: me } = await sb.rpc("jr_mark_mail", { p_id: id, p_field: col });
    if (me) { console.error(me); return json({ ok: true, lang, warn: "메일은 보냈지만 체크 표시를 저장하지 못했어요" }); }
    return json({ ok: true, lang });
  } catch (e) {
    console.error(e);
    return json({ error: "서버 오류가 났어요" }, 500);
  }
});
