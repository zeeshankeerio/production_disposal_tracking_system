import { Product, ProductionEntry, DisposalEntry, Shift } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

// Initial sample products
const initialProducts: Product[] = [
  { id: "p1", name: "Whole Wheat Bread", description: "Freshly baked whole grain bread", unit: "loaf", category: "Bakery" },
  { id: "p2", name: "White Bread", description: "Classic white sandwich bread", unit: "loaf", category: "Bakery" },
  { id: "p3", name: "Chocolate Cake", description: "Rich chocolate cake with frosting", unit: "cake", category: "Pastry" },
  { id: "p4", name: "Croissant", description: "Buttery flaky pastry", unit: "piece", category: "Pastry" },
  { id: "p5", name: "Multigrain Loaf", description: "Nutritious multi-grain bread", unit: "loaf", category: "Bakery" },
  { id: "p6", name: "Cinnamon Roll", description: "Sweet pastry with cinnamon filling", unit: "piece", category: "Pastry" },
  { id: "p7", name: "Sourdough Bread", description: "Tangy sourdough bread loaf", unit: "loaf", category: "Bakery" },
  { id: "p8", name: "Cheese Danish", description: "Flaky pastry with cheese filling", unit: "piece", category: "Pastry" }
]

// Get products from localStorage or use initial products
const getPersistedProducts = (): Product[] => {
  if (typeof window === 'undefined') {
    return initialProducts;
  }
  
  try {
    const storedProducts = localStorage.getItem('mockProducts');
    return storedProducts ? JSON.parse(storedProducts) : initialProducts;
  } catch (error) {
    console.error("Error loading products from localStorage:", error);
    return initialProducts;
  }
}

// Products export that uses localStorage when available
export const products: Product[] = getPersistedProducts();

// Function to save products to localStorage
export const saveProductsToStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mockProducts', JSON.stringify(products));
    } catch (error) {
      console.error("Error saving products to localStorage:", error);
    }
  }
}

// Generate random date within the last 30 days
function getRandomDate(daysBack = 30) {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack))
  return date
}

// Generate random notes
function getRandomNotes() {
  const notes = [
    "Standard production run",
    "Increased batch size due to high demand",
    "Special order for customer",
    "Regular production schedule",
    "Extra care taken with this batch",
    "Followed new recipe",
    "Quality check passed",
    "Minor adjustments to recipe",
    "Production line running smoothly",
    "Staff training completed"
  ]
  
  return Math.random() > 0.7 ? notes[Math.floor(Math.random() * notes.length)] : ""
}

// Generate random disposal notes
function getRandomDisposalNotes(reason: string) {
  const notes = [
    "Standard disposal procedure followed",
    "Documented for quality control",
    "Inspected by supervisor",
    "Properly labeled for disposal",
    "Followed safety protocols",
    "Reported to management",
    "Replacement inventory ordered",
    "Staff notified of issue",
    "Root cause analysis pending",
    "Preventive measures implemented"
  ]
  
  return Math.random() > 0.6 ? notes[Math.floor(Math.random() * notes.length)] : ""
}

// Generate mock production entries
export function generateProductionEntries(count = 50): ProductionEntry[] {
  const entries: ProductionEntry[] = []
  const staffNames = ["John Smith", "Maria Garcia", "David Kim", "Sarah Johnson", "Ahmed Hassan"]
  const shifts: Shift[] = ["morning", "afternoon", "night"]
  
  for (let i = 0; i < count; i++) {
    const productIndex = Math.floor(Math.random() * products.length)
    const product = products[productIndex]
    const date = getRandomDate()
    
    entries.push({
      id: uuidv4(),
      product_name: product.name,
      product_id: product.id,
      staff_name: staffNames[Math.floor(Math.random() * staffNames.length)],
      date,
      quantity: 10 + Math.floor(Math.random() * 90),
      shift: shifts[Math.floor(Math.random() * shifts.length)],
      notes: getRandomNotes()
    })
  }
  
  return entries
}

// Generate mock disposal entries
export function generateDisposalEntries(count = 20): DisposalEntry[] {
  const entries: DisposalEntry[] = []
  const staffNames = ["John Smith", "Maria Garcia", "David Kim", "Sarah Johnson", "Ahmed Hassan"]
  const shifts: Shift[] = ["morning", "afternoon", "night"]
  const reasons = [
    "Expired / Past use-by date", 
    "Quality issues / Failed inspection",
    "Damaged / Broken during handling",
    "Contamination / Food safety concern",
    "Overproduction / Excess inventory",
    "Customer return",
    "Equipment malfunction",
    "Other"
  ]
  
  for (let i = 0; i < count; i++) {
    const productIndex = Math.floor(Math.random() * products.length)
    const product = products[productIndex]
    const reason = reasons[Math.floor(Math.random() * reasons.length)]
    
    entries.push({
      id: uuidv4(),
      product_name: product.name,
      product_id: product.id,
      staff_name: staffNames[Math.floor(Math.random() * staffNames.length)],
      date: getRandomDate(),
      quantity: 5 + Math.floor(Math.random() * 45),
      shift: shifts[Math.floor(Math.random() * shifts.length)],
      reason,
      notes: getRandomDisposalNotes(reason)
    })
  }
  
  return entries
} 