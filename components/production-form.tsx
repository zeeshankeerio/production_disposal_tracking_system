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
import { ProductionEntry, Shift } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Combobox, ComboboxOption } from "@/components/ui/combobox"
import { SimpleDatePicker } from "@/components/ui/simple-date-picker"
import { DatePickerWrapper } from "@/components/ui/date-picker-wrapper"
import { DatePickerWrapper as ClientDatePicker } from "@/components/ui/client-pickers"
import { prepareDateForSubmission, toEastern, fromEastern, formatEastern } from "@/lib/date-utils"
import { formatShift } from "@/lib/utils"

const productionSchema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  quantity: z.number().min(1, "Quantity must be greater than 0").max(10000, "Quantity seems too high"),
  date: z.date({
    required_error: "Date is required",
  }),
  shift: z.enum(["morning", "afternoon", "night"] as const, {
    required_error: "Shift is required",
  }),
  staff_name: z.string().min(1, "Staff name is required"),
  notes: z.string().optional(),
  expiration_date: z.date({
    required_error: "Expiration date is required",
  }),
})

type ProductionFormValues = z.infer<typeof productionSchema>

// Add cart entry type
type CartEntry = {
  id: string;
  product_name: string;
  quantity: number;
  notes?: string;
  expiration_date: string; // Keep as string to match ProductionEntry type
}

type CommonFields = {
  date: Date;
  shift: "morning" | "afternoon" | "night";
  staff_name: string;
}

const NEW_YORK_TIMEZONE = 'America/New_York';

export function ProductionForm() {
  const { addProductionEntry, products, refreshData, isLoading: isDataLoading } = useData()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [cartEntries, setCartEntries] = useState<CartEntry[]>([])
  const [commonFields, setCommonFields] = useState<CommonFields>({
    date: toEastern(new Date()),
    shift: "morning",
    staff_name: "",
  })
  const { toast } = useToast()

  const form = useForm<ProductionFormValues>({
    resolver: zodResolver(productionSchema),
    defaultValues: {
      product_name: "",
      quantity: 0,
      date: toEastern(new Date()),
      shift: "morning",
      staff_name: "",
      notes: "",
      expiration_date: toEastern(new Date(new Date().setDate(new Date().getDate() + 7))),
    },
  })

  // Update selected product when product_name changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "product_name") {
        setSelectedProduct(value.product_name || null)
      }
      // Update common fields when they change
      if (name === "date" || name === "shift" || name === "staff_name") {
        setCommonFields(prev => ({
          ...prev,
          [name]: value[name]
        }))
      }
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  const addToCart = (data: ProductionFormValues) => {
    // Debug log to check incoming data
    console.log("Adding to cart:", data);

    // 1. Capture potentially undefined value
    const rawExpirationDate = data.expiration_date;

    // 2. Define a safe/fallback default
    const safeExpirationDate = (rawExpirationDate !== undefined && rawExpirationDate !== null)
      ? new Date(rawExpirationDate)
      : new Date(new Date().setDate(new Date().getDate() + 7)); // Default to 7 days from now

    // 3. Validate the safe date
    if (isNaN(safeExpirationDate.getTime())) {
      console.error("Invalid expiration date:", rawExpirationDate);
      toast({
        title: "Error",
        description: "Invalid expiration date",
        variant: "destructive",
      });
      return;
    }

    const newEntry: CartEntry = {
      id: Date.now().toString(),
      product_name: data.product_name,
      quantity: data.quantity,
      notes: data.notes,
      expiration_date: safeExpirationDate.toISOString().split('T')[0], // Format as YYYY-MM-DD string
    }

    // Debug log to check new entry
    console.log("New cart entry:", newEntry);

    setCartEntries([...cartEntries, newEntry])
    
    // Reset only product-specific fields while keeping common fields
    form.reset({
      ...form.getValues(),
      product_name: "",
      quantity: 0,
      notes: "",
      expiration_date: new Date(new Date().setDate(new Date().getDate() + 7)),
    })
    
    // Clear selected product
    setSelectedProduct(null)
    
    toast({
      title: "Added to Cart",
      description: "Entry added to cart. You can add more entries or submit all at once.",
    })
  }

  const removeFromCart = (id: string) => {
    setCartEntries(cartEntries.filter(entry => entry.id !== id))
    toast({
      title: "Removed from Cart",
      description: "Entry removed from cart.",
    })
  }

  async function onSubmit(data: ProductionFormValues) {
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

        // Validate dates in EST
        const productionDate = commonFields.date ? toEastern(new Date(commonFields.date)) : null
        const expirationDate = entry.expiration_date ? toEastern(new Date(entry.expiration_date)) : null

        if (!productionDate || isNaN(productionDate.getTime())) {
          throw new Error("Invalid production date")
        }

        if (!expirationDate || isNaN(expirationDate.getTime())) {
          throw new Error("Invalid expiration date")
        }

        // Ensure expiration date is after production date
        if (expirationDate <= productionDate) {
          throw new Error("Expiration date must be after production date")
        }

        // Create the production entry with common fields
        const productionEntry = {
          product_id: selectedProductData.id,
          product_name: entry.product_name,
          quantity: entry.quantity,
          date: productionDate, // Keep as Date object in EST
          shift: commonFields.shift,
          staff_name: commonFields.staff_name,
          expiration_date: expirationDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD string
          notes: entry.notes || "",
        }

        // Add the entry
        await addProductionEntry(productionEntry)
      })

      // Wait for all submissions to complete
      await Promise.all(submissionPromises)

      // Clear the cart
      setCartEntries([])
      
      // Reset all form fields to their default values in EST
      form.reset({
        product_name: "",
        quantity: 0,
        date: toEastern(new Date()),
        shift: "morning",
        staff_name: "",
        notes: "",
        expiration_date: toEastern(new Date(new Date().setDate(new Date().getDate() + 7))),
      })
      
      // Reset common fields in EST
      setCommonFields({
        date: toEastern(new Date()),
        shift: "morning",
        staff_name: "",
      })
      
      // Clear selected product
      setSelectedProduct(null)

      // Refresh data to update the UI
      await refreshData()

      toast({
        title: "Success",
        description: "All entries have been submitted successfully.",
      })
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

  // Safe date formatting with comprehensive error handling
  const formatDate = (dateString: string | undefined | null): string => {
    try {
      // Debug log to check input
      console.log("Formatting date:", dateString);

      // Handle undefined or null
      if (!dateString) {
        console.warn("Date string is undefined or null");
        return "No date";
      }

      const date = new Date(dateString);
      
      // Validate date
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", dateString);
        return "Invalid date";
      }

      // Convert to New York timezone
      const newYorkDate = new Date(date.toLocaleString('en-US', { timeZone: NEW_YORK_TIMEZONE }));

      // Format the date
      return formatEastern(newYorkDate, "MMM dd, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error, "Input:", dateString);
      return "Invalid date";
    }
  };

  // Safe date validation
  const isValidDate = (date: any): boolean => {
    if (!date) return false;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return false;
      
      // Convert to New York timezone for validation
      const newYorkDate = new Date(d.toLocaleString('en-US', { timeZone: NEW_YORK_TIMEZONE }));
      return !isNaN(newYorkDate.getTime());
    } catch (error) {
      return false;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Production Entry</CardTitle>
        <CardDescription>Record new production entries</CardDescription>
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
                          placeholder="Select production date"
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
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="afternoon">Afternoon</SelectItem>
                          <SelectItem value="night">Night</SelectItem>
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

                <div className="grid grid-cols-2 gap-4">
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
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            min={1}
                            max={10000}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiration_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Expiration Date</FormLabel>
                        <FormControl>
                          <ClientDatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select expiration date"
                            disablePastDates={true}
                            minDate={new Date()}
                            fromYear={new Date().getFullYear()}
                            toYear={new Date().getFullYear() + 5}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes" 
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
                // Debug log for each entry
                console.log("Rendering cart entry:", entry);

                // 1. Capture potentially undefined value
                const rawExpirationDate = entry.expiration_date;

                // 2. Define a safe/fallback default
                const safeExpirationDate = (rawExpirationDate !== undefined && rawExpirationDate !== null)
                  ? new Date(rawExpirationDate)
                  : new Date(0); // Default to Unix epoch

                // 3. Format the date safely
                const formattedExpirationDate = safeExpirationDate.toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{entry.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.quantity} units • Shift: {formatShift(commonFields.shift)} • Expires: {formattedExpirationDate}
                      </p>
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
            Production entries should be accurate and complete. Please ensure all information is correct before submitting.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

