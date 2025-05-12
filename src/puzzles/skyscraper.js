/*  Skyscrapers generator / renderer  –  v1.4-fix1
 *  • N = 3 … 9
 *  • slam-dunk shading (Rules 1-4)  ← numbers & grey cells both show
 *  • fixed printable cell-sizes; extra bottom space → no PDF clipping
 *  • ResizeObserver keeps SVGs from overflowing on narrow windows
 *  © 2025 – free to re-use
 */

  /* ─────────── helpers ─────────── */
  const clone = b => b.map(r => r.slice());

  /* quick latin square */
  function latinSquare(N) {
    const base = [...Array(N).keys()].map(x => x + 1);
    const g = [];
    for (let r = 0; r < N; r++) g.push(base.map(x => ((x + r) % N) + 1));
    for (let c = 0; c < N; c++) {
      const s = Math.random() * N | 0;
      for (let r = 0; r < N; r++) [g[r][c], g[r][s]] = [g[r][s], g[r][c]];
    }
    return g;
  }

  /* visible count */
  const see = arr => { let m = 0, k = 0; for (const v of arr) if (v > m) { m = v; k++; } return k; };

  function deriveClues(grid) {
    const N = grid.length, t = [], b = [], l = [], r = [];
    for (let c = 0; c < N; c++) {
      const col = grid.map(row => row[c]);
      t.push(see(col)); b.push(see([...col].reverse()));
    }
    for (const row of grid) { l.push(see(row)); r.push(see([...row].reverse())); }
    return { top: t, bottom: b, left: l, right: r };
  }

  /* slam-dunk cells (Rules 1-4) */
  function slamCells({ top, bottom, left, right }) {
    const N = top.length, out = [], mark = (r, c) => out.push({ r, c });

    /* Rule 1 – clue 1 ⇒ tallest (N) at the border */
    top.   forEach((v, c) => v === 1 && mark(0,      c));
    bottom.forEach((v, c) => v === 1 && mark(N - 1,  c));
    left.  forEach((v, r) => v === 1 && mark(r,      0));
    right. forEach((v, r) => v === 1 && mark(r, N - 1));

    /* Rule 2 – clue N forces entire order 1…N (shade all) */
    top.   forEach((v, c) => { if (v === N) for (let r = 0; r < N; r++) mark(r,         c); });
    bottom.forEach((v, c) => { if (v === N) for (let r = 0; r < N; r++) mark(N - 1 - r, c); });
    left.  forEach((v, r) => { if (v === N) for (let c = 0; c < N; c++) mark(r,         c); });
    right. forEach((v, r) => { if (v === N) for (let c = 0; c < N; c++) mark(r, N - 1 - c); });

    /* Rule 3 – opposite clues sum to N+1 ⇒ tallest tower position */
    for (let c = 0; c < N; c++) if (top[c] + bottom[c] === N + 1)   mark(top[c]   - 1, c);
    for (let r = 0; r < N; r++) if (left[r] + right[r] === N + 1)   mark(r, left[r] - 1);

    /* Rule 4 (1 opposite 2 ⇒ N-1 next to N) doesn’t add new slams */

    return out;
  }

  /* ─────────── puzzle factory ─────────── */
  const makePuzzle = N => {
    const grid  = latinSquare(N);
    const clues = deriveClues(grid);
    const slams = slamCells(clues);
    return { size: N, grid, clues, slams };
  };

  /* ─────────── SVG renderer ─────────── */
  function render({ grid, clues, slams }) {
    const N     = grid.length;
    const CELL  = (N <= 4 ? 42 : N === 5 ? 34 : N === 6 ? 30 : 24);
    const PAD   = 18;
    const BOX   = CELL * N + PAD * 2 + 20;   // +20 bottom padding
    const NS    = 'http://www.w3.org/2000/svg';

    const svg   = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${BOX} ${BOX}`);

    /* grid */
    for (let i = 0; i <= N; i++) {
      const y = PAD + i * CELL, x = y;
      [['x1', PAD, 'y1', y, 'x2', PAD + N * CELL, 'y2', y],
       ['x1', x, 'y1', PAD, 'x2', x, 'y2', PAD + N * CELL]]
      .forEach(arr => {
        const ln = document.createElementNS(NS, 'line');
        for (let k = 0; k < arr.length; k += 2) ln.setAttribute(arr[k], arr[k + 1]);
        ln.setAttribute('stroke', 'black');
        ln.setAttribute('stroke-width', i && i !== N ? 1 : 2);
        svg.appendChild(ln);
      });
    }

    const text = (x, y, t, cls) => {
      const e = document.createElementNS(NS, 'text');
      e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('class', cls);
      e.textContent = t; return e;
    };

    /* clues */
    clues.top.   forEach((v, c) => svg.appendChild(text(PAD + c * CELL + CELL / 2, PAD - 10, v, 'clue')));
    clues.bottom.forEach((v, c) => svg.appendChild(text(PAD + c * CELL + CELL / 2, PAD + N * CELL + 18, v, 'clue')));
    clues.left.  forEach((v, r) => svg.appendChild(text(PAD - 10, PAD + r * CELL + CELL / 2 + 4, v, 'clue')));
    clues.right. forEach((v, r) => svg.appendChild(text(PAD + N * CELL + 10, PAD + r * CELL + CELL / 2 + 4, v, 'clue')));

    /* solutions layer */
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'solutions');
    g.style.display = 'none';

    /* shaded slams */
    slams.forEach(({ r, c }) => {
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', PAD + c * CELL + 1);
      rect.setAttribute('y', PAD + r * CELL + 1);
      rect.setAttribute('width', CELL - 2); rect.setAttribute('height', CELL - 2);
      rect.setAttribute('class', 'slam'); g.appendChild(rect);
    });

    /* numbers */
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        g.appendChild(text(PAD + c * CELL + CELL / 2, PAD + r * CELL + CELL / 2 + 4,
                           grid[r][c], 'cell-text'));

    svg.appendChild(g);
    return svg;
  }

  /* Previous page builder and shrink SVG's and init commented out 

  const page      = document.getElementById('page');
  const sizeSel   = document.getElementById('size');
  const layoutSel = document.getElementById('layout');
  const genBtn    = document.getElementById('generate');
  const toggleBtn = document.getElementById('toggle');
  const pdfTitle  = document.getElementById('pdfTitle');

  let puzzles   = [];
  let solutions = false;

  const rebuild = (regen) => {
    const N           = +sizeSel.value;
    const [rows, cols] = { '3x2': [3, 2], '2x2': [2, 2], '1x1': [1, 1] }[layoutSel.value];
    const need        = rows * cols;

    page.style.gridTemplateColumns = `repeat(${cols}, auto)`;
    page.style.gridRowGap          = '0.4in';
    page.style.gridColumnGap       = '0.4in';
    pdfTitle.textContent           = `Skyscrapers ${N}×${N}`;

    if (regen || puzzles.length !== need || puzzles[0]?.size !== N) {
      puzzles = Array.from({ length: need }, () => makePuzzle(N));
    }

    page.innerHTML = '';
    puzzles.forEach((p, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'skyscraper-wrap';
      wrap.appendChild(Object.assign(document.createElement('div'), {
        className: 'puzzle-title',
        textContent: `Puzzle #${i + 1}`
      }));
      wrap.appendChild(render(p));
      page.appendChild(wrap);
    });
  };

  genBtn.onclick   =
  sizeSel.onchange =
  layoutSel.onchange = () => rebuild(true);

  toggleBtn.onclick = () => {
    solutions = !solutions;
    toggleBtn.textContent = solutions ? 'Hide Solutions' : 'Show Solutions';
    page.querySelectorAll('.solutions')
        .forEach(g => g.style.display = solutions ? 'block' : 'none');
  };

  
  new ResizeObserver(() => {
    const maxW = document.body.clientWidth - 40;           // margin
    const cols = { '3x2': 2, '2x2': 2, '1x1': 1 }[layoutSel.value];
    const each = maxW / cols;
    page.querySelectorAll('svg').forEach(svg => svg.style.maxWidth = `${each}px`);
  }).observe(document.body);

  
  rebuild(true);

*/

// ---------- ES-module exports for the new loader ----------
export function generate() {
  return makePuzzle(5);          // 5×5 by default
}

export function renderPuzzle(idx, data) {
  return render(data);           // ignore idx, reuse existing render()
}

