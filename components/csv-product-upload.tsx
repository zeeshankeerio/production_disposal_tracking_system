"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useData } from "@/components/providers/data-provider"
import { FileUp, AlertTriangle, Check, Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

// Product structure expected in CSV
interface CsvProductData {
  id?: string
  product_name: string
  category: string
  unit?: string
  description?: string
}

export function CsvProductUpload() {
  const { addProduct, refreshData } = useData()
  const [isUploading, setIsUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [csvData, setCsvData] = useState<CsvProductData[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [importComplete, setImportComplete] = useState(false)
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Map CSV unit strings to application units
  const mapUnit = (unit: string | undefined | null): string => {
    if (!unit) return "piece";
    
    const unitMap: Record<string, string> = {
      // Common variations to standardize
      "unit": "unit",
      "units": "unit",
      "piece": "piece",
      "pieces": "piece",
      "pc": "piece",
      "pcs": "piece",
      "slice": "slice",
      "slices": "slice",
      "cake": "cake",
      "cakes": "cake",
      "loaf": "loaf",
      "loaves": "loaf",
      "kg": "kg",
      "kilograms": "kg",
      "g": "g",
      "gram": "g",
      "grams": "g",
      "dozen": "dozen",
      "box": "box",
      "boxes": "box",
      "pack": "pack",
      "package": "pack",
      "cup": "cup",
      "cups": "cup"
    }

    const lowerUnit = unit.toLowerCase().trim()
    return unitMap[lowerUnit] || "piece" // Default to piece if not found
  }

  // Auto-assign units based on product name and category
  const determineUnit = (product: CsvProductData): string => {
    // Add null checks before calling toLowerCase()
    const name = product.product_name ? product.product_name.toLowerCase() : '';
    
    // Handle categories with slashes by taking the first part (before the slash)
    // For example: "In Display/Itens em Exposição" -> "in display"
    let category = '';
    if (product.category) {
      // If category contains slash, use just the first part for matching
      if (product.category.includes('/')) {
        category = product.category.split('/')[0].toLowerCase().trim();
      } else {
        category = product.category.toLowerCase();
      }
    }
    
    // If unit is already provided and valid, use it
    if (product.unit) {
      const mappedUnit = mapUnit(product.unit)
      if (mappedUnit) return mappedUnit
    }
    
    // Otherwise, determine from category and name
    if (category.includes("refrigerado")) {
      if (name.includes("bolo")) return "cake"
      if (name.includes("mousse") || name.includes("copo")) return "cup"
      if (name.includes("torta") || name.includes("pudim")) return "slice"
      return "piece"
    }
    
    if (category.includes("embalado")) {
      if (name.includes("bolo")) return "cake"
      if (name.includes("pão")) return "loaf"
      if (name.includes("biscoito")) return "pack"
      return "piece"
    }
    
    if (category.includes("salgados")) return "piece"
    
    if (category.includes("exposição") || category.includes("display")) {
      if (name.includes("bolo")) return "slice"
      return "piece"
    }
    
    return "piece" // Default
  }

  // Validate row data
  const validateRow = (row: any, index: number): string[] => {
    const errors: string[] = []
    
    if (!row.product_name) {
      errors.push(`Row ${index+1}: Product name is required`)
    } else if (row.product_name.length < 2) {
      errors.push(`Row ${index+1}: Product name must be at least 2 characters`)
    }
    
    if (!row.category) {
      errors.push(`Row ${index+1}: Category is required`)
    }
    
    return errors
  }

  // Import products to database with batch processing and improved handling
  const importProducts = async () => {
    if (csvData.length === 0) return;
    
    setIsUploading(true);
    setImportComplete(false);
    let successCount = 0;
    let failCount = 0;
    const failedProducts: {name: string, error: string}[] = [];
    
    try {
      // Process products in small batches to prevent overwhelming the system
      const BATCH_SIZE = 5; // Process 5 products at a time
      
      // Calculate total batches
      const totalBatches = Math.ceil(csvData.length / BATCH_SIZE);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        // Get current batch of products
        const startIndex = batchIndex * BATCH_SIZE;
        const endIndex = Math.min(startIndex + BATCH_SIZE, csvData.length);
        const batch = csvData.slice(startIndex, endIndex);
        
        // Process each product in the batch
        const batchPromises = batch.map(async (product) => {
          try {
            // Use determineUnit unless a specific unit was provided
            const unit = product.unit ? mapUnit(product.unit) : determineUnit(product);
            
            // Add product with proper unit
            await addProduct({
              name: product.product_name,
              category: product.category,
              unit: unit,
              description: product.description || `${product.category} - ${product.product_name}`
            });
            return { success: true, product };
          } catch (error) {
            return { 
              success: false, 
              product,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        });
        
        // Wait for all products in the batch to be processed
        const results = await Promise.allSettled(batchPromises);
        
        // Count successes and failures
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { success, product, error } = result.value;
            if (success) {
              successCount++;
            } else {
              failCount++;
              failedProducts.push({
                name: product.product_name,
                error: error || 'Unknown error'
              });
              console.error(`Failed to import product: ${product.product_name}`, error);
            }
          } else {
            failCount++;
            console.error('Promise rejection during import:', result.reason);
          }
        });
        
        // Update progress based on completed batches
        const completedItems = (batchIndex + 1) * BATCH_SIZE;
        const progressPercent = Math.min(Math.floor((completedItems / csvData.length) * 100), 100);
        setProgress(progressPercent);
        
        // Update stats
        setStats({
          total: csvData.length,
          success: successCount,
          failed: failCount
        });
        
        // Short pause between batches to let the UI update and prevent freezing
        await new Promise(r => setTimeout(r, 100));
      }
      
      // Show failed products in console for debugging
      if (failedProducts.length > 0) {
        console.group('Failed to import these products:');
        failedProducts.forEach(({name, error}) => {
          console.error(`${name}: ${error}`);
        });
        console.groupEnd();
      }
      
      // Notify user of import completion
      toast({
        title: "Import complete",
        description: `Successfully imported ${successCount} products. ${failCount} products failed.`,
      });
      
      // Refresh data to update the UI
      await refreshData();
      
      // If some products failed, provide more information
      if (failCount > 0) {
        toast({
          title: "Some products failed to import",
          description: "Check the browser console for details (F12 > Console).",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("Error in import process:", error);
      toast({
        title: "Import error",
        description: error instanceof Error ? error.message : "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setImportComplete(true);
    }
  };

  // Enhanced CSV parsing for larger files
  const parseCSV = (content: string): CsvProductData[] => {
    try {
      // Handle different line endings and remove empty lines
      const lines = content.split(/\r\n|\n|\r/).filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }
      
      // Parse header row
      const headers = parseCSVRow(lines[0]);
      
      // Find column indices
      const idIndex = findColumnIndex(headers, ['#', 'id', 'product id', 'product_id']);
      const nameIndex = findColumnIndex(headers, ['product name', 'product_name', 'name', 'product']);
      const categoryIndex = findColumnIndex(headers, ['category', 'type', 'product category', 'product_category']);
      const unitIndex = findColumnIndex(headers, ['unit', 'units', 'measure', 'unit_of_measure']);
      const descriptionIndex = findColumnIndex(headers, ['description', 'desc', 'notes', 'details']);
      
      if (nameIndex === -1 || categoryIndex === -1) {
        throw new Error('CSV must contain at least "Product Name" and "Category" columns. ' +
                        'Please check column headers and try again.');
      }
      
      // Process each line - using a for loop for better performance with large files
      const rows: CsvProductData[] = [];
      const allErrors: string[] = [];
      
      // Keep track of processed lines for performance
      let processedLines = 0;
      const totalLines = lines.length - 1; // Exclude header

      // Parse in chunks for better UI responsiveness
      const parseChunk = (startIndex: number, endIndex: number) => {
        for (let i = startIndex; i < endIndex; i++) {
          if (!lines[i].trim()) continue;
          
          try {
            const columns = parseCSVRow(lines[i]);
            
            const product: CsvProductData = {
              product_name: columns[nameIndex] || '',
              category: columns[categoryIndex] || '',
              unit: unitIndex !== -1 && columns[unitIndex] ? columns[unitIndex] : undefined,
              description: descriptionIndex !== -1 && columns[descriptionIndex] ? 
                columns[descriptionIndex] : undefined
            };
            
            if (idIndex !== -1 && columns[idIndex]) {
              product.id = columns[idIndex];
            }
            
            if (!product.product_name) {
              allErrors.push(`Row ${i}: Product name is missing`);
              continue;
            }
            
            if (!product.category) {
              allErrors.push(`Row ${i}: Category is missing`);
              continue;
            }
            
            // Basic validation
            if (product.product_name.length < 2) {
              allErrors.push(`Row ${i}: Product name must be at least 2 characters`);
              continue;
            }
            
            // Add valid product to rows array
            rows.push(product);
          } catch (error) {
            allErrors.push(`Row ${i}: Error parsing row - ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          
          processedLines++;
          const progress = Math.floor((processedLines / totalLines) * 50); // Use first 50% for parsing
          setProgress(progress);
        }
      };
      
      // Parse header row and first 100 rows immediately
      const initialEnd = Math.min(101, lines.length);
      parseChunk(1, initialEnd);
      
      // Process remaining rows if there are more
      if (lines.length > initialEnd) {
        parseChunk(initialEnd, lines.length);
      }
      
      setValidationErrors(allErrors);
      console.log(`Parsed ${rows.length} products from CSV with ${allErrors.length} errors`);
      return rows;
    } catch (error) {
      console.error("Error parsing CSV:", error);
      throw error;
    }
  };
  
  // Helper function to parse a CSV row, handling quoted values
  const parseCSVRow = (row: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        // Handle quotes - toggle quote state
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        // End of field if comma and not inside quotes
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    // Clean up quoted values
    return result.map(value => {
      // Remove enclosing quotes and handle escaped quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        return value.substring(1, value.length - 1).replace(/""/g, '"').trim();
      }
      return value.trim();
    });
  };
  
  // Helper function to find column index by possible names (case insensitive)
  const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
    const lowerHeaders = headers.map(h => h && h.toLowerCase().trim() || '');
    
    for (const name of possibleNames) {
      const index = lowerHeaders.indexOf(name ? name.toLowerCase() : '');
      if (index !== -1) return index;
    }
    
    return -1; // Not found
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setFileName(file.name)
    setIsUploading(true)
    setProgress(10)
    
    try {
      // Use FileReader with ISO-8859-1 encoding for better handling of special characters
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            resolve(event.target.result as string)
          } else {
            reject(new Error("Failed to read file contents"))
          }
        }
        reader.onerror = () => reject(reader.error)
        // Read as ISO-8859-1 (Latin1) which better preserves special characters
        reader.readAsText(file, "ISO-8859-1")
      })
      
      setProgress(30)
      
      const data = parseCSV(content)
      setProgress(50)
      
      setCsvData(data)
      setStats({
        total: data.length,
        success: 0,
        failed: 0
      })
      
    } catch (error) {
      toast({
        title: "Error parsing CSV",
        description: error instanceof Error ? error.message : "Failed to parse CSV file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setProgress(100)
    }
  }

  // Reset the import
  const resetImport = () => {
    setCsvData([])
    setFileName(null)
    setValidationErrors([])
    setProgress(0)
    setImportComplete(false)
    setStats({ total: 0, success: 0, failed: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      {!csvData.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Import Products from CSV</CardTitle>
            <CardDescription>
              Upload a CSV file with product names and categories for bulk import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
              <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Your CSV file only needs to have columns for <strong>Product Name</strong> and <strong>Category</strong>. 
                Unit will be set to "piece" by default and can be changed later if needed.
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                disabled={isUploading}
                onChange={handleFileChange}
                className="max-w-sm"
              />
              <div className="mt-4 text-sm text-center">
                <a 
                  href="/templates/product-import-template.csv" 
                  download
                  className="text-primary hover:underline"
                >
                  Download template CSV file
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>CSV Data Preview</CardTitle>
                <CardDescription>
                  {fileName ? `File: ${fileName} (${csvData.length} products)` : "Preview data before import"}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={resetImport}
                disabled={isUploading}
              >
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Validation Errors ({validationErrors.length})</AlertTitle>
                <AlertDescription>
                  <div className="max-h-40 overflow-auto">
                    <ul className="list-disc pl-5 mt-2">
                      {validationErrors.slice(0, 10).map((error, i) => (
                        <li key={i} className="text-sm">{error}</li>
                      ))}
                      {validationErrors.length > 10 && (
                        <li className="text-sm italic">...and {validationErrors.length - 10} more errors</li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="border rounded-md">
              <Table>
                <TableCaption>
                  {csvData.length} products ready to import
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">#</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    {/* Show unit column if present in CSV */}
                    {csvData.some(data => data.unit) && <TableHead>Unit</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{row.product_name}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      {/* Show unit value if present in CSV */}
                      {csvData.some(data => data.unit) && <TableCell>{row.unit || 'piece'}</TableCell>}
                    </TableRow>
                  ))}
                  {csvData.length > 10 && (
                    <TableRow>
                      <TableCell colSpan={csvData.some(data => data.unit) ? 4 : 3} className="text-center italic">
                        + {csvData.length - 10} more items
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {isUploading && (
              <div className="mt-4 space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  Processing: {stats.success + stats.failed} of {stats.total} products 
                  ({Math.round(progress)}%)
                </p>
              </div>
            )}

            {importComplete && (
              <Alert className="mt-4" variant={stats.failed > 0 ? "destructive" : "default"}>
                {stats.failed > 0 ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <AlertTitle>Import Results</AlertTitle>
                <AlertDescription>
                  Successfully imported {stats.success} of {stats.total} products.
                  {stats.failed > 0 && ` ${stats.failed} products failed to import.`}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={importProducts} 
              disabled={isUploading || csvData.length === 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Products"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}