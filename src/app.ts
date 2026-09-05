import './style.css';
import { coverCrop, mapFaceBox, type Box, type Crop } from './geometry';
import { drawEffect, drawPostcardFrame, type EffectName } from './effects';
import { blobToDataUrl, configureStorage, dataUrlToBlob, deletePostcard, isSavedSettings, loadPostcard, loadSettings, resetCurrentStorage, savePostcard, saveSettings, type SavedSettings } from './storage';

type SourceMode = 'idle' | 'preview' | 'camera';
type DetectedFace = { boundingBox: DOMRectReadOnly };
type FaceDetectorLike = { detect(input: HTMLVideoElement): Promise<DetectedFace[]> };
type FaceDetectorConstructor = new (options: { fastMode: boolean; maxDetectedFaces: number }) => FaceDetectorLike;

const isDemo = new URLSearchParams(window.location.search).get('demo') === '1';
const demoSettings: SavedSettings = {
  effect: 'confetti',
  timer: 0,
  mirror: true,
  frozen: false,
  caption: 'Mina and Jo\'s garden party'
};

configureStorage(isDemo ? 'demo' : 'real');
if (isDemo) {
  document.title = 'Demo — Postcard FX';
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', 'https://camera-effect-postcard.sociobot.in/?demo=1');
}

const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;
const video = $('#camera-video') as HTMLVideoElement;
const previewImage = $('#preview-image') as HTMLImageElement;
const effectsCanvas = $('#effects-canvas') as HTMLCanvasElement;
const stage = $('#stage') as HTMLElement;
const status = $('#camera-status') as HTMLElement;
const cameraButton = $('#camera-button') as HTMLButtonElement;
const previewButton = $('#preview-button') as HTMLButtonElement;
const switchButton = $('#switch-button') as HTMLButtonElement;
const captureButton = $('#capture-button') as HTMLButtonElement;
const countdownEl = $('#countdown') as HTMLElement;
const modeLabel = $('#mode-label') as HTMLElement;
const timerSelect = $('#timer-select') as HTMLSelectElement;
const mirrorToggle = $('#mirror-toggle') as HTMLInputElement;
const motionToggle = $('#motion-toggle') as HTMLInputElement;
const captionInput = $('#caption-input') as HTMLInputElement;
const characterCount = $('#character-count') as HTMLElement;
const result = $('#result') as HTMLElement;
const resultImage = $('#result-image') as HTMLImageElement;
const downloadLink = $('#download-link') as HTMLAnchorElement;
const shareButton = $('#share-button') as HTMLButtonElement;
const restoreButton = $('#restore-button') as HTMLButtonElement;
const toast = $('#toast') as HTMLElement;
const toastText = $('#toast-text') as HTMLElement;
const toastAction = $('#toast-action') as HTMLButtonElement;
const demoBanner = $('#demo-banner') as HTMLElement;
const resetDemoButton = $('#reset-demo') as HTMLButtonElement;
const startRealButton = $('#start-real') as HTMLButtonElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

let sourceMode: SourceMode = 'idle';
let effect: EffectName = 'orbit';
let mediaStream: MediaStream | null = null;
let facingMode: 'user' | 'environment' = 'user';
let faceDetector: FaceDetectorLike | null = null;
let detectedFace: Box | null = null;
let detectionBusy = false;
let lastDetection = 0;
let animationFrame = 0;
let latestBlob: Blob | null = null;
let latestUrl = '';
let captureBusy = false;
let deferredInstall: Event | null = null;

function announce(message: string, error = false) {
  status.textContent = message;
  status.classList.toggle('is-error', error);
}

function showToast(message: string, action = false) {
  toastText.textContent = message;
  toastAction.hidden = !action;
  toast.hidden = false;
  if (!action) window.setTimeout(() => { toast.hidden = true; }, 4200);
}

function currentSettings(): SavedSettings {
  return { effect, timer: Number(timerSelect.value), mirror: mirrorToggle.checked, frozen: motionToggle.checked, caption: captionInput.value };
}

function persistSettings() { saveSettings(currentSettings()); }

function motionIsFrozen() { return motionToggle.checked || reducedMotion.matches; }

function restoreSettings() {
  const { settings: saved, recovered } = loadSettings();
  if (!saved) return recovered;
  if (['orbit', 'rays', 'confetti'].includes(saved.effect)) selectEffect(saved.effect as EffectName, false);
  timerSelect.value = String([0, 3, 10].includes(saved.timer) ? saved.timer : 3);
  mirrorToggle.checked = saved.mirror;
  motionToggle.checked = saved.frozen;
  captionInput.value = saved.caption;
  return recovered;
}

function updateCharacterCount() { characterCount.textContent = `${captionInput.value.length} / 42`; }

function selectEffect(next: EffectName, persist = true) {
  effect = next;
  document.querySelectorAll<HTMLButtonElement>('[data-effect]').forEach((button) => {
    const selected = button.dataset.effect === next;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  if (persist) persistSettings();
}

function stopCamera() {
  mediaStream?.getTracks().forEach((track) => track.stop());
  mediaStream = null;
  video.srcObject = null;
  detectedFace = null;
}

function setMode(mode: SourceMode) {
  sourceMode = mode;
  const camera = mode === 'camera';
  video.hidden = !camera;
  previewImage.hidden = camera;
  video.classList.toggle('is-mirrored', camera && mirrorToggle.checked);
  modeLabel.textContent = camera ? 'Live · on-device' : mode === 'preview' ? 'No-camera preview' : 'Preview mode';
  switchButton.hidden = !camera || !mediaStream || mediaStream.getVideoTracks().length === 0;
  captureButton.disabled = mode === 'idle';
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    announce('This browser cannot open a camera here. Use the no-camera preview instead.', true);
    previewButton.focus();
    return;
  }
  cameraButton.disabled = true;
  cameraButton.textContent = 'Opening camera…';
  announce('Waiting for camera permission…');
  stopCamera();
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1440 } },
      audio: false
    });
    video.srcObject = mediaStream;
    await video.play();
    setMode('camera');
    const Detector = (window as unknown as { FaceDetector?: FaceDetectorConstructor }).FaceDetector;
    faceDetector = Detector ? new Detector({ fastMode: true, maxDetectedFaces: 1 }) : null;
    announce(faceDetector ? 'Camera ready. The geometric effect follows your face on this device.' : 'Camera ready. Your browser uses the centered portrait guide for the effect.');
  } catch (error) {
    stopCamera();
    setMode('idle');
    const denied = error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError');
    announce(denied ? 'Camera permission was not granted. Nothing was captured—try the no-camera preview.' : 'The camera could not start. Check that another app is not using it, or try preview mode.', true);
    previewButton.focus();
  } finally {
    cameraButton.disabled = false;
    cameraButton.innerHTML = '<span aria-hidden="true">◉</span> Use my camera';
  }
}

function usePreview(focusCapture = true) {
  stopCamera();
  setMode('preview');
  announce('No-camera preview ready. The downloaded postcard uses the abstract portrait shown here.');
  if (focusCapture) captureButton.focus();
}

function canvasFace(width: number, height: number, crop?: Crop): Box {
  if (sourceMode === 'camera' && detectedFace && crop) return mapFaceBox(detectedFace, crop, width, height, mirrorToggle.checked);
  return { x: width * .31, y: height * .18, width: width * .38, height: height * .34 };
}

async function detectFace(now: number) {
  if (!faceDetector || detectionBusy || now - lastDetection < 280 || video.readyState < 2) return;
  detectionBusy = true; lastDetection = now;
  try {
    const faces = await faceDetector.detect(video);
    if (faces[0]) {
      const box = faces[0].boundingBox;
      detectedFace = { x: box.x, y: box.y, width: box.width, height: box.height };
    }
  } catch {
    faceDetector = null;
    announce('Camera ready. Face following is unavailable, so the effect uses the centered portrait guide.');
  } finally { detectionBusy = false; }
}

function sizeCanvas() {
  const rect = stage.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(rect.width * scale);
  const height = Math.round(rect.height * scale);
  if (effectsCanvas.width !== width || effectsCanvas.height !== height) { effectsCanvas.width = width; effectsCanvas.height = height; }
}

function render(now: number) {
  sizeCanvas();
  const ctx = effectsCanvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);
    let crop: Crop | undefined;
    if (sourceMode === 'camera' && video.videoWidth) crop = coverCrop(video.videoWidth, video.videoHeight, effectsCanvas.width, effectsCanvas.height);
    drawEffect(ctx, effectsCanvas.width, effectsCanvas.height, canvasFace(effectsCanvas.width, effectsCanvas.height, crop), effect, now, motionIsFrozen());
    drawPostcardFrame(ctx, effectsCanvas.width, effectsCanvas.height, captionInput.value);
  }
  if (sourceMode === 'camera') void detectFace(now);
  animationFrame = requestAnimationFrame(render);
}

function wait(ms: number) { return new Promise<void>((resolve) => window.setTimeout(resolve, ms)); }

async function runCountdown() {
  const seconds = Number(timerSelect.value);
  for (let value = seconds; value > 0; value -= 1) {
    countdownEl.textContent = String(value);
    countdownEl.setAttribute('aria-label', `${value}`);
    status.textContent = `Photo in ${value}…`;
    await wait(1000);
    countdownEl.textContent = '';
    void countdownEl.offsetWidth;
  }
  countdownEl.textContent = '';
}

function drawSource(ctx: CanvasRenderingContext2D, source: CanvasImageSource, sourceWidth: number, sourceHeight: number, crop: Crop, mirrored: boolean) {
  ctx.save();
  if (mirrored) { ctx.translate(1200, 0); ctx.scale(-1, 1); }
  ctx.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, 1200, 1500);
  ctx.restore();
}

async function makePostcard(quiet = false) {
  if (captureBusy || sourceMode === 'idle') return;
  captureBusy = true; captureButton.disabled = true;
  try {
    await runCountdown();
    const output = document.createElement('canvas'); output.width = 1200; output.height = 1500;
    const ctx = output.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas is unavailable');
    let crop: Crop;
    if (sourceMode === 'camera') {
      if (!video.videoWidth) throw new Error('The camera frame is not ready');
      crop = coverCrop(video.videoWidth, video.videoHeight, output.width, output.height);
      drawSource(ctx, video, video.videoWidth, video.videoHeight, crop, mirrorToggle.checked);
    } else {
      if (!previewImage.complete) await previewImage.decode();
      crop = coverCrop(previewImage.naturalWidth, previewImage.naturalHeight, output.width, output.height);
      drawSource(ctx, previewImage, previewImage.naturalWidth, previewImage.naturalHeight, crop, false);
    }
    drawEffect(ctx, output.width, output.height, canvasFace(output.width, output.height, crop), effect, performance.now(), motionIsFrozen());
    drawPostcardFrame(ctx, output.width, output.height, captionInput.value.trim());
    const blob = await new Promise<Blob>((resolve, reject) => output.toBlob((value) => value ? resolve(value) : reject(new Error('PNG export failed')), 'image/png'));
    await displayResult(blob, true, !quiet);
    stopCamera();
    setMode('idle');
    announce('Postcard made. Your camera has stopped.');
  } catch {
    announce('The postcard could not be made. Try again, or switch to no-camera preview.', true);
  } finally { captureBusy = false; captureButton.disabled = !mediaStream && sourceMode !== 'preview'; }
}

async function displayResult(blob: Blob, save: boolean, moveFocus = true) {
  latestBlob = blob;
  if (latestUrl) URL.revokeObjectURL(latestUrl);
  latestUrl = URL.createObjectURL(blob);
  resultImage.src = latestUrl; downloadLink.href = latestUrl;
  result.hidden = false; restoreButton.hidden = false;
  if (save) await savePostcard(blob);
  if (moveFocus) {
    result.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    downloadLink.focus({ preventScroll: true });
  }
}

async function sharePostcard() {
  if (!latestBlob) return;
  const file = new File([latestBlob], 'postcard-fx.png', { type: 'image/png' });
  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    try { await navigator.share({ title: 'My Postcard FX', text: 'A private camera postcard made with Postcard FX.', files: [file] }); }
    catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) showToast('Sharing did not open. Download the PNG instead.'); }
  } else { showToast('File sharing is not available here. Download the PNG instead.'); downloadLink.focus(); }
}

async function removeLocalCopy() {
  if (!window.confirm('Delete the saved postcard from this device? A PNG you already downloaded will not be affected.')) return;
  await deletePostcard(); latestBlob = null;
  if (latestUrl) URL.revokeObjectURL(latestUrl); latestUrl = '';
  result.hidden = true; restoreButton.hidden = true;
  showToast('The local postcard copy was deleted.');
  cameraButton.focus();
}

async function exportData() {
  const savedBlob = await loadPostcard();
  const payload = { product: 'postcard-fx', version: 1, exportedAt: new Date().toISOString(), settings: currentSettings(), postcard: savedBlob ? await blobToDataUrl(savedBlob) : null };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = 'postcard-fx-backup.json'; link.click(); URL.revokeObjectURL(url);
  showToast('Local backup exported.');
}

async function importData(file: File) {
  try {
    const payload: unknown = JSON.parse(await file.text());
    if (!payload || typeof payload !== 'object') throw new Error('Wrong backup format');
    const backup = payload as { product?: unknown; version?: unknown; settings?: unknown; postcard?: unknown };
    if (backup.product !== 'postcard-fx' || backup.version !== 1 || !isSavedSettings(backup.settings)) throw new Error('Wrong backup format');

    // Validate every field before touching either local store. Imports are atomic
    // from the user's point of view: a bad image cannot partially overwrite prefs.
    let postcard: Blob | null = null;
    if (backup.postcard !== null && backup.postcard !== undefined) {
      if (typeof backup.postcard !== 'string' || !backup.postcard.startsWith('data:image/png;base64,')) throw new Error('Wrong image type');
      postcard = await dataUrlToBlob(backup.postcard);
      const signature = new Uint8Array(await postcard.slice(0, 8).arrayBuffer());
      const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
      if (postcard.type !== 'image/png' || !pngSignature.every((byte, index) => signature[index] === byte)) throw new Error('Wrong image type');
    }

    saveSettings(backup.settings);
    restoreSettings();
    updateCharacterCount();
    if (postcard) { await savePostcard(postcard); await displayResult(postcard, false); }
    showToast('Local backup imported.');
  } catch { showToast('That file is not a valid Postcard FX backup.'); }
}

function setupEvents() {
  cameraButton.addEventListener('click', () => void startCamera());
  previewButton.addEventListener('click', () => usePreview());
  switchButton.addEventListener('click', () => { facingMode = facingMode === 'user' ? 'environment' : 'user'; void startCamera(); });
  captureButton.addEventListener('click', () => void makePostcard());
  document.querySelectorAll<HTMLButtonElement>('[data-effect]').forEach((button) => button.addEventListener('click', () => selectEffect(button.dataset.effect as EffectName)));
  [timerSelect, mirrorToggle, motionToggle].forEach((control) => control.addEventListener('change', () => { video.classList.toggle('is-mirrored', sourceMode === 'camera' && mirrorToggle.checked); persistSettings(); }));
  captionInput.addEventListener('input', () => { updateCharacterCount(); persistSettings(); });
  $('#retake-button').addEventListener('click', () => { result.hidden = true; if (sourceMode === 'idle') usePreview(); stage.scrollIntoView({ block: 'center' }); captureButton.focus(); });
  $('#delete-button').addEventListener('click', () => void removeLocalCopy());
  shareButton.addEventListener('click', () => void sharePostcard());
  restoreButton.addEventListener('click', () => { if (latestBlob) void displayResult(latestBlob, false); });
  $('#export-data').addEventListener('click', () => void exportData());
  $('#import-data').addEventListener('change', (event) => { const file = (event.target as HTMLInputElement).files?.[0]; if (file) void importData(file); });
  window.addEventListener('beforeunload', stopCamera);
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  if (isDemo) {
    resetDemoButton.addEventListener('click', () => void resetDemo());
    startRealButton.addEventListener('click', () => void leaveDemo());
  }
}

async function loadDemoSample() {
  saveSettings(demoSettings);
  restoreSettings();
  updateCharacterCount();
  usePreview(false);
  await makePostcard(true);
  announce('Sample postcard ready. Change the effect, caption, or timer to try the maker.');
}

async function resetDemo() {
  resetDemoButton.disabled = true;
  try {
    await resetCurrentStorage();
    latestBlob = null;
    if (latestUrl) URL.revokeObjectURL(latestUrl);
    latestUrl = '';
    result.hidden = true;
    restoreButton.hidden = true;
    await loadDemoSample();
    showToast('Demo reset to the sample postcard.');
  } finally {
    resetDemoButton.disabled = false;
  }
}

async function leaveDemo() {
  startRealButton.disabled = true;
  try {
    await resetCurrentStorage();
  } finally {
    window.location.assign('/');
  }
}

function updateNetworkStatus() {
  const pill = $('#network-status');
  pill.classList.toggle('is-offline', !navigator.onLine);
  pill.innerHTML = navigator.onLine ? '<span aria-hidden="true">●</span> Works offline' : '<span aria-hidden="true">●</span> Offline & ready';
}

function setupInstall() {
  const installButton = $('#install-button') as HTMLButtonElement;
  window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredInstall = event; installButton.hidden = false; });
  installButton.addEventListener('click', async () => {
    if (!deferredInstall) return;
    await (deferredInstall as Event & { prompt(): Promise<void> }).prompt(); deferredInstall = null; installButton.hidden = true;
  });
}

function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then((registration) => {
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) showToast('A fresh version is ready.', true);
        });
      });
    }).catch(() => { /* The app still works where service workers are unavailable. */ });
  });
  toastAction.addEventListener('click', () => { navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' }); window.location.reload(); });
}

async function init() {
  const recoveredPreferences = restoreSettings();
  demoBanner.hidden = !isDemo;
  updateCharacterCount(); setupEvents(); setupInstall(); setupServiceWorker(); updateNetworkStatus();
  if (recoveredPreferences) announce('Saved preferences were invalid and have been reset. You can continue with a fresh postcard.', true);
  animationFrame = requestAnimationFrame(render);
  try {
    const saved = await loadPostcard();
    if (saved) {
      latestBlob = saved;
      restoreButton.hidden = false;
      if (isDemo) await displayResult(saved, false, false);
    }
    else if (isDemo) await loadDemoSample();
  } catch { /* Private browsing may disallow IndexedDB; capture and download still work. */ }
}

void init();

export function cleanupForTests() { cancelAnimationFrame(animationFrame); stopCamera(); }
