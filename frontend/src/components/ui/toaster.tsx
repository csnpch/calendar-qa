import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastProgress,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts, pause, resume } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, duration, variant, isPaused, ...props }) {
        return (
          <Toast 
            key={id} 
            variant={variant} 
            onMouseEnter={() => pause(id)}
            onMouseLeave={() => resume(id)}
            {...props}
          >
            <div className="grid gap-1 flex-1 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
            <ToastProgress duration={duration} variant={variant} isPaused={isPaused} />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
