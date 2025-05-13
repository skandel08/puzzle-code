/* Simple puzzle loader — generic for every module */
console.log('Puzzle Code booting…');

const params    = new URLSearchParams(window.location.search);
const puzzleKey = params.get('puzzle') || 'ApplesBananas';

try {
  // 1 – load the requested puzzle module (ES-module syntax)
  const module = await import(`./puzzles/${puzzleKey}.js`);

  // 2 – if it provides a toolbar builder, let it inject controls
  const ctrlHost = document.getElementById('controls');
  if (module.renderControls && ctrlHost) {
    module.renderControls(ctrlHost);
  }

  // 3 – generate a model and render the first puzzle (index 1)
  if (typeof module.generate === 'function' &&
      typeof module.renderPuzzle === 'function') {

    const data = module.generate();                      // create puzzle model
    document.getElementById('puzzleArea')                // insert into page
            .appendChild(module.renderPuzzle(1, data));

  } else {
    console.error(`${puzzleKey}.js is missing generate() or renderPuzzle()`);
  }

} catch (err) {
  console.error(`Could not load puzzle "${puzzleKey}"`, err);
  document.body.innerHTML =
    `<p style="color:red">Puzzle "${puzzleKey}" not found.</p>`;
}
