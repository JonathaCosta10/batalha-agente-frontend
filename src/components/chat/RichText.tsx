import { Fragment, type ReactNode } from 'react';

// The model's light markdown (**bold**, *italic*, "- " / "1. " lists, "# " headings) as React elements.
// Never HTML: text stays text, so a reply cannot inject markup.
function inline(text:string, key:string):ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).filter(Boolean).map((part,i)=>
    part.startsWith('**')&&part.endsWith('**')&&part.length>4?<strong key={`${key}-${i}`}>{part.slice(2,-2)}</strong>
    :part.startsWith('*')&&part.endsWith('*')&&part.length>2?<em key={`${key}-${i}`}>{part.slice(1,-1)}</em>
    :<Fragment key={`${key}-${i}`}>{part}</Fragment>);
}

type Block = {kind:'p'|'ul'|'ol'; lines:string[]};

export function parseBlocks(text:string):Block[] {
  const blocks:Block[]=[];
  for(const raw of text.replace(/\r\n/g,'\n').split('\n')){
    const line=raw.trimEnd();
    const bullet=/^\s*[-*•]\s+(.*)$/.exec(line), numbered=/^\s*\d+[.)]\s+(.*)$/.exec(line);
    const kind:Block['kind']=bullet?'ul':numbered?'ol':'p';
    const content=bullet?.[1]??numbered?.[1]??line.replace(/^#{1,6}\s+/,'');
    const last=blocks[blocks.length-1];
    if(kind==='p'&&!content.trim()){blocks.push({kind:'p',lines:[]});continue;}
    if(last&&last.kind===kind&&(kind!=='p'||last.lines.length))last.lines.push(content);
    else blocks.push({kind,lines:[content]});
  }
  return blocks.filter(b=>b.lines.length);
}

export function RichText({text}:{text:string}) {
  return <>{parseBlocks(text).map((b,i)=>{
    const key=`b${i}`;
    if(b.kind==='ul')return <ul key={key} className="rich-list">{b.lines.map((l,j)=><li key={j}>{inline(l,`${key}-${j}`)}</li>)}</ul>;
    if(b.kind==='ol')return <ol key={key} className="rich-list">{b.lines.map((l,j)=><li key={j}>{inline(l,`${key}-${j}`)}</li>)}</ol>;
    return <p key={key} className="rich-p">{b.lines.map((l,j)=><Fragment key={j}>{j>0&&<br/>}{inline(l,`${key}-${j}`)}</Fragment>)}</p>;
  })}</>;
}
