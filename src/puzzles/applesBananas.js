/******************************************************
 * Apples & Bananas – browser logic  (v0.6 – prettified)
 ******************************************************/

// =============== Configuration ==================
const MIN_GRID = 3;
const MAX_GRID = 10;
const SUBGRID_CHOICES = [2, 3, 4, 5, 6, 7, 8];

const appleSrc  = 'assets/apple.png';
const bananaSrc = 'assets/banana.png';

// =============== Utility helpers ================
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const blankGrid = n => Array.from({ length: n }, () => Array(n).fill(null));

function countWindow(grid, r0, c0, size) {
  let apples = 0, bananas = 0;
  for (let r = r0; r < r0 + size; r++) {
    for (let c = c0; c < c0 + size; c++) {
      const val = grid[r][c];
      if (val === 'A') apples++;
      else if (val === 'B') bananas++;
    }
  }
  return { apples, bananas };
}

function windowMatches(cnt, clue, target) {
  switch (clue) {
    case 'count':   return cnt.apples === target;
    case 'equal':   return cnt.apples === cnt.bananas && cnt.apples > 0;
    case 'less':    return cnt.apples <  cnt.bananas;
    case 'greater': return cnt.apples >  cnt.bananas;
  }
}

// =============== Puzzle generator ===============
function makePuzzle(N, sub, mode, clue, maxIter = 5000) {
  for (let tries = 0; tries < maxIter; tries++) {
    // 1. random grid
    const grid = blankGrid(N);
    const fillProb = 0.6;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (Math.random() < fillProb) {
          grid[r][c] = (mode === 'apples') ? 'A' : (Math.random() < 0.5 ? 'A' : 'B');
        }
      }
    }

    // 2. target apples for count clue
    const target = clue === 'count' ? randInt(1, sub * sub) : null;

    // 3. scan windows
    const matches = [];
    for (let r = 0; r <= N - sub; r++) {
      for (let c = 0; c <= N - sub; c++) {
        if (windowMatches(countWindow(grid, r, c, sub), clue, target)) {
          matches.push({ r, c, size: sub });
        }
      }
    }

    if (matches.length === 1) {
      return { grid, sol: matches[0], clue, target };
    }
  }
  throw new Error('Could not generate a unique puzzle');
}

// =============== Rendering =======================
function renderPuzzle(idx, data) {
  const { grid, sol, clue, target } = data;
  const N = grid.length;

  // Card container
  const card = document.createElement('div');
  card.className = 'puzzle';
  card.innerHTML = `<div class="title">Puzzle ${idx}</div>`;

  // Grid element
  const gDiv = document.createElement('div');
  gDiv.className = 'grid';
  gDiv.style.gridTemplate = `repeat(${N}, var(--cell)) / repeat(${N}, var(--cell))`;

  grid.flat().forEach(val => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    if (val) {
      const img = document.createElement('img');
      img.src = val === 'A' ? appleSrc : bananaSrc;
      img.alt = val;
      cell.appendChild(img);
    }
    gDiv.appendChild(cell);
  });
  card.appendChild(gDiv);

  // Meta row
  const meta = document.createElement('div');
  meta.className = 'metaRow';

  const clueHTML = {
    count:   `<strong>${target}</strong> <img src="${appleSrc}" style="height:1.1em;vertical-align:middle">`,
    equal:   `# <img src="${appleSrc}" style="height:1.1em;vertical-align:middle"> = # <img src="${bananaSrc}" style="height:1.1em;vertical-align:middle">`,
    less:    `# <img src="${appleSrc}" style="height:1.1em;vertical-align:middle"> &lt; # <img src="${bananaSrc}" style="height:1.1em;vertical-align:middle">`,
    greater: `# <img src="${appleSrc}" style="height:1.1em;vertical-align:middle"> &gt; # <img src="${bananaSrc}" style="height:1.1em;vertical-align:middle">`
  }[clue];

  meta.innerHTML = `<span>${sol.size}×${sol.size}</span><span>${clueHTML}</span>`;
  card.appendChild(meta);

  // Store solution coords
  card.dataset.solR = sol.r;
  card.dataset.solC = sol.c;
  card.dataset.solSize = sol.size;

  return card;
}

function toggleSolutions(show) {
  document.querySelectorAll('.puzzle').forEach(card => {
    const gDiv = card.querySelector('.grid');
    gDiv.querySelector('.solBox')?.remove();
    if (!show) return;

    const size   = +card.dataset.solSize;
    const cellPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell'));
    const left   = +card.dataset.solC * cellPx;
    const top    = +card.dataset.solR * cellPx;

    const box = document.createElement('div');
    box.className   = 'solBox';
    box.style.left  = `${left}px`;
    box.style.top   = `${top}px`;
    box.style.width = `${size * cellPx - 6}px`;
    box.style.height= `${size * cellPx - 6}px`;
    gDiv.appendChild(box);
  });
}

// =============== DOM Wiring ======================
const gridSel  = document.getElementById('gridSizeSel');
const fruitSel = document.getElementById('fruitModeSel');
const subSel   = document.getElementById('subgridSizeSel');
const batchSel = document.getElementById('batchSizeSel');

// Populate selects
for (let n = MIN_GRID; n <= MAX_GRID; n++) {
  gridSel.add(new Option(`${n} × ${n}`, n));
}
SUBGRID_CHOICES.forEach(sz => subSel.add(new Option(`${sz} × ${sz}`, sz)));

function updateSubtitle() {
  document.getElementById('gridSizeTitle').textContent = `${gridSel.value} × ${gridSel.value}`;
}
updateSubtitle();
gridSel.addEventListener('change', updateSubtitle);

let puzzleCount = 0;
function addPuzzle() {
  const data = makePuzzle(
    +gridSel.value,
    +subSel.value,
    fruitSel.value,
    document.getElementById('clueTypeSel').value
  );
  document.getElementById('puzzleArea').appendChild(renderPuzzle(++puzzleCount, data));
}

// --- button handlers ---
document.getElementById('generateBtn').onclick = () => {
  // clear old puzzles
  document.getElementById('puzzleArea').innerHTML = '';
  puzzleCount = 0;
  const num = +batchSel.value;
  for (let i = 0; i < num; i++) {
    try { addPuzzle(); } catch (e) { console.warn('Generation failed, skipping', e); i--; }
  }
};

let solVisible = false;
document.getElementById('toggleSolutionsBtn').onclick = e => {
  solVisible = !solVisible;
  e.target.textContent = solVisible ? 'Hide solutions' : 'Show solutions';
  toggleSolutions(solVisible);
};

document.getElementById('downloadPdfBtn').onclick = () => {
  document.getElementById('exportNotice').style.display = 'block';
  try { window.print(); }
  finally { document.getElementById('exportNotice').style.display = 'none'; }
};

export function generate() {
  // 4×4 grid, 2×2 window, apples-only mode, exact-count clue
  return makePuzzle(4, 2, 'apples', 'count');
}

// re-use existing renderer & toggle
export { renderPuzzle, toggleSolutions };

