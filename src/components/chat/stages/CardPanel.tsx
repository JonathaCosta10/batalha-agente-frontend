import { Download, Sparkles } from 'lucide-react';
import type { Plan } from '../../../types';
import { Button } from '../../ui/Button';
import { SharePreview } from '../SharePreview';

type CardPanelProps = { plan:Plan; phraseIndex:number; exporting:boolean; onSave:()=>void; onDownload:()=>void; onNextPhrase:()=>void; onLeave:()=>void };

export function CardPanel({plan,phraseIndex,exporting,onSave,onDownload,onNextPhrase,onLeave}:CardPanelProps) {
  return <div className="control-panel">
    <h3>Um novo passo merece ser lembrado.</h3><p>Este card não mostra seu saldo, sua renda nem os valores do plano.</p>
    <SharePreview plan={plan} index={phraseIndex}/>
    <Button testId="button-save-image" onClick={onSave} disabled={exporting}><Download size={17}/>{exporting?'Preparando imagem...':'Salvar imagem'}</Button>
    <Button testId="button-download-image" variant="outline" onClick={onDownload} disabled={exporting}>Baixar PNG</Button>
    <Button testId="button-change-phrase" variant="outline" onClick={onNextPhrase}><Sparkles size={17}/>Gerar outra frase</Button>
    <Button testId="button-return-without-image" variant="quiet" onClick={onLeave}>Voltar ao início sem salvar a imagem</Button>
  </div>;
}
