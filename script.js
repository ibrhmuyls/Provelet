const colors = ['blue', 'green', 'orange', 'pink', 'purple'];
const eggStages = 5;
let targetColor = '';
let gameInterval;
let spawnInterval;
let proveInterval;
let sp1Interval;
let timeLeft = 60;
let score = 0;
let caught = 0;
let speedMultiplier = 1;
let maxEggs = 2;
let eggsOnScreen = [];
let gameActive = false;
let targetEggProbability = 0.8;
let slowdownActive = false;
let speedupActive = false;
let slowdownTimeout;
let speedupTimeout;

let proveSpawnCount = 0;
const maxProveSpawns = 4;
let sp1SpawnCount = 0;
const maxSp1Spawns = 4;

const container = document.getElementById('game-container');
const player = document.getElementById('player');
const resultScreen = document.getElementById('result-screen');
const resultMessage = document.getElementById('result-message');
const finalScore = document.getElementById('final-score');
const caughtCounter = document.getElementById('caught');
const targetDisplay = document.getElementById('target-display');
const eggSelect = document.getElementById('egg-select');
function createGrayEggs() {
  eggSelect.innerHTML = '';
  const shuffledColors = shuffleArray([...colors]); // renkleri karıştır

  for (let i = 0; i < 5; i++) {
    const grayEgg = document.createElement('img');
    grayEgg.src = './assets/egg_gray.png';
    grayEgg.classList.add('gray-egg');
    grayEgg.style.margin = '0 5px';
    grayEgg.style.cursor = 'pointer';
    grayEgg.onclick = () => selectColor(shuffledColors[i]); // karıştırılmış renk
    eggSelect.appendChild(grayEgg);
  }
}
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function selectColor(color) {
  targetColor = color;

  eggSelect.style.display = 'none';
  document.getElementById('egg-instruction').style.display = 'none';

  document.getElementById('ui').style.display = 'block';
  container.style.display = 'block';

  // Telif metnini gizle
  document.getElementById('disclaimer').style.display = 'none';

  targetDisplay.innerHTML = '';
  const icon = document.createElement('img');
  icon.src = `./assets/egg_${color}_1.png`;
  icon.style.width = '28px';
  icon.style.verticalAlign = 'middle';
  
  targetDisplay.appendChild(icon);

  startGame();
}
function startGame() {
  gameActive = true;
  timeLeft = 60;
  score = 0;
  caught = 0;
  speedMultiplier = 1;
  maxEggs = 2;
  eggsOnScreen = [];
  slowdownActive = false;
  speedupActive = false;
  proveSpawnCount = 0;
  sp1SpawnCount = 0;
  targetEggProbability = 0.8; // 💡 EKLENDİ
  document.getElementById('score').innerText = score;
  document.getElementById('time').innerText = timeLeft;
  caughtCounter.innerText = caught;

  player.style.display = 'block';
  container.appendChild(player);

  gameInterval = setInterval(updateGame, 1000);
  spawnInterval = setInterval(spawnEggs, 1000);
  proveInterval = setInterval(spawnProveEgg, 10000);
  sp1Interval = setInterval(spawnSp1Box, 12000);

  document.addEventListener('mousemove', movePlayer);
}

function updateGame() {
  if (!gameActive) return;

  timeLeft--;
  document.getElementById('time').innerText = timeLeft;

  if (timeLeft === 40) {
    targetEggProbability = 0.4;
  } else if (timeLeft === 20) {
    targetEggProbability = 0.2;
  }

  if (timeLeft % 10 === 0 && maxEggs < 5) {
    maxEggs++;
    speedMultiplier += 0.2;
  }

  if (timeLeft <= 0) {
    endGame(true);
  }

  const timeDisplay = document.getElementById('time');
  if (timeLeft <= 10) {
    timeDisplay.style.color = 'red';
    timeDisplay.style.animation = 'pulse 0.5s infinite';
  } else {
    timeDisplay.style.color = '';
    timeDisplay.style.animation = '';
  }
}

function spawnEggs() {
  if (!gameActive) return;

  let tries = 0;
  let newEggs = [];
  let newPositions = [];

  while (newEggs.length < maxEggs && tries < 30) {
    const egg = createEgg();
    const newLeft = parseFloat(egg.el.style.left);

    const overlaps = newPositions.some(existingLeft => {
      return Math.abs(existingLeft - newLeft) < 50; // mesafe ne kadar yakınsa çakışma say
    });

    if (!overlaps && !overlapsWithOthers(egg.el)) {
      newEggs.push(egg);
      newPositions.push(newLeft);
    }

    tries++;
  }

  newEggs.forEach(egg => {
    eggsOnScreen.push(egg);
    container.appendChild(egg.el);
    fallEgg(egg);
  });
}
function spawnProveEgg() {
  if (!gameActive || proveSpawnCount >= maxProveSpawns) return;

  const el = document.createElement('img');
  el.src = './assets/prove.png';
  el.className = 'egg prove-item';
  el.style.position = 'absolute';
  el.style.width = '50px';
  el.style.height = '35px';

  let attempt = 0;
  do {
    el.style.left = Math.random() * (container.clientWidth - 40) + 'px';
    attempt++;
  } while (overlapsWithOthers(el) && attempt < 10);

  el.style.top = '-50px';
  const proveEgg = { el, color: 'prove', y: -50, stage: 1, falling: true };
  eggsOnScreen.push(proveEgg);
  container.appendChild(el);
  fallEgg(proveEgg);
  proveSpawnCount++;
}

function spawnSp1Box() {
  if (!gameActive || sp1SpawnCount >= maxSp1Spawns) return;

  const el = document.createElement('img');
  el.src = './assets/sp1.png';
  el.className = 'egg sp1-item';
  el.style.position = 'absolute';
  el.style.width = '30px';
  el.style.height = '40px';

  let attempt = 0;
  do {
    el.style.left = Math.random() * (container.clientWidth - 40) + 'px';
    attempt++;
  } while (overlapsWithOthers(el) && attempt < 10);

  el.style.top = '-50px';
  const sp1Box = { el, color: 'sp1', y: -50, stage: 1, falling: true };
  eggsOnScreen.push(sp1Box);
  container.appendChild(el);
  fallEgg(sp1Box);
  sp1SpawnCount++;
}

function overlapsWithOthers(newEl) {
  const newLeft = parseFloat(newEl.style.left);
  return eggsOnScreen.some(e => {
    const existingLeft = parseFloat(e.el.style.left);
    return Math.abs(existingLeft - newLeft) < 40;
  });
}

function createEgg() {
  let color = Math.random() < targetEggProbability
  ? targetColor
  : colors.filter(c => c !== targetColor)[Math.floor(Math.random() * 4)];
  const el = document.createElement('img');
  el.src = `./assets/egg_${color}_1.png`;
  el.className = 'egg';
  el.style.position = 'absolute';
  el.style.width = '30px';
  el.style.height = '44px';
  el.style.left = Math.random() * (container.clientWidth - 40) + 'px';
  el.style.top = '-50px';
  return { el, color, y: -50, stage: 1, falling: true };
}

function fallEgg(egg) {
  function step() {
    if (!gameActive || !egg.falling) return;

    egg.y += 3 * speedMultiplier;
    egg.el.style.top = egg.y + 'px';

    const eggRect = egg.el.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    if (
      eggRect.bottom >= playerRect.top &&
      eggRect.left < playerRect.right &&
      eggRect.right > playerRect.left
    ) {
      handleCatch(egg);
      return;
    }

    if (egg.y + 50 >= container.clientHeight - 20) {
      egg.falling = false;
      crackAndRemove(egg);
      return;
    }

    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function crackAndRemove(egg) {
  if (egg.color === 'prove' || egg.color === 'sp1') {
    if (container.contains(egg.el)) container.removeChild(egg.el);
    eggsOnScreen = eggsOnScreen.filter(e => e !== egg);
    return;
  }

  let stage = 2;
  const crackInterval = setInterval(() => {
    if (stage > eggStages) {
      clearInterval(crackInterval);
      if (container.contains(egg.el)) container.removeChild(egg.el);
      eggsOnScreen = eggsOnScreen.filter(e => e !== egg);
      return;
    }
    egg.el.src = `./assets/egg_${egg.color}_${stage}.png`;
    stage++;
  }, 100);
}

function handleCatch(egg) {
  if (!gameActive) return;

  if (egg.color === 'prove') {
    if (container.contains(egg.el)) container.removeChild(egg.el);
    eggsOnScreen = eggsOnScreen.filter(e => e !== egg);

    if (speedupActive) {
      clearTimeout(speedupTimeout);
      speedMultiplier /= 2;
      speedupActive = false;
      const msg = document.getElementById('speedup-msg');
      if (msg) container.removeChild(msg);
    }

    if (!slowdownActive) {
      slowdownActive = true;
      speedMultiplier /= 2;

      const msg = document.createElement('div');
      msg.innerText = 'System slowing down!';
      msg.id = 'slowdown-msg';
      Object.assign(msg.style, {
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#fff0f6', color: '#ff4081',
        padding: '10px 20px', borderRadius: '12px',
        fontSize: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.2)'
      });
      container.appendChild(msg);

      slowdownTimeout = setTimeout(() => {
        speedMultiplier *= 2;
        slowdownActive = false;
        const m = document.getElementById('slowdown-msg');
        if (m) container.removeChild(m);
      }, 10000);
    }
    return;
  }

  if (egg.color === 'sp1') {
    if (container.contains(egg.el)) container.removeChild(egg.el);
    eggsOnScreen = eggsOnScreen.filter(e => e !== egg);

    if (slowdownActive) {
      clearTimeout(slowdownTimeout);
      speedMultiplier *= 2;
      slowdownActive = false;
      const msg = document.getElementById('slowdown-msg');
      if (msg) container.removeChild(msg);
    }

    if (!speedupActive) {
      speedupActive = true;
      speedMultiplier *= 2;

      const msg = document.createElement('div');
      msg.innerText = 'System speeding up!';
      msg.id = 'speedup-msg';
      Object.assign(msg.style, {
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#e6fff6', color: '#00a86b',
        padding: '10px 20px', borderRadius: '12px',
        fontSize: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.2)'
      });
      container.appendChild(msg);

      speedupTimeout = setTimeout(() => {
        speedMultiplier /= 2;
        speedupActive = false;
        const m = document.getElementById('speedup-msg');
        if (m) container.removeChild(m);
      }, 10000);
    }
    return;
  }

if (egg.color === targetColor) {
  score += 100; // her doğru yumurta 100 puan
  caught++;
    document.getElementById('score').innerText = score;
    caughtCounter.innerText = caught;

    const scoreDisplay = document.getElementById('score');
    scoreDisplay.style.color = 'limegreen';
    scoreDisplay.style.animation = 'flash 0.5s';
    setTimeout(() => {
      scoreDisplay.style.color = '';
      scoreDisplay.style.animation = '';
    }, 500);

    if (container.contains(egg.el)) container.removeChild(egg.el);
    eggsOnScreen = eggsOnScreen.filter(e => e !== egg);
  } else {
    endGame(false);
  }
}

function movePlayer(e) {
  const rect = container.getBoundingClientRect();
  let x = e.clientX - rect.left;
  if (x < 0) x = 0;
  if (x > container.clientWidth) x = container.clientWidth;
  player.style.left = `${x - player.offsetWidth / 2}px`;
}

function endGame(win) {
  gameActive = false;
  clearInterval(gameInterval);
  clearInterval(spawnInterval);
  clearInterval(proveInterval);
  clearInterval(sp1Interval);
  clearTimeout(slowdownTimeout);
  clearTimeout(speedupTimeout);
  slowdownActive = false;
  speedupActive = false;

  const msg1 = document.getElementById('slowdown-msg');
  if (msg1) container.removeChild(msg1);
  const msg2 = document.getElementById('speedup-msg');
  if (msg2) container.removeChild(msg2);

  document.removeEventListener('mousemove', movePlayer);

  resultScreen.classList.add('show');
if (win) {
  resultMessage.innerHTML = '🎉 <strong>Great Catch!</strong><br>You mastered the eggs!';
} else {
  resultMessage.innerHTML = '💥 <strong>Oops!</strong><br>You cracked the wrong egg!';
}

finalScore.innerHTML = `⭐ <strong>Your Score:</strong> ${score} points`;

  eggsOnScreen.forEach(e => {
    if (container.contains(e.el)) container.removeChild(e.el);
  });
  eggsOnScreen = [];
  player.style.display = 'none';
}

function restartGame() {
  resultScreen.classList.remove('show');
  eggSelect.style.display = 'flex';
  document.getElementById('egg-instruction').style.display = 'block';
  document.getElementById('ui').style.display = 'none';
  container.style.display = 'none';
  targetDisplay.innerHTML = '';

  proveSpawnCount = 0;
  sp1SpawnCount = 0;
  slowdownActive = false;
  speedupActive = false;
  clearTimeout(slowdownTimeout);
  clearTimeout(speedupTimeout);

  document.getElementById('disclaimer').style.display = 'block';
  const msg1 = document.getElementById('slowdown-msg');
  if (msg1) container.removeChild(msg1);
  const msg2 = document.getElementById('speedup-msg');
  if (msg2) container.removeChild(msg2);

  createGrayEggs();
}


window.onload = () => {
  restartGame();

  const overlay = document.getElementById('how-to-play-overlay');
  const closeBtn = document.getElementById('close-how-to-play');

  closeBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
  });

  overlay.style.display = 'flex'; // oyun başında göster
};