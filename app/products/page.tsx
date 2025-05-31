"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useData } from "@/components/providers/data-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw, FileText, Plus, Edit, Trash, ChevronLeft, ChevronRight, AlertCircle, Lightbulb, LayoutDashboard, PackagePlus, PackageMinus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ProductDialog } from "@/components/product-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CopyrightFooter } from "@/components/copyright-footer"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Breadcrumb } from "@/components/breadcrumb"
import { QuickNav } from "@/components/quick-nav"
import { CsvImportDialog } from "@/components/csv-import-dialog"

export default function ProductsPage() {
  const { products, isLoading, refreshData, deleteProduct, error, clearAllData } = useData()
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const { toast } = useToast()
  
  // Set mounted state after initial render
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Show toast when errors occur
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory])
  
  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      (product.name ? product.name.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
      (product.description ? product.description.toLowerCase() : '').includes(searchTerm.toLowerCase()) ||
      (product.category ? product.category.toLowerCase() : '').includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)
  
  // Get all unique categories
  const categories = Array.from(new Set(products.map(product => product.category)))
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshData()
    setTimeout(() => {
      setIsRefreshing(false)
      toast({
        title: "Data Refreshed",
        description: "Product data has been updated",
      })
    }, 800)
  }
  
  // Export products to CSV
  const exportToCSV = () => {
    if (filteredProducts.length === 0) return
    
    const headers = ["ID", "Name", "Category", "Unit", "Description"]
    const csvRows = []
    csvRows.push(headers.join(','))
    
    for (const product of filteredProducts) {
      const values = [
        product.id,
        product.name,
        product.category,
        product.unit,
        product.description || ""
      ]
      csvRows.push(values.map(value => `"${value}"`).join(','))
    }
    
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `products-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Export Successful",
      description: `Product data has been exported to CSV`,
    })
  }
  
  // Handle clear all data
  const handleClearAllData = async () => {
    try {
      await clearAllData();
      toast({
        title: "Data Cleared",
        description: "All products, production entries, and disposal entries have been cleared",
      });
    } catch (error) {
      console.error("Error clearing data:", error);
      toast({
        title: "Error",
        description: "Failed to clear data. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (!mounted) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
            <p className="text-muted-foreground">
              Manage your products inventory
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[200px]" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-10 space-y-8">
      <Breadcrumb 
        items={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Products" },
        ]} 
        className="mb-2"
      />
      
      <QuickNav />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Product Management</h2>
          <p className="text-muted-foreground">
            Manage your products inventory
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportToCSV}
            disabled={filteredProducts.length === 0 || isLoading}
            className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export
          </Button>
          <CsvImportDialog 
            buttonVariant="outline" 
            buttonSize="sm"
            buttonText="Import CSV"
            buttonClass="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50"
          />
          <ConfirmDialog
            title="Clear All Data"
            description="This will permanently delete all products, production entries, and disposal entries. This action cannot be undone."
            onConfirm={handleClearAllData}
            trigger={
              <Button 
                variant="destructive" 
                size="sm"
                className="transition-all hover:shadow-md dark:shadow-md"
              >
                <Trash className="mr-2 h-4 w-4" />
                Clear All Data
              </Button>
            }
          />
          <ProductDialog 
            buttonVariant="default" 
            buttonSize="sm"
            buttonText="Add New Product"
            buttonClass="transition-all hover:shadow-md"
          />
        </div>
      </div>
      
      {/* Quick Navigation */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 -mt-4">
        <Button variant="link" size="sm" asChild>
          <a href="/entries">
            <FileText className="mr-1 h-4 w-4" />
            Entries
          </a>
        </Button>
        <Button variant="link" size="sm" asChild>
          <a href="/dashboard">
            <LayoutDashboard className="mr-1 h-4 w-4" />
            Dashboard
          </a>
        </Button>
        <Button variant="link" size="sm" asChild>
          <a href="/production">
            <PackagePlus className="mr-1 h-4 w-4" />
            Production
          </a>
        </Button>
        <Button variant="link" size="sm" asChild>
          <a href="/disposal">
            <PackageMinus className="mr-1 h-4 w-4" />
            Disposal
          </a>
        </Button>
      </div>
      
      <Card className="transition-all hover:shadow-md dark:shadow-none dark:hover:shadow-none dark:border-border/50">
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Manage your products inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="border border-destructive/30 bg-destructive/5 p-4 rounded-md space-y-2">
              <div className="flex items-center gap-2 text-destructive font-medium">
                <AlertCircle className="h-5 w-5" />
                Error loading products
              </div>
              <p className="text-sm text-muted-foreground">
                {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="gap-2 mt-2"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tutorial section */}
              <div className="mb-4 p-3 bg-muted/50 rounded-md border border-border/50">
                <h3 className="text-sm font-medium mb-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1 text-amber-500" />
                  Working with Products
                </h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-semibold">Custom Categories:</span> Select <span className="font-semibold">"+ Add Custom Category"</span> to create categories 
                    beyond the standard ones. Custom categories will be immediately available for all products.
                  </p>
                  <p>
                    <span className="font-semibold">Products in Use:</span> Products that are used in production or disposal entries cannot be deleted.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search products..." 
                    className="pl-8 dark:border-border/50" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full sm:w-[200px] dark:border-border/50">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="rounded-md border dark:border-border/50 overflow-x-auto">
                <div className="grid grid-cols-6 gap-4 p-4 font-medium border-b dark:border-border/50 min-w-[800px]">
                  <div className="col-span-2">Product</div>
                  <div>Category</div>
                  <div>Unit</div>
                  <div className="col-span-2">Actions</div>
                </div>
                <div className="divide-y dark:divide-border/50 min-w-[800px]">
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <div key={i} className="grid grid-cols-6 gap-4 p-4">
                        <Skeleton className="h-6 w-full col-span-2" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-8 w-20 col-span-2" />
                      </div>
                    ))
                  ) : filteredProducts.length > 0 ? (
                    paginatedProducts.map((product) => (
                      <div key={product.id} className="grid grid-cols-6 gap-4 p-4">
                        <div className="col-span-2">
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {product.description}
                            </div>
                          )}
                        </div>
                        <div>
                          <Badge variant="outline" className="dark:border-border/50">
                            {product.category}
                          </Badge>
                        </div>
                        <div>{product.unit}</div>
                        <div className="col-span-2 flex items-center space-x-2">
                          <ProductDialog 
                            buttonVariant="outline"
                            buttonSize="sm"
                            buttonText="Edit" 
                            buttonClass="dark:border-border/50"
                            mode="edit"
                            product={product}
                            trigger={
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="dark:border-border/50"
                                aria-label={`Edit ${product.name}`}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                <span className="sm:inline hidden">Edit</span>
                              </Button>
                            }
                          />
                          <ConfirmDialog
                            title="Delete Product"
                            description={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
                            variant="danger"
                            confirmText="Delete"
                            onConfirm={() => deleteProduct(product.id)}
                            trigger={
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="dark:border-border/50 hover:bg-destructive/10 hover:text-destructive"
                                aria-label={`Delete ${product.name}`}
                              >
                                <Trash className="h-4 w-4 mr-1" />
                                <span className="sm:inline hidden">Delete</span>
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      {searchTerm || selectedCategory !== "all" ? (
                        <div>
                          <h3 className="text-lg font-medium mb-2">No products found</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            No products match your current filters. Try adjusting your search or category selection.
                          </p>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSearchTerm("");
                              setSelectedCategory("all");
                            }}
                          >
                            <Search className="mr-2 h-4 w-4" />
                            Clear Filters
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-medium mb-2">No products yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Get started by adding your first product to the system.
                          </p>
                          <ProductDialog 
                            buttonVariant="default"
                            buttonText="Add Your First Product"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {filteredProducts.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
                  <div>
                    Showing {Math.min(startIndex + 1, filteredProducts.length)}-{Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-1 mx-2">
                        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                          let pageNum: number
                          
                          // Logic to show pages around current page
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                          
                          return (
                            <Button
                              key={i}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setCurrentPage(pageNum)}
                              aria-label={`Page ${pageNum}`}
                              aria-current={currentPage === pageNum ? "page" : undefined}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value))
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Items per page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 per page</SelectItem>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="20">20 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <CopyrightFooter />
    </div>
  )
} 