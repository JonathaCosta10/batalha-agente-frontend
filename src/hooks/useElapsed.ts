import { useEffect, useState } from 'react';

// Segundos decorridos desde startedAt; re-renderiza uma vez por segundo enquanto o componente está montado.
export function useElapsed(startedAt:number){
  const [now,setNow]=useState(()=>Date.now());
  useEffect(()=>{setNow(Date.now());const id=window.setInterval(()=>setNow(Date.now()),1000);return ()=>clearInterval(id);},[startedAt]);
  return (now-startedAt)/1000;
}
