import { startCamera, stopCamera, captureSnapshot, toggleAuto, startAutoCapture, isStreaming } from './camera.js';
import { recognizeBlob } from './recognize.js';
import { loadVR, exitVR } from './vr.js';

export const API_BASE = 'http://localhost:8000';

let PLACES_DATA = {};
let uploadedFile = null;

(async function init() {
  try {
    const res = await fetch('./places.json');
    PLACES_DATA = await res.json();
  } catch {
    PLACES_DATA = {
      halong: { name:'Vịnh Hạ Long', location:'Quảng Ninh, Việt Nam', description:'Vịnh Hạ Long là kỳ quan thiên nhiên thế giới với hàng nghìn hòn đảo đá vôi.', highlights:['Di sản UNESCO','Hang Sửng Sốt','Du thuyền đêm'], bestTime:'Tháng 10–4', emoji:'⛵' },
      hoian:  { name:'Phố Cổ Hội An', location:'Quảng Nam, Việt Nam', description:'Hội An là đô thị cổ với ánh đèn lồng và ẩm thực độc đáo.', highlights:['Đèn lồng','Chùa Cầu','Cao lầu'], bestTime:'Tháng 2–8', emoji:'🏮' }
    };
  }

  window.App = {
    switchTab, handleStartCamera, handleStopCamera,
    handleCapture, handleAutoToggle,
    handleFileSelect, handleDrop, removePreview, recognizeUpload,
    handleLoadVR: loadVR, handleExitVR: exitVR
  };
})();

export function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
  if (name === 'upload' && isStreaming()) handleStopCamera();
}

async function handleStartCamera() {
  const ok = await startCamera();
  if (!ok) showStatus('error', 'Không thể truy cập camera. Hãy cấp quyền trong trình duyệt.');
}

function handleStopCamera() {
  stopCamera();
}

async function handleCapture() {
  if (!isStreaming()) return;
  const blob = await captureSnapshot();
  await doRecognize(blob);
}

function handleAutoToggle() {
  toggleAuto(handleCapture);
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) setUploadFile(file);
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dropZone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) setUploadFile(file);
}

function setUploadFile(file) {
  uploadedFile = file;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('previewImg').src = ev.target.result;
    document.getElementById('previewWrap').classList.add('show');
    document.getElementById('dropZone').style.display = 'none';
    document.getElementById('btnRecognizeUpload').disabled = false;
  };
  reader.readAsDataURL(file);
}

function removePreview() {
  uploadedFile = null;
  document.getElementById('previewWrap').classList.remove('show');
  document.getElementById('dropZone').style.display = '';
  document.getElementById('btnRecognizeUpload').disabled = true;
  document.getElementById('fileInput').value = '';
}

async function recognizeUpload() {
  if (!uploadedFile) return;
  await doRecognize(uploadedFile);
}

async function doRecognize(blob) {
  showStatus('loading', 'Đang phân tích hình ảnh…');
  document.getElementById('resultSection').classList.remove('show');

  try {
    const data = await recognizeBlob(blob);
    hideStatus();
    showResult(data);
  } catch {
    hideStatus();
    showStatus('error', 'Không thể kết nối server. Kiểm tra backend đang chạy tại localhost:8000');
  }
}

function showResult(data) {
  const sec       = document.getElementById('resultSection');
  const pct       = Math.round(data.score * 100);
  const placeInfo = PLACES_DATA[data.place];

  let html = '';

  if (data.place === 'unknown' || !placeInfo) {
    html = `
      <div class="result-unknown">
        <div class="icon">🔍</div>
        <h3>Không nhận diện được địa điểm</h3>
        <p>Độ tin cậy quá thấp (${pct}%). Hãy thử ảnh rõ hơn hoặc từ góc khác.</p>
      </div>`;
  } else {
    html = `
      <div class="result-card">
        <div class="result-header">
          <div>
            <div class="result-emoji">${placeInfo.emoji}</div>
            <div class="result-title">
              <h2>${placeInfo.name}</h2>
              <div class="loc">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${placeInfo.location}
              </div>
            </div>
          </div>
          <div class="confidence-badge">✓ ${pct}% chính xác</div>
        </div>
        <div class="result-body">
          <p>${placeInfo.description}</p>
          <div class="highlights">
            ${placeInfo.highlights.map(h => `<span class="highlight-tag">✦ ${h}</span>`).join('')}
          </div>
          <div class="result-meta">
            <span>📅 Thời điểm đẹp nhất: ${placeInfo.bestTime}</span>
          </div>
          <hr class="section-divider" />
          <button class="btn btn-forest" onclick="App.handleLoadVR('${data.place}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Trải nghiệm 360° – ${placeInfo.name}
          </button>
        </div>
      </div>`;
  }

  sec.innerHTML = html;
  sec.classList.add('show');
  sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showStatus(type, msg) {
  const el = document.getElementById('status');
  el.className = 'show ' + type;
  el.innerHTML = type === 'loading'
    ? `<div class="status-spinner"></div>${msg}`
    : `<span>${type === 'error' ? '⚠' : '✓'}</span> ${msg}`;
}

function hideStatus() {
  document.getElementById('status').className = '';
}
