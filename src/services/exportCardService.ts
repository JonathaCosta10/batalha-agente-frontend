import { brand } from '../lib/brand';
import type { ExportResult, Plan } from '../types';
import { phraseFor } from './planService';

const FILE_NAME = 'meu-proximo-passo-janeiro-2026.png';

function loadImage(src:string):Promise<HTMLImageElement> {
  return new Promise((resolve,reject)=>{
    const img = new Image();
    img.onload=()=>resolve(img); img.onerror=()=>reject(new Error('Não foi possível carregar a marca do card.'));
    img.src=src;
  });
}
function wrap(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number) {
  const words=text.split(' '); let line=''; let yy=y;
  for(const word of words) {
    const candidate=line?`${line} ${word}`:word;
    if(ctx.measureText(candidate).width>maxWidth && line) {ctx.fillText(line,x,yy);yy+=lineHeight;line=word;} else line=candidate;
  }
  if(line) ctx.fillText(line,x,yy);
  return yy;
}
export async function createCardBlob(plan:Plan,index:number):Promise<Blob> {
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
  const ctx=canvas.getContext('2d');
  if(!ctx) throw new Error('Este navegador não oferece exportação de imagem.');
  const [itau,agora]=await Promise.all([loadImage(brand('itau-referencia.png')),loadImage(brand('i-agora.png'))]);
  ctx.fillStyle='#ff6200';ctx.fillRect(0,0,1080,1920);
  ctx.strokeStyle='rgba(255,255,255,.19)';ctx.lineWidth=2;
  for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(540,110,380+i*125,0,Math.PI*2);ctx.stroke();}
  ctx.fillStyle='#fff'; ctx.font='700 38px "Open Sans",sans-serif';ctx.fillText('JANEIRO / 2026',94,145);
  ctx.fillStyle='#f8d542';ctx.beginPath();ctx.arc(820,580,178,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='800 410px "Open Sans",sans-serif';ctx.fillText('↗',165,850);
  ctx.font='800 88px "Open Sans",sans-serif';
  const end=wrap(ctx,phraseFor(plan,index),94,1050,885,104);
  ctx.font='600 40px "Open Sans",sans-serif';ctx.fillText('Pequenas mudanças. Mais equilíbrio.',94,end+130);
  ctx.strokeStyle='rgba(255,255,255,.72)';ctx.beginPath();ctx.moveTo(94,1655);ctx.lineTo(986,1655);ctx.stroke();
  ctx.font='700 49px "Open Sans",sans-serif';ctx.fillText('Qual vai ser seu próximo passo?',94,1730);
  ctx.drawImage(itau,94,1750,153*itau.naturalWidth/itau.naturalHeight,153);
  const ratio=agora.naturalWidth/agora.naturalHeight;
  ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(788,1777,198,100,32);ctx.fill();
  ctx.drawImage(agora,815,1799,144,144/ratio);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Não foi possível gerar o PNG.')),'image/png'));
}
function triggerDownload(blob:Blob):'downloaded' {
  const url=URL.createObjectURL(blob);
  try {
    const link=document.createElement('a');link.href=url;link.download=FILE_NAME;link.style.display='none';
    document.body.appendChild(link);link.click();link.remove();
    return 'downloaded';
  } finally {window.setTimeout(()=>URL.revokeObjectURL(url),60000);}
}
export async function downloadCard(plan:Plan,index:number):Promise<'downloaded'> {
  return triggerDownload(await createCardBlob(plan,index));
}
export async function shareOrDownloadCard(plan:Plan,index:number):Promise<ExportResult> {
  const blob=await createCardBlob(plan,index);
  const file=new File([blob],FILE_NAME,{type:'image/png'});
  if(navigator.share && navigator.canShare?.({files:[file]})) {
    await navigator.share({files:[file],title:'Meu próximo passo'});
    return 'shared';
  }
  return triggerDownload(blob);
}
