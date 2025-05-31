"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useData } from "@/components/providers/data-provider"
import { useToast } from "@/components/ui/use-toast"
import { ProductCategory, Product } from "@/lib/types"
import { Plus, Save } from "lucide-react"

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  customCategory: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  onSuccess?: () => void
  product?: Product
  mode?: "add" | "edit"
}

export function ProductForm({ onSuccess, product, mode = "add" }: ProductFormProps) {
  const { addProduct, refreshData, updateProduct, products } = useData()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const { toast } = useToast()

  // Extract all unique categories from existing products
  const existingCategories = useMemo(() => {
    const categories = new Set<string>()
    products.forEach(p => {
      if (p.category) {
        categories.add(p.category)
      }
    })
    return Array.from(categories).sort()
  }, [products])

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      category: product?.category || "",
      description: product?.description || "",
      unit: product?.unit || "",
      customCategory: "",
    },
  })

  // Set form values when product changes (for edit mode)
  useEffect(() => {
    if (product && mode === "edit") {
      form.reset({
        name: product.name,
        category: product.category,
        description: product.description || "",
        unit: product.unit,
        customCategory: "",
      })
    }
  }, [product, form, mode])

  const watchCategory = form.watch("category")
  
  // Set up custom category when "custom" is selected
  useEffect(() => {
    if (watchCategory === "custom" && !showCustomCategory) {
      setShowCustomCategory(true)
    } else if (watchCategory !== "custom" && showCustomCategory) {
      setShowCustomCategory(false)
    }
  }, [watchCategory, showCustomCategory])

  async function onSubmit(data: ProductFormValues) {
    try {
      setIsSubmitting(true)
      
      // Check if product name already exists (for new products or when changing names during edit)
      const nameExists = products.some(p => {
        // Ensure both names are defined before comparing
        if (!p.name || !data.name) return false;
        
        // Normalize both strings to ensure consistent comparison regardless of special characters
        const existingName = p.name.toLowerCase().trim();
        const newName = data.name.toLowerCase().trim();
        
        return existingName === newName && (mode === "add" || (mode === "edit" && product && p.id !== product.id));
      });
      
      if (nameExists) {
        toast({
          title: "Error",
          description: "A product with this name already exists",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return;
      }
      
      // Check if custom category is empty when custom is selected
      if (data.category === "custom" && (!data.customCategory || data.customCategory.trim() === "")) {
        toast({
          title: "Error",
          description: "Custom category name cannot be empty",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
      
      // Check if custom category already exists
      if (data.category === "custom" && existingCategories.includes(data.customCategory!)) {
        toast({
          title: "Error",
          description: "This category already exists. Please select it from the dropdown instead.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
      
      // Use custom category if selected
      const productData = {
        name: data.name.trim(),
        category: data.category === "custom" ? data.customCategory!.trim() : data.category,
        description: data.description?.trim(),
        unit: data.unit,
      }
      
      let result;
      
      if (mode === "edit" && product) {
        // Update existing product
        result = await updateProduct({
          id: product.id,
          ...productData
        })
        toast({
          title: "Success",
          description: "Product updated successfully",
        })
      } else {
        // Add new product
        result = await addProduct(productData)
        toast({
          title: "Success",
          description: "Product added successfully",
        })
        
        // Reset form
        form.reset({
          name: "",
          category: "",
          description: "",
          unit: "",
          customCategory: "",
        })
      }
      
      // Reset custom category state
      setShowCustomCategory(false)
      
      // Refresh data to update UI
      await refreshData()
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Error",
        description: mode === "edit" 
          ? `Failed to update product: ${errorMessage}` 
          : `Failed to add product: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Pães">Pães</SelectItem>
                  <SelectItem value="Confeitaria">Confeitaria</SelectItem>
                  <SelectItem value="Salgados">Salgados</SelectItem>
                  <SelectItem value="Bolos">Bolos</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                  
                  {/* Add custom categories that aren't in the predefined list */}
                  {existingCategories
                    .filter(cat => !["Pães", "Confeitaria", "Salgados", "Bolos", "Outros"].includes(cat))
                    .map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))
                  }
                  
                  <SelectItem value="custom" className="text-primary font-medium border-t mt-1 pt-1">
                    + Add Custom Category
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {showCustomCategory && (
          <FormField
            control={form.control}
            name="customCategory"
            render={({ field }) => (
              <FormItem className="bg-accent/20 p-3 rounded-md border border-border/50">
                <FormLabel className="flex items-center">
                  <Plus className="h-4 w-4 mr-1 text-primary" />
                  Custom Category Name
                </FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="Enter custom category name" 
                      {...field} 
                      className="border-primary/30 focus-visible:ring-primary"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="border-primary hover:bg-primary/10"
                      onClick={() => {
                        if (field.value) {
                          form.setValue("category", field.value);
                          form.setValue("customCategory", "");
                          setShowCustomCategory(false);
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>
                  Enter a custom category name or click the + button to create it now
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="kg">Kilogram (kg)</SelectItem>
                  <SelectItem value="g">Gram (g)</SelectItem>
                  <SelectItem value="loaf">Loaf</SelectItem>
                  <SelectItem value="dozen">Dozen</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="unit">Unit</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter product description" 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button
          type="submit"
          className="w-full mt-4"
          disabled={isSubmitting || (watchCategory === "custom" && !form.getValues("customCategory"))}
        >
          {isSubmitting 
            ? (mode === "edit" ? "Saving..." : "Adding...") 
            : (mode === "edit" ? (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Product
                </span>
              ))
          }
        </Button>
      </form>
    </Form>
  )
} 