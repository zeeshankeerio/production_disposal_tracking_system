import { Product, ProductionEntry, DisposalEntry } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"

// Define file paths
const DATA_DIR = path.join(process.cwd(), "data")
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json")
const PRODUCTION_FILE = path.join(DATA_DIR, "production.json")
const DISPOSAL_FILE = path.join(DATA_DIR, "disposal.json")

// Ensure data directory exists
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Create empty files if they don't exist
const initializeFiles = () => {
  ensureDataDir()
  
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([]))
  }
  
  if (!fs.existsSync(PRODUCTION_FILE)) {
    fs.writeFileSync(PRODUCTION_FILE, JSON.stringify([]))
  }
  
  if (!fs.existsSync(DISPOSAL_FILE)) {
    fs.writeFileSync(DISPOSAL_FILE, JSON.stringify([]))
  }
}

// Helper to convert Date objects to ISO strings during serialization
const dateReplacer = (key: string, value: any) => {
  if (value instanceof Date) {
    return value.toISOString()
  }
  return value
}

// Helper to revive Date objects during deserialization
const dateReviver = (key: string, value: any) => {
  // Check if this looks like an ISO date string
  if (typeof value === 'string' && 
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/.test(value)) {
    try {
      const date = new Date(value);
      // Convert to EST by subtracting 4 hours
      date.setHours(date.getHours() - 4);
      return date;
    } catch (e) {
      // If Date creation fails, return the original string
      return value;
    }
  }
  return value;
}

// Generic read function
const readData = <T>(filePath: string): T[] => {
  try {
    const data = fs.readFileSync(filePath, "utf-8")
    if (!data || data.trim() === '') {
      return []
    }
    // Use the date reviver to convert date strings back to Date objects
    return JSON.parse(data, dateReviver) as T[]
  } catch (error) {
    console.error(`Error reading from ${filePath}:`, error)
    return []
  }
}

// Generic write function
const writeData = <T>(filePath: string, data: T[]): boolean => {
  try {
    // Use the date replacer to convert Date objects to ISO strings
    fs.writeFileSync(filePath, JSON.stringify(data, dateReplacer, 2))
    return true
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error)
    return false
  }
}

// Products API
export const getProducts = (): Product[] => {
  initializeFiles()
  return readData<Product>(PRODUCTS_FILE)
}

export const getProduct = (id: string): Product | null => {
  const products = getProducts()
  return products.find(p => p.id === id) || null
}

export const createProduct = (product: Omit<Product, "id">): Product | null => {
  const products = getProducts()
  
  // Check for duplicate product names
  if (products.some(p => p.name && product.name && p.name.toLowerCase() === product.name.toLowerCase())) {
    return null
  }
  
  const newProduct: Product = {
    ...product,
    id: uuidv4()
  }
  
  products.push(newProduct)
  if (writeData(PRODUCTS_FILE, products)) {
    return newProduct
  }
  
  return null
}

export const updateProduct = (product: Product): Product | null => {
  const products = getProducts()
  const index = products.findIndex(p => p.id === product.id)
  
  if (index === -1) {
    return null
  }
  
  // Check for duplicate product names (excluding the current product)
  if (products.some(p => p.id !== product.id && p.name && product.name && p.name.toLowerCase() === product.name.toLowerCase())) {
    return null
  }
  
  products[index] = product
  if (writeData(PRODUCTS_FILE, products)) {
    return product
  }
  
  return null
}

export const deleteProduct = (id: string): boolean => {
  const products = getProducts()
  const filtered = products.filter(p => p.id !== id)
  
  if (filtered.length === products.length) {
    return false // Nothing was removed
  }
  
  return writeData(PRODUCTS_FILE, filtered)
}

export const clearProducts = (): boolean => {
  return writeData(PRODUCTS_FILE, [])
}

// Production entries API
export const getProductionEntries = (): ProductionEntry[] => {
  initializeFiles()
  const entries = readData<ProductionEntry>(PRODUCTION_FILE)
  
  // Double ensure date fields are properly cast as Date objects in EST
  return entries.map(entry => ({
    ...entry,
    date: entry.date instanceof Date ? entry.date : new Date(String(entry.date))
  }))
}

export const createProductionEntry = (entry: Omit<ProductionEntry, "id">): ProductionEntry | null => {
  const entries = getProductionEntries()
  
  // Ensure the date is a Date object in EST
  const newEntry: ProductionEntry = {
    ...entry,
    id: uuidv4(),
    date: entry.date instanceof Date ? entry.date : new Date(String(entry.date))
  }
  
  // Make sure date serializes correctly
  Object.defineProperty(newEntry, 'date', {
    writable: true,
    enumerable: true,
    value: newEntry.date
  })
  
  entries.unshift(newEntry) // Add to front for most recent first
  if (writeData(PRODUCTION_FILE, entries)) {
    return newEntry
  }
  
  return null
}

export const clearProductionEntries = (): boolean => {
  return writeData(PRODUCTION_FILE, [])
}

// Disposal entries API
export const getDisposalEntries = (): DisposalEntry[] => {
  initializeFiles()
  const entries = readData<DisposalEntry>(DISPOSAL_FILE)
  
  // Double ensure date fields are properly cast as Date objects in EST
  return entries.map(entry => ({
    ...entry,
    date: entry.date instanceof Date ? entry.date : new Date(String(entry.date))
  }))
}

export const createDisposalEntry = (entry: Omit<DisposalEntry, "id">): DisposalEntry | null => {
  const entries = getDisposalEntries()
  
  // Use the same timestamp for both date and created_at
  const currentTime = new Date()
  
  const newEntry: DisposalEntry = {
    ...entry,
    id: uuidv4(),
    date: currentTime, // Set to same timestamp as created_at
    created_at: currentTime
  }
  
  // Make sure date serializes correctly
  Object.defineProperty(newEntry, 'date', {
    writable: true,
    enumerable: true,
    value: newEntry.date
  })
  
  entries.unshift(newEntry) // Add to front for most recent first
  if (writeData(DISPOSAL_FILE, entries)) {
    return newEntry
  }
  
  return null
}

export const clearDisposalEntries = (): boolean => {
  return writeData(DISPOSAL_FILE, [])
}

// Initialize files on startup
initializeFiles() 