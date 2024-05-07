
// NodeListではfilterが使えないのでArrayに変換
const gauges = [].map.call(document.querySelectorAll(".status-view .gauge"), (el) => {
  return el
});

let initial_width = window.innerWidth;

const drawBar = (canvas, ratio, value, max) => {
  const ctx = canvas.getContext("2d");
  const width = canvas.width-1;
  const height = canvas.height;

  const gradient = ctx.createLinearGradient(0, height/2, canvas.width, height/2);
  gradient.addColorStop(1, "hsl(218, 2%, 92%)");
  gradient.addColorStop(0.3, "hsl(218, 2%, 80%)");
  gradient.addColorStop(0, "hsl(218, 8%, 55%)");

  //空のバーを描画（クリッピング）
  ctx.beginPath();
  //現在値が0なら背景色を変える
  //ctx.fillStyle = (value != 0) ? `hsl(218, 8%, 83%)` : '#999';
  ctx.roundRect(width-width*0.98, height-height*0.95, width*0.98, height*0.86, height/2-1);
  ctx.clip();
  //空のバーを描画
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = `#000`;
  //現在値が0なら背景色を変える
  ctx.fillStyle = gradient;
  ctx.roundRect(width-width*0.98, height-height*0.95, width*0.98, height*0.86, height/2-1);
  ctx.stroke();
  ctx.fill();
  ctx.closePath();

  if (value != 0) {
    //現在値を示すバーの描画（現在値が0ならそもそも描画しない）
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = `#000`;
    if (ratio <= 0.2){
      ctx.fillStyle = 'hsl(346, 56%, 48%)';
    } else if (ratio <= 0.4) {
      ctx.fillStyle = 'hsl(50, 82%, 48%)';
    } else {
      ctx.fillStyle = 'hsl(154, 100%, 34%)';
    }
    ctx.roundRect(width-width*0.98, height-height*0.95, (width*ratio-1)*0.98, height*0.86, height/2-1);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
  }

  //最大値と現在値を示す数値の描画
  ctx.lineWidth = 1;
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${height*0.7}px sans-serif`;
  ctx.textBaseline = "top";
  ctx.strokeStyle = "#000"
  ctx.strokeText(`${value}/${max}`, width-width*0.96, height*0.2, width*0.8);
  ctx.fillText(`${value}/${max}`, width-width*0.96, height*0.2, width*0.8);

};


const canvasCorrection = (canvas, w, h) => {
  //参考： https://developer.mozilla.org/ja/docs/Web/API/Window/devicePixelRatio
  const ctx = canvas.getContext("2d");
  //表示サイズを設定
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  // メモリ上における実際のサイズを設定
  const scale = window.devicePixelRatio;
  canvas.width = Math.floor(w*scale);
  canvas.height = Math.floor(h*scale);

  // css上のピクセル数を前提としているシステムに合わせる
  // ctx.scale(scale, scale);

};

const resize = (canvas, w, h) => {
  canvasCorrection(canvas, w, h);
};
const reset = () => {
  gauges.filter((el) => el !== undefined).forEach((el, i) => {
    el.innerHTML = '';
  });
};

const allGaugesDraw = () => {
  gauges.filter((el) => el !== undefined).forEach((el, i) => {
    const min = 0;
    const max = el.dataset.max;
    const value = el.dataset.value;
    const ratio = ((max-min) != 0) ? value / (max - min) : 0;
    // div.gaugeにcanvas要素を挿入
    const barCanvas = document.createElement("canvas");
    const barContent = document.createTextNode(`${value} / ${max}`);
    barCanvas.classList.add('bar');
    barCanvas.appendChild(barContent);
    el.append(barCanvas);
    const bar = el.querySelector("canvas.bar");

    //canvasのサイズを親要素と同じにする
    resize(bar, el.offsetWidth, el.offsetHeight);
    drawBar(bar, ratio, value, max);

  });
};

window.addEventListener('load', () => {
  allGaugesDraw();
});

window.addEventListener('resize', () => {
  if (initial_width === window.innerWidth) return;
  initial_width = window.innerWidth;
  reset();
  allGaugesDraw();
});
