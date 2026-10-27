// Cloudflare Worker: static site (assets) + /api/don-hang which hands out sequential order numbers for Flashcards (SY0001, SY0002…).
export class OrderCounter {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(req) {
    const info = await req.json().catch(() => ({}));
    const so = ((await this.ctx.storage.get('so')) || 0) + 1;
    await this.ctx.storage.put('so', so);
    await this.ctx.storage.put('don-' + so, { t: new Date().toISOString(), deck: String(info.deck || '').slice(0, 120), type: info.type === 'hard' ? 'hard' : 'pdf' });
    return Response.json({ so });
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/don-hang') {
      if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      const stub = env.ORDERS.get(env.ORDERS.idFromName('flashcards'));
      const r = await stub.fetch('https://do/next', { method: 'POST', body: await req.text() });
      return new Response(r.body, { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
    }
    return env.ASSETS.fetch(req);
  }
};
