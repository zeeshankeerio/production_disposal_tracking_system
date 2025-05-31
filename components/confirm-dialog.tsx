"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState, ReactNode } from "react"

interface ConfirmDialogProps {
  title: string
  description: string
  onConfirm: () => void
  trigger: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "default"
}

export function ConfirmDialog({
  title,
  description,
  onConfirm,
  trigger,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default"
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      await onConfirm()
    } catch (error) {
      console.error("Error during confirmation action:", error)
    } finally {
      setIsLoading(false)
      setOpen(false)
    }
  }

  const getButtonVariant = () => {
    switch (variant) {
      case "danger":
        return "destructive"
      case "warning":
        return "secondary"
      default:
        return "default"
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            type="button"
            variant={getButtonVariant()}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 