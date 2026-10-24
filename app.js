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

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  }
  function write() {
    try { localStorage.setItem(KEY, JSON.stringify(meals)); } catch { /* Speicher voll/gesperrt */ }
  }

  // Vorschläge: bisherige Gerichte, gefiltert nach Eingabe; Gerichte der Vorwoche zuerst, dann zuletzt genutzte
  function suggest(query, ownKey) {
    const last = new Map();
    for (const [k, m] of Object.entries(meals)) {
      if (k !== ownKey && (!last.has(m) || k > last.get(m))) last.set(m, k);
    }
    const prev = new Set();
    for (let i = 1; i <= 7; i++) { const m = meals[iso(addDays(start, -i))]; if (m) prev.add(m); }
    const q = query.trim().toLowerCase();
    return [...last.keys()]
      .filter(m => m.toLowerCase() !== q && (!q || m.toLowerCase().includes(q)))
      .sort((a, b) => (prev.has(b) - prev.has(a)) || last.get(b).localeCompare(last.get(a)))
      .slice(0, 15);
  }

  function fillChips(box, input, key) {
    const items = suggest(input.value, key);
    box.textContent = '';
    for (const m of items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = m;
      box.append(b);
    }
    box.hidden = !items.length || document.activeElement !== input;
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
        `<input id="m${i}" type="text" autocomplete="off" autocapitalize="sentences" enterkeyhint="done" placeholder="Gericht"></div>` +
        `<div class="chips" hidden></div>`;
      const input = li.querySelector('input'), box = li.querySelector('.chips');
      input.value = meals[key] || '';

      const commit = () => {
        const v = input.value.trim();
        if (v) meals[key] = v; else delete meals[key];
        write();
      };
      input.addEventListener('input', () => { commit(); fillChips(box, input, key); });
      input.addEventListener('focus', () => fillChips(box, input, key));
      input.addEventListener('blur', () => setTimeout(() => { box.hidden = true; }, 150));
      input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
      box.addEventListener('mousedown', e => e.preventDefault()); // Fokus behalten
      box.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        input.value = b.textContent;
        commit();
        input.blur();
      });
      list.append(li);
    }
  }

  $('prev').onclick = () => { start = addDays(start, -7); render(); };
  $('next').onclick = () => { start = addDays(start, 7); render(); };
  $('jump').onclick = () => { start = addDays(thisWeek(), 7); render(); };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && document.activeElement?.tagName !== 'INPUT') render();
  });

  render();
  navigator.storage?.persist?.().catch(() => {});
  if ('serviceWorker' in navigator) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
