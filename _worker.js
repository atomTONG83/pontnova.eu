const SESSION_COOKIE = "pn_workbench_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const WORKBENCH_PREFIX = "/workbench";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/workbench") {
      return redirect(`${url.origin}/workbench/`);
    }

    if (path === "/workbench/login" && request.method === "GET") {
      if (await hasValidSession(request, env)) {
        return redirect(`${url.origin}/workbench/`);
      }
      return loginPage();
    }

    if (path === "/workbench/api/login" && request.method === "POST") {
      return handleLogin(request, env);
    }

    if (path === "/workbench/api/logout" && request.method === "POST") {
      return redirect(`${url.origin}/workbench/login`, {
        "Set-Cookie": clearSessionCookie(request),
      });
    }

    if (path === "/workbench/" || path === "/workbench/index.html") {
      if (!(await hasValidSession(request, env))) {
        return redirect(`${url.origin}/workbench/login`);
      }
      const response = await env.ASSETS.fetch(request);
      return withPrivateHeaders(response);
    }

    if (path.startsWith(`${WORKBENCH_PREFIX}/api/`)) {
      return new Response("Not found", { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleLogin(request, env) {
  const url = new URL(request.url);
  const form = await request.formData();
  const password = String(form.get("password") || "");

  if (!(await passwordMatches(password, env))) {
    return loginPage("口令不正确，请再试一次。", 401);
  }

  const token = await signSession(env);
  return redirect(`${url.origin}/workbench/`, {
    "Set-Cookie": sessionCookie(token, request),
  });
}

function redirect(location, headers = {}) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      ...headers,
    },
  });
}

async function passwordMatches(input, env) {
  const expectedHash = env.PONTNOVA_WORKBENCH_PASSWORD_SHA256;
  const expectedPassword = env.PONTNOVA_WORKBENCH_PASSWORD;

  if (expectedHash) {
    const inputHash = await sha256Hex(input);
    return timingSafeEqual(inputHash, expectedHash.toLowerCase());
  }

  if (expectedPassword) {
    return timingSafeEqual(input, expectedPassword);
  }

  return false;
}

async function signSession(env) {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = crypto.randomUUID();
  const payload = `${expiry}.${nonce}`;
  const signature = await hmac(payload, sessionSecret(env));
  return `${payload}.${signature}`;
}

async function hasValidSession(request, env) {
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const token = cookies[SESSION_COOKIE];
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [expiry, nonce, signature] = parts;
  if (!expiry || !nonce || Number(expiry) < Math.floor(Date.now() / 1000)) return false;

  const expected = await hmac(`${expiry}.${nonce}`, sessionSecret(env));
  return timingSafeEqual(signature, expected);
}

function sessionSecret(env) {
  return env.PONTNOVA_WORKBENCH_SESSION_SECRET || env.PONTNOVA_WORKBENCH_PASSWORD || "pontnova-local-dev-only";
}

async function hmac(payload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64Url(signature);
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64Url(buffer) {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function parseCookies(header) {
  return Object.fromEntries(
    header
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const index = cookie.indexOf("=");
        return [cookie.slice(0, index), decodeURIComponent(cookie.slice(index + 1))];
      })
  );
}

function sessionCookie(token, request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/workbench; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/workbench; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] || 0) ^ (right[index] || 0);
  }
  return diff === 0;
}

function withPrivateHeaders(response) {
  const next = new Response(response.body, response);
  next.headers.set("Cache-Control", "no-store");
  next.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet, noimageindex");
  next.headers.set("X-Frame-Options", "DENY");
  next.headers.set("X-Content-Type-Options", "nosniff");
  return next;
}

function loginPage(message = "", status = 200) {
  return new Response(
    `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">
  <title>Pontnova 工作台登录</title>
  <style>
    :root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; color-scheme: light; }
    * { box-sizing: border-box; }
    body { display: grid; min-height: 100vh; margin: 0; place-items: center; background: #f6f3ee; color: #202426; }
    main { width: min(420px, calc(100vw - 32px)); border: 1px solid #d9d2c4; border-radius: 8px; padding: 28px; background: #fffefa; box-shadow: 0 18px 50px rgba(30,32,34,.12); }
    .mark { display: grid; width: 44px; height: 44px; place-items: center; margin-bottom: 18px; border-radius: 8px; background: #161b1d; color: #fffefa; font-weight: 800; }
    h1 { margin: 0 0 8px; font-size: 26px; letter-spacing: 0; }
    p { margin: 0 0 22px; color: #697176; line-height: 1.6; }
    label { display: grid; gap: 8px; color: #697176; font-size: 13px; font-weight: 700; }
    input { width: 100%; height: 44px; border: 1px solid #d9d2c4; border-radius: 8px; padding: 0 12px; font: inherit; outline: none; }
    input:focus { border-color: #006d77; box-shadow: 0 0 0 3px rgba(0,109,119,.14); }
    button { width: 100%; height: 44px; margin-top: 16px; border: 0; border-radius: 8px; background: #006d77; color: #fff; font: inherit; font-weight: 800; cursor: pointer; }
    .error { margin-bottom: 12px; border: 1px solid rgba(164,66,83,.28); border-radius: 8px; padding: 10px 12px; background: rgba(164,66,83,.08); color: #a64253; }
  </style>
</head>
<body>
  <main>
    <div class="mark">PN</div>
    <h1>Pontnova 工作台</h1>
    <p>请输入内部口令进入项目台。</p>
    ${message ? `<div class="error">${escapeHtml(message)}</div>` : ""}
    <form action="/workbench/api/login" method="post">
      <label>口令
        <input name="password" type="password" autocomplete="current-password" required autofocus>
      </label>
      <button type="submit">登录</button>
    </form>
  </main>
</body>
</html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}
