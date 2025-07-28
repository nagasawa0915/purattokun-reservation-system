/**
 * 🔢 数値入力アドオン v1.0 - 超軽量版
 * 既存の編集システムに数値入力機能を追加
 */
(function(){
let p=null;

// パネル作成
function create(){
  const d=document.createElement('div');
  d.id='spine-numeric-input';
  d.style.cssText='position:fixed;top:70px;right:20px;width:180px;background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:12px;z-index:10001;font:12px sans-serif;display:none';
  d.innerHTML=`<b style="display:block;margin-bottom:8px">📊 数値入力</b>
  <div>X:<input id="nx" type="number" style="width:50px;margin:0 5px"></div>
  <div>Y:<input id="ny" type="number" style="width:50px;margin:0 5px"></div>
  <div>幅:<input id="nw" type="number" style="width:50px;margin:0 5px"></div>
  <div>高:<input id="nh" type="number" style="width:50px;margin:0 5px"></div>`;
  document.body.appendChild(d);
  
  // 入力イベント
  ['nx','ny','nw','nh'].forEach(id=>{
    document.getElementById(id).oninput=update;
  });
  
  return d;
}

// 値更新
function update(){
  const x=+document.getElementById('nx').value||0;
  const y=+document.getElementById('ny').value||0;
  const w=+document.getElementById('nw').value||80;
  const h=+document.getElementById('nh').value||80;
  
  let el=null;
  if(window.isCharacterEditMode){
    el=document.querySelector('.demo-character,.character-wrapper');
  }else if(window.isCanvasEditMode){
    el=document.querySelector('.character-canvas');
  }
  
  if(el){
    el.style.left=x+'px';
    el.style.top=y+'px';
    el.style.width=w+'px';
    el.style.height=h+'px';
    if(window.updateCoordinateDisplay)updateCoordinateDisplay();
  }
}

// 監視
function monitor(){
  const show=window.isCharacterEditMode||window.isCanvasEditMode;
  p.style.display=show?'block':'none';
  
  if(show){
    const el=document.querySelector('.demo-character,.character-wrapper,.character-canvas');
    if(el){
      document.getElementById('nx').value=parseInt(el.style.left)||0;
      document.getElementById('ny').value=parseInt(el.style.top)||0;
      document.getElementById('nw').value=parseInt(el.style.width)||80;
      document.getElementById('nh').value=parseInt(el.style.height)||80;
    }
  }
}

// 初期化
function init(){
  p=create();
  setInterval(monitor,100);
  console.log('🔢 数値入力アドオン起動');
}

// 起動
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{
  setTimeout(init,100);
}

})();