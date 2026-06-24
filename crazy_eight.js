/* ─── CONFIG ─── */
const ROUND_DURATION = 60;
const TOTAL_ROUNDS   = 8;
const CIRCUMFERENCE  = 2 * Math.PI * 92; // r=92

const ROUNDS = [
  { label: "Sketch your first idea",         hint: "Today isn't about creating perfect designs. It's about generating lots of ideas quickly." },
  { label: "A completely different approach", hint: "When the timer ends, move on immediately. What would a beginner design?" },
  { label: "Push beyond the obvious",         hint: "Make it playful. Keep drawing." },
  { label: "What would a child draw?",        hint: "What if money wasn't a limitation? Design the dream version." },
  { label: "The unexpected solution",         hint: "Strip away everything unnecessary. Bad ideas are welcome." },
  { label: "Flip the problem around",         hint: "What would Apple or Google do? Trust your instincts." },
  { label: "Your wildest idea yet",           hint: "What if users could only use one button?" },
  { label: "One final push — make it count",  hint: "Combine your best ideas." }
];

const VOICE_CUES = {
  start:   "Let's go. Today isn't about creating perfect designs. It's about generating lots of ideas quickly.",
  between: [
    "Round 2. When the timer ends, move on immediately. What would a beginner design?",
    "Round 3. Make it playful. Keep drawing.",
    "Round 4. What if money wasn't a limitation? Design the dream version.",
    "Round 5. Strip away everything unnecessary. Bad ideas are welcome.",
    "Round 6. What would Apple or Google do? Trust your instincts.",
    "Round 7. What if users could only use one button?",
    "Last round. Combine your best ideas."
  ],
  ten:     "Ten seconds.",
  done:    "That's eight. Now we can slow down and select the best ideas. Which idea surprises you? Which idea solves the problem best? Can two ideas be combined?"
};

/* ─── AUDIO VOICE ─── */
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function playAlarm(type) {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const configs = {
      ten:   { wave: 'sine',   gain: 0.5, notes: [
        { t: 0,    f: 660,  d: 0.08 }
      ]},
      round: { wave: 'square', gain: 0.38, notes: [
        { t: 0,    f: 880,  d: 0.12 },
        { t: 0.18, f: 880,  d: 0.12 },
        { t: 0.36, f: 880,  d: 0.12 },
        { t: 0.54, f: 1100, d: 0.28 }
      ]},
      final: { wave: 'sine',   gain: 0.6, notes: [
        { t: 0,    f: 660,  d: 0.1  },
        { t: 0.18, f: 880,  d: 0.1  },
        { t: 0.36, f: 1047, d: 0.3  }
      ]}
    };
    const { wave, gain: g, notes } = configs[type] || configs.round;
    notes.forEach(({ t, f, d }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = wave;
      osc.frequency.value = f;
      gain.gain.setValueAtTime(g, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
      osc.start(now + t);
      osc.stop(now + t + d + 0.01);
    });
  } catch(e) {}
}

/* ─── STATE ─── */
let round       = 1;
let timeLeft    = ROUND_DURATION;
let ticker      = null;
let paused      = false;
let voiceOn     = true;
let rowFillAnimFrame = null;

/* ─── ELEMENTS ─── */
const $ = id => document.getElementById(id);
const screens = {
  start:      $('startScreen'),
  exercise:   $('exerciseScreen'),
  completion: $('completionScreen'),
  why:        $('whyScreen'),
  contact:    $('contactScreen')
};

/* ─── SPEECH ─── */
function say(text) {
  if (!voiceOn || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.05; u.pitch = 1; u.volume = 1;
  u.onstart = () => {
    $('voiceDot').classList.add('speaking');
    $('voiceStatusText').textContent = 'Speaking';
  };
  u.onend = () => {
    $('voiceDot').classList.remove('speaking');
    $('voiceStatusText').textContent = 'Voice ready';
  };
  window.speechSynthesis.speak(u);
}

/* ─── BUILD SKETCH LIST ─── */
function buildSketchList() {
  const list = $('sketchList');
  list.innerHTML = '';
  for (let i = 1; i <= TOTAL_ROUNDS; i++) {
    list.innerHTML += `
      <div class="sketch-row ${i === 1 ? 'current' : 'pending'}" id="row${i}">
        <div class="sketch-row-n">${String(i).padStart(2,'0')}</div>
        <div class="sketch-row-info">
          <div class="sketch-row-label">${ROUNDS[i-1].label}</div>
          <div class="sketch-row-bar">
            <div class="sketch-row-fill" id="fill${i}"></div>
          </div>
        </div>
        <div class="sketch-row-check" id="check${i}">✓</div>
      </div>`;
  }
}

/* ─── SHOW SCREEN ─── */
function show(name) {
  Object.entries(screens).forEach(([k, el]) => {
    el.classList.toggle('active', k === name);
  });
}

/* ─── TIMER RING ─── */
function setRing(secondsLeft) {
  const pct    = secondsLeft / ROUND_DURATION;
  const offset = CIRCUMFERENCE * (1 - pct);
  $('tRing').style.strokeDasharray  = CIRCUMFERENCE;
  $('tRing').style.strokeDashoffset = offset;
}

/* ─── ROW FILL ANIMATION ─── */
function animateRowFill(rowIndex) {
  const fill = $('fill' + rowIndex);
  if (!fill) return;
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const pct = Math.min((elapsed / (ROUND_DURATION * 1000)) * 100, 100);
    fill.style.width = pct + '%';
    if (pct < 100) rowFillAnimFrame = requestAnimationFrame(step);
  }
  rowFillAnimFrame = requestAnimationFrame(step);
}

/* ─── START ─── */
function startWorkout() {
  round    = 1;
  timeLeft = ROUND_DURATION;
  paused   = false;
  buildSketchList();
  updateUI();
  show('exercise');
  $('topbarStatus').textContent = 'ROUND 1 / 8';
  setRing(ROUND_DURATION);
  say(VOICE_CUES.start);
  animateRowFill(1);
  startTicker();
}

/* ─── TICKER ─── */
function startTicker() {
  clearInterval(ticker);
  ticker = setInterval(() => {
    if (paused) return;
    timeLeft--;
    $('timerDigits').textContent = timeLeft;
    setRing(timeLeft);

    if (timeLeft === 10) { playAlarm('ten'); say(VOICE_CUES.ten); }
    if (timeLeft <= 0)   endRound();
  }, 1000);
}

/* ─── END ROUND ─── */
function endRound() {
  clearInterval(ticker);
  cancelAnimationFrame(rowFillAnimFrame);

  // Mark completed
  const row = $('row' + round);
  row.classList.remove('current');
  row.classList.add('done');
  $('fill' + round).style.width = '100%';

  if (round < TOTAL_ROUNDS) {
    round++;
    timeLeft = ROUND_DURATION;
    updateUI();
    setRing(ROUND_DURATION);
    animateRowFill(round);
    playAlarm('round');
    say(VOICE_CUES.between[round - 2]);
    startTicker();
  } else {
    finishWorkout();
  }
}

/* ─── UPDATE UI ─── */
function updateUI() {
  $('roundNum').textContent    = round;
  $('promptText').textContent  = ROUNDS[round - 1].label;
  $('promptHint').textContent  = ROUNDS[round - 1].hint;
  $('timerDigits').textContent = timeLeft;
  $('topbarStatus').textContent = `ROUND ${round} / 8`;

  const done = round - 1;
  $('progressThumb').style.width = (done / TOTAL_ROUNDS * 100) + '%';
  $('progressLabel').textContent = `${done} / 8`;

  // Highlight current row
  for (let i = 1; i <= TOTAL_ROUNDS; i++) {
    const r = $('row' + i);
    if (!r) continue;
    if (i < round) {
      r.className = 'sketch-row done';
    } else if (i === round) {
      r.className = 'sketch-row current';
    } else {
      r.className = 'sketch-row pending';
    }
  }
}

/* ─── FINISH ─── */
function finishWorkout() {
  $('progressThumb').style.width = '100%';
  $('progressLabel').textContent = '8 / 8';
  $('topbarStatus').textContent  = 'COMPLETE';
  playAlarm('final');
  say(VOICE_CUES.done);
  setTimeout(() => show('completion'), 800);
}

/* ─── PAUSE ─── */
function togglePause() {
  paused = !paused;
  const btn = $('pauseBtn');
  if (paused) {
    btn.textContent = '▶';
    btn.classList.add('active-ctrl');
    $('topbarStatus').textContent = 'PAUSED';
    say('Paused.');
  } else {
    btn.textContent = 'II';
    btn.classList.remove('active-ctrl');
    $('topbarStatus').textContent = `ROUND ${round} / 8`;
    say('Resuming.');
  }
}

/* ─── VOICE ─── */
function toggleVoice() {
  voiceOn = !voiceOn;
  const btn = $('voiceBtn');
  if (!voiceOn) {
    window.speechSynthesis.cancel();
    btn.classList.remove('active-ctrl');
    $('voiceDot').classList.remove('speaking');
    $('voiceStatusText').textContent = 'Voice off';
  } else {
    btn.classList.add('active-ctrl');
    $('voiceStatusText').textContent = 'Voice ready';
    say('Voice on.');
  }
}

/* ─── STOP ─── */
function stopWorkout() {
  if (!confirm('Stop this workout?')) return;
  clearInterval(ticker);
  cancelAnimationFrame(rowFillAnimFrame);
  window.speechSynthesis.cancel();
  resetToStart();
}

/* ─── RESTART ─── */
function restartWorkout() {
  clearInterval(ticker);
  cancelAnimationFrame(rowFillAnimFrame);
  startWorkout();
}

/* ─── HOME ─── */
function resetToStart() {
  clearInterval(ticker);
  cancelAnimationFrame(rowFillAnimFrame);
  window.speechSynthesis.cancel();
  paused  = false;
  round   = 1;
  timeLeft = ROUND_DURATION;
  $('topbarStatus').textContent = 'READY';
  show('start');
}

/* ─── NAV ─── */
function showWhy() {
  clearInterval(ticker);
  cancelAnimationFrame(rowFillAnimFrame);
  window.speechSynthesis.cancel();
  $('topbarStatus').textContent = 'WHY IT WORKS';
  show('why');
}

function showContact() {
  clearInterval(ticker);
  cancelAnimationFrame(rowFillAnimFrame);
  window.speechSynthesis.cancel();
  $('topbarStatus').textContent = 'CONTACT';
  show('contact');
}

window.addEventListener('beforeunload', () => window.speechSynthesis.cancel());
