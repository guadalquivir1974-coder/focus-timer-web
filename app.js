(() => {
  const root = document.documentElement;
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  const timeText = document.getElementById('timeText');
  const statusText = document.getElementById('statusText');

  const minutesInput = document.getElementById('minutes');
  const applyBtn = document.getElementById('applyBtn');
  const startPauseBtn = document.getElementById('startPauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const themeToggle = document.getElementById('themeToggle');

  const progressCircle = document.querySelector('.progress');

  const CIRCUMFERENCE = 327; // approx 2*pi*52
  progressCircle.style.strokeDasharray = String(CIRCUMFERENCE);

  let totalSeconds = 25 * 60;
  let remainingSeconds = totalSeconds;
  let timerId = null;
  let running = false;

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }

  function setDocumentTitle() {
    document.title = running ? `${formatTime(remainingSeconds)} · Timer` : 'Timer de concentración';
  }

  function setStatus(text) {
    statusText.textContent = text;
  }

  function render() {
    timeText.textContent = formatTime(remainingSeconds);
    const progress = totalSeconds === 0 ? 0 : (remainingSeconds / totalSeconds);
    const offset = CIRCUMFERENCE * (1 - progress);
    progressCircle.style.strokeDashoffset = String(offset);
    setDocumentTitle();
  }

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
    running = false;
    document.body.classList.remove('running');
    startPauseBtn.textContent = 'Iniciar';
    setStatus('Listo');
    render();
  }

  function startTimer() {
    if (running) return;
    running = true;
    document.body.classList.add('running');
    startPauseBtn.textContent = 'Pausar';
    setStatus('En marcha');

    const endAt = Date.now() + remainingSeconds * 1000;

    timerId = setInterval(() => {
      const msLeft = endAt - Date.now();
      remainingSeconds = Math.ceil(msLeft / 1000);

      if (remainingSeconds <= 0) {
        remainingSeconds = 0;
        render();
        stopTimer();

        // Minimal feedback
        try { navigator.vibrate?.([150, 80, 150]); } catch {}
        alert('¡Tiempo! Descansa un momento 🙂');
      } else {
        render();
      }
    }, 250);

    render();
  }

  function toggleStartPause() {
    if (running) stopTimer();
    else startTimer();
  }

  function applyMinutes() {
    const raw = Number(minutesInput.value);
    const mins = clamp(Number.isFinite(raw) ? raw : 25, 1, 180);
    minutesInput.value = String(mins);
    totalSeconds = mins * 60;
    remainingSeconds = totalSeconds;
    stopTimer();
    render();
  }

  function reset() {
    remainingSeconds = totalSeconds;
    stopTimer();
    render();
  }

  // Theme
  function prefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem('theme', theme);

    // Icon + mobile browser bar color
    const isLight = theme === 'light';
    themeToggle.querySelector('.icon').textContent = isLight ? '☀' : '☾';
    themeMeta?.setAttribute('content', isLight ? '#f6f7fb' : '#0b1220');
  }

  function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      applyTheme(saved);
      return;
    }
    applyTheme(prefersDark() ? 'dark' : 'light');
  }

  function toggleTheme() {
    const current = root.dataset.theme === 'light' ? 'light' : 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
  }

  // Events
  applyBtn.addEventListener('click', applyMinutes);
  startPauseBtn.addEventListener('click', toggleStartPause);
  resetBtn.addEventListener('click', reset);
  themeToggle.addEventListener('click', toggleTheme);

  minutesInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applyMinutes();
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    const typing = tag === 'input' || tag === 'textarea';
    if (typing && e.key !== 'Escape') return;

    if (e.code === 'Space') {
      e.preventDefault();
      toggleStartPause();
    } else if (e.key.toLowerCase() === 'r') {
      reset();
    } else if (e.key.toLowerCase() === 't') {
      toggleTheme();
    }
  });

  // Init
  initTheme();
  render();
})();