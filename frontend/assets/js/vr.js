// vr.js – 360° Cubemap viewer dùng Three.js

import { API_BASE } from './app.js';

let renderer = null;
let animId   = null;

export async function loadVR(place) {
  const sec = document.getElementById('vrSection');
  sec.classList.add('show');
  sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  document.getElementById('vrLoading').style.display = 'flex';
  document.getElementById('vrHint').style.display    = 'none';

  try {
    const res = await fetch(`${API_BASE}/place/${place}`);
    if (!res.ok) throw new Error('not found');
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    initThreeJS(data.images);
  } catch {
    initFallback(place);
  }
}

export function exitVR() {
  stopVR();
  document.getElementById('vrSection').classList.remove('show');
  const canvas = document.getElementById('vrCanvas');
  canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
}

// ── Three.js Cubemap ──────────────────────────────────────────────────
function initThreeJS(imageUrls) {
  // imageUrls từ backend: ["/static/vr/halong/px.jpg", ...]
  // Thứ tự cubemap Three.js: px, nx, py, ny, pz, nz
  const fullUrls = imageUrls.map(u => API_BASE + u);

  if (!window.THREE) {
    // Load Three.js dynamically nếu chưa có
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => buildScene(fullUrls);
    document.head.appendChild(script);
  } else {
    buildScene(fullUrls);
  }
}

function buildScene(urls) {
  const container = document.getElementById('vrContainer');
  const canvas    = document.getElementById('vrCanvas');

  stopVR(); // cleanup trước

  const W = container.clientWidth;
  const H = container.clientHeight;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(75, W / H, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Load cubemap texture
  const loader  = new THREE.CubeTextureLoader();
  const texture = loader.load(
    urls,
    () => {
      // Loaded
      document.getElementById('vrLoading').style.display = 'none';
      document.getElementById('vrHint').style.display    = '';
    },
    undefined,
    () => initFallback(null) // error fallback
  );
  scene.background = texture;

  // Drag to look around
  let isDragging = false;
  let prev = { x: 0, y: 0 };
  let lon = 0, lat = 0;
  let targetLon = 0, targetLat = 0;

  canvas.addEventListener('mousedown', e => { isDragging = true; prev = { x: e.clientX, y: e.clientY }; });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    targetLon -= (e.clientX - prev.x) * 0.3;
    targetLat += (e.clientY - prev.y) * 0.15;
    targetLat  = Math.max(-85, Math.min(85, targetLat));
    prev = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('mouseup', () => { isDragging = false; });

  // Touch
  canvas.addEventListener('touchstart',  e => { isDragging = true; prev = { x: e.touches[0].clientX, y: e.touches[0].clientY }; });
  canvas.addEventListener('touchmove',   e => {
    if (!isDragging) return;
    e.preventDefault();
    targetLon -= (e.touches[0].clientX - prev.x) * 0.3;
    targetLat += (e.touches[0].clientY - prev.y) * 0.15;
    targetLat  = Math.max(-85, Math.min(85, targetLat));
    prev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: false });
  canvas.addEventListener('touchend', () => { isDragging = false; });

  // Scroll to zoom
  canvas.addEventListener('wheel', e => {
    camera.fov = Math.max(30, Math.min(100, camera.fov + e.deltaY * 0.05));
    camera.updateProjectionMatrix();
  });

  // Animate
  function animate() {
    animId = requestAnimationFrame(animate);

    // Smooth lerp
    lon += (targetLon - lon) * 0.08;
    lat += (targetLat - lat) * 0.08;

    const phi   = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon);

    camera.position.set(0, 0, 0);
    camera.lookAt(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    );

    renderer.render(scene, camera);
  }
  animate();

  // Resize
  window.addEventListener('resize', () => {
    const W2 = container.clientWidth;
    const H2 = container.clientHeight;
    camera.aspect = W2 / H2;
    camera.updateProjectionMatrix();
    renderer.setSize(W2, H2);
  });
}

function stopVR() {
  if (animId) { cancelAnimationFrame(animId); animId = null; }
  if (renderer) { renderer.dispose(); renderer = null; }
}

// ── Canvas Fallback (nếu không có ảnh VR) ────────────────────────────
function initFallback(place) {
  document.getElementById('vrLoading').style.display = 'none';
  document.getElementById('vrHint').style.display    = '';

  const canvas    = document.getElementById('vrCanvas');
  const container = document.getElementById('vrContainer');
  canvas.width    = container.clientWidth  || 800;
  canvas.height   = container.clientHeight || 450;
  const ctx = canvas.getContext('2d');

  const isHalong = !place || place === 'halong';
  let yaw = 0, pitch = 0;

  function draw() {
    const W = canvas.width, H = canvas.height;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    if (isHalong) {
      grad.addColorStop(0,   '#0d2b45');
      grad.addColorStop(0.5, '#1a6b8a');
      grad.addColorStop(0.7, '#0e4a6a');
      grad.addColorStop(1,   '#3a2e2e');
    } else {
      grad.addColorStop(0,   '#2a1a0a');
      grad.addColorStop(0.5, '#c47a3a');
      grad.addColorStop(0.7, '#8b4513');
      grad.addColorStop(1,   '#3d2008');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const horizon = H * 0.6 + pitch * 2;

    if (isHalong) {
      // Islands
      for (let i = 0; i < 9; i++) {
        const bx = ((i * 137 + yaw * 1.5) % (W + 200)) - 100;
        const bh = 80 + (i % 3) * 60;
        ctx.fillStyle = '#2a2020';
        ctx.beginPath();
        ctx.moveTo(bx, horizon);
        ctx.quadraticCurveTo(bx + 50, horizon - bh, bx + 100, horizon);
        ctx.fill();
      }
      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (let s = 0; s < 25; s++) {
        ctx.beginPath();
        ctx.arc(((s * 97 + yaw * 0.3) % W), 15 + (s * 17 % (H * 0.3)), 1, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Lanterns
      for (let i = 0; i < 14; i++) {
        const lx  = ((i * 91 + yaw * 0.8) % (W + 60)) - 30;
        const ly  = 50 + (i % 5) * 45;
        const hue = (i * 30) % 360;
        ctx.fillStyle = `hsl(${hue},80%,55%)`;
        ctx.beginPath();
        ctx.ellipse(lx, ly, 12, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `hsla(${hue},80%,70%,0.35)`;
        ctx.beginPath();
        ctx.ellipse(lx, ly, 22, 30, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Houses
      for (let i = 0; i < 7; i++) {
        const hx = ((i * 160 + yaw * 0.5) % (W + 150)) - 75;
        ctx.fillStyle = '#6b4226';
        ctx.fillRect(hx, horizon - 70, 80, 70);
        ctx.fillStyle = '#4a2f18';
        ctx.beginPath();
        ctx.moveTo(hx - 10, horizon - 70);
        ctx.lineTo(hx + 40, horizon - 120);
        ctx.lineTo(hx + 90, horizon - 70);
        ctx.fill();
      }
    }

    // Compass
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(W - 80, 10, 70, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '11px Be Vietnam Pro, sans-serif';
    const deg = ((-yaw / 2) % 360 + 360) % 360;
    ctx.fillText(`${Math.round(deg)}°`, W - 65, 25);
  }

  function animate() {
    animId = requestAnimationFrame(animate);
    draw();
  }
  animate();

  setupDrag(canvas, (dx, dy) => {
    yaw   -= dx * 0.4;
    pitch += dy * 0.2;
    pitch  = Math.max(-60, Math.min(60, pitch));
  });
}

function setupDrag(el, onMove) {
  let dragging = false, last = { x: 0, y: 0 };
  el.addEventListener('mousedown',  e => { dragging = true; last = { x: e.clientX, y: e.clientY }; });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    onMove(e.clientX - last.x, e.clientY - last.y);
    last = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  el.addEventListener('touchstart',  e => { dragging = true; last = { x: e.touches[0].clientX, y: e.touches[0].clientY }; });
  el.addEventListener('touchmove',   e => {
    if (!dragging) return;
    e.preventDefault();
    onMove(e.touches[0].clientX - last.x, e.touches[0].clientY - last.y);
    last = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: false });
  el.addEventListener('touchend', () => { dragging = false; });
}
