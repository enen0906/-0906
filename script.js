const wrapper = document.getElementById('wrapper');
const bgCanvas = document.getElementById('bgCanvas');
const maskCanvas = document.getElementById('maskCanvas');
const bgCtx = bgCanvas.getContext('2d');
const maskCtx = maskCanvas.getContext('2d');

// 測試圖片 (直接用 GitHub 可公開讀取的圖片 URL 試試)
const testImageUrl = "https://i.postimg.cc/RCGKq4nk/6.png";

let img = new Image();
img.crossOrigin = "anonymous"; // 嘗試避免 CORS 問題
img.src = testImageUrl;

img.onload = function () {
  console.log("✅ 圖片載入成功", img.width, img.height);
  setCanvasSize();
  bgCtx.drawImage(img, 0, 0, bgCanvas.width, bgCanvas.height);
  console.log("🎨 圖片繪製完成");
  initMask();
};

img.onerror = function () {
  console.error("❌ 圖片載入失敗:", testImageUrl);
};

function setCanvasSize() {
  const width = wrapper.clientWidth;
  const height = Math.floor(width * 1350 / 1080); // 依比例縮放
  console.log("📐 設定 canvas 尺寸:", width, height);

  wrapper.style.height = height + "px";
  bgCanvas.width = maskCanvas.width = width;
  bgCanvas.height = maskCanvas.height = height;
}

function initMask() {
  maskCtx.fillStyle = "#999";
  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
  console.log("🖌 遮罩初始化完成");
}

// === 刮刮功能 ===
let isDrawing = false;

function getPos(e) {
  const rect = maskCanvas.getBoundingClientRect();
  if (e.touches && e.touches.length > 0) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  } else {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
}

function scratch(e) {
  if (!isDrawing) return;
  e.preventDefault();
  const { x, y } = getPos(e);
  maskCtx.globalCompositeOperation = 'destination-out';
  maskCtx.beginPath();
  maskCtx.arc(x, y, 40, 0, Math.PI * 2);
  maskCtx.fill();
}

// 滑鼠事件
maskCanvas.addEventListener("mousedown", (e) => { isDrawing = true; scratch(e); });
maskCanvas.addEventListener("mousemove", scratch);
maskCanvas.addEventListener("mouseup", () => { isDrawing = false; });
maskCanvas.addEventListener("mouseleave", () => { isDrawing = false; });

// 觸控事件
maskCanvas.addEventListener("touchstart", (e) => { isDrawing = true; scratch(e); }, { passive: false });
maskCanvas.addEventListener("touchmove", scratch, { passive: false });
maskCanvas.addEventListener("touchend", () => { isDrawing = false; });

// 視窗調整大小時重繪
window.addEventListener("resize", () => {
  setCanvasSize();
  bgCtx.drawImage(img, 0, 0, bgCanvas.width, bgCanvas.height);
  initMask();
});
