/* Simple puzzle loader */
console.log("Puzzle Code booting…");

const params = new URLSearchParams(window.location.search);
const puzzleKey = params.get('puzzle') || 'ApplesBananas';

try {
  const module = await import(`./puzzles/${puzzleKey}.js`);
  if (module.generate && module.renderPuzzle) {
    const data = module.generate();              // create puzzle model
    document.getElementById('puzzleArea')        // insert into page
            .appendChild(module.renderPuzzle(1, data));
  } else {
    console.error(`${puzzleKey}.js is missing generate() or renderPuzzle()`);
  }

} catch (err) {
  console.error(`Could not load puzzle "${puzzleKey}"`, err);
  document.body.innerHTML = `<p style="color:red">Puzzle "${puzzleKey}" not found.</p>`;
}
