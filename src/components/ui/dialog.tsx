import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './button'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({ title, description, children, drawer = false }: { title: string; description?: string; children: ReactNode; drawer?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content className={drawer ? 'dialog-content drawer-content' : 'dialog-content'}>
        <header className="dialog-header">
          <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
          <DialogClose asChild><Button variant="ghost" size="icon" aria-label="Fechar"><X size={19} /></Button></DialogClose>
        </header>
        <DialogPrimitive.Description className={description ? 'muted dialog-description' : 'sr-only'}>{description || title}</DialogPrimitive.Description>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
