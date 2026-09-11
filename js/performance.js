// Opt-in browser measurements shared by the current game and the 3D prototype.
// No storage, telemetry, or animation loop is started without ?profile=1.
(() => {
  if (!new URLSearchParams(location.search).has('profile')) return;
  const panel = document.createElement('aside');
  panel.id = 'performance-panel';
  panel.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:9999;max-width:calc(100vw - 16px);width:300px;padding:12px;border:1px solid #827294;border-radius:14px;background:#191426f5;color:#fff;font:12px/1.5 system-ui;box-sizing:border-box';
  panel.innerHTML = '<strong>Tezlik o‘lchovi · 12 soniya</strong><p style="margin:5px 0">Bir xil oynada va bir xil harakatlar bilan solishtiring.</p><button type="button" id="measure-start">O‘lchash</button> <button type="button" id="measure-close" aria-label="O‘lchov panelini yopish">×</button><output id="measure-result" style="display:block;white-space:pre-wrap;margin-top:6px">Tayyor</output>';
  document.body.append(panel);
  const output = panel.querySelector('output');
  const button = panel.querySelector('#measure-start');
  let active = false, frame = 0, observer, provider = () => ({});
  window.CandyMetrics = { setProvider(fn) { provider = fn; } };
  panel.querySelector('#measure-close').onclick = () => {
    active = false; cancelAnimationFrame(frame); observer?.disconnect(); panel.remove();
  };
  button.onclick = () => {
    if (active) return;
    active = true; button.disabled = true;
    const samples = [], tasks = [], start = performance.now(), initial = provider();
    let last = start, shown = -1;
    if (PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
      observer = new PerformanceObserver(list => tasks.push(...list.getEntries().map(e => e.duration)));
      observer.observe({type:'longtask'});
    }
    function tick(now) {
      if (!active) return;
      if (document.hidden) {
        active = false; observer?.disconnect(); button.disabled = false;
        output.textContent = 'Bekor qilindi: o‘lchov davomida oynani faol tuting.'; return;
      }
      samples.push(now - last); last = now;
      const elapsed = now - start, seconds = Math.floor(elapsed / 1000);
      if (seconds !== shown) { shown = seconds; output.textContent = `O‘lchanmoqda… ${Math.min(12, seconds)} / 12 s`; }
      if (elapsed < 12000) { frame = requestAnimationFrame(tick); return; }
      tasks.push(...(observer?.takeRecords() || []).map(e => e.duration));
      observer?.disconnect(); active = false; button.disabled = false;
      samples.sort((a,b) => a-b);
      const percentile = p => +(samples[Math.min(samples.length-1, Math.ceil(samples.length*p)-1)] || 0).toFixed(2);
      const result = {
        page: location.pathname, timestamp: new Date().toISOString(),
        viewport: `${innerWidth}×${innerHeight}`, devicePixelRatio,
        durationMs: Math.round(elapsed), frames: samples.length,
        fps: +(samples.length * 1000 / elapsed).toFixed(1),
        p95Ms: percentile(.95), p99Ms: percentile(.99),
        maxFrameMs: +samples[samples.length-1].toFixed(2),
        longTasks: tasks.length, maxLongTaskMs: +Math.max(0,...tasks).toFixed(2),
        ...provider()
      };
      if (typeof initial.renderCount === 'number') result.renderedFrames = result.renderCount - initial.renderCount;
      output.textContent = `${result.fps} FPS · p95 ${result.p95Ms} ms\np99 ${result.p99Ms} ms · max ${result.maxFrameMs} ms\nUzoq vazifalar: ${result.longTasks} (max ${result.maxLongTaskMs} ms)\n${result.viewport} · ${result.frames} kadr`;
      const detail = document.createElement('details'), summary = document.createElement('summary'), pre = document.createElement('pre');
      summary.textContent = 'To‘liq natija'; pre.style.cssText = 'max-height:180px;overflow:auto;font-size:10px';
      pre.textContent = JSON.stringify(result,null,2); detail.append(summary,pre);
      output.append(detail);
    }
    frame = requestAnimationFrame(tick);
  };
})();
