"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Product, ProductionEntry, DisposalEntry, DataContextType } from "@/lib/types"
import { products as mockProducts, generateProductionEntries, generateDisposalEntries, saveProductsToStorage } from "@/lib/mock-data"
import { USE_MOCK_DATA, API_ENDPOINTS, MOCK_DATA_REFRESH_INTERVAL } from "@/lib/config"
import { isoStringToDate, dateToISOString, formatDateForDisplay } from "@/lib/date-utils"

// Create context
const DataContext = createContext<DataContextType | undefined>(undefined)

// Set up mock data
let mockProductionEntries: ProductionEntry[] = []
let mockDisposalEntries: DisposalEntry[] = []

// Provider component
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [productionEntries, setProductionEntries] = useState<ProductionEntry[]>([])
  const [disposalEntries, setDisposalEntries] = useState<DisposalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Initialize mock data if using mock data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true)
        if (USE_MOCK_DATA) {
          // Generate mock data
          mockProductionEntries = generateProductionEntries()
          mockDisposalEntries = generateDisposalEntries()
          
          // Set initial data with proper validation
          const validatedProducts = mockProducts.map(p => ({...p}))
          const validatedProduction = mockProductionEntries.map(e => ({
            ...e,
            quantity: Number(e.quantity) || 0,
            date: new Date(e.date)
          }))
          const validatedDisposal = mockDisposalEntries.map(e => ({
            ...e,
            quantity: Number(e.quantity) || 0,
            date: new Date(e.date)
          }))

          setProducts(validatedProducts)
          setProductionEntries(validatedProduction)
          setDisposalEntries(validatedDisposal)
        } else {
          await fetchData()
        }
      } catch (err) {
        console.error("Error initializing data:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [])
  
  // Function to fetch data from API or use mock data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (USE_MOCK_DATA) {
        // Use mock data with validation
        const validatedProducts = mockProducts.map(p => ({...p}))
        const validatedProduction = mockProductionEntries.map(e => ({
          ...e,
          quantity: Number(e.quantity) || 0,
          date: new Date(e.date)
        }))
        const validatedDisposal = mockDisposalEntries.map(e => ({
          ...e,
          quantity: Number(e.quantity) || 0,
          date: new Date(e.date)
        }))

        setProducts(validatedProducts)
        setProductionEntries(validatedProduction)
        setDisposalEntries(validatedDisposal)
      } else {
        // Fetch real data from API
        const [productsRes, productionRes, disposalRes] = await Promise.all([
          fetch(API_ENDPOINTS.PRODUCTS),
          fetch(API_ENDPOINTS.PRODUCTION),
          fetch(API_ENDPOINTS.DISPOSAL)
        ])
        
        if (!productsRes.ok) throw new Error(`Failed to fetch products: ${productsRes.status}`)
        if (!productionRes.ok) throw new Error(`Failed to fetch production entries: ${productionRes.status}`)
        if (!disposalRes.ok) throw new Error(`Failed to fetch disposal entries: ${disposalRes.status}`)
        
        const productsData = await productsRes.json()
        const productionData = await productionRes.json()
        const disposalData = await disposalRes.json()
        
        // Validate data
        const validatedProduction = productionData.data.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          quantity: Number(entry.quantity) || 0,
          shift: entry.shift as "morning" | "afternoon" | "night",
          notes: entry.notes || ""
        }))

        const validatedDisposal = disposalData.data.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          quantity: Number(entry.quantity) || 0,
          shift: entry.shift as "morning" | "afternoon" | "night",
          notes: entry.notes || ""
        }))

        setProducts(productsData.data || [])
        setProductionEntries(validatedProduction)
        setDisposalEntries(validatedDisposal)
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      
      if (!USE_MOCK_DATA) {
        toast({
          title: "Error",
          description: "Failed to load data. Please try again later.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [toast])
  
  // Refresh data function with proper validation
  const refreshData = useCallback(async () => {
    if (USE_MOCK_DATA) {
      // Create entirely new array references with validated data
      const validatedProducts = mockProducts.map(p => ({...p}))
      const validatedProduction = mockProductionEntries.map(e => ({
        ...e,
        quantity: Number(e.quantity) || 0,
        date: new Date(e.date)
      }))
      const validatedDisposal = mockDisposalEntries.map(e => ({
        ...e,
        quantity: Number(e.quantity) || 0,
        date: new Date(e.date)
      }))

      setProducts(validatedProducts)
      setProductionEntries(validatedProduction)
      setDisposalEntries(validatedDisposal)
      return;
    }
    
    // For real API, fetch fresh data
    return fetchData();
  }, [fetchData])

  // Function to add a production entry
  const addProductionEntry = useCallback(async (entry: any) => {
    try {
      if (USE_MOCK_DATA) {
        // Add to mock data
        const { id, ...entryWithoutId } = entry;
        
        // Ensure date is a Date object for mock data using our utility function
        const dateValue = isoStringToDate(entry.date) || new Date();
        const expirationDateValue = isoStringToDate(entry.expiration_date) || new Date();
        
        const newEntry: ProductionEntry = {
          id: `mock-${Date.now()}`,
          ...entryWithoutId,
          date: dateValue, // Use the properly formatted date
          expiration_date: expirationDateValue, // Convert expiration_date to Date object
          notes: entry.notes || ""
        }
        
        mockProductionEntries = [newEntry, ...mockProductionEntries]
        setProductionEntries(prev => [newEntry, ...prev])
        
        toast({
          title: "Success",
          description: "Production entry added successfully",
        })
        return newEntry
      } else {
        // Add to real API with string date
        const { id, ...entryWithoutId } = entry;
        
        // For API, we ensure date is properly formatted
        const response = await fetch(API_ENDPOINTS.PRODUCTION, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...entryWithoutId,
            notes: entry.notes || ""
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to add production entry")
        }

        // Convert date back to Date object for consistent state using our utility
        const responseData = await response.json();
        const newEntry = {
          ...responseData,
          date: isoStringToDate(responseData.date) || new Date(),
          expiration_date: isoStringToDate(responseData.expiration_date) || new Date() // Convert expiration_date to Date object
        };
        
        setProductionEntries((prev) => [...prev, newEntry])

        toast({
          title: "Success",
          description: "Production entry added successfully",
        })
        return newEntry
      }
    } catch (err) {
      console.error("Error adding production entry:", err)
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add production entry",
        variant: "destructive",
      })
      throw err
    }
  }, [toast])
  
  // Function to add a disposal entry with immediate state update
  const addDisposalEntry = useCallback(async (entry: any) => {
    try {
      if (USE_MOCK_DATA) {
        // Add to mock data
        const { id, ...entryWithoutId } = entry;
        
        // Ensure date is a Date object and quantity is a number
        const dateValue = isoStringToDate(entry.date) || new Date();
        const quantityValue = Number(entry.quantity);
        
        if (isNaN(quantityValue)) {
          throw new Error("Invalid quantity value");
        }
        
        const newEntry: DisposalEntry = {
          id: `mock-${Date.now()}`,
          ...entryWithoutId,
          date: dateValue,
          quantity: quantityValue,
          notes: entry.notes || ""
        }
        
        // Update mock data
        mockDisposalEntries = [newEntry, ...mockDisposalEntries]
        
        // Update state with validated data
        setDisposalEntries(prev => [newEntry, ...prev])
        
        // Trigger a refresh to update all components
        setTimeout(() => refreshData(), 100)
        
        toast({
          title: "Success",
          description: "Disposal entry added successfully",
        })
        return newEntry
      } else {
        // Add to real API with string date
        const { id, ...entryWithoutId } = entry;
        
        // Validate quantity before sending to API
        const quantityValue = Number(entry.quantity);
        if (isNaN(quantityValue)) {
          throw new Error("Invalid quantity value");
        }
        
        const response = await fetch(API_ENDPOINTS.DISPOSAL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...entryWithoutId,
            quantity: quantityValue,
            notes: entry.notes || ""
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to add disposal entry")
        }

        // Convert date back to Date object and ensure quantity is a number
        const responseData = await response.json();
        const newEntry = {
          ...responseData,
          date: isoStringToDate(responseData.date) || new Date(),
          quantity: Number(responseData.quantity) || 0
        };
        
        // Update state with validated data
        setDisposalEntries((prev) => [newEntry, ...prev])
        
        // Trigger a refresh to update all components
        setTimeout(() => refreshData(), 100)

        toast({
          title: "Success",
          description: "Disposal entry added successfully",
        })
        return newEntry
      }
    } catch (err) {
      console.error("Error adding disposal entry:", err)
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add disposal entry",
        variant: "destructive",
      })
      throw err
    }
  }, [toast, refreshData])

  // Function to add a new product
  const addProduct = useCallback(async (product: Omit<Product, "id">): Promise<Product> => {
    try {
      // Basic validation
      if (!product.name || product.name.trim() === "") {
        throw new Error("Product name is required")
      }
      
      if (!product.category || product.category.trim() === "") {
        throw new Error("Product category is required")
      }
      
      if (!product.unit || product.unit.trim() === "") {
        throw new Error("Product unit is required")
      }
      
      // Create a temporary ID for optimistic updates
      const tempId = `temp-${Date.now()}`
      
      // Create the new product object
      const newProduct: Product = {
        id: tempId,
        ...product,
      }
      
      // Optimistically update the UI with a copy of the array to ensure reference change
      setProducts(prev => [...prev, {...newProduct}])
      
      if (USE_MOCK_DATA) {
        // Check for duplicate product names
        const isDuplicate = mockProducts.some(p => 
          p.name && product.name && p.name.toLowerCase() === product.name.toLowerCase()
        )
        
        if (isDuplicate) {
          // Revert optimistic update
          setProducts(prev => prev.filter(p => p.id !== tempId))
          throw new Error("A product with this name already exists")
        }
        
        // Add to mock data with a real ID
        const persistedProduct: Product = {
          id: `mock-${Date.now()}`,
          ...product,
        }
        
        // Create a new copy of the mockProducts array to avoid reference issues
        // Use push with a spread to ensure a new object reference
        mockProducts.push({...persistedProduct})
        
        // Save products to localStorage
        saveProductsToStorage()
        
        // Update state with the real ID - use filter + spread to ensure new array reference
        setProducts(prev => {
          const filtered = prev.filter(p => p.id !== tempId);
          return [...filtered, {...persistedProduct}];
        })
        
        // Trigger a data refresh to ensure all components have the latest data
        setTimeout(() => refreshData(), 100)
        
        toast({
          title: "Success",
          description: "Product added successfully",
        })
        return persistedProduct
      } else {
        // Add to real API
        const response = await fetch(API_ENDPOINTS.PRODUCTS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product),
        })

        if (!response.ok) {
          // Revert optimistic update
          setProducts(prev => prev.filter(p => p.id !== tempId))
          throw new Error("Failed to add product")
        }

        const persistedProduct = await response.json()
        
        // Update with the new reference to trigger state updates - ensure new array reference
        setProducts(prev => {
          const filtered = prev.filter(p => p.id !== tempId);
          return [...filtered, {...persistedProduct}];
        })
        
        // Trigger a data refresh to ensure all components have the latest data
        setTimeout(() => refreshData(), 100)

        toast({
          title: "Success",
          description: "Product added successfully",
        })
        return persistedProduct
      }
    } catch (err) {
      console.error("Error adding product:", err)
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add product",
        variant: "destructive",
      })
      throw err
    }
  }, [toast, refreshData])

  // Function to update an existing product
  const updateProduct = useCallback(async (product: Product): Promise<Product> => {
    try {
      // Basic validation
      if (!product.name || product.name.trim() === "") {
        throw new Error("Product name is required")
      }
      
      if (!product.category || product.category.trim() === "") {
        throw new Error("Product category is required")
      }
      
      if (!product.unit || product.unit.trim() === "") {
        throw new Error("Product unit is required")
      }
      
      if (USE_MOCK_DATA) {
        // Check for duplicate product names (excluding the current product)
        const isDuplicate = mockProducts.some(p => 
          p.id !== product.id && p.name && product.name && p.name.toLowerCase() === product.name.toLowerCase()
        )
        
        if (isDuplicate) {
          throw new Error("A product with this name already exists")
        }
        
        // Update in mock data - ensuring a new object reference
        const index = mockProducts.findIndex(p => p.id === product.id)
        if (index === -1) throw new Error("Product not found")
        
        // Create a fresh copy to avoid reference issues
        mockProducts[index] = { ...product }
        
        // Save products to localStorage
        saveProductsToStorage()
        
        // Update in state with completely new array reference to trigger React re-renders
        setProducts(prev => {
          const newArray = [...prev];
          const stateIndex = newArray.findIndex(p => p.id === product.id);
          if (stateIndex !== -1) {
            newArray[stateIndex] = { ...product };
          }
          return newArray;
        })
        
        // Trigger a data refresh to ensure all components have the latest data
        setTimeout(() => refreshData(), 100)
        
        toast({
          title: "Success",
          description: "Product updated successfully",
        })
        return { ...product }
      } else {
        // Update in real API
        const response = await fetch(`${API_ENDPOINTS.PRODUCTS}/${product.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product),
        })

        if (!response.ok) {
          throw new Error("Failed to update product")
        }

        const updatedProduct = await response.json()
        
        // Update in state with a new reference to ensure React re-renders
        setProducts(prev => {
          const newArray = [...prev];
          const index = newArray.findIndex(p => p.id === updatedProduct.id);
          if (index !== -1) {
            newArray[index] = { ...updatedProduct };
          }
          return newArray;
        })
        
        // Trigger a data refresh to ensure all components have the latest data
        setTimeout(() => refreshData(), 100)

        toast({
          title: "Success",
          description: "Product updated successfully",
        })
        return { ...updatedProduct }
      }
    } catch (err) {
      console.error("Error updating product:", err)
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update product",
        variant: "destructive",
      })
      throw err
    }
  }, [toast, refreshData])

  // Function to delete a product
  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    try {
      // Find the product
      const product = products.find(p => p.id === id)
      if (!product) {
        throw new Error("Product not found")
      }
      
      // Check if product is used in any entries
      const isUsedInProduction = productionEntries.some(entry => 
        entry.product_name.toLowerCase() === product.name.toLowerCase()
      )
      
      const isUsedInDisposal = disposalEntries.some(entry => 
        entry.product_name.toLowerCase() === product.name.toLowerCase()
      )
      
      if (isUsedInProduction || isUsedInDisposal) {
        throw new Error(
          "This product cannot be deleted because it is used in production or disposal entries. " +
          "Please remove all related entries first or contact an administrator."
        )
      }
      
      // Optimistically update the UI
      setProducts(prev => prev.filter(p => p.id !== id))
      
      if (USE_MOCK_DATA) {
        // Update mock data
        const index = mockProducts.findIndex(p => p.id === id)
        if (index === -1) {
          // Revert optimistic update if product not found
          setProducts(prev => [...prev, product])
          throw new Error("Product not found")
        }
        
        // Remove product from mock data
        mockProducts.splice(index, 1)
        
        // Save products to localStorage
        saveProductsToStorage()
        
        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
      } else {
        // Delete from real API
        const response = await fetch(`${API_ENDPOINTS.PRODUCTS}/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          // Revert optimistic update if API call fails
          setProducts(prev => [...prev, product])
          throw new Error("Failed to delete product")
        }

        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
      }
    } catch (err) {
      console.error("Error deleting product:", err)
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete product",
        variant: "destructive",
      })
      throw err
    }
  }, [products, productionEntries, disposalEntries, toast])

  // Function to clear all data - products, production entries and disposal entries
  const clearAllData = useCallback(async (): Promise<void> => {
    try {
      if (USE_MOCK_DATA) {
        // Clear mock data
        mockProducts.length = 0;
        mockProductionEntries.length = 0;
        mockDisposalEntries.length = 0;
        
        // Save empty products to localStorage
        saveProductsToStorage();
        
        // Clear state
        setProducts([]);
        setProductionEntries([]);
        setDisposalEntries([]);
        
        toast({
          title: "Success",
          description: "All data has been cleared successfully",
        });
      } else {
        // Clear from real API
        const responses = await Promise.all([
          fetch(`${API_ENDPOINTS.PRODUCTS}/clear`, { method: 'DELETE' }),
          fetch(`${API_ENDPOINTS.PRODUCTION}/clear`, { method: 'DELETE' }),
          fetch(`${API_ENDPOINTS.DISPOSAL}/clear`, { method: 'DELETE' })
        ]);
        
        // Check if any requests failed
        const failedResponses = responses.filter(response => !response.ok);
        if (failedResponses.length > 0) {
          throw new Error("Failed to clear some data");
        }
        
        // Clear state
        setProducts([]);
        setProductionEntries([]);
        setDisposalEntries([]);
        
        toast({
          title: "Success",
          description: "All data has been cleared successfully",
        });
      }
    } catch (err) {
      console.error("Error clearing all data:", err);
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to clear data",
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  // Function to delete a production entry
  const deleteProductionEntry = useCallback(async (id: string): Promise<void> => {
    try {
      // Find the entry to delete
      const entry = productionEntries.find(e => e.id === id)
      if (!entry) {
        throw new Error("Production entry not found")
      }
      
      // Optimistically update the UI
      setProductionEntries(prev => prev.filter(e => e.id !== id))
      
      if (USE_MOCK_DATA) {
        // Update mock data
        const index = mockProductionEntries.findIndex(e => e.id === id)
        if (index === -1) {
          // Revert optimistic update if entry not found
          setProductionEntries(prev => [...prev, entry])
          throw new Error("Production entry not found in mock data")
        }
        
        // Remove entry from mock data
        mockProductionEntries.splice(index, 1)
        
        toast({
          title: "Success",
          description: "Production entry deleted successfully",
        })
      } else {
        // Delete from real API
        const response = await fetch(`${API_ENDPOINTS.PRODUCTION}/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          // Revert optimistic update if API call fails
          setProductionEntries(prev => [...prev, entry])
          throw new Error("Failed to delete production entry")
        }

        toast({
          title: "Success",
          description: "Production entry deleted successfully",
        })
      }
    } catch (err) {
      console.error("Error deleting production entry:", err)
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete production entry",
        variant: "destructive",
      })
      throw err
    }
  }, [productionEntries, toast])

  // Function to delete a disposal entry
  const deleteDisposalEntry = useCallback(async (id: string): Promise<void> => {
    try {
      // Find the entry to delete
      const entry = disposalEntries.find(e => e.id === id)
      if (!entry) {
        throw new Error("Disposal entry not found")
      }
      
      // Optimistically update the UI
      setDisposalEntries(prev => prev.filter(e => e.id !== id))
      
      if (USE_MOCK_DATA) {
        // Update mock data
        const index = mockDisposalEntries.findIndex(e => e.id === id)
        if (index === -1) {
          // Revert optimistic update if entry not found
          setDisposalEntries(prev => [...prev, entry])
          throw new Error("Disposal entry not found in mock data")
        }
        
        // Remove entry from mock data
        mockDisposalEntries.splice(index, 1)
        
        toast({
          title: "Success",
          description: "Disposal entry deleted successfully",
        })
      } else {
        // Delete from real API
        const response = await fetch(`${API_ENDPOINTS.DISPOSAL}/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          // Revert optimistic update if API call fails
          setDisposalEntries(prev => [...prev, entry])
          throw new Error("Failed to delete disposal entry")
        }

        toast({
          title: "Success",
          description: "Disposal entry deleted successfully",
        })
      }
    } catch (err) {
      console.error("Error deleting disposal entry:", err)
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete disposal entry",
        variant: "destructive",
      })
      throw err
    }
  }, [disposalEntries, toast])

  // Fetch data on component mount
  useEffect(() => {
    fetchData()

    // Set up periodic refresh of mock data if using mock data
    let intervalId: number | undefined
    
    if (USE_MOCK_DATA) {
      intervalId = window.setInterval(() => {
        // Generate new entries occasionally
        if (Math.random() > 0.7) {
          const newProductionEntries = generateProductionEntries(1)
          const newDisposalEntries = Math.random() > 0.6 ? generateDisposalEntries(1) : []
          
          mockProductionEntries = [...newProductionEntries, ...mockProductionEntries]
          mockDisposalEntries = [...newDisposalEntries, ...mockDisposalEntries]
          
          setProductionEntries([...newProductionEntries, ...productionEntries])
          setDisposalEntries([...newDisposalEntries, ...disposalEntries])
        }
      }, MOCK_DATA_REFRESH_INTERVAL)
    }
    
    return () => {
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [fetchData])
  
  const value: DataContextType = {
    products,
    productionEntries,
    disposalEntries,
    isLoading,
    error,
    addProductionEntry,
    addDisposalEntry,
    addProduct,
    updateProduct,
    deleteProduct,
    refreshData,
    clearAllData,
    deleteProductionEntry,
    deleteDisposalEntry
  }
  
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

// Hook to use the data context
export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}

