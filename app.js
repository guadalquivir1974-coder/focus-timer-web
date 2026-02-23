(() => {
  const timeText = document.getElementById('timeText');
  const minutesInput = document.getElementById('minutes');
  const applyBtn = document.getElementById('applyBtn');
  const startPauseBtn = document.getElementById('startPauseBtn');
  const resetBtn = document.getElementById('resetBtn');
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
    const mmStr = String(mm).padStart(2, '0');
    const ssStr = String(ss).padStart(2, '0');
    return `${mmStr}:${ssStr}`;
  }

  function setDocumentTitle() {
    document.title = running ? `${formatTime(remainingSeconds)} · Timer` : 'Timer de concentración';
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
    startPauseBtn.textContent = 'Iniciar';
    render();
  }

  function startTimer() {
    if (running) return;
    running = true;
    startPauseBtn.textContent = 'Pausar';

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

  // Events
  applyBtn.addEventListener('click', applyMinutes);
  startPauseBtn.addEventListener('click', toggleStartPause);
  resetBtn.addEventListener('click', reset);

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
    }
  });

  // Init
  render();
})();
