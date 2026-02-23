(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const chipsEl = $('#chips');
  const minutesInput = $('#minutesInput');
  const applyBtn = $('#applyBtn');
  const toggleBtn = $('#toggleBtn');
  const resetBtn = $('#resetBtn');
  const skipBtn = $('#skipBtn');

  const timeText = $('#timeText');
  const subText = $('#subText');
  const pctText = $('#pctText');
  const meterFill = $('#meterFill');
  const status = $('#status');
  const statusText = $('#statusText');

  const activityIcon = $('#activityIcon');
  const activityName = $('#activityName');

  const statsTitle = $('#statsTitle');
  const statToday = $('#statToday');
  const statTotal = $('#statTotal');
  const statMinutes = $('#statMinutes');
  const clearStatsBtn = $('#clearStats');

  const btnTheme = $('#btnTheme');
  const btnFocus = $('#btnFocus');
  const focusOverlay = $('#focusOverlay');
  const focusTime = $('#focusTime');
  const focusSub = $('#focusSub');
  const focusActivity = $('#focusActivity');

  const toast = $('#toast');

  const CIRC = 2 * Math.PI * 90; // r=90 => ~565.48
  const rings = document.querySelectorAll('.progress');

  const QUOTES = [
    '“Hazlo fácil: 1 bloque, 1 objetivo.”',
    '“Empieza mal, pero empieza.”',
    '“Un minuto cuenta. Luego otro.”',
    '“Menos tabs, más avance.”',
    '“Respira. Hazlo. Termina.”'
  ];

  const ACTIVITIES = [
    { id: 'trabajo', name: 'Trabajo', emoji: '🧠', minutes: 25, accent1: '#7c3aed', accent2: '#22d3ee' },
    { id: 'deporte', name: 'Deporte', emoji: '🏃', minutes: 30, accent1: '#22c55e', accent2: '#06b6d4' },
    { id: 'television', name: 'Televisión', emoji: '📺', minutes: 45, accent1: '#f97316', accent2: '#fb7185' },
    { id: 'ordenador', name: 'Ordenador', emoji: '💻', minutes: 20, accent1: '#60a5fa', accent2: '#a78bfa' },
  ];

  const STORAGE_KEY = 'focusflow.v1';
  const TODAY_KEY = () => new Date().toISOString().slice(0, 10);

  let state = loadState();
  let timer = {
    running: false,
    totalMs: state.totalMs ?? (25 * 60 * 1000),
    leftMs: state.leftMs ?? (25 * 60 * 1000),
    startedAt: null,
    raf: null,
    lastTick: 0,
    activityId: state.activityId ?? 'trabajo',
  };

  // ---------- Init ----------
  hydrateActivity(timer.activityId, false);
  renderAll();

  // Chips
  chipsEl.innerHTML = '';
  for (const a of ACTIVITIES) {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.dataset.id = a.id;
    btn.innerHTML = `
      <span class="emoji" aria-hidden="true">${a.emoji}</span>
      <span class="name">${a.name}</span>
      <span class="mins">${a.minutes} min</span>
    `;
    btn.addEventListener('click', () => selectActivity(a.id));
    chipsEl.appendChild(btn);
  }
  syncChips();

  // Actions
  applyBtn.addEventListener('click', applyMinutes);
  toggleBtn.addEventListener('click', toggle);
  resetBtn.addEventListener('click', reset);
  skipBtn.addEventListener('click', () => finish(true));

  clearStatsBtn.addEventListener('click', () => {
    if (!confirm('¿Borrar estadísticas de esta actividad?')) return;
    const id = timer.activityId;
    const s = loadState();
    if (s.stats?.[id]) delete s.stats[id];
    saveState(s);
    showToast('Estadísticas borradas.');
    renderStats();
  });

  btnTheme.addEventListener('click', toggleTheme);
  btnFocus.addEventListener('click', toggleFocus);

  document.addEventListener('keydown', (e) => {
    if (e.key === ' '){
      e.preventDefault();
      toggle();
    } else if (e.key.toLowerCase() === 'r'){
      reset();
    } else if (e.key.toLowerCase() === 't'){
      toggleTheme();
    } else if (e.key.toLowerCase() === 'f'){
      toggleFocus();
    } else if (e.key === 'Escape'){
      if (focusOverlay.classList.contains('show')) toggleFocus(false);
    } else if (e.key === 'Enter'){
      if (document.activeElement === minutesInput) applyMinutes();
    }
  });

  // Visibility: pause animation loop only
  document.addEventListener('visibilitychange', () => {
    if (!timer.running) return;
    if (document.hidden){
      cancelAnimationFrame(timer.raf);
      timer.raf = null;
    } else {
      timer.lastTick = performance.now();
      timer.raf = requestAnimationFrame(loop);
    }
  });

  // ---------- Functions ----------
  function selectActivity(id){
    if (timer.activityId === id) return;
    hydrateActivity(id, true);
  }

  function hydrateActivity(id, applyPreset){
    const a = ACTIVITIES.find(x => x.id === id) || ACTIVITIES[0];
    timer.activityId = a.id;

    // Apply colors
    document.documentElement.style.setProperty('--accent1', a.accent1);
    document.documentElement.style.setProperty('--accent2', a.accent2);

    // Pill
    activityIcon.textContent = a.emoji;
    activityName.textContent = a.name;

    statsTitle.textContent = a.name;
    focusActivity.textContent = `${a.emoji} ${a.name}`;

    // Apply minutes preset if asked and not running
    if (applyPreset && !timer.running){
      setMinutes(a.minutes);
      showToast(`Actividad: ${a.name} · ${a.minutes} min`);
    } else {
      minutesInput.value = Math.round(timer.totalMs / 60000);
    }

    // Quote
    $('#quote').textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    syncChips();
    persist();
    renderStats();
  }

  function syncChips(){
    document.querySelectorAll('.chip').forEach((el) => {
      const on = el.dataset.id === timer.activityId;
      el.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function setMinutes(mins){
    const m = clampInt(mins, 1, 180);
    timer.totalMs = m * 60 * 1000;
    timer.leftMs = timer.totalMs;
    minutesInput.value = m;
    persist();
    renderAll();
  }

  function applyMinutes(){
    if (timer.running){
      showToast('Pausa el timer para cambiar minutos.');
      return;
    }
    setMinutes(Number(minutesInput.value || 25));
    showToast('Tiempo aplicado.');
  }

  function toggle(){
    timer.running ? pause() : start();
  }

  function start(){
    if (timer.leftMs <= 0) timer.leftMs = timer.totalMs;
    timer.running = true;
    timer.startedAt = Date.now();
    timer.lastTick = performance.now();
    toggleBtn.textContent = 'Pausar';
    subText.textContent = 'En marcha';
    status.classList.add('running');
    statusText.textContent = 'En marcha';
    showToast('En marcha. Dale.');
    timer.raf = requestAnimationFrame(loop);
    persist();
  }

  function pause(){
    timer.running = false;
    timer.startedAt = null;
    toggleBtn.textContent = 'Iniciar';
    subText.textContent = 'Pausado';
    status.classList.remove('running');
    statusText.textContent = 'Pausado';
    cancelAnimationFrame(timer.raf);
    timer.raf = null;
    persist();
  }

  function reset(){
    pause();
    timer.leftMs = timer.totalMs;
    subText.textContent = 'Preparado';
    statusText.textContent = 'Listo';
    renderAll();
    showToast('Reset.');
  }

  function loop(now){
    if (!timer.running) return;

    const dt = Math.min(200, now - timer.lastTick);
    timer.lastTick = now;

    timer.leftMs = Math.max(0, timer.leftMs - dt);

    renderAll(false);

    if (timer.leftMs <= 0){
      finish(false);
      return;
    }

    timer.raf = requestAnimationFrame(loop);
  }

  function finish(isManual){
    pause();
    timer.leftMs = 0;
    renderAll();
    const mins = Math.round(timer.totalMs / 60000);

    if (!isManual){
      bumpStats(timer.activityId, mins);
      showToast(`✅ Sesión completada: ${mins} min (${getActivity(timer.activityId).name})`);
    } else {
      showToast('Sesión terminada (modo prueba).');
    }

    // Small overlay effect using focus card if open
    if (focusOverlay.classList.contains('show')){
      focusSub.textContent = '¡Hecho! Esc para salir · Espacio para reiniciar';
    }

    // Reset after finish, but keep the total
    timer.leftMs = timer.totalMs;
    subText.textContent = 'Completado';
    statusText.textContent = 'Listo';
    renderAll();
    persist();
  }

  function renderAll(updateText = true){
    const { mm, ss } = msToParts(timer.leftMs);
    const t = `${pad2(mm)}:${pad2(ss)}`;
    if (updateText){
      timeText.textContent = t;
      focusTime.textContent = t;
    } else {
      // Even when not updating everything, keep time in focus mode
      focusTime.textContent = t;
      timeText.textContent = t;
    }

    const pct = timer.totalMs ? (1 - timer.leftMs / timer.totalMs) : 0;
    const pctClamped = Math.max(0, Math.min(1, pct));
    const offset = CIRC * (1 - pctClamped);

    rings.forEach(r => { r.style.strokeDasharray = String(CIRC); r.style.strokeDashoffset = String(offset); });

    meterFill.style.height = `${Math.round(pctClamped * 100)}%`;
    pctText.textContent = `${Math.round(pctClamped * 100)}%`;

    // Buttons
    toggleBtn.textContent = timer.running ? 'Pausar' : 'Iniciar';

    // Sub text
    if (timer.running){
      subText.textContent = 'En marcha';
      status.classList.add('running');
      statusText.textContent = 'En marcha';
      focusSub.textContent = 'Espacio para pausar · Esc para salir';
    } else {
      status.classList.remove('running');
      if (timer.leftMs === timer.totalMs){
        subText.textContent = 'Preparado';
        statusText.textContent = 'Listo';
      }
    }
  }

  function renderStats(){
    const s = loadState();
    const id = timer.activityId;
    const stats = s.stats?.[id] || { totalSessions: 0, totalMinutes: 0, byDay: {} };
    const today = TODAY_KEY();
    const todaySessions = stats.byDay?.[today]?.sessions || 0;

    statToday.textContent = String(todaySessions);
    statTotal.textContent = String(stats.totalSessions || 0);
    statMinutes.textContent = String(stats.totalMinutes || 0);
  }

  function bumpStats(id, minutes){
    const s = loadState();
    s.stats = s.stats || {};
    const today = TODAY_KEY();
    const st = s.stats[id] || { totalSessions: 0, totalMinutes: 0, byDay: {} };

    st.totalSessions += 1;
    st.totalMinutes += minutes;

    st.byDay[today] = st.byDay[today] || { sessions: 0 };
    st.byDay[today].sessions += 1;

    s.stats[id] = st;
    saveState(s);
    renderStats();
  }

  function toggleTheme(){
    const root = document.documentElement;
    const cur = root.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    state = loadState();
    state.theme = next;
    saveState(state);
    showToast(next === 'light' ? 'Tema claro' : 'Tema oscuro');
  }

  function toggleFocus(force){
    const show = typeof force === 'boolean' ? force : !focusOverlay.classList.contains('show');
    focusOverlay.classList.toggle('show', show);
    focusOverlay.setAttribute('aria-hidden', show ? 'false' : 'true');
    if (show){
      showToast('Modo Focus: Esc para salir.');
    }
  }

  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add('show');
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function persist(){
    const s = loadState();
    s.activityId = timer.activityId;
    s.totalMs = timer.totalMs;
    s.leftMs = timer.leftMs;
    saveState(s);
  }

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      const s = raw ? JSON.parse(raw) : {};
      // theme
      if (s.theme){
        document.documentElement.setAttribute('data-theme', s.theme);
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
      return s;
    } catch {
      document.documentElement.setAttribute('data-theme', 'dark');
      return {};
    }
  }

  function saveState(s){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  }

  function getActivity(id){
    return ACTIVITIES.find(x => x.id === id) || ACTIVITIES[0];
  }

  function msToParts(ms){
    const totalSec = Math.ceil(ms / 1000);
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    return { mm, ss };
  }
  function pad2(n){ return String(n).padStart(2, '0'); }
  function clampInt(n, a, b){
    const x = Number.isFinite(n) ? Math.round(n) : a;
    return Math.max(a, Math.min(b, x));
  }

  // Apply stored theme if any
  if (state.theme){
    document.documentElement.setAttribute('data-theme', state.theme);
  }

})();