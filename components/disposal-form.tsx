"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, InfoIcon, AlertTriangleIcon, Plus, Trash2 } from "lucide-react"

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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useData } from "@/components/providers/data-provider"
import { DisposalEntry, Shift } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Combobox, ComboboxOption } from "@/components/ui/combobox"
import { SimpleDatePicker } from "@/components/ui/simple-date-picker"
import { DatePickerWrapper } from "@/components/ui/date-picker-wrapper"
import { DatePickerWrapper as ClientDatePicker } from "@/components/ui/client-pickers"
import { prepareDateForSubmission, formatEastern } from "@/lib/date-utils"
import { formatShift } from "@/lib/utils"

const NEW_YORK_TIMEZONE = 'America/New_York';

// Common disposal reasons
const DISPOSAL_REASONS = [
  "Expired / Past use-by date",
  "Quality issues / Failed inspection",
  "Damaged / Broken during handling",
  "Contamination / Food safety concern",
  "Overproduction / Excess inventory",
  "Customer return",
  "Equipment malfunction",
  "Other"
]

const disposalSchema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  quantity: z.coerce.number().min(1, "Quantity must be greater than 0").max(10000, "Quantity seems too high"),
  date: z.date({
    required_error: "Date is required",
  }).refine((date) => {
    // Ensure date is not in the future
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return date <= today
  }, "Date cannot be in the future"),
  shift: z.enum(["morning", "afternoon", "night"] as const, {
    required_error: "Shift is required",
  }),
  staff_name: z.string().min(1, "Staff name is required"),
  reason: z.string().min(1, "At least one reason is required"),
  notes: z.string().optional(),
})

type DisposalFormValues = z.infer<typeof disposalSchema>

// Add cart entry type
type CartEntry = {
  id: string;
  product_name: string;
  quantity: number;
  reason: string;
  notes?: string;
  date?: string;
}

type CommonFields = {
  date: Date;
  shift: "morning" | "afternoon" | "night";
  staff_name: string;
}

// Update the formatDate function to handle both Date and string types
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "N/A"
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return "Invalid Date"
    
    // Convert to New York timezone
    const newYorkDate = new Date(dateObj.toLocaleString('en-US', { timeZone: NEW_YORK_TIMEZONE }));
    return formatEastern(newYorkDate, "MMM dd, yyyy HH:mm")
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid Date"
  }
}

export function DisposalForm() {
  const { addDisposalEntry, products, refreshData, isLoading: isDataLoading } = useData()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [cartEntries, setCartEntries] = useState<CartEntry[]>([])
  const [commonFields, setCommonFields] = useState<CommonFields>({
    date: new Date(),
    shift: "morning",
    staff_name: "",
  })
  const { toast } = useToast()

  const form = useForm<DisposalFormValues>({
    resolver: zodResolver(disposalSchema),
    defaultValues: {
      product_name: "",
      quantity: 0,
      date: new Date(),
      shift: "morning",
      staff_name: commonFields.staff_name,
      reason: "",
      notes: "",
    },
  })

  // Update selected product when product_name changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "product_name") {
        setSelectedProduct(value.product_name || null)
      }
      if (name === "reason") {
        const reasons = value.reason ? value.reason.split(", ").filter(Boolean) : []
        setSelectedReasons(reasons)
      }
      // Update common fields when they change, but avoid circular updates
      if (name === "date" || name === "shift" || name === "staff_name") {
        setCommonFields(prev => ({
          ...prev,
          [name]: value[name]
        }))
      }
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  // Add a separate effect to sync staff_name from commonFields to form
  useEffect(() => {
    if (commonFields.staff_name !== form.getValues("staff_name")) {
      form.setValue("staff_name", commonFields.staff_name)
    }
  }, [commonFields.staff_name])

  const addToCart = (data: DisposalFormValues) => {
    // Validate quantity
    const quantity = Number(data.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Error",
        description: "Invalid quantity value",
        variant: "destructive",
      })
      return
    }

    // Validate date
    const disposalDate = data.date ? new Date(data.date) : new Date()
    if (isNaN(disposalDate.getTime())) {
      toast({
        title: "Error",
        description: "Invalid disposal date",
        variant: "destructive",
      })
      return
    }

    const newEntry: CartEntry = {
      id: Date.now().toString(),
      product_name: data.product_name,
      quantity: quantity,
      reason: data.reason,
      notes: data.notes,
      date: disposalDate.toISOString().split('T')[0], // Format as YYYY-MM-DD string
    }

    setCartEntries([...cartEntries, newEntry])
    
    // Reset only product-specific fields
    form.reset({
      ...form.getValues(),
      product_name: "",
      quantity: 0,
      reason: "",
      notes: "",
    })
    
    // Clear selected product and reset UI state
    setSelectedProduct(null)
    setSelectedReasons([])
    
    toast({
      title: "Added to Cart",
      description: "Entry added to cart. You can add more entries or submit all at once.",
    })
  }

  const handleReasonChange = (value: string, index: number) => {
    const newReasons = [...selectedReasons]
    newReasons[index] = value
    setSelectedReasons(newReasons)
    
    // Update form value with comma-separated string
    const combinedReasons = newReasons.filter(Boolean).join(", ")
    form.setValue("reason", combinedReasons)
  }

  const removeFromCart = (id: string) => {
    setCartEntries(cartEntries.filter(entry => entry.id !== id))
    toast({
      title: "Removed from Cart",
      description: "Entry removed from cart.",
    })
  }

  async function onSubmit(data: DisposalFormValues) {
    try {
      setIsSubmitting(true)
      
      // Find the product to get its ID
      const selectedProductData = products.find(p => p.name === data.product_name)
      
      if (!selectedProductData) {
        toast({
          title: "Error",
          description: "Selected product not found. Please try again.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
      
      // Add to cart instead of submitting directly
      addToCart(data)
    } catch (error) {
      console.error("Form submission error:", error)
      toast({
        title: "Error",
        description: "Failed to add entry to cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Safe date validation
  const isValidDate = (date: any): boolean => {
    if (!date) return false;
    const d = new Date(date);
    return !isNaN(d.getTime());
  };

  const submitCart = async () => {
    if (cartEntries.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty. Please add entries first.",
        variant: "destructive",
      })
      return
    }

    if (!commonFields.staff_name) {
      toast({
        title: "Error",
        description: "Staff name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Submit each entry in the cart separately
      const submissionPromises = cartEntries.map(async (entry) => {
        const selectedProductData = products.find(p => p.name === entry.product_name)
        
        if (!selectedProductData) {
          throw new Error(`Product not found: ${entry.product_name}`)
        }

        // Validate quantity
        const quantity = Number(entry.quantity)
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error("Invalid quantity value")
        }

        // Validate date
        const disposalDate = commonFields.date ? new Date(commonFields.date) : null
        if (!disposalDate || isNaN(disposalDate.getTime())) {
          throw new Error("Invalid disposal date")
        }

        // Create the disposal entry with common fields and a temporary ID
        const disposalEntry = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Add temporary ID
          product_id: selectedProductData.id,
          product_name: entry.product_name,
          quantity: quantity,
          date: disposalDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          shift: commonFields.shift,
          staff_name: commonFields.staff_name,
          reason: entry.reason,
          notes: entry.notes || "",
        }

        // Add the entry
        await addDisposalEntry(disposalEntry)
      })

      // Wait for all submissions to complete
      await Promise.all(submissionPromises)

      // Clear the cart and reset form
      setCartEntries([])
      form.reset({
        product_name: "",
        quantity: 0,
        date: new Date(),
        shift: "morning",
        staff_name: "",
        reason: "",
        notes: "",
      })
      setSelectedProduct(null)

      // Initial refresh to update the UI immediately
      await refreshData()

      toast({
        title: "Success",
        description: "All entries have been submitted successfully.",
      })

      // Set up automatic refresh after 2 seconds
      setTimeout(async () => {
        await refreshData()
        toast({
          title: "Refreshed",
          description: "Data has been refreshed automatically.",
        })
      }, 2000)

    } catch (error) {
      console.error("Error submitting cart:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit entries. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get the selected product details
  const selectedProductDetails = selectedProduct 
    ? products.find(p => p.name === selectedProduct) 
    : null

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Disposal Entry</CardTitle>
        <CardDescription>Record new disposal entries</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Common Fields Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Common Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <ClientDatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select disposal date"
                          disableFutureDates={true}
                          fromYear={2020}
                          toYear={new Date().getFullYear()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shift"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shift" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="morning">{formatShift("morning")}</SelectItem>
                          <SelectItem value="afternoon">{formatShift("afternoon")}</SelectItem>
                          <SelectItem value="night">{formatShift("night")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="staff_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Staff Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter staff name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Product Entry Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Add Product</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="product_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Combobox
                          options={products.map(product => ({
                            value: product.name,
                            label: product.name,
                            badge: product.category
                          }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select a product"
                          emptyMessage="No products found."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter quantity"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : Number(e.target.value)
                            field.onChange(value)
                          }}
                          min={1}
                          max={10000}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reasons (up to 3)</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[0, 1, 2].map((index) => (
                          <Select
                            key={index}
                            onValueChange={(value) => handleReasonChange(value, index)}
                            value={selectedReasons[index] || ""}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Reason ${index + 1}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {DISPOSAL_REASONS.map((reason) => (
                                <SelectItem 
                                  key={reason} 
                                  value={reason}
                                  disabled={selectedReasons.includes(reason) && selectedReasons[index] !== reason}
                                >
                                  {reason}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any additional details about this disposal" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={isSubmitting || isDataLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </form>
        </Form>

        {/* Cart Entries */}
        {cartEntries.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Cart Entries</h3>
              <Button
                type="button"
                variant="secondary"
                className="w-full md:w-auto"
                disabled={isSubmitting || isDataLoading}
                onClick={submitCart}
              >
                {isSubmitting ? "Submitting..." : `Submit All Entries (${cartEntries.length})`}
              </Button>
            </div>
            <div className="space-y-2">
              {cartEntries.map((entry) => {
                const formattedDate = formatDate(commonFields.date)
                
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{entry.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.quantity} units • Date: {formattedDate}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <p>Reasons:</p>
                        <ul className="list-disc list-inside">
                          {entry.reason.split(", ").map((reason, index) => (
                            <li key={index}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground">
                          Notes: {entry.notes}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(entry.id)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedProductDetails && (
          <Alert className="mt-6">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Product Information</AlertTitle>
            <AlertDescription>
              {selectedProductDetails.description || "No description available"}
            </AlertDescription>
          </Alert>
        )}

        <Alert variant="destructive" className="mt-6">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Disposing of products should be done carefully and in accordance with company policies.
            Please ensure all information is accurate.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

