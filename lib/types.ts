export type ProductCategory = "Pães" | "Confeitaria" | "Salgados" | "Bolos" | "Outros"

export type Shift = "morning" | "afternoon" | "night"

export type DisposalReason = string

export interface Product {
  id: string
  name: string
  description?: string
  unit: string
  category: string
}

export interface BaseEntry {
  id: string
  product_name: string
  product_id: string
  staff_name: string
  date: Date
  quantity: number
  shift: Shift
  notes?: string
}

export interface ProductionEntry extends BaseEntry {
  expiration_date: string
}

export interface DisposalEntry extends BaseEntry {
  reason: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  statusCode: number
}

export interface DataContextType {
  products: Product[]
  productionEntries: ProductionEntry[]
  disposalEntries: DisposalEntry[]
  isLoading: boolean
  error: string | null
  addProductionEntry: (entry: ProductionEntry) => Promise<void>
  addDisposalEntry: (entry: DisposalEntry) => Promise<void>
  addProduct: (product: Omit<Product, "id">) => Promise<Product>
  updateProduct: (product: Product) => Promise<Product>
  deleteProduct: (id: string) => Promise<void>
  deleteProductionEntry: (id: string) => Promise<void>
  deleteDisposalEntry: (id: string) => Promise<void>
  refreshData: () => Promise<void>
  clearAllData: () => Promise<void>
}

export interface ProductionFormData {
  staff_name: string
  date: Date
  product_name: string
  quantity: number
  shift: Shift
  notes?: string
}

export interface DisposalFormData {
  staff_name: string
  date: Date
  product_name: string
  quantity: number
  shift: Shift
  reason: string
  notes?: string
}

export interface ChartDataPoint {
  date: string
  formattedDate: string
  production: number
  disposal: number
}

export interface ProductStats {
  id: string
  name: string
  production: number
  disposal: number
  disposalRate: number
  efficiency: number
}

export interface ReasonStats {
  name: string
  value: number
}

export interface Insight {
  id: string
  title: string
  description: string
  type: "warning" | "info" | "success"
  priority: "high" | "medium" | "low"
  date: string
  category?: "performance" | "trend" | "anomaly" | "recommendation" | "analysis"
  icon?: React.ReactNode
  data?: any
}

export interface ProductionAnalytics {
  totalProduction: number
  productionByProduct: Record<string, number>
  productionByDay: Record<string, number>
  productionByShift: Record<string, number>
}

export interface DisposalAnalytics {
  totalDisposal: number
  disposalByReason: Record<string, number>
  disposalByProduct: Record<string, number>
  disposalByShift: Record<string, number>
}

export interface AIInsight {
  title: string
  description: string
  priority: "high" | "medium" | "low"
  type: "warning" | "info" | "success"
}

export interface ProductPerformance {
  id: string
  name: string
  category: ProductCategory
  produced: number
  disposed: number
  disposalRate: number
  trend: number
}

// Helper to convert from database format to application format
export function mapProductFromDB(product: any): Product {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    unit: product.unit,
    category: product.category as ProductCategory,
  }
}

export function mapProductionEntryFromDB(entry: any): ProductionEntry {
  return {
    id: entry.id,
    staff_name: entry.staff_name,
    date: new Date(entry.date),
    product_name: entry.product_name,
    product_id: entry.product_id,
    quantity: entry.quantity,
    shift: entry.shift as Shift,
    notes: entry.notes,
    expiration_date: entry.expiration_date,
  }
}

export function mapDisposalEntryFromDB(entry: any): DisposalEntry {
  return {
    id: entry.id,
    staff_name: entry.staff_name,
    date: new Date(entry.date),
    product_name: entry.product_name,
    product_id: entry.product_id,
    quantity: entry.quantity,
    shift: entry.shift as Shift,
    reason: entry.reason as DisposalReason,
    notes: entry.notes,
  }
}

