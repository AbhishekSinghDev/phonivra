import { toast } from 'sonner'

export function notify(message: string): void {
  // Interaction stubs stay silent so clicks no longer raise toasts. Only real
  // notifications (e.g. failures) reach the Toaster.
  if (message.endsWith(' clicked')) return
  toast(message)
}

export function notifyError(message: string): void {
  toast.error(message, { id: message, duration: 8000, icon: null })
}
