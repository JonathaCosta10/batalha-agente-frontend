import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalSheetProps = { label:string; onClose:()=>void; children:ReactNode };

export function ModalSheet({label,onClose,children}:ModalSheetProps) {
  return <div className="modal-backdrop" onClick={onClose}><div className="modal-sheet" role="dialog" aria-modal="true" aria-label={label} onClick={e=>e.stopPropagation()}>
    <button className="icon-btn modal-close" data-testid="button-close-sheet" aria-label="Fechar" onClick={onClose}><X size={22}/></button>
    {children}
  </div></div>;
}
