export function normalizeProgram(program){
  const items=[]; let time=0;
  const sets=Array.isArray(program?.sets)?program.sets:[];
  sets.forEach((set,idx)=>{
    const reps=Math.max(1,Math.floor(Number(set.repetitions)||1));
    for(let rep=1;rep<=reps;rep++){
      const duration=Math.max(0,Number(set.duration)||0);
      const breakDuration=Math.max(0,Number(set.breakDuration)||0);
      items.push({type:'work',setId:set.id,setIndex:idx,repIndex:rep-1,repTotal:reps,duration,start:time,end:time+duration,midpoint:duration/2,midpointBeep:!!set.midpointBeep});
      time+=duration;
      if(breakDuration>0){items.push({type:'break',setId:set.id,setIndex:idx,repIndex:rep-1,repTotal:reps,duration:breakDuration,start:time,end:time+breakDuration});time+=breakDuration}
    }
  });
  return {items,duration:time};
}
export function formatTime(seconds,showHours=false){seconds=Math.max(0,Math.floor(seconds+1e-7));const h=Math.floor(seconds/3600);const m=Math.floor((seconds%3600)/60);const s=seconds%60;return showHours||h>0?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
export function shortTime(seconds){seconds=Math.max(0,Math.round(seconds));const m=Math.floor(seconds/60),s=seconds%60;return `${m}:${String(s).padStart(2,'0')}`}
export function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
export function getItemAt(items,elapsed){if(!items.length)return null; if(elapsed>=items[items.length-1].end)return items[items.length-1];return items.find(i=>elapsed>=i.start&&elapsed<i.end)||items[0]}
