// Cloudflare Worker: static site (assets) + Flashcards orders.
//   POST /api/don-hang              new order → { so, token }   (order codes SY0001, SY0002…)
//   GET  /api/don-hang?so=&t=       buyer polls; once chị marks it paid, a PDF order also gets the file key
//   POST /api/don-hang/info         buyer presses "Tôi đã chuyển khoản" (hard cards: with name / phone / address) → e-mail to chị
//   POST /api/quan-ly/*             chị's admin page /quan-ly-don/ (login, list, set status, set her own short password)
// PDFs sit encrypted in /tai-ve/ (see files.js); keys are unwrapped at chị's login and kept in the Durable Object.
import { PW_HASH, FILES } from './files.js';
import { EmailMessage } from 'cloudflare:email';

const PDF_PER_CARD = 3000, HARD_PER_CARD = 6000;
const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const sha = (s) => crypto.subtle.digest('SHA-256', enc.encode(s));
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
const rand = () => hex(crypto.getRandomValues(new Uint8Array(16)));
const json = (d, status = 200) => Response.json(d, { status, headers: { 'cache-control': 'no-store' } });
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
// orders made before slugs were stored only have the deck title
const slugOf = (o) => o.slug || Object.keys(FILES).find((k) => o.deck && FILES[k].title === o.deck) || '';

export class OrderCounter {
  constructor(ctx) { this.ctx = ctx; this.s = ctx.storage; }

  async order(so) { return (await this.s.get('don-' + so)) || null; }

  async fetch(req) {
    const url = new URL(req.url), p = url.pathname;
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};

    if (p === '/new') {
      const so = ((await this.s.get('so')) || 0) + 1;
      const slug = FILES[body.slug] ? body.slug : '';
      const type = body.type === 'hard' ? 'hard' : 'pdf';
      const qty = type === 'hard' ? Math.min(20, Math.max(1, parseInt(body.qty) || 1)) : 1;
      const cards = slug ? FILES[slug].cards : 0;
      const o = { so, t: new Date().toISOString(), slug, deck: str(body.deck, 120), type, qty,
        amount: cards * qty * (type === 'hard' ? HARD_PER_CARD : PDF_PER_CARD), status: 'cho', token: rand() };
      await this.s.put({ so, ['don-' + so]: o });
      return json({ so, token: o.token });
    }

    if (p === '/status' || p === '/info') {
      const so = parseInt(p === '/status' ? url.searchParams.get('so') : body.so);
      const o = await this.order(so);
      const t = p === '/status' ? url.searchParams.get('t') : body.t;
      if (!o || !o.token || o.token !== t) return json({ error: 'not found' }, 404);
      if (p === '/info') {
        if (o.type === 'hard') Object.assign(o, { qty: Math.min(20, Math.max(1, parseInt(body.qty) || o.qty || 1)), ten: str(body.ten, 100), sdt: str(body.sdt, 30), dc: str(body.dc, 300) });
        if (o.type === 'hard' && o.slug) o.amount = FILES[o.slug].cards * o.qty * HARD_PER_CARD;
        const first = !o.bao;
        o.bao = new Date().toISOString();
        await this.s.put('don-' + so, o);
        return json({ ok: true, notify: first ? o : null });
      }
      return json({ status: o.status, file: await this.file(o) });
    }

    // ---- admin ----
    if (p === '/login') {
      // master password (hash in files.js) also unwraps the PDF keys; chị's own short password lives only in this DO
      const now = Date.now(), pw = str(body.pw, 100);
      const lock = (await this.s.get('lock')) || { n: 0, until: 0 };
      const fail = async () => {
        lock.n++; if (lock.n >= 8) { lock.until = now + 15 * 60e3; lock.n = 0; }
        await this.s.put('lock', lock); return json({ error: 'sai mật khẩu' }, 403);
      };
      const put = {};
      if (hex(await sha('sophia-pw:' + pw)) === PW_HASH) {
        const kek = await crypto.subtle.importKey('raw', await sha('sophia-kek:' + pw), 'AES-GCM', false, ['decrypt']);
        const keys = {};
        for (const [slug, f] of Object.entries(FILES)) {
          keys[slug] = b64(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(f.wiv) }, kek, unb64(f.wkey)));
        }
        put.keys = keys;
      } else {
        if (lock.until > now) return json({ error: 'khoa' }, 429); // only the short password is locked out
        const pw2 = await this.s.get('pw2');
        if (!pw2 || hex(await sha(pw2.salt + ':' + pw)) !== pw2.hash) return fail();
      }
      const sess = (await this.s.get('sessions')) || {};
      const id = rand();
      for (const k in sess) if (sess[k] < now) delete sess[k];
      sess[id] = now + 90 * 864e5;
      await this.s.put({ ...put, sessions: sess, lock: { n: 0, until: 0 } });
      return json({ session: id });
    }
    const sess = (await this.s.get('sessions')) || {};
    if (!body.session || !(sess[body.session] > Date.now())) return json({ error: 'cần đăng nhập' }, 401);

    if (p === '/list') {
      const n = (await this.s.get('so')) || 0;
      const map = await this.s.list({ prefix: 'don-' });
      const orders = [...map.values()].map((o) => ({ ...o, slug: slugOf(o), status: o.status || 'cho',
        amount: o.amount || (slugOf(o) ? FILES[slugOf(o)].cards * (o.type === 'hard' ? HARD_PER_CARD : PDF_PER_CARD) : 0) }));
      orders.sort((a, b) => b.so - a.so);
      return json({ total: n, orders });
    }
    if (p === '/setpw') {
      const pw = str(body.pw, 100).trim();
      if (pw.length < 6) return json({ error: 'ngắn quá' }, 400);
      const salt = rand();
      await this.s.put('pw2', { salt, hash: hex(await sha(salt + ':' + pw)) });
      return json({ ok: true });
    }
    if (p === '/set') {
      const o = await this.order(parseInt(body.so));
      if (!o) return json({ error: 'not found' }, 404);
      if (!['cho', 'da-tra', 'da-gui', 'huy'].includes(body.status)) return json({ error: 'bad status' }, 400);
      o.status = body.status; o.slug = slugOf(o);
      if (!o.token) o.token = rand();
      if (body.status === 'da-tra' && !o.paid) o.paid = new Date().toISOString();
      await this.s.put('don-' + o.so, o);
      return json({ ok: true, token: o.token });
    }
    return json({ error: 'not found' }, 404);
  }

  async file(o) {
    if (o.type !== 'pdf' || !['da-tra', 'da-gui'].includes(o.status) || !FILES[o.slug]) return null;
    const keys = (await this.s.get('keys')) || {};
    if (!keys[o.slug]) return null;
    const f = FILES[o.slug];
    return { parts: f.parts, iv: f.iv, key: keys[o.slug], name: f.name };
  }
}

// e-mail chị when a buyer presses "Tôi đã chuyển khoản" (needs the MAIL send_email binding + Cloudflare Email Routing)
const vnd = (n) => String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đồng';
const mimeWord = (s) => '=?UTF-8?B?' + b64(enc.encode(s)) + '?=';
async function mail(env, o) {
  if (!env.MAIL) return;
  const code = 'SY' + String(o.so).padStart(4, '0'), hard = o.type === 'hard';
  const text = [`Khách báo đã chuyển khoản đơn ${code}.`, '',
    `Bộ thẻ: ${o.deck}`, `Loại: ${hard ? 'Thẻ cứng, ' + o.qty + ' bộ' : 'Thẻ PDF'}`, `Số tiền: ${vnd(o.amount)}`,
    ...(hard ? ['', `Người nhận: ${o.ten}`, `SĐT: ${o.sdt}`, `Địa chỉ: ${o.dc}`] : []), '',
    `Kiểm tra app Techcombank có tiền về với nội dung ${code}, rồi mở trang quản lý để bấm "Đã nhận tiền":`,
    'https://sophiayogakids.com/quan-ly-don/'].join('\r\n');
  const raw = [`From: ${mimeWord('Sophia Yoga – Đơn hàng')} <don-hang@sophiayogakids.com>`, `To: ${env.MAIL_TO}`,
    `Subject: ${mimeWord(`💰 Đơn ${code} – ${hard ? 'thẻ cứng' : 'PDF'} ${vnd(o.amount)}`)}`, `Message-ID: <${rand()}@sophiayogakids.com>`,
    `Date: ${new Date().toUTCString()}`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '',
    b64(enc.encode(text)).replace(/.{76}/g, '$&\r\n')].join('\r\n');
  await env.MAIL.send(new EmailMessage('don-hang@sophiayogakids.com', env.MAIL_TO, raw)).catch((e) => console.log('mail failed', e));
}

const ROUTES = { 'POST /api/don-hang': '/new', 'GET /api/don-hang': '/status', 'POST /api/don-hang/info': '/info',
  'POST /api/quan-ly/login': '/login', 'POST /api/quan-ly/list': '/list', 'POST /api/quan-ly/set': '/set', 'POST /api/quan-ly/setpw': '/setpw' };

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      const route = ROUTES[req.method + ' ' + url.pathname];
      if (!route) return json({ error: 'not found' }, 404);
      const stub = env.ORDERS.get(env.ORDERS.idFromName('flashcards'));
      const r = await stub.fetch('https://do' + route + url.search, { method: req.method, body: req.method === 'POST' ? await req.text() : undefined });
      if (route !== '/info' || !r.ok) return r;
      const d = await r.json();
      if (d.notify) ctx.waitUntil(mail(env, d.notify));
      return json({ ok: true });
    }
    return env.ASSETS.fetch(req);
  }
};
