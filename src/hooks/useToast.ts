import { useEffect, useState } from 'react';

const TOAST_DURATION = 4000;

export function useToast() {
  const [toast,setToast]=useState('');
  useEffect(()=>{const id=window.setTimeout(()=>setToast(''),TOAST_DURATION);return ()=>clearTimeout(id);},[toast]);
  return [toast,setToast] as const;
}
