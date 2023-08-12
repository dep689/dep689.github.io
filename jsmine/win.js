/** Canvas Confetti
 * https://www.kirilv.com/canvas-confetti/
 */

function win() {
  var end = Date.now() + (15 * 1000);
  var colors = ["#fb5824", "#fb5824", "#ff275b", "#fca24a", "#ff772a", "#fe2525"];
  confetti({
    particleCount: 2,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
    colors: colors
  });
  confetti({
    particleCount: 2,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
    colors: colors
  });
  
  if (Date.now() < end) {
    requestAnimationFrame(win);
  }
}