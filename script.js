<div id="wrapper" style="position:relative; width:100%; max-width:1080px; margin:0 auto;">
  <canvas id="bgCanvas" style="position:absolute; top:0; left:0; z-index:1;"></canvas>
  <canvas id="maskCanvas" style="position:absolute; top:0; left:0; z-index:2;"></canvas>
  <div id="result" style="position:absolute; top:0; left:0; width:100%; height:100%; display:none; text-align:center; justify-content:center; align-items:center; flex-direction:column; z-index:3; display:flex;"></div>
</div>

<script>
const LIFF_ID = '2007597530-o1xaVbZm';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxqa2xiM8ZUvN8Izt5siIF4_AafygmWWni0Gtf59rCZCyovV4Sun-DFLonehWktxeOb/exec';

const wrapper = document.getElementById('wrapper');
const bgCanvas = document.getElementById('bgCanvas');
const maskCanvas = document.getElementById('maskCanvas');
const bgCtx = bgCanvas.getContext('2d');
const maskCtx = maskCanvas.getContext('2d');
const resultDiv = document.getElementById('result');

let deviceBrand = '未知';
let deviceModel = '未知';
let userId = '未知';
let hasSentData = false;

// 型號對照表（略，可照你原本完整 modelMap）
const modelMap = { /* 你的 modelMap */ };

function guessModelName(rawModel) {
  if (!rawModel) return rawModel || "未知機型";
  const key = rawModel.toUpperCase();
  if (modelMap[key]) return modelMap[key];
  if (key.startsWith("SM-A")) return "Samsung Galaxy A 系列 " + rawModel;
  if (key.startsWith("SM-S")) return "Samsung Galaxy S 系列 " + rawModel;
  if (key.startsWith("SM-F")) return "Samsung Galaxy Z 系列 " + rawModel;
  return rawModel;
}

function detectBrand(modelCode) {
  const code = modelCode.toUpperCase();
  if (code.startsWith("SM-")) return "Samsung";
  if (code.includes("IPHONE")) return "Apple";
  if (code.includes("PIXEL")) return "Google";
  if (code.includes("ONEPLUS")) return "OnePlus";
  if (code.includes("OPPO")) return "OPPO";
  if (code.includes("ASUS")) return "ASUS";
  if (code.includes("VIVO")) return "vivo";
  if (code.includes("REALME")) return "realme";
  if (code.includes("XIAOMI") || code.includes("REDMI")) return "Xiaomi";
  return "Android";
}

function getAndroidModel(ua) {
  const regex = /android.*;\s([^;]+)\sbuild/i;
  let match = ua.match(regex);
  if (match && match[1]) {
    let model = match[1].trim();
    if (model.toLowerCase() === 'wv') return "Android裝置";
    return model;
  }
  const regex2 = /android.*;\s([^;]+)\)/i;
  match = ua.match(regex2);
  if (match && match[1]) {
    let model = match[1].trim();
    if (model.toLowerCase() === 'wv') return "Android裝置";
    return model;
  }
  return "Android裝置";
}

function getDeviceInfo() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('iphone')) {
    deviceBrand = 'Apple';
    deviceModel = 'iPhone';
  } else if (ua.includes('ipad')) {
    deviceBrand = 'Apple';
    deviceModel = 'iPad';
  } else if (ua.includes('android')) {
    const rawModel = getAndroidModel(ua);
    const modelCode = rawModel.toUpperCase();
    deviceModel = guessModelName(modelCode);
    deviceBrand = detectBrand(modelCode);
  } else {
    deviceBrand = '未知';
    deviceModel = '未知';
  }
}

// 初始化 LIFF 並檢查是否已抽過
async function initLiff() {
  await liff.init({ liffId: LIFF_ID });
  if (!liff.isLoggedIn()) {
    liff.login();
  } else {
    try {
      const profile = await liff.getProfile();
      userId = profile.userId || '未知';
    } catch (err) {
      console.error('無法取得使用者 ID', err);
    }
    getDeviceInfo();
    checkIfUserHasDrawn();
  }
}

// 檢查使用者是否已抽過
async function checkIfUserHasDrawn() {
  try {
    const params = new URLSearchParams({ userId });
    const res = await fetch(`${GAS_URL}?${params.toString()}`);
    const result = await res.json(); // GAS 回傳 { hasDrawn: true/false }

    if (result.hasDrawn) {
      resultDiv.innerHTML = `<div class="prize">⚠️ 您已參加過抽獎</div>`;
      maskCanvas.style.pointerEvents = 'none';
      resultDiv.style.display = 'flex';
    } else {
      loadPrize();
    }
  } catch (err) {
    console.error('檢查抽獎狀態失敗', err);
  }
}

// 抽獎圖片設定
const images = {
  '天選獎S1': 'https://i.postimg.cc/RCGKq4nk/6.png',
  '天選獎S2': 'https://i.postimg.cc/gkxjRNkf/5.png',
  '機會獎': 'https://i.postimg.cc/3xpwfNG1/3.png',
  '命運獎': 'https://i.postimg.cc/RFCV0TDp/2.png'
};

let prize = '';
let img = new Image();
img.crossOrigin = 'anonymous';

async function loadPrize() {
  // 先向 GAS 抽獎
  const params = new URLSearchParams({ action: 'draw', userId, deviceBrand, deviceModel, timestamp: new Date().toISOString() });
  const res = await fetch(`${GAS_URL}?${params.toString()}`);
  const data = await res.json(); // { hasDrawn:false, prize: '機會獎' }
  prize = data.prize || '命運獎';
  img.src = images[prize];

  img.onload = () => {
    setCanvasSize();
    bgCtx.drawImage(img, 0, 0, bgCanvas.width, bgCanvas.height);
    initMask();
  };
}

// 畫布大小
function setCanvasSize() {
  const width = wrapper.clientWidth;
  const height = Math.floor(width * 1350 / 1080);
  wrapper.style.height = height + 'px';
  bgCanvas.width = maskCanvas.width = width;
  bgCanvas.height = maskCanvas.height = height;
}

// 初始化遮罩
function initMask() {
  maskCtx.fillStyle = '#999';
  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
}

// 檢查刮開比例
function checkScratchPercent() {
  const imgData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
  let cleared = 0;
  for (let i = 3; i < imgData.length; i += 4) {
    if (imgData[i] === 0) cleared++;
  }
  const percent = cleared / (maskCanvas.width * maskCanvas.height) * 100;
  if (percent > 50) {
    resultDiv.innerHTML = `
      <div class="prize">🎉 恭喜你中了【${prize}】 🎉</div>
      <div class="notice" style="color:#d60000; font-weight:bold; font-size:70px;">請洽服務人員兌獎</div>
    `;
    resultDiv.style.display = 'flex';
    maskCanvas.style.pointerEvents = 'none';
  }
}

let isDrawing = false;
function getPos(e) {
  const rect = maskCanvas.getBoundingClientRect();
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
  } else {
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
}

function scratch(e) {
  if (!isDrawing) return;
  e.preventDefault();
  const { x, y } = getPos(e);
  maskCtx.globalCompositeOperation = 'destination-out';
  maskCtx.beginPath();
  maskCtx.arc(x, y, 50, 0, Math.PI * 2);
  maskCtx.fill();
}

maskCanvas.addEventListener('mousedown', (e) => { isDrawing = true; scratch(e); });
maskCanvas.addEventListener('mousemove', scratch);
maskCanvas.addEventListener('mouseup', () => { isDrawing = false; checkScratchPercent(); });
maskCanvas.addEventListener('mouseleave', () => { isDrawing = false; });
maskCanvas.addEventListener('touchstart', (e) => { isDrawing = true; scratch(e); }, { passive: false });
maskCanvas.addEventListener('touchmove', scratch, { passive: false });
maskCanvas.addEventListener('touchend', () => { isDrawing = false; checkScratchPercent(); });

window.addEventListener('resize', () => {
  setCanvasSize();
  bgCtx.drawImage(img, 0, 0, bgCanvas.width, bgCanvas.height);
  initMask();
});

initLiff();
</script>
