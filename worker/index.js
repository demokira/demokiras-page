// dk-counter — Cloudflare Worker: visitor counter (plain text).
// Deploy: npx wrangler kv namespace create COUNTER  -> paste id into wrangler.toml
//         npx wrangler deploy
// The page fetches <workers-url>/counter and renders the number with its own CSS.

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    if (url.pathname !== "/counter") {
      return new Response("not found", { status: 404 });
    }

    var ip = request.headers.get("CF-Connecting-IP") || "unknown";
    var today = new Date().toISOString().slice(0, 10);
    var seenKey = "seen:" + today + ":" + ip;
    var exp = 60 * 60 * 24 * 2; // keep dedupe key 2 days

    if (!(await env.COUNTER.get(seenKey))) {
      await env.COUNTER.put(seenKey, "1", { expirationTtl: exp });
      var total = (parseInt(await env.COUNTER.get("total")) || 0) + 1;
      var todays = (parseInt(await env.COUNTER.get("today")) || 0) + 1;
      await env.COUNTER.put("total", String(total));
      await env.COUNTER.put("today", String(todays), { expirationTtl: exp });
    }

    var total = parseInt(await env.COUNTER.get("total")) || 0;
    return new Response(String(total).padStart(7, "0"), {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "access-control-allow-origin": "*",
        "cache-control": "no-store"
      }
    });
  }
};
