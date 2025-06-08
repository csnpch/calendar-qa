import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 4000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  duration?: number
  isPaused?: boolean
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
  PAUSE_TOAST: "PAUSE_TOAST",
  RESUME_TOAST: "RESUME_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["PAUSE_TOAST"]
      toastId: ToasterToast["id"]
    }
  | {
      type: ActionType["RESUME_TOAST"]
      toastId: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const toastTimers = new Map<string, { remainingTime: number; startTime: number }>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    
    case "PAUSE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId ? { ...t, isPaused: true } : t
        ),
      }
    
    case "RESUME_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId ? { ...t, isPaused: false } : t
        ),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ duration = TOAST_REMOVE_DELAY, ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => {
    // Clean up timers
    if (toastTimeouts.has(id)) {
      clearTimeout(toastTimeouts.get(id)!)
      toastTimeouts.delete(id)
    }
    if (toastTimers.has(id)) {
      toastTimers.delete(id)
    }
    dispatch({ type: "DISMISS_TOAST", toastId: id })
  }

  const pause = () => {
    const timer = toastTimers.get(id)
    if (timer && toastTimeouts.has(id)) {
      const elapsed = Date.now() - timer.startTime
      timer.remainingTime = Math.max(0, timer.remainingTime - elapsed)
      clearTimeout(toastTimeouts.get(id)!)
      toastTimeouts.delete(id)
    }
    dispatch({ type: "PAUSE_TOAST", toastId: id })
  }

  const resume = () => {
    const timer = toastTimers.get(id)
    if (timer && timer.remainingTime > 0) {
      timer.startTime = Date.now()
      const timeout = setTimeout(() => {
        dismiss()
      }, timer.remainingTime)
      toastTimeouts.set(id, timeout)
    }
    dispatch({ type: "RESUME_TOAST", toastId: id })
  }

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      duration,
      isPaused: false,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  // Initialize timer
  toastTimers.set(id, {
    startTime: Date.now(),
    remainingTime: duration
  })

  // Auto-dismiss after specified duration
  const timeout = setTimeout(() => {
    dismiss()
  }, duration)
  toastTimeouts.set(id, timeout)

  return {
    id: id,
    dismiss,
    update,
    pause,
    resume,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    pause: (toastId: string) => {
      const timer = toastTimers.get(toastId)
      if (timer && toastTimeouts.has(toastId)) {
        const elapsed = Date.now() - timer.startTime
        timer.remainingTime = Math.max(0, timer.remainingTime - elapsed)
        clearTimeout(toastTimeouts.get(toastId)!)
        toastTimeouts.delete(toastId)
      }
      dispatch({ type: "PAUSE_TOAST", toastId })
    },
    resume: (toastId: string) => {
      const timer = toastTimers.get(toastId)
      if (timer && timer.remainingTime > 0) {
        timer.startTime = Date.now()
        const timeout = setTimeout(() => {
          dispatch({ type: "DISMISS_TOAST", toastId })
        }, timer.remainingTime)
        toastTimeouts.set(toastId, timeout)
      }
      dispatch({ type: "RESUME_TOAST", toastId })
    },
  }
}

export { useToast, toast }
