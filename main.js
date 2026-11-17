/* RIF Intranet 데스크톱 앱 (Windows · Mac)
   - rif-studio.com/intranet/ 을 그대로 띄워요. 기능은 사이트에서 고치면 앱에도 바로 반영돼요.
   - 음성 채팅용 마이크 · 알림은 우리 사이트에서만 허용해요.
   - 창을 닫아도 뒤에서 켜져 있어서 메일 · 채팅 · 통화 알림을 받아요 (완전히 끄려면 트레이/Dock 메뉴의 '종료'). */
const { app, BrowserWindow, shell, session, Menu, Tray, nativeImage, systemPreferences } = require("electron");
const path = require("path");
const fs = require("fs");

const HOME = "https://rif-studio.com/intranet/";
const OK_HOSTS = new Set(["rif-studio.com", "www.rif-studio.com", "noqtyhmgdfzziymfclnx.supabase.co"]);
const isOurs = (u) => { try { const x = new URL(u); return x.protocol === "https:" && OK_HOSTS.has(x.hostname); } catch { return false; } };
const isSite = (u) => { try { const x = new URL(u); return x.protocol === "https:" && (x.hostname === "rif-studio.com" || x.hostname === "www.rif-studio.com"); } catch { return false; } };

let win = null, tray = null, quitting = false, lastCount = 0;
const stateFile = () => path.join(app.getPath("userData"), "window.json");
const loadState = () => { try { return JSON.parse(fs.readFileSync(stateFile(), "utf8")); } catch { return {}; } };
const saveState = () => { try { if (win && !win.isMinimized() && !win.isMaximized()) fs.writeFileSync(stateFile(), JSON.stringify({ ...win.getBounds(), max: false })); else if (win) fs.writeFileSync(stateFile(), JSON.stringify({ ...loadState(), max: win.isMaximized() })); } catch {} };

if (!app.requestSingleInstanceLock()) { app.quit(); }
app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
app.setAppUserModelId("com.rifstudio.intranet");

function createWindow() {
  const st = loadState();
  win = new BrowserWindow({
    width: st.width || 1280, height: st.height || 860, x: st.x, y: st.y, minWidth: 900, minHeight: 600,
    title: "RIF Intranet", backgroundColor: "#f8f7f4", autoHideMenuBar: true, show: false,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, backgroundThrottling: false, spellcheck: false },
  });
  if (st.max) win.maximize();
  win.webContents.setUserAgent(win.webContents.getUserAgent() + " RIFIntranetDesktop/" + app.getVersion());
  win.once("ready-to-show", () => win.show());
  win.loadURL(HOME);

  // 우리 사이트가 아닌 링크는 기본 브라우저로
  win.webContents.setWindowOpenHandler(({ url }) => { if (isSite(url) && new URL(url).pathname.startsWith("/intranet")) { win.loadURL(url); } else { shell.openExternal(url); } return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { if (!isOurs(url)) { e.preventDefault(); shell.openExternal(url); } });

  // 인터넷이 끊겼을 때 안내 화면
  win.webContents.on("did-fail-load", (_e, code, _d, url, isMain) => { if (isMain && code !== -3) win.loadFile(path.join(__dirname, "offline.html"), { query: { u: url || HOME } }); });

  // 안 읽은 메일 숫자: 페이지 제목 "(3) Intranet · RIF STUDIO" → Dock 숫자 / 작업표시줄 빨간 점
  win.on("page-title-updated", (_e, title) => {
    const n = Number((String(title).match(/^\((\d+)\)/) || [])[1] || 0);
    if (process.platform === "darwin") app.setBadgeCount(n);
    else win.setOverlayIcon(n ? nativeImage.createFromPath(path.join(__dirname, "badge.png")) : null, n ? "안 읽은 메일 " + n + "통" : "");
    if (n > lastCount && !win.isFocused()) win.flashFrame(true);
    lastCount = n;
  });
  win.on("focus", () => win.flashFrame(false));

  // 창을 닫으면 숨기기 (뒤에서 알림 · 통화 받기)
  win.on("close", (e) => { saveState(); if (!quitting) { e.preventDefault(); win.hide(); } });
  win.on("resize", saveState); win.on("move", saveState);
}

function setupPermissions() {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler(async (wc, perm, cb, details) => {
    const origin = details && (details.requestingUrl || details.securityOrigin) || wc.getURL();
    if (!isSite(origin)) return cb(false);
    if (perm === "media") {
      const audioOnly = !details.mediaTypes || details.mediaTypes.every((t) => t === "audio");
      if (!audioOnly) return cb(false);
      if (process.platform === "darwin") { try { const ok = await systemPreferences.askForMediaAccess("microphone"); return cb(ok); } catch { return cb(false); } }
      return cb(true);
    }
    cb(["notifications", "clipboard-sanitized-write", "fullscreen"].includes(perm));
  });
  ses.setPermissionCheckHandler((_wc, perm, origin) => isSite(origin) && ["media", "notifications", "clipboard-sanitized-write"].includes(perm));
}

function setupMenu() {
  const isMac = process.platform === "darwin";
  const tpl = [
    ...(isMac ? [{ role: "appMenu", label: "RIF Intranet" }] : []),
    { label: "편집", submenu: [{ role: "undo", label: "실행 취소" }, { role: "redo", label: "다시 실행" }, { type: "separator" }, { role: "cut", label: "잘라내기" }, { role: "copy", label: "복사" }, { role: "paste", label: "붙여넣기" }, { role: "selectAll", label: "모두 선택" }] },
    { label: "보기", submenu: [{ label: "인트라넷 처음으로", accelerator: "CmdOrCtrl+Shift+H", click: () => win && win.loadURL(HOME) }, { role: "reload", label: "새로고침" }, { type: "separator" }, { role: "zoomIn", label: "크게" }, { role: "zoomOut", label: "작게" }, { role: "resetZoom", label: "원래 크기" }, { type: "separator" }, { role: "togglefullscreen", label: "전체 화면" }] },
    { label: "창", submenu: [{ role: "minimize", label: "최소화" }, ...(isMac ? [{ role: "front" }] : [{ label: "종료", accelerator: "Ctrl+Q", click: () => { quitting = true; app.quit(); } }])] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tpl));
}

function setupTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, "build", "icon.png")).resize({ width: process.platform === "darwin" ? 18 : 16, height: process.platform === "darwin" ? 18 : 16 });
  tray = new Tray(icon);
  tray.setToolTip("RIF Intranet");
  const show = () => { if (!win) createWindow(); win.show(); win.focus(); };
  tray.setContextMenu(Menu.buildFromTemplate([{ label: "열기", click: show }, { type: "separator" }, { label: "종료", click: () => { quitting = true; app.quit(); } }]));
  tray.on("click", show);
}

app.whenReady().then(() => {
  setupPermissions();
  setupMenu();
  createWindow();
  setupTray();
  app.on("activate", () => { if (win) { win.show(); win.focus(); } else createWindow(); });
});
app.on("before-quit", () => { quitting = true; saveState(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
