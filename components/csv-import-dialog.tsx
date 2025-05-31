"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileUp } from "lucide-react"
import { useState } from "react"
import { CsvProductUpload } from "@/components/csv-product-upload"

interface CsvImportDialogProps {
  buttonText?: string
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined
  buttonSize?: "default" | "sm" | "lg" | "icon" | null | undefined
  buttonClass?: string
  trigger?: React.ReactNode
}

export function CsvImportDialog({
  buttonText = "Import Products",
  buttonVariant = "outline",
  buttonSize = "sm",
  buttonClass = "",
  trigger,
}: CsvImportDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={buttonVariant} size={buttonSize} className={buttonClass}>
            <FileUp className="mr-2 h-4 w-4" />
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing product data for bulk import
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <CsvProductUpload />
        </div>
      </DialogContent>
    </Dialog>
  )
} 