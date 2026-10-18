// Standalone preview controls; the actual dock uses its existing shared care UI.
(() => {
  const floating=document.createElement('div');floating.dataset.careCarry='';
  floating.style.cssText='position:fixed;width:44px;height:44px;pointer-events:none;display:none;z-index:10;';
  document.body.appendChild(floating);
  const blocked=new WeakSet();let carry=null,timer=null;
  function end(){
    clearTimeout(timer);timer=null;
    if(carry){const {button,id}=carry;carry=null;preview.cancelManualCare();if(button.hasPointerCapture(id))button.releasePointerCapture(id);}
    floating.style.display='none';
  }
  function move(e){
    if(!carry||carry.id!==e.pointerId)return;
    carry.x=e.clientX;carry.y=e.clientY;
    if(!carry.active)return;
    floating.style.left=(e.clientX-22)+'px';floating.style.top=(e.clientY-22)+'px';
    preview.updateManualCare(e.clientX,e.clientY);
  }
  for(const [id,kind] of [['water','water'],['food','snack']]){
    const button=document.getElementById(id);
    button.title='Click to give, or hold and bring it to the mouth';
    button.onpointerdown=e=>{
      if(e.button!==0)return;end();blocked.delete(button);
      carry={button,id:e.pointerId,x:e.clientX,y:e.clientY,kind,active:false};button.setPointerCapture(e.pointerId);
      timer=setTimeout(()=>{
        timer=null;if(!carry||carry.button!==button)return;blocked.add(button);
        if(!preview.beginManualCare(kind)){end();return;}
        carry.active=true;floating.innerHTML=preview.icons.care[kind];floating.style.display='block';
        move({pointerId:carry.id,clientX:carry.x,clientY:carry.y});
      },450);
    };
    for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,end);
    button.onclick=()=>{if(blocked.has(button)){blocked.delete(button);return;}preview.giveCare(kind);};
  }
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
  window.addEventListener('blur',end);document.addEventListener('pointerleave',end);
  const pet=document.getElementById('pet'),quote=document.getElementById('careQuote');
  pet.addEventListener('cat-manual-care-delivered',end);
  pet.addEventListener('cat-manual-care-cancelled',end);
  pet.addEventListener('cat-manual-care-complete',e=>{quote.textContent=e.detail.message;});
  pet.addEventListener('cat-yarn-complete',e=>{quote.textContent=e.detail.message;});
  pet.addEventListener('companion-bubble',e=>{quote.textContent=e.detail.message;});
  pet.addEventListener('cat-yarn-quote-clear',()=>{quote.textContent='';});
  window.addEventListener('beforeunload',end);
})();
