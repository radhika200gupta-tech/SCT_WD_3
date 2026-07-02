const boardEl = document.getElementById('board');
const statusMsg = document.getElementById('statusMsg');
const turnMarkEl = document.getElementById('turnMark');
const turnIndicator = document.getElementById('turnIndicator');
const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const scoreDrawEl = document.getElementById('scoreDraw');
const resetBtn = document.getElementById('resetBtn');
const modeBtns = document.querySelectorAll('.mode-btn');
const winStrokeEl = document.querySelector('.win-stroke');
const bannerMode = document.getElementById('bannerMode');
const scoreItems = document.querySelectorAll('.score-item');
const announceBanner = document.getElementById('announceBanner');
const announceIcon = document.getElementById('announceIcon');
const announceHeadline = document.getElementById('announceHeadline');
const announceConfetti = document.getElementById('announceConfetti');

let board = Array(9).fill(null);
let current = 'X';
let mode = 'pvp';
let gameOver = false;
let cpuThinking = false;

const scores = { X: 0, O: 0, Draw: 0 };

const WIN_LINES = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

const CELL_CENTER = [
  [50,50], [150,50], [250,50],
  [50,150],[150,150],[250,150],
  [50,250],[150,250],[250,250]
];

function xMarkSVG(){
  return `<svg class="mark x" viewBox="0 0 100 100">
    <path d="M 22 22 L 78 78" />
    <path d="M 78 22 L 22 78" />
  </svg>`;
}
function oMarkSVG(){
  return `<svg class="mark o" viewBox="0 0 100 100">
    <path d="M 50 12 A 38 38 0 1 1 49.9 12" />
  </svg>`;
}

function animateMark(cell, delayBetweenStrokes = 90){
  const paths = cell.querySelectorAll('.mark path');
  paths.forEach((path, idx) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    setTimeout(() => {
      void path.getBoundingClientRect();
      path.style.strokeDashoffset = 0;
    }, idx * delayBetweenStrokes);
  });
}

function buildBoard(){
  boardEl.innerHTML = '';
  board.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'cell';
    btn.setAttribute('role', 'gridcell');
    btn.setAttribute('aria-label', `Cell ${i + 1}, empty`);
    btn.dataset.index = i;
    btn.addEventListener('click', onCellClick);
    boardEl.appendChild(btn);
  });
}

function onCellClick(e){
  const i = Number(e.currentTarget.dataset.index);
  if (gameOver || board[i] || cpuThinking) return;
  placeMark(i, current);

  const result = evaluateBoard(board);
  if (result){
    finishGame(result);
    return;
  }

  swapTurn();

  if (mode === 'cpu' && current === 'O' && !gameOver){
    cpuThinking = true;
    setStatus('Computer is thinking…');
    setTimeout(cpuMove, 450);
  }
}

function placeMark(i, mark){
  board[i] = mark;
  const cell = boardEl.children[i];
  cell.innerHTML = mark === 'X' ? xMarkSVG() : oMarkSVG();
  cell.disabled = true;
  cell.setAttribute('aria-label', `Cell ${i + 1}, ${mark}`);
  animateMark(cell);
}

function swapTurn(){
  current = current === 'X' ? 'O' : 'X';
  turnMarkEl.textContent = current;
  turnMarkEl.classList.toggle('o', current === 'O');
  const msg = mode === 'cpu' && current === 'O'
    ? "Computer's turn"
    : `${current}'s turn to draw`;
  setStatus(msg);
}

function setStatus(msg){
  statusMsg.textContent = msg;
}

function evaluateBoard(b){
  for (const line of WIN_LINES){
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]){
      return { winner: b[a], line };
    }
  }
  if (b.every(cell => cell)) return { winner: null, line: null };
  return null;
}

function finishGame(result){
  gameOver = true;
  cpuThinking = false;

  if (result.winner){
    result.line.forEach(i => boardEl.children[i].classList.add('winner'));
    drawWinLine(result.line);
    scores[result.winner]++;
    updateScoreboard();

    const isComputer = mode === 'cpu' && result.winner === 'O';
    showAnnouncement(result.winner, isComputer);
    flashScore(result.winner);
  } else {
    scores.Draw++;
    updateScoreboard();
    showAnnouncement(null, false);
    flashScore('Draw');
  }

  turnIndicator.style.opacity = '0.45';
  [...boardEl.children].forEach(c => c.disabled = true);
}

function showAnnouncement(winner, isComputer){
  announceBanner.classList.remove('win-x', 'win-o', 'win-draw');
  announceIcon.classList.remove('icon-x', 'icon-o', 'icon-draw');

  if (winner === 'X'){
    announceBanner.classList.add('win-x');
    announceIcon.classList.add('icon-x');
    announceIcon.innerHTML = '<path d="M22 22 L78 78 M78 22 L22 78"/>';
    announceHeadline.textContent = 'X Wins!';
    burstConfetti(['#ff8a6d', '#f4efe2']);
  } else if (winner === 'O'){
    announceBanner.classList.add('win-o');
    announceIcon.classList.add('icon-o');
    announceIcon.innerHTML = '<circle cx="50" cy="50" r="34" fill="none"/>';
    announceHeadline.textContent = isComputer ? 'Computer Wins!' : 'O Wins!';
    burstConfetti(['#7fdcd0', '#f4efe2']);
  } else {
    announceBanner.classList.add('win-draw');
    announceIcon.classList.add('icon-draw');
    announceIcon.innerHTML = '<path d="M22 50 h56 M50 22 v56" transform="rotate(45 50 50)"/>';
    announceHeadline.textContent = "It's a Draw!";
    burstConfetti(['#e8c468', '#f4efe2']);
  }

  announceBanner.classList.add('show');
}

function burstConfetti(colors){
  announceConfetti.innerHTML = '';
  const pieceCount = 14;
  for (let i = 0; i < pieceCount; i++){
    const piece = document.createElement('span');
    const angle = (Math.PI * 2 * i) / pieceCount + Math.random() * 0.4;
    const distance = 60 + Math.random() * 40;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    piece.style.setProperty('--tx', `${tx}px`);
    piece.style.setProperty('--ty', `${ty}px`);
    piece.style.setProperty('--tr', `${Math.random() * 360}deg`);
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${200 + Math.random() * 150}ms`;
    announceConfetti.appendChild(piece);
  }
}

function flashScore(key){
  scoreItems.forEach(item => {
    const label = item.querySelector('.score-label').textContent.trim();
    const matches = (key === 'X' && label === 'X') ||
                     (key === 'O' && label === 'O') ||
                     (key === 'Draw' && label === 'Draw');
    if (matches){
      item.classList.remove('win-flash');
      void item.getBoundingClientRect();
      item.classList.add('win-flash');
    }
  });
}

function drawWinLine(line){
  const [start, , end] = line;
  const [x1, y1] = CELL_CENTER[start];
  const [x2, y2] = CELL_CENTER[end];
  winStrokeEl.setAttribute('x1', x1);
  winStrokeEl.setAttribute('y1', y1);
  winStrokeEl.setAttribute('x2', x2);
  winStrokeEl.setAttribute('y2', y2);
  winStrokeEl.classList.remove('show');
  void winStrokeEl.getBoundingClientRect();
  winStrokeEl.classList.add('show');
}

function updateScoreboard(){
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
  scoreDrawEl.textContent = scores.Draw;
}

function cpuMove(){
  const i = bestMove(board);
  placeMark(i, 'O');

  const result = evaluateBoard(board);
  cpuThinking = false;

  if (result){
    finishGame(result);
    return;
  }
  swapTurn();
}

function bestMove(b){
  let best = { score: -Infinity, index: -1 };
  for (let i = 0; i < 9; i++){
    if (b[i]) continue;
    b[i] = 'O';
    const score = minimax(b, 0, false);
    b[i] = null;
    if (score > best.score){
      best = { score, index: i };
    }
  }
  return best.index;
}

function minimax(b, depth, isMaximizing){
  const result = evaluateBoard(b);
  if (result){
    if (result.winner === 'O') return 10 - depth;
    if (result.winner === 'X') return depth - 10;
    return 0;
  }

  if (isMaximizing){
    let best = -Infinity;
    for (let i = 0; i < 9; i++){
      if (b[i]) continue;
      b[i] = 'O';
      best = Math.max(best, minimax(b, depth + 1, false));
      b[i] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++){
      if (b[i]) continue;
      b[i] = 'X';
      best = Math.min(best, minimax(b, depth + 1, true));
      b[i] = null;
    }
    return best;
  }
}

function resetBoard(){
  board = Array(9).fill(null);
  current = 'X';
  gameOver = false;
  cpuThinking = false;
  turnMarkEl.textContent = 'X';
  turnMarkEl.classList.remove('o');
  turnIndicator.style.opacity = '1';
  setStatus('X draws first');
  winStrokeEl.classList.remove('show');
  announceBanner.classList.remove('show', 'win-x', 'win-o', 'win-draw');
  announceConfetti.innerHTML = '';
  buildBoard();
}

resetBtn.addEventListener('click', resetBoard);

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.mode;

    bannerMode.innerHTML = mode === 'cpu'
      ? `<svg class="mini-mark mini-x" viewBox="0 0 24 24"><path d="M5 5 L19 19 M19 5 L5 19"/></svg> Player <em>vs</em> Computer <svg class="mini-cpu" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="11" rx="1.5"/><path d="M9 20h6M12 17v3"/></svg>`
      : `<svg class="mini-mark mini-x" viewBox="0 0 24 24"><path d="M5 5 L19 19 M19 5 L5 19"/></svg> Player <em>vs</em> Player <svg class="mini-mark mini-o" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>`;

    scores.X = 0; scores.O = 0; scores.Draw = 0;
    updateScoreboard();
    resetBoard();
  });
});

buildBoard();
updateScoreboard();