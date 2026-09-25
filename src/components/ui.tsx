'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Evaluation } from '../domain/model';
export const labels = { ready: 'Ready to review', monitor: 'Monitor', review: 'Needs verification', excluded: 'Not eligible' };
export const date = (s: string) => new Date(s).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
export function download(name: string, content: string, type = 'application/json') { const url = URL.createObjectURL(new Blob([content],{type})); const a = document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url); }
export function Badge({status}: {status: Evaluation['status']}) { return <span className={`badge ${status}`}><span className="dot" />{labels[status]}</span>; }
export function Modal({title,onClose,children,wide=false}: {title:string;onClose:()=>void;children:ReactNode;wide?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const prior=document.activeElement as HTMLElement|null;ref.current?.showModal();return()=>prior?.focus();},[]);
  return <dialog ref={ref} className={wide?'modal wide':'modal'} onCancel={onClose}><header className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20}/></button></header>{children}</dialog>;
}
