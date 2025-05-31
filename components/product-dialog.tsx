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
import { Plus, Edit } from "lucide-react"
import { ProductForm } from "@/components/product-form"
import { useState } from "react"
import { Product } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { useData } from "@/components/providers/data-provider"

interface ProductDialogProps {
  buttonText?: string
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined
  buttonSize?: "default" | "sm" | "lg" | "icon" | null | undefined
  buttonClass?: string
  trigger?: React.ReactNode
  mode?: "add" | "edit"
  product?: Product
}

export function ProductDialog({
  buttonText,
  buttonVariant = "default",
  buttonSize = "default",
  buttonClass = "",
  trigger,
  mode = "add",
  product
}: ProductDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const { refreshData } = useData()

  const handleSuccess = async () => {
    // Close the dialog first
    setOpen(false);
    
    // Wait a bit to ensure any state changes complete
    setTimeout(async () => {
      // Ensure data is refreshed after successful operation
      await refreshData();
      
      // Show toast after refresh completes
      toast({
        title: mode === "add" ? "Product Added" : "Product Updated",
        description: mode === "add" 
          ? "The new product has been added successfully." 
          : "The product has been updated successfully.",
        variant: "default",
      });
    }, 100);
  }

  // Determine button text based on mode if not explicitly provided
  const defaultButtonText = mode === "add" ? "Add New Product" : "Edit Product"
  const displayButtonText = buttonText || defaultButtonText
  
  // Dialog content text
  const dialogTitle = mode === "add" ? "Add New Product" : "Edit Product"
  const dialogDescription = mode === "add" 
    ? "Add a new product to the system. Fill out the form below to create a new product."
    : "Edit this product's details. Update the information below to modify the product."

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={buttonVariant} size={buttonSize} className={buttonClass}>
            {mode === "add" ? (
              <Plus className="mr-2 h-4 w-4" />
            ) : (
              <Edit className="mr-2 h-4 w-4" />
            )}
            {displayButtonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ProductForm 
            onSuccess={handleSuccess} 
            product={product} 
            mode={mode} 
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 