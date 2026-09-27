import type { ReactNode } from 'react';
import type { ButtonVariant } from '../../types';

type ButtonProps = { children:ReactNode; onClick:()=>void; variant?:ButtonVariant; disabled?:boolean; testId:string };

export function Button({children,onClick,variant='primary',disabled,testId}:ButtonProps) {
  return <button data-testid={testId} type="button" className={`${variant}-btn`} onClick={onClick} disabled={disabled}>{children}</button>;
}
