import {normalizeProgram,getItemAt,clamp} from './programTimeline.js';

export class WorkoutEngine extends EventTarget{
  constructor(audio){super();this.audio=audio;this.reset();this.raf=0}
  load(program){this.program=structuredClone(program);this.timeline=normalizeProgram(program);this.elapsed=0;this.state='ready';this.eventFired=new Set();this.lastNow=performance.now();this.currentItem=null;this.startWall=null;this.pausedAt=0;this.emit()}
  reset(){this.program=null;this.timeline={items:[],duration:0};this.elapsed=0;this.state='idle';this.eventFired=new Set();this.currentItem=null;this.startWall=null;this.pausedAt=0;if(this.raf)cancelAnimationFrame(this.raf)}
  position(){if(this.state==='running'&&this.startWall!=null)return clamp((performance.now()-this.startWall)/1000,0,this.timeline.duration);return this.elapsed}
  start(){if(!this.program||!this.timeline.items.length)return false;return this.startOrResume()}
  startOrResume(){if(this.state==='running')return true;if(this.elapsed>=this.timeline.duration)this.restart();this.state='running';this.startWall=performance.now()-this.elapsed*1000;this.lastNow=performance.now();this.audio?.stopAll();this.loop();this.dispatchEvent(new CustomEvent('state'));return true}
  pause(){if(this.state!=='running')return;this.elapsed=this.position();this.state='paused';this.startWall=null;this.audio?.stopAll();if(this.raf)cancelAnimationFrame(this.raf);this.dispatchEvent(new CustomEvent('state'));this.emit()}
  stop(){if(this.state==='idle')return;this.elapsed=0;this.state='ready';this.startWall=null;this.eventFired.clear();this.currentItem=null;this.audio?.stopAll();if(this.raf)cancelAnimationFrame(this.raf);this.dispatchEvent(new CustomEvent('state'));this.emit()}
  restart(){if(!this.program)return;this.elapsed=0;this.state='ready';this.startWall=null;this.eventFired.clear();this.currentItem=null;this.audio?.stopAll();if(this.raf)cancelAnimationFrame(this.raf);this.dispatchEvent(new CustomEvent('state'));this.emit()}
  rebuildFiredBefore(elapsed){
    const fired=new Set();
    this.timeline.items.forEach((it,i)=>{
      if(it.end<=elapsed){
        if(it.type==='work'){
          fired.add(`${i}:start`);
          if(it.midpointBeep&&it.duration>0.2)fired.add(`${i}:mid`);
          fired.add(`${i}:end`);
        }
      }else if(it.type==='work'&&it.start<elapsed){
        fired.add(`${i}:start`);
        if(it.midpointBeep&&it.duration>0.2&&it.start+it.midpoint<elapsed)fired.add(`${i}:mid`);
      }
    });
    this.eventFired=fired;
  }
  seekToItem(targetIndex){
    if(!this.timeline.items.length)return;
    const target=this.timeline.items[clamp(targetIndex,0,this.timeline.items.length-1)];
    if(!target)return;
    this.elapsed=clamp(target.start+0.001,0,this.timeline.duration);
    this.rebuildFiredBefore(this.elapsed);
    this.audio?.stopAll();
    if(this.state==='running')this.startWall=performance.now()-this.elapsed*1000;
    this.dispatchEvent(new CustomEvent('state'));
    this.emit();
  }
  skip(delta){
    const item=this.currentItem||getItemAt(this.timeline.items,this.elapsed);
    const curIndex=Math.max(0,this.timeline.items.indexOf(item));
    this.seekToItem(curIndex+delta);
  }
  previous(){
    const item=this.currentItem||getItemAt(this.timeline.items,Math.max(0,this.elapsed-0.001));
    const curIndex=Math.max(0,this.timeline.items.indexOf(item));
    this.seekToItem(Math.max(0,curIndex-1));
  }
  loop(){if(this.state!=='running')return;const now=performance.now();this.elapsed=this.position();this.updateEvents();this.emit();if(this.elapsed>=this.timeline.duration-0.0001){this.elapsed=this.timeline.duration;this.state='complete';this.startWall=null;this.dispatchEvent(new CustomEvent('state'));this.emit();return}this.lastNow=now;this.raf=requestAnimationFrame(()=>this.loop())}
  updateEvents(){if(!this.timeline.items.length)return;const items=this.timeline.items;const eps=.08;for(let i=0;i<items.length;i++){const it=items[i];if(it.type==='work'){const startKey=`${i}:start`;if(!this.eventFired.has(startKey)&&this.elapsed>=it.start-eps){this.eventFired.add(startKey);this.audio?.beep('start')}if(it.midpointBeep&&it.duration>0.2){const midKey=`${i}:mid`;const when=it.start+it.midpoint;if(!this.eventFired.has(midKey)&&this.elapsed>=when-eps){this.eventFired.add(midKey);this.audio?.beep('mid')}}const endKey=`${i}:end`;if(!this.eventFired.has(endKey)&&this.elapsed>=it.end-eps){this.eventFired.add(endKey);this.audio?.beep('end')}}}}
  emit(){const elapsed=clamp(this.elapsed,0,this.timeline.duration);const item=getItemAt(this.timeline.items,Math.max(0,elapsed-0.00001));this.currentItem=item;const setIndex=item?.setIndex??0;const repIndex=item?.repIndex??0;const setDuration=item?.duration||0;const setElapsed=item?clamp(elapsed-item.start,0,setDuration):0;const setProgress=setDuration?setElapsed/setDuration:1;this.dispatchEvent(new CustomEvent('tick',{detail:{state:this.state,elapsed,item,currentSet:setIndex,currentPhase:item?.type||'work',setElapsed,setRemaining:Math.max(0,setDuration-setElapsed),setProgress,overallProgress:this.timeline.duration?elapsed/this.timeline.duration:0,midpointReached:!!item&&item.type==='work'&&setElapsed>=item.midpoint,currentRep:repIndex+1,totalReps:item?.repTotal||1,totalDuration:this.timeline.duration}}))}
}
