import { AlertCircle, ArrowLeft, CircleCheck, RefreshCw } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'
import { problem } from '../api'
import { Button } from './ui/button'

export function Field({ label, error, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const generated = useId()
  const fieldId = id ?? generated
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <input id={fieldId} aria-invalid={Boolean(error) || undefined} aria-describedby={error ? fieldId + '-error' : undefined} {...props} />
      {error && <span id={fieldId + '-error'} className="field-error">{error}</span>}
    </div>
  )
}

export function Notice({ children, kind = 'info' }: { children: ReactNode; kind?: 'info' | 'error' | 'success' }) {
  const Icon = kind === 'success' ? CircleCheck : AlertCircle
  return <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}><Icon size={17} aria-hidden="true" /><div>{children}</div></div>
}

export function ErrorState({ failure, retry }: { failure: unknown; retry?: () => void }) {
  return <div className="state-box"><Notice kind="error">{problem(failure).message}</Notice>{retry && <Button variant="outline" onClick={retry}><RefreshCw size={15} /> Tentar novamente</Button>}</div>
}

export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return <section className="empty"><h2>{title}</h2><p>{children}</p></section>
}

export function Skeleton({ className = '', label }: { className?: string; label?: string }) {
  return <div className={`skeleton ${className}`} role={label ? 'status' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />
}

export function Breadcrumb({ children }: { children: ReactNode }) {
  return <nav aria-label="Localização" className="breadcrumb"><Link to="/"><ArrowLeft size={14} /> Início</Link><span aria-hidden="true">/</span><span>{children}</span></nav>
}

export function PageHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <header className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children && <p>{children}</p>}</header>
}
