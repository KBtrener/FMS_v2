(() => {
  const clocks = { left: { running: false, startedAt: 0, elapsed: 0, tick: null }, right: { running: false, startedAt: 0, elapsed: 0, tick: null } };
  const format = ms => { const sec = Math.floor(ms / 1000); return `${String(Math.floor(sec / 60)).padStart(2,'0')}:${String(sec % 60).padStart(2,'0')}.${String(Math.floor(ms % 1000 / 100))}`; };
  const elapsed = clock => clock.elapsed + (clock.running ? Date.now() - clock.startedAt : 0);
  function paint() {
    for (const side of ['left','right']) {
      const clock=clocks[side], value=elapsed(clock);
      document.querySelectorAll(`[data-bunkie-clock="${side}"]`).forEach(node => node.textContent=format(value));
      document.querySelectorAll(`[data-bunkie-timer-action="toggle"][data-bunkie-side="${side}"]`).forEach(button => { button.textContent=clock.running?'STOP':'START'; button.setAttribute('aria-label',clock.running?'Zatrzymaj stoper i zapisz czas':'Uruchom stoper'); });
    }
  }
  function toggle(side) {
    const clock=clocks[side]; if(!clock)return;
    if(!clock.running){clock.running=true;clock.startedAt=Date.now();clock.tick=setInterval(paint,100);paint();return;}
    clock.elapsed=elapsed(clock);clock.running=false;clearInterval(clock.tick);clock.tick=null;
    const seconds=Math.round(clock.elapsed/10)/100;
    document.dispatchEvent(new CustomEvent('bunkie:record',{bubbles:true,detail:{seconds,side}}));
    clock.elapsed=0;paint();
  }
  document.addEventListener('click',event=>{const button=event.target.closest('[data-bunkie-timer-action="toggle"]');if(button)toggle(button.dataset.bunkieSide);});
  window.BunkieTimer={format,elapsed:side=>elapsed(clocks[side]),toggle};
})();
