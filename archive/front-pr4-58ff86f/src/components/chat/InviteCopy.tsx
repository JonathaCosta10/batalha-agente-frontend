// Renders the invite paragraphs, turning *marked* passages into emphasis.
export function InviteCopy({text}:{text:string}) {
  return <div className="invite-copy">{text.split('\n\n').map((paragraph,index)=><p key={index}>{paragraph.split(/(\*[^*]+\*)/g).map((part,partIndex)=>part.startsWith('*')&&part.endsWith('*')?<em key={partIndex}>{part.slice(1,-1)}</em>:part)}</p>)}</div>;
}
