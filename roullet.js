let items = ["1등", "2등", "3등", "4등", "5등", "6등"];
let canvas, ctx;
let angle = 0;
let spinning = false;

// ===== 간단 SFX (Web Audio 합성) =====
const SFX = (() => {
  let ac;
  const ensure = () => (ac ??= new (window.AudioContext || window.webkitAudioContext)());

  function tone({ freq = 440, dur = 0.08, type = "sine", gain = 0.08, sweep = 0 }) {
    const a = ensure();
    const t0 = a.currentTime;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * sweep), t0 + dur);
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  return {
    start() { tone({ freq: 420, dur: 0.20, type: "triangle", gain: 0.10, sweep: 1.4 }); },
    tick(speed = 1) {
      // 속도 빠를수록 살짝 피치↑
      const f = 900 * Math.min(1.4, 0.9 + 0.5 * speed);
      tone({ freq: f, dur: 0.03, type: "square", gain: 0.06 });
    },
    win() {
      tone({ freq: 660, dur: 0.14, type: "sine", gain: 0.10 });
      setTimeout(() => tone({ freq: 880, dur: 0.16, type: "sine", gain: 0.10 }), 120);
      setTimeout(() => tone({ freq: 1320, dur: 0.18, type: "sine", gain: 0.10 }), 240);
    }
  };
})();

window.onload = () => {
  canvas = document.getElementById("wheel");
  ctx = canvas.getContext("2d");
  drawWheel();
};

function addItems() {
  const input = document.getElementById("items")?.value;
  if (input) items = input.split(",");
  drawWheel();
}

function shuffleItems() {
  items.sort(() => Math.random() - 0.5);
  drawWheel();
}

function drawWheel() {
  const arc = (2 * Math.PI) / items.length;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  items.forEach((item, i) => {
    const startAngle = i * arc + angle;
    ctx.beginPath();
    ctx.fillStyle = `hsl(${i * (360 / items.length)}, 70%, 50%)`;
    ctx.moveTo(canvas.width/2, canvas.height/2);
    ctx.arc(canvas.width/2, canvas.height/2, canvas.width/2, startAngle, startAngle + arc);
    ctx.fill();

    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(startAngle + arc / 2);
    ctx.fillStyle = "#fff";
    ctx.font = "20px bold Pretendard";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item, canvas.width/4, 0);
    ctx.restore();
  });
}

function getIndexAtPointer() {
  // 포인터는 상단(−90°, 즉 -Math.PI/2) 방향
  const ARC = (2 * Math.PI) / items.length;
  const POINTER_ANGLE = -Math.PI / 2;
  const a = ((POINTER_ANGLE - angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const idx = Math.floor(a / ARC);
  return Math.min(items.length - 1, Math.max(0, idx));
}

function spin() {
  if (spinning) return Promise.resolve();
  spinning = true;

  SFX.start(); // 시작음

  let spinTime = 3000 + Math.random() * 2000;
  let spinAngle = Math.random() * 360 + 720;

  let start = Date.now();
  let prevIdx = -1;

  return new Promise((resolve) => {
    let animate = () => {
      let now = Date.now();
      let elapsed = now - start;
      let progress = elapsed / spinTime;

      if (progress < 1) {
        angle += (spinAngle * (1 - progress)) / 50;
        drawWheel();

        // 틱 사운드: 포인터가 다른 조각으로 넘어갈 때
        const cur = getIndexAtPointer();
        if (cur !== prevIdx) {
          // 진행 속도로 틱 강도 살짝 조절
          const speedHint = Math.max(0.3, 1 - progress);
          SFX.tick(speedHint);
          prevIdx = cur;
        }

        requestAnimationFrame(animate);
      } else {
        spinning = false;
        showResult();
        resolve();
      }
    };
    animate();
  });
}

function showResult() {
  const arc = (2 * Math.PI) / items.length;
  const index = Math.floor(((2 * Math.PI - (angle % (2 * Math.PI))) / arc)) % items.length;
  const text = `🎉 당첨: ${items[index]} 🎉`;
  const el = document.getElementById("result");
  if (el) el.textContent = text;

  // 대형 화면 전용 결과 배지(#R)도 있으면 함께 표시
  const R = document.getElementById("R");
  if (R) { R.style.display = "inline-block"; R.textContent = `🎉 ${items[index]}`; }

  SFX.win(); // 당첨음
}

function reset() {
  angle = 0;
  drawWheel();

  // 대형 화면 결과 배지 숨김
  const R = document.getElementById("R");
  if (R) R.style.display = "none";
}

function openBig() {
  window.open("big.html", "_blank", "width=800,height=800");
}
