import { useState, useEffect, useRef } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, ShieldAlert } from "lucide-react"

const CORRECT_PASSWORD = "928928928"

interface PasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  actionLabel: string
  onConfirm: () => void
}

export function PasswordDialog({ open, onOpenChange, actionLabel, onConfirm }: PasswordDialogProps) {
  const [value, setValue] = useState("")
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue("")
      setError(false)
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value === CORRECT_PASSWORD) {
      onOpenChange(false)
      onConfirm()
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setValue("")
      inputRef.current?.focus()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Lock size={17} className="text-primary" />
            </div>
            <AlertDialogTitle>Password Required</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Enter the password to {actionLabel}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className={shake ? "animate-[shake_0.4s_ease-in-out]" : ""}>
            <Input
              ref={inputRef}
              type="password"
              placeholder="••••••••"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(false) }}
              className={`h-11 text-base tracking-widest ${error ? "border-destructive ring-1 ring-destructive" : ""}`}
              autoComplete="off"
            />
            {error && (
              <div className="flex items-center gap-1.5 mt-2 text-destructive text-sm">
                <ShieldAlert size={14} /> Incorrect password
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button type="submit" disabled={value.length === 0}>
              Confirm
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
