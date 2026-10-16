// Classify scruff movement without recording pointer history or queuing bubbles.
const DragReactions = {
  create({now, onReaction}) {
    let state=null,lastSession=-Infinity;
    return {
      begin(x,y) {
        const t=now(),allowed=t-lastSession>=6000;
        state={start:t,last:t,x,y,distance:0,fastMs:0,movement:false,allowed,lastBubble:t};
        if(allowed){lastSession=t;onReaction('pickup');}
      },
      move(x,y) {
        if(!state)return;const t=now(),dt=t-state.last,d=Math.hypot(x-state.x,y-state.y);
        state.last=t;state.x=x;state.y=y;state.distance+=d;
        if(dt<=0||dt>250){state.fastMs=0;return;}
        const speed=d/dt*1000;
        state.fastMs=speed>=900?state.fastMs+dt:0;
        if(!state.allowed||state.movement||t-state.start<1200)return;
        const phase=state.fastMs>=80?'fast':t-state.start>=1800&&state.distance>=35&&speed<500?'slow':null;
        if(phase){state.movement=true;state.lastBubble=t;onReaction(phase);}
      },
      end(cancelled=false) {
        if(state&&state.allowed&&!cancelled&&now()-state.lastBubble>=1200)onReaction('landing');
        state=null;
      },
    };
  },
};
if(typeof module!=='undefined'&&module.exports)module.exports=DragReactions;
