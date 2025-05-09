/* Simple puzzle loader */
console.log("Puzzle Code booting…");

const params = new URLSearchParams(window.location.search);
const puzzleKey = params.get('puzzle') || 'ApplesBananas';

try {
  const module = await import(`./puzzles/${puzzleKey}.js`);
  if (typeof module.generate === 'function') {
    const model = module.generate();
    console.log(`${puzzleKey} model:`, model);
  } else {
    console.error(`${puzzleKey}.js has no generate() export`);
  }
} catch (err) {
  console.error(`Could not load puzzle "${puzzleKey}"`, err);
  document.body.innerHTML = `<p style="color:red">Puzzle "${puzzleKey}" not found.</p>`;
}
