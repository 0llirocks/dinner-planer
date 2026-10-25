(() => {
  'use strict';
  const KEY = 'abendbrot.v1'; // { "YYYY-MM-DD": "Gericht" }
  const fmtDow = new Intl.DateTimeFormat('de-DE', { weekday: 'long' });
  const fmtShort = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' });
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  // Wochenstart = Dienstag (getDay: So=0 ... Di=2)
  const weekStart = d => addDays(d, -((d.getDay() + 5) % 7));
  const thisWeek = () => weekStart(new Date());

  let meals = read();
  let start = addDays(thisWeek(), 7); // Start: nächste Woche

  const $ = id => document.getElementById(id);
  const list = $('days');
  // Textfeld wächst mit dem Inhalt, damit lange Gerichte vollständig lesbar sind
  const autosize = el => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  }
  function write() {
    try { localStorage.setItem(KEY, JSON.stringify(meals)); } catch { /* Speicher voll/gesperrt */ }
  }

  // Vorschläge nur beim Tippen: bisherige Gerichte, die zur Eingabe passen.
  // Reihenfolge: Treffer am Wortanfang, Gerichte der Vorwoche, zuletzt verwendete.
  function suggest(query, ownKey) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const last = new Map();
    for (const [k, m] of Object.entries(meals)) {
      if (k !== ownKey && (!last.has(m) || k > last.get(m))) last.set(m, k);
    }
    const prev = new Set();
    for (let i = 1; i <= 7; i++) { const m = meals[iso(addDays(start, -i))]; if (m) prev.add(m); }
    const rank = m => (m.toLowerCase().startsWith(q) ? 2 : 0) + (prev.has(m) ? 1 : 0);
    return [...last.keys()]
      .filter(m => m.toLowerCase() !== q && m.toLowerCase().includes(q))
      .sort((a, b) => (rank(b) - rank(a)) || last.get(b).localeCompare(last.get(a)))
      .slice(0, 6);
  }

  function fillMenu(box, input, key) {
    const items = suggest(input.value, key);
    box.textContent = '';
    for (const m of items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = m;
      box.append(b);
    }
    box.hidden = !items.length || document.activeElement !== input;
    if (box.hidden) return;
    // Dropdown unter dem Textfeld, in dessen Breite; bei wenig Platz (Tastatur) darüber
    const r = input.getBoundingClientRect();
    const vv = window.visualViewport;
    const bottom = vv ? vv.offsetTop + vv.height : innerHeight;
    const up = bottom - r.bottom < Math.min(items.length * 44 + 2, 280) + 8;
    box.style.left = r.left + 'px';
    box.style.width = r.width + 'px';
    box.style.top = up ? 'auto' : r.bottom + 4 + 'px';
    box.style.bottom = up ? innerHeight - r.top + 4 + 'px' : 'auto';
  }

  function render() {
    const today = iso(new Date());
    const diff = Math.round((start - thisWeek()) / 604800000);
    $('title').textContent = diff === 0 ? 'Diese Woche' : diff === 1 ? 'Nächste Woche'
      : diff === -1 ? 'Letzte Woche' : diff > 0 ? `In ${diff} Wochen` : `Vor ${-diff} Wochen`;
    $('sub').textContent = `${fmtShort.format(start)} – ${fmtShort.format(addDays(start, 6))}`;
    $('jump').hidden = diff === 1;
    list.textContent = '';

    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i), key = iso(d);
      const li = document.createElement('li');
      li.className = 'day' + (key === today ? ' today' : '');
      li.innerHTML = `<div class="row"><label class="dow" for="m${i}">${fmtDow.format(d)}<small>${fmtShort.format(d)}</small></label>` +
        `<div class="field"><textarea id="m${i}" rows="1" autocomplete="off" autocapitalize="sentences" enterkeyhint="${i < 6 ? 'next' : 'done'}" placeholder="Gericht"></textarea>` +
        `<div class="menu" hidden></div></div></div>`;
      const input = li.querySelector('textarea'), box = li.querySelector('.menu');
      input.value = meals[key] || '';

      const commit = () => {
        const v = input.value.trim();
        if (v) meals[key] = v; else delete meals[key];
        write();
      };
      // Weiter zum nächsten Tag (Tastatur bleibt offen); nach dem letzten Tag schließt sie
      const next = () => { const n = $('m' + (i + 1)); if (n) n.focus(); else input.blur(); };
      input.addEventListener('input', () => {
        if (input.value.includes('\n')) input.value = input.value.replace(/\s*\n+\s*/g, ' ');
        autosize(input);
        commit();
        fillMenu(box, input, key);
      });
      input.addEventListener('blur', () => setTimeout(() => { box.hidden = true; }, 150));
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); next(); } });
      box.addEventListener('mousedown', e => e.preventDefault()); // Fokus behalten
      box.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        input.value = b.textContent;
        autosize(input);
        commit();
        box.hidden = true;
        next();
      });
      list.append(li);
      autosize(input);
    }
  }

  $('prev').onclick = () => { start = addDays(start, -7); render(); };
  $('next').onclick = () => { start = addDays(start, 7); render(); };
  $('jump').onclick = () => { start = addDays(thisWeek(), 7); render(); };
  addEventListener('resize', () => list.querySelectorAll('textarea').forEach(autosize));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && document.activeElement?.tagName !== 'TEXTAREA') render();
  });

  render();
  navigator.storage?.persist?.().catch(() => {});
  if ('serviceWorker' in navigator) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
