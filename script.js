<div id="wrapper" style="position:relative; width:100%; max-width:1080px; margin:0 auto;">
  <canvas id="bgCanvas" style="position:absolute; top:0; left:0; z-index:1;"></canvas>
  <canvas id="maskCanvas" style="position:absolute; top:0; left:0; z-index:2;"></canvas>
  <div id="result" style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; text-align:center; justify-content:center; align-items:center; flex-direction:column; z-index:3;"></div>
</div>

<script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
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
let prize = '';
let img = new Image();
img.crossOrigin = 'anonymous';
let isDrawing = false;

// 型號對照表，全部大寫 Key
const modelMap = {
  // Galaxy S 系列
  "SM-G9800": "Galaxy S20",
  "SM-G9860": "Galaxy S20+",
  "SM-G9880": "Galaxy S20 Ultra",
  "SM-G9910": "Galaxy S21",
  "SM-G9960": "Galaxy S21+",
  "SM-G9980": "Galaxy S21 Ultra",
  "SM-S9010": "Galaxy S22",
  "SM-S9060": "Galaxy S22+",
  "SM-S9080": "Galaxy S22 Ultra",
  "SM-S9110": "Galaxy S23",
  "SM-S9160": "Galaxy S23+",
  "SM-S9180": "Galaxy S23 Ultra",
  "SM-S9210": "Galaxy S24",
  "SM-S9260": "Galaxy S24+",
  "SM-S9280": "Galaxy S24 Ultra",
  "SM-S9310": "Galaxy S25",
  "SM-S9360": "Galaxy S25+",
  "SM-S9380": "Galaxy S25 Ultra",

  // Galaxy Z 系列
  "SM-F7000": "Galaxy Z Flip",
  "SM-F9160": "Galaxy Z Fold2",
  "SM-F7110": "Galaxy Z Flip3",
  "SM-F9260": "Galaxy Z Fold3",
  "SM-F7210": "Galaxy Z Flip4",
  "SM-F9360": "Galaxy Z Fold4",
  "SM-F7310": "Galaxy Z Flip5",
  "SM-F9460": "Galaxy Z Fold5",
  "SM-F7410": "Galaxy Z Flip6",
  "SM-F9560": "Galaxy Z Fold6",

  // Galaxy A 系列
  "SM-A5150": "Galaxy A51",
  "SM-A7150": "Galaxy A71",
  "SM-A3250": "Galaxy A32",
  "SM-A5250": "Galaxy A52",
  "SM-A5260": "Galaxy A52 5G",
  "SM-A7250": "Galaxy A72",
  "SM-A2660": "Galaxy A26 5G",
  "SM-A3360": "Galaxy A33 5G",
  "SM-A3660": "Galaxy A36 5G",
  "SM-A5360": "Galaxy A53 5G",
  "SM-A5660": "Galaxy A56 5G",
  "SM-A7360": "Galaxy A73 5G",
  "SM-A1460": "Galaxy A14 5G",
  "SM-A2450": "Galaxy A24",
  "SM-A3460": "Galaxy A34 5G",
  "SM-A5460": "Galaxy A54 5G",
  "SM-A3560": "Galaxy A35 5G",
  "SM-A5560": "Galaxy A55 5G",
  "SM-A1660": "Galaxy A16",

  // 已有的機種
  "iPhone": "Apple iPhone（型號未知）",
  "Pixel 7": "Google Pixel 7",
  "Pixel 7 Pro": "Google Pixel 7 Pro",
  "Pixel 8": "Google Pixel 8",
  "Pixel 8 Pro": "Google Pixel 8 Pro",
  "Pixel 9": "Google Pixel 9",
  "Pixel 9 Pro": "Google Pixel 9 Pro",
  "OnePlus 9": "OnePlus 9",
  "OnePlus 10": "OnePlus 10",
  "OnePlus 11": "OnePlus Buds",
  "OnePlus 13": "OnePlus 13",
  "XQ-DC72": "Sony Xperia 1 V",
  "XQ-DQ72": "Sony Xperia 5 V",
  "23078PND5G": "Xiaomi 13T Pro",
  "22071212AG": "Xiaomi 12T Pro",
  "23021RAA2Y": "Redmi Note 12",
  "23090RA98G": "Redmi Note 13 Pro",
  "AI2205": "ASUS ROG Phone 6",
  "AI2401": "ASUS ROG Phone 8",
  "AI2302": "ASUS Zenfone 10",
  "CPH2491": "OPPO Reno10",
  "CPH2525": "OPPO Find X6",
  "V2238": "vivo X90",
  "V2303": "vivo Y78",
  "RMX3820": "realme 11 Pro+",
  "RMX3866": "realme GT Neo5"
};

function guessModelName(rawModel){
  if(!rawModel) return "未知機型";
  const key = rawModel.toUpperCase();
  if(modelMap[key]) return modelMap[key];
  if(key.startsWith("SM-A")) return "Samsung Galaxy A 系列 " + rawModel;
  if(key.startsWith("SM-S")) return "Samsung Galaxy S 系列 " + rawModel;
  if(key.startsWith("SM-F")) return "Samsung Galaxy Z 系列 " + rawModel;
  return rawModel;
}

function detectBrand(modelCode){
  const code = modelCode.toUpperCase();
  if(code.startsWith("SM-")) return "Samsung";
  if(code.includes("IPHONE")) return "Apple";
  if(code.includes("PIXEL")) return "Google";
  if(code.includes("ONEPLUS")) return "OnePlus";
  if(code.includes("OPPO")) return "OPPO";
  if(code.includes("ASUS")) return "ASUS";
  if(code.includes("VIVO")) return "vivo";
  if(code.includes("REALME")) return "realme";
  if(code.includes("XIAOMI") || code.includes("REDMI")) return "Xiaomi";
  return "Android";
}

function getAndroidModel(ua){
  let match = ua.match(/android.*;\s([^;]+)\sbuild/i);
  if(match && match[1]){
    if(match[1].toLowerCase() === 'wv') return "Android裝置";
    return match[1].trim();
  }
  match = ua.match(/android.*;\s([^;]+)\)/i);
  if(match && match[1]){
    if(match[1].toLowerCase() === 'wv') return "Android裝置";
    return match[1].trim();
  }
  return "Android裝置";
}

function getDeviceInfo(){
  const ua = navigator.userAgent.toLowerCase();
  if(ua.includes('iphone')){
    deviceBrand='Apple'; deviceModel='iPhone';
  }else if(ua.includes('ipad')){
    deviceBrand='Apple'; deviceModel='iPad';
  }else if(ua.includes('android')){
    const raw = getAndroidModel(ua);
    const code = raw.toUpperCase();
    deviceModel = guessModelName(code);
    deviceBrand = detectBrand(code);
  }else{
    deviceBrand='未知'; deviceModel='未知';
  }
}

// 設定 canvas 尺寸
function setCanvasSize(){
  const width = wrapper.clientWidth;
  const height = Math.floor(width*1350/1080);
  wrapper.style.height = height+'px';
  bgCanvas.width = maskCanvas.width = width;
  bgCanvas.height = maskCanvas.height = height;
}

// 初始化遮罩
function initMask(){
  maskCtx.fillStyle="#999";
  maskCtx.fillRect(0,0,maskCanvas.width,maskCanvas.height);
}

// 刮刮卡位置
function getPos(e){
  const rect = maskCanvas.getBoundingClientRect();
  if(e.touches && e.touches.length>0){
    return { x:e.touches[0].clientX-rect.left, y:e.touches[0].clientY-rect.top };
  }else{
    return { x:e.clientX-rect.left, y:e.clientY-rect.top };
  }
}

function scratch(e){
  if(!isDrawing) return;
  e.preventDefault();
  const {x,y} = getPos(e);
  maskCtx.globalCompositeOperation='destination-out';
  maskCtx.beginPath();
  maskCtx.arc(x,y,50,0,Math.PI*2);
  maskCtx.fill();
}

function checkScratchPercent(){
  const imgData = maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height).data;
  let cleared=0;
  for(let i=3;i<imgData.length;i+=4) if(imgData[i]===0) cleared++;
  const percent = cleared/(maskCanvas.width*maskCanvas.height)*100;
  if(percent>50){
    resultDiv.innerHTML = `
      <div style="font-size:40px;">🎉恭喜你中了【${prize}】🎉</div>
      <div style="color:red; font-weight:bold; font-size:30px;">請洽服務人員兌獎</div>
    `;
    resultDiv.style.display='flex';
    maskCanvas.style.pointerEvents='none';
  }
}

// 刮刮卡事件
maskCanvas.addEventListener('mousedown',e=>{isDrawing=true;scratch(e);});
maskCanvas.addEventListener('mousemove',scratch);
maskCanvas.addEventListener('mouseup',()=>{isDrawing=false;checkScratchPercent();});
maskCanvas.addEventListener('mouseleave',()=>{isDrawing=false;});
maskCanvas.addEventListener('touchstart',e=>{isDrawing=true;scratch(e);},{passive:false});
maskCanvas.addEventListener('touchmove',scratch,{passive:false});
maskCanvas.addEventListener('touchend',()=>{isDrawing=false;checkScratchPercent();});

// 改變大小時重設
window.addEventListener('resize',()=>{
  setCanvasSize();
  bgCtx.drawImage(img,0,0,bgCanvas.width,bgCanvas.height);
  initMask();
});

// LIFF 初始化
async function initLiff(){
  await liff.init({liffId:LIFF_ID});
  if(!liff.isLoggedIn()) liff.login();
  else{
    try{ const profile = await liff.getProfile(); userId = profile.userId||'未知'; } catch(e){ console.error(e);}
    getDeviceInfo();
    fetchPrize();
  }
}

// 抽獎圖片
const images={
  '天選獎S1':'https://i.postimg.cc/RCGKq4nk/6.png',
  '天選獎S2':'https://i.postimg.cc/gkxjRNkf/5.png',
  '機會獎':'https://i.postimg.cc/3xpwfNG1/3.png',
  '命運獎':'https://i.postimg.cc/RFCV0TDp/2.png'
};

// 從 GAS 抽獎
async function fetchPrize(){
  try{
    const params = new URLSearchParams({action:'draw', userId, deviceBrand, deviceModel, timestamp:new Date().toISOString()});
    const res = await fetch(`${GAS_URL}?${params.toString()}`);
    const text = await res.text();
    if(text==='duplicate'){
      resultDiv.innerHTML=`<div style="font-size:30px;color:red;">您已抽過獎囉</div>`;
      resultDiv.style.display='flex';
      maskCanvas.style.pointerEvents='none';
      return;
    }
    prize=text||'命運獎';
    img.src = images[prize];
    img.onload=()=>{
      setCanvasSize();
      bgCtx.drawImage(img,0,0,bgCanvas.width,bgCanvas.height);
      initMask();
    };
  }catch(err){console.error(err);}
}

initLiff();
</script>
