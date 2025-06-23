"use server"

import { createServerSupabaseClient } from "./supabase"
import type { Product, ProductionEntry, DisposalEntry } from "./types"
import { mapProductFromDB, mapProductionEntryFromDB, mapDisposalEntryFromDB } from "./utils"
import { prepareDateForSubmission, formatDateForDatabase, createEasternTimestamp } from "./date-utils"

// Utility function to check if a table exists
async function checkTableExists(tableName: string): Promise<boolean> {
  const supabase = createServerSupabaseClient()
  try {
    const { error } = await supabase.from(tableName).select('id').limit(1)
    return !error
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

// Helper function to handle database errors
function handleDatabaseError(error: any, operation: string): never {
  console.error(`Error during ${operation}:`, error)
  throw new Error(`Failed to ${operation}: ${error.message || 'Unknown error'}`)
}

// Product operations
export async function getProducts(): Promise<Product[]> {
  const supabase = createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')
    
    if (error) throw error
    
    return (data || []).map(mapProductFromDB)
  } catch (error) {
    return handleDatabaseError(error, 'get products')
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null
      }
      throw error
    }

    return mapProductFromDB(data)
  } catch (error) {
    console.error("Error fetching product:", error)
    return null
  }
}

export async function addProduct(product: Omit<Product, "id">): Promise<Product> {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: product.name,
        category: product.category,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return mapProductFromDB(data)
  } catch (error) {
    return handleDatabaseError(error, "add product")
  }
}

// Production entry operations
export async function getProductionEntries(): Promise<ProductionEntry[]> {
  const supabase = createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from('production_entries')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return (data || []).map(mapProductionEntryFromDB)
  } catch (error) {
    return handleDatabaseError(error, 'get production entries')
  }
}

export async function addProductionEntry(entry: Omit<ProductionEntry, "id" | "created_at">): Promise<ProductionEntry> {
  const supabase = createServerSupabaseClient()

  try {
    // Use the improved date utilities for consistent US Eastern timezone handling
    // Works with existing TEXT date fields in database
    const easternTimestamp = createEasternTimestamp();
    const formattedDate = formatDateForDatabase(entry.date);
    const formattedExpirationDate = formatDateForDatabase(entry.expiration_date);
    
    const { data, error } = await supabase
      .from("production_entries")
      .insert({
        staff_name: entry.staff_name,
        date: formattedDate,
        product_id: entry.product_id,
        product_name: entry.product_name,
        quantity: entry.quantity,
        shift: entry.shift,
        expiration_date: formattedExpirationDate,
        created_at: easternTimestamp
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return mapProductionEntryFromDB(data)
  } catch (error) {
    return handleDatabaseError(error, "add production entry")
  }
}

// Disposal entry operations
export async function getDisposalEntries(): Promise<DisposalEntry[]> {
  const supabase = createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from('disposal_entries')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return (data || []).map(mapDisposalEntryFromDB)
  } catch (error) {
    return handleDatabaseError(error, 'get disposal entries')
  }
}

export async function addDisposalEntry(entry: Omit<DisposalEntry, "id" | "created_at">): Promise<DisposalEntry> {
  const supabase = createServerSupabaseClient()

  try {
    // Use the same timestamp for both date and created_at
    const easternTimestamp = createEasternTimestamp();
    
    const { data, error } = await supabase
      .from("disposal_entries")
      .insert({
        staff_name: entry.staff_name,
        date: easternTimestamp, // Set to same timestamp as created_at
        product_id: entry.product_id,
        product_name: entry.product_name,
        quantity: entry.quantity,
        shift: entry.shift,
        reason: entry.reason,
        notes: entry.notes,
        created_at: easternTimestamp
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return mapDisposalEntryFromDB(data)
  } catch (error) {
    return handleDatabaseError(error, "add disposal entry")
  }
}

// Analytics operations
export async function getProductionAnalytics() {
  const entries = await getProductionEntries()

  // Total production
  const totalProduction = entries.reduce((sum, entry) => sum + entry.quantity, 0)

  // Production by product
  const productionByProduct = entries.reduce(
    (acc, entry) => {
      acc[entry.product_name] = (acc[entry.product_name] || 0) + entry.quantity
      return acc
    },
    {} as Record<string, number>,
  )

  // Production by day
  const productionByDay = entries.reduce(
    (acc, entry) => {
      const dateStr = entry.date.toISOString().split('T')[0]
      acc[dateStr] = (acc[dateStr] || 0) + entry.quantity
      return acc
    },
    {} as Record<string, number>,
  )

  // Production by shift
  const productionByShift = entries.reduce(
    (acc, entry) => {
      acc[entry.shift] = (acc[entry.shift] || 0) + entry.quantity
      return acc
    },
    {} as Record<string, number>,
  )

  return {
    totalProduction,
    productionByProduct,
    productionByDay,
    productionByShift,
  }
}

export async function getDisposalAnalytics() {
  const entries = await getDisposalEntries()

  // Total disposal
  const totalDisposal = entries.reduce((sum, entry) => sum + entry.quantity, 0)

  // Disposal by reason
  const disposalByReason = entries.reduce(
    (acc, entry) => {
      acc[entry.reason] = (acc[entry.reason] || 0) + entry.quantity
      return acc
    },
    {} as Record<string, number>,
  )

  // Disposal by product
  const disposalByProduct = entries.reduce(
    (acc, entry) => {
      acc[entry.product_name] = (acc[entry.product_name] || 0) + entry.quantity
      return acc
    },
    {} as Record<string, number>,
  )

  // Disposal by shift
  const disposalByShift = entries.reduce(
    (acc, entry) => {
      acc[entry.shift] = (acc[entry.shift] || 0) + entry.quantity
      return acc
    },
    {} as Record<string, number>,
  )

  return {
    totalDisposal,
    disposalByReason,
    disposalByProduct,
    disposalByShift,
  }
}

