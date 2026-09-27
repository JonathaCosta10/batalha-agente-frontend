import { useState } from 'react';
import { Info } from 'lucide-react';
import { ModalSheet } from './ModalSheet';

// Limitações do protótipo, declaradas na tela (pedido do dono, 2026-09-27). Texto datado; a lista
// completa, com o que não foi medido, está em docs/LIMITACOES.md. Mudar aqui = mudar lá.
export const LIMITS = {
  title:'Protótipo — limitações',
  updatedAt:'27/09/2026',
  items:[
    'O perfil é sintético, da base do evento (BigQuery), sorteado por sessão. Não é um cliente real.',
    'Lemos entradas, saídas e categorias de gasto em modo só leitura e, no modo com IA, enviamo-las ao Gemini (Google), através do nosso servidor, para gerar a conversa. No modo demonstração a resposta do chat é fixa.',
    'Nada é movimentado nem contratado: nenhum Pix, pagamento, transferência ou produto.',
    'Não é recomendação de investimento.',
    'A sessão expira (a conversa no servidor dura 30 minutos) e o histórico do chat não sobrevive a recarregar a página.',
    'O nome e o gênero da pessoa não são mostrados: aparece um rótulo neutro do id sorteado, salvo nome gerado com selo do servidor.',
  ],
} as const;

type Props = { initialOpen?:boolean };

/** Um "i" fixo no canto que abre a folha com as limitações. Componente único. */
export function PrototypeLimits({initialOpen=false}:Props) {
  const [open,setOpen]=useState(initialOpen);
  return <>
    <button type="button" className="limits-fab" data-testid="button-prototype-limits" aria-label={LIMITS.title} title={LIMITS.title} onClick={()=>setOpen(true)}><Info size={18}/></button>
    {open&&<ModalSheet label={LIMITS.title} onClose={()=>setOpen(false)}>
      <div className="limits-sheet" data-testid="sheet-prototype-limits">
        <h2>{LIMITS.title}</h2>
        <p className="limits-date">Atualizado em {LIMITS.updatedAt}</p>
        <ul>{LIMITS.items.map(t=><li key={t}>{t}</li>)}</ul>
      </div>
    </ModalSheet>}
  </>;
}
