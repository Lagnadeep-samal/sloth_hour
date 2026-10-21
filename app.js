const $ = s => document.querySelector(s);
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
};
let OLLAMA = store.get('ollamaUrl') || 'http://localhost:11434', demo = false;
const SAMPLES = {
  'A lighthouse keeper': 'The keeper climbed the spiral stairs one slow step at a time. At the top, the great lamp turned, patient as breathing. Far below, the sea folded itself against the rocks. He poured a cup of warm tea and held it in both hands. The light swept out across the water, and back, and out again. His eyes grew heavy. The waves kept watch. He slept.',
  'A night train through snow': 'The night train hummed along the edge of a white valley. Snow drifted past the window, soft and unhurried. In her seat, Mara tucked a blanket around her knees. The wheels kept a gentle rhythm. Clack, and rest. Clack, and rest. A lamp glowed amber above her. The valley went on without her. She leaned her head on the glass and slept.',
  'A sloth and a slow river': 'Under a canopy of broad green leaves, a sloth named Pim hung from her favorite branch. Below, the river moved so slowly it hardly seemed to move at all. She reached for one leaf. It took a while. That was fine. Warm air rocked the branch. The river whispered. Pim closed her eyes. Nothing needed doing. She slept.',
  'A quiet bookshop': 'The bookshop smelled of paper and cedar. Rain tapped the window in no hurry. Ilan sat in the big armchair at the back with a book he did not need to finish. A cat shifted on the shelf above. The clock ticked softly. Pages turned, then stopped turning. The words blurred into warm shapes. He slept.',
  'A garden after rain': 'After the rain, the garden dripped and shone. Each leaf held a small bright bead of water. Oma sat on the porch step, listening. A snail crossed the path, slowly. The air was cool and smelled of earth. One drop fell, then another, then a long quiet. She pulled her shawl close. She slept.'
};
const THEMES = ['A lighthouse keeper', 'A night train through snow', 'A sloth and a slow river', 'A quiet bookshop', 'A garden after rain'];
const SOUNDS = ['Rain', 'Ocean', 'Wind', 'Deep hum', 'Silence'];
let theme = THEMES[2], sound = 'Rain';
let ac, master, current = null, ctl = null, sleepT = null, tickT = null;

/* ---------- chips ---------- */
function chips(el, items, get, set) {
  el.innerHTML = '';
  items.forEach(t => {
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = t;
    b.setAttribute('aria-pressed', get() === t);
    b.onclick = () => { set(t); [...el.children].forEach(c => c.setAttribute('aria-pressed', c === b)); };
    el.appendChild(b);
  });
}
chips($('#themes'), THEMES, () => theme, t => theme = t);
chips($('#sounds'), SOUNDS, () => sound, t => { sound = t; playSound(t); });

/* ---------- Ollama ---------- */
async function loadModels() {
  try {
    const r = await fetch(OLLAMA + '/api/tags');
    const { models } = await r.json();
    if (!models.length) throw new Error('none');
    $('#model').innerHTML = models.map(m => `<option>${m.name}</option>`).join('');
    demo = false; $('#dot').classList.add('ok');
    $('#stat').textContent = `Ollama is running with ${models.length} model${models.length > 1 ? 's' : ''}.`;
    $('#hint').style.display = 'none';
  } catch (e) {
    demo = true; $('#dot').classList.remove('ok');
    $('#stat').textContent = 'Demo mode: Ollama was not found, so you will hear a sample story.';
    $('#hint').style.display = 'block';
  }
}
loadModels();

async function tell() {
  stopSpeech();
  ctl = new AbortController();
  const words = $('#len').value;
  const prompt = `Write a calm bedtime story for an adult who struggles to wind down. Setting: ${theme}. About ${words} words. Use soft sensory detail and a slow pace. No conflict, no danger, no cliffhangers. Let the sentences get shorter and sleepier toward the end, and finish with the main character drifting off to sleep. Plain prose only: no title, no markdown, no lists.`;
  const out = $('#story'); out.textContent = '';
  setBusy(true);
  try {
    if (demo) {
      await demoStory(out, ctl.signal);
      if (!ctl.signal.aborted && $('#speak').checked) speak(out.textContent);
      setBusy(false); return;
    }
    const r = await fetch(OLLAMA + '/api/generate', {
      method: 'POST', signal: ctl.signal,
      body: JSON.stringify({ model: $('#model').value, prompt, stream: true, options: { temperature: 0.85 } })
    });
    if (!r.ok) throw new Error('Ollama returned ' + r.status);
    const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '';
    for (;;) {
      const { done, value } = await rd.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n'); buf = lines.pop();
      for (const l of lines) if (l.trim()) { try { out.textContent += JSON.parse(l).response || ''; } catch {} }
    }
    if ($('#speak').checked) speak(out.textContent);
  } catch (e) {
    if (e.name !== 'AbortError') { out.textContent = 'Could not make a story: ' + e.message; $('#hint').style.display = 'block'; }
  }
  setBusy(false);
}
function setBusy(b) {
  const g = $('#go');
  g.textContent = b ? 'Stop' : 'Tell me a story';
  g.classList.toggle('stop', b);
}
$('#go').onclick = () => {
  if ($('#go').classList.contains('stop')) { ctl && ctl.abort(); stopSpeech(); setBusy(false); }
  else { tell(); startSleepTimer(); if (sound !== 'Silence' && !current) playSound(sound); }
};

/* ---------- speech (uses the browser's own voices) ---------- */
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  (text.match(/[^.!?]+[.!?]*/g) || []).forEach(s => {
    const u = new SpeechSynthesisUtterance(s.trim());
    u.rate = 0.8; u.pitch = 0.9; u.volume = 0.8;
    speechSynthesis.speak(u);
  });
}
function stopSpeech() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }

/* ---------- soundscapes (generated live with Web Audio, no files) ---------- */
function ensureAudio() {
  if (ac) {
    if (ac.state === 'suspended') ac.resume();
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setValueAtTime($('#vol').value / 100 * .6, ac.currentTime);
    return;
  }
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = $('#vol').value / 100 * .6;
  master.connect(ac.destination);
}
function noiseSrc(brown) {
  const n = ac.sampleRate * 4, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w * .5;
  }
  const s = ac.createBufferSource(); s.buffer = b; s.loop = true; s.start(); return s;
}
function lfo(freq, depth, target) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.frequency.value = freq; g.gain.value = depth;
  o.connect(g).connect(target); o.start(); return o;
}
function build(kind) {
  const out = ac.createGain(); out.gain.value = 0; const srcs = [];
  if (kind === 'Rain') {
    const s = noiseSrc(false), hp = ac.createBiquadFilter(), lp = ac.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 900; lp.type = 'lowpass'; lp.frequency.value = 7500;
    s.connect(hp).connect(lp).connect(out); srcs.push(s);
  } else if (kind === 'Ocean') {
    const s = noiseSrc(true), lp = ac.createBiquadFilter(), sw = ac.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 600; sw.gain.value = .55;
    s.connect(lp).connect(sw).connect(out); srcs.push(s, lfo(.09, .4, sw.gain));
  } else if (kind === 'Wind') {
    const s = noiseSrc(false), bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 450; bp.Q.value = 1.2;
    s.connect(bp).connect(out); srcs.push(s, lfo(.06, 280, bp.frequency));
  } else if (kind === 'Deep hum') {
    const trem = ac.createGain(); trem.gain.value = .7; trem.connect(out);
    [55, 82.4, 110.3].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = f; g.gain.value = .22 / (i + 1); o.connect(g).connect(trem); o.start(); srcs.push(o);
    });
    srcs.push(lfo(.12, .25, trem.gain));
  }
  out.connect(master);
  return { out, srcs };
}
function playSound(kind) {
  ensureAudio();
  const t = ac.currentTime, old = current; current = null;
  if (old) {
    old.out.gain.cancelScheduledValues(t); old.out.gain.setValueAtTime(old.out.gain.value, t);
    old.out.gain.linearRampToValueAtTime(0, t + 2);
    setTimeout(() => { old.srcs.forEach(s => { try { s.stop(); } catch {} }); old.out.disconnect(); }, 2300);
  }
  if (kind === 'Silence') { $('#moon').classList.add('off'); return; }
  current = build(kind);
  current.out.gain.linearRampToValueAtTime(1, t + 3);
  $('#moon').classList.remove('off');
}
$('#vol').oninput = e => { if (master) master.gain.setTargetAtTime(e.target.value / 100 * .6, ac.currentTime, .1); };

/* ---------- sleep timer ---------- */
function startSleepTimer() {
  clearTimeout(sleepT); clearInterval(tickT);
  const min = +$('#sleep').value; if (!min) { $('#count').textContent = ''; return; }
  const end = Date.now() + min * 60000;
  tickT = setInterval(() => {
    const left = Math.max(0, end - Date.now());
    $('#count').textContent = Math.ceil(left / 60000) + ' min left';
  }, 1000);
  sleepT = setTimeout(() => {
    clearInterval(tickT); $('#count').textContent = 'Good night.';
    stopSpeech();
    if (ac && master) {
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setValueAtTime(master.gain.value, ac.currentTime);
      master.gain.linearRampToValueAtTime(0, ac.currentTime + 25);
      setTimeout(() => { playSound('Silence'); }, 26000);
    }
  }, min * 60000);
}
$('#sleep').onchange = () => { if (current) startSleepTimer(); };

async function demoStory(out, sig) {
  const words = (SAMPLES[theme] || Object.values(SAMPLES)[0]).split(' ');
  for (const w of words) {
    if (sig.aborted) return;
    out.textContent += w + ' ';
    await new Promise(r => setTimeout(r, 140));
  }
}

/* ---------- Ollama address ---------- */
$('#url').value = OLLAMA;
$('#url').onchange = e => {
  OLLAMA = e.target.value.trim().replace(/\/$/, '') || 'http://localhost:11434';
  store.set('ollamaUrl', OLLAMA); loadModels();
};

/* ---------- install and offline support ---------- */
/*SW*/ if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
