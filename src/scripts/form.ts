import { scrollToEl, $ } from './ctx';

/** Commissions form. Posts JSON to PUBLIC_FORM_ENDPOINT (see README). Without one, it pretends politely. */
const form = () => $<HTMLFormElement>('.form');

export function prefill(id: string, title: string, scroll = false) {
  const f = form();
  if (!f) return;
  const type = f.querySelector<HTMLSelectElement>('#f-type')!;
  const msg = f.querySelector<HTMLTextAreaElement>('#f-msg')!;
  type.value = 'buy';
  const line = `${f.dataset.about}: Pl. ${id.replace('pl-', '')}${title ? ` — ${title}` : ''}\n\n`;
  if (!msg.value.startsWith(line)) msg.value = line + msg.value;
  if (scroll) {
    scrollToEl($('#commissions')!, -40);
    setTimeout(() => f.querySelector<HTMLInputElement>('#f-name')?.focus({ preventScroll: true }), 900);
  }
}

export function initForm() {
  const f = form();
  if (!f) return;
  const status = f.querySelector<HTMLElement>('.form__status')!;
  const btn = f.querySelector<HTMLButtonElement>('.form__submit')!;
  const d = f.dataset;

  // ?enquire=pl-017 (from a Plate page)
  const q = new URLSearchParams(location.search).get('enquire');
  if (q) {
    const titles = JSON.parse(document.getElementById('page-data')?.textContent ?? '{}').titles ?? {};
    const t = titles[q] as string | undefined;
    prefill(q, t ?? '');
  }

  const fields = ['f-name', 'f-email', 'f-msg'].map((id) => f.querySelector<HTMLInputElement>(`#${id}`)!);
  const check = (el: HTMLInputElement) => {
    const box = el.closest('.field')!;
    const err = box.querySelector<HTMLElement>('.field__err')!;
    let msg = '';
    if (!el.value.trim()) msg = d.msgRequired!;
    else if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim())) msg = d.msgEmail!;
    err.textContent = msg;
    box.classList.toggle('is-invalid', !!msg);
    el.setAttribute('aria-invalid', String(!!msg));
    if (msg) el.setAttribute('aria-describedby', err.id); else el.removeAttribute('aria-describedby');
    return !msg;
  };
  fields.forEach((el) => el.addEventListener('blur', () => { if (el.value) check(el); }));

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bad = fields.filter((el) => !check(el));
    if (bad.length) { bad[0].focus(); return; }
    btn.classList.remove('is-sewing'); void btn.offsetWidth;
    btn.classList.add('is-sewing', 'is-sewn');
    btn.disabled = true;
    status.textContent = d.msgSending!;
    const data = Object.fromEntries(new FormData(f).entries());
    try {
      if ((data as any).company) throw new Error('bot');
      const endpoint = d.endpoint;
      if (endpoint) {
        const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ...data, lang: document.documentElement.lang }) });
        if (!r.ok) throw new Error(String(r.status));
      } else {
        // TODO: set PUBLIC_FORM_ENDPOINT (Formspree, Netlify Forms, your own API…). Until then nothing is sent.
        console.info('[commissions] No PUBLIC_FORM_ENDPOINT set — form data not sent:', data);
        await new Promise((r) => setTimeout(r, 900));
      }
      status.textContent = d.msgSent!;
      f.reset();
    } catch {
      status.textContent = d.msgError!;
      btn.classList.remove('is-sewn');
    } finally {
      btn.disabled = false;
    }
  });
}
