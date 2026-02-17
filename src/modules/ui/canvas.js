import { getState, setState } from '../state.js';

export function initCanvas() {
  setTimeout(() => {
    const sigCanvas = document.getElementById('sigCanvas');
    const r = sigCanvas.getBoundingClientRect();
    sigCanvas.width = r.width * 2;
    sigCanvas.height = r.height * 2;
    const sigCtx = sigCanvas.getContext('2d');
    sigCtx.scale(2, 2);
    sigCtx.lineWidth = 2.5;
    sigCtx.lineCap = 'round';
    sigCtx.lineJoin = 'round';
    sigCtx.strokeStyle = '#1a1a1a';
    setState('sigCanvas', sigCanvas);
    setState('sigCtx', sigCtx);

    sigCanvas.addEventListener('touchstart', startDraw, { passive: false });
    sigCanvas.addEventListener('touchmove', draw, { passive: false });
    sigCanvas.addEventListener('touchend', endDraw);
    sigCanvas.addEventListener('mousedown', startDraw);
    sigCanvas.addEventListener('mousemove', draw);
    sigCanvas.addEventListener('mouseup', endDraw);
    sigCanvas.addEventListener('mouseleave', endDraw);
  }, 100);
}

function getPos(e) {
  const { sigCanvas } = getState();
  const r = sigCanvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] : e;
  return { x: t.clientX - r.left, y: t.clientY - r.top };
}

function startDraw(e) {
  e.preventDefault();
  setState('isDrawing', true);
  const p = getPos(e);
  const { sigCtx } = getState();
  sigCtx.beginPath();
  sigCtx.moveTo(p.x, p.y);
}

function draw(e) {
  if (!getState().isDrawing) return;
  e.preventDefault();
  const p = getPos(e);
  const { sigCtx } = getState();
  sigCtx.lineTo(p.x, p.y);
  sigCtx.stroke();
}

function endDraw() {
  setState('isDrawing', false);
}

export function clearCanvas() {
  const { sigCtx, sigCanvas } = getState();
  if (sigCtx && sigCanvas) sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
}
