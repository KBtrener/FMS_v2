(() => {
  let startedAt = null, elapsedBeforeStart = 0, tick = null, restUntil = null;
  const format = ms => { const sec = Math.floor(ms / 1000); return `${String(Math.floor(sec / 60)).padStart(2,'0')}:${String(sec % 60).padStart(2,'0')}.${String(Math.floor(ms % 1000 / 100))}`; };
  const elapsed = () => elapsedBeforeStart + (startedAt === null ? 0 : Date.now() - startedAt);
  function paint() {
    document.querySelectorAll('[data-bunkie-clock]').forEach(node => node.textContent = format(elapsed()));
    const rest = Math.max(0, (restUntil || 0) - Date.now());
    document.querySelectorAll('[data-bunkie-rest-clock]').forEach(node => node.textContent = format(rest));
    document.querySelectorAll('[data-bunkie-rest-status]').forEach(node => node.textContent = restUntil ? rest === 0 ? 'Osiągnięto zalecane minimum 60 s odpoczynku.' : 'Odpoczynek trwa. Kolejna próba może rozpocząć się po odpoczynku.' : 'Możesz uruchomić licznik odpoczynku po próbie.');
  }
  function start() { if (startedAt !== null) return; startedAt = Date.now(); clearInterval(tick); tick = setInterval(paint, 100); paint(); }
  function stop() { if (startedAt === null) return; elapsedBeforeStart = elapsed(); startedAt = null; clearInterval(tick); tick = null; paint(); document.dispatchEvent(new CustomEvent('bunkie:record', { bubbles: true, detail: { seconds: Math.round(elapsedBeforeStart / 10) / 100 } })); }
  function reset() { startedAt = null; elapsedBeforeStart = 0; clearInterval(tick); tick = null; paint(); }
  function restStart() { restUntil = Date.now() + 60000; clearInterval(tick); tick = setInterval(() => { paint(); if (Date.now() >= restUntil) { clearInterval(tick); tick = null; } }, 100); paint(); }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-bunkie-timer-action]'); if (!button) return;
    const action = button.dataset.bunkieTimerAction;
    if (action === 'start') start(); else if (action === 'stop') stop(); else if (action === 'reset') reset(); else if (action === 'rest') restStart();
  });
  window.BunkieTimer = { format, elapsed, start, stop, reset, restStart };
})();
