// minimal toast implementation using sonner
import { toast as sonnerToast } from "sonner"

export const toast = (options: { title?: string, description?: string, variant?: "default" | "destructive" }) => {
  if (options.variant === "destructive") {
    sonnerToast.error(options.title, { description: options.description })
  } else {
    sonnerToast(options.title, { description: options.description })
  }
}

export const useToast = () => {
  return { toast }
}
