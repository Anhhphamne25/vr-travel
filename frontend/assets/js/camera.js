// camera.js – Camera stream, capture, auto-capture countdown

let stream = null;
let autoTimer = null;
let countdownInterval = null;

export async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    const video = document.getElementById('cameraFeed');
    video.srcObject = stream;
    document.getElementById('cameraOverlay').style.display = 'none';
    document.getElementById('btnCapture').disabled = false;
    document.getElementById('btnStartCamera').style.display = 'none';
    document.getElementById('btnStopCamera').style.display = '';

    if (document.getElementById('autoToggle').checked) {
      startAutoCapture();
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  stopAutoCapture();
  const video = document.getElementById('cameraFeed');
  video.srcObject = null;
  document.getElementById('cameraOverlay').style.display = 'flex';
  document.getElementById('btnCapture').disabled = true;
  document.getElementById('btnStartCamera').style.display = '';
  document.getElementById('btnStopCamera').style.display = 'none';
}

export function isStreaming() {
  return !!stream;
}

export async function captureSnapshot() {
  const video  = document.getElementById('cameraFeed');
  const canvas = document.getElementById('cameraCanvas');
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext('2d').drawImage(video, 0, 0);

  // Flash effect
  const flash = document.getElementById('flashEl');
  flash.classList.add('go');
  setTimeout(() => flash.classList.remove('go'), 200);

  return new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
}

export function toggleAuto(onCaptureFn) {
  const on = document.getElementById('autoToggle').checked;
  document.getElementById('autoLabel').textContent = on ? 'Bật' : 'Tắt';
  document.getElementById('intervalRow').style.display = on ? 'flex' : 'none';
  if (on && stream) startAutoCapture(onCaptureFn);
  else stopAutoCapture();
}

export function startAutoCapture(onCaptureFn) {
  stopAutoCapture();
  runCountdown(onCaptureFn);
}

export function stopAutoCapture() {
  clearTimeout(autoTimer);
  clearInterval(countdownInterval);
  document.getElementById('countdownRing').classList.remove('visible');
}

function runCountdown(onCaptureFn) {
  const secs      = parseInt(document.getElementById('intervalSelect').value);
  let remaining   = secs;
  const circle    = document.getElementById('countdownCircle');
  const numEl     = document.getElementById('countdownNum');
  const ring      = document.getElementById('countdownRing');
  const circumference = 2 * Math.PI * 22;

  ring.classList.add('visible');
  numEl.textContent = remaining;
  circle.style.strokeDashoffset = 0;

  setTimeout(() => {
    circle.style.strokeDashoffset = circumference;
  }, 50);

  countdownInterval = setInterval(() => {
    remaining--;
    numEl.textContent = remaining;
    const progress = (secs - remaining) / secs;
    circle.style.strokeDashoffset = progress * circumference;

    if (remaining <= 0) {
      clearInterval(countdownInterval);
      const autoOn = document.getElementById('autoToggle').checked;
      if (stream && autoOn && typeof onCaptureFn === 'function') {
        onCaptureFn().then(() => {
          autoTimer = setTimeout(() => runCountdown(onCaptureFn), 800);
        });
      }
    }
  }, 1000);
}
