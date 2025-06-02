import { 
  Product, 
  ProductionEntry, 
  DisposalEntry 
} from "@/lib/types"
import { createServerSupabaseClient } from "./supabase"
import { handleSupabaseError } from "./supabase"

// Products API
export const getProducts = async (): Promise<Product[]> => {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  } catch (err) {
    throw handleSupabaseError(err)
  }
}

export const getProduct = async (id: string): Promise<Product | null> => {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  } catch (err) {
    throw handleSupabaseError(err)
  }
}

export const createProduct = async (product: Omit<Product, "id">): Promise<Product | null> => {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check for duplicate product names
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id')
      .ilike('name', product.name)
    
    if (checkError) throw checkError
    
    if (existingProducts && existingProducts.length > 0) {
      return null // Product with this name already exists
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        category: product.category,
        description: product.description || null,
        unit: product.unit
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (err) {
    throw handleSupabaseError(err)
  }
}

export const updateProduct = async (product: Product): Promise<Product | null> => {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check for duplicate product names (excluding the current product)
    const { data: existingProducts, error: checkError } = await supabase
      .from('products')
      .select('id')
      .ilike('name', product.name)
      .neq('id', product.id)
    
    if (checkError) throw checkError
    
    if (existingProducts && existingProducts.length > 0) {
      return null // Another product with this name already exists
    }
    
    const { data, error } = await supabase
      .from('products')
      .update({
        name: product.name,
        category: product.category,
        description: product.description || null,
        unit: product.unit
      })
      .eq('id', product.id)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (err) {
    throw handleSupabaseError(err)
  }
}

export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  } catch (err) {
    throw handleSupabaseError(err)
  }
}

export const clearProducts = async (): Promise<boolean> => {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase
      .from('products')
      .delete()
      .not('id', 'is', null) // Delete all rows
    
    if (error) throw error
    return true
  } catch (err) {
    throw handleSupabaseError(err)
  }
}

// Helper function to format date strings consistently
const formatDateValue = (value: any): string => {
  if (!value) return '';
  
  try {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    throw new Error('Invalid date format');
  }
};

// Production entries API
export const getProductionEntries = async (): Promise<ProductionEntry[]> => {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('production_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000000)
    
    if (error) throw error
    
    return (data || []).map(entry => ({
      ...entry,
      date: new Date(entry.date)
    }))
  } catch (err) {
    throw handleSupabaseError(err)
  }
}

export const createProductionEntry = async (entry: Omit<ProductionEntry, "id">): Promise<ProductionEntry | null> => {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('production_entries')
      .insert({
        staff_name: entry.staff_name,
        date: formatDateValue(entry.date),
        product_id: entry.product_id,
        product_name: entry.product_name,
        quantity: entry.quantity,
        shift: entry.shift,
        expiration_date: formatDateValue(entry.expiration_date)
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      ...data,
      date: new Date(data.date),
      expiration_date: data.expiration_date
    }
  } catch (err) {
    throw handleSupabaseError(err)
  }
}

export const clearProductionEntries = async (): Promise<boolean> => {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase
      .from('production_entries')
      .delete()
      .not('id', 'is', null) // Delete all rows
    
    if (error) throw error
    return true
  } catch (err) {
    throw handleSupabaseError(err)
  }
}

export const deleteProductionEntry = async (id: string): Promise<boolean> => {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase
      .from('production_entries')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  } catch (err) {
    throw handleSupabaseError(err)
  }
}

// Disposal entries API
export const getDisposalEntries = async (): Promise<DisposalEntry[]> => {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('disposal_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000000)
    
    if (error) throw error
    
    return (data || []).map(entry => ({
      ...entry,
      date: new Date(entry.date)
    }))
  } catch (err) {
    throw handleSupabaseError(err)
  }
}

export const createDisposalEntry = async (entry: Omit<DisposalEntry, "id">): Promise<DisposalEntry | null> => {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('disposal_entries')
      .insert({
        staff_name: entry.staff_name,
        date: formatDateValue(entry.date),
        product_id: entry.product_id,
        product_name: entry.product_name,
        quantity: entry.quantity,
        shift: entry.shift,
        reason: entry.reason,
        notes: entry.notes || null
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      ...data,
      date: new Date(data.date)
    }
  } catch (err) {
    throw handleSupabaseError(err)
  }
}

export const clearDisposalEntries = async (): Promise<boolean> => {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase
      .from('disposal_entries')
      .delete()
      .not('id', 'is', null) // Delete all rows
    
    if (error) throw error
    return true
  } catch (err) {
    throw handleSupabaseError(err)
  }
}

export const deleteDisposalEntry = async (id: string): Promise<boolean> => {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase
      .from('disposal_entries')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  } catch (err) {
    throw handleSupabaseError(err)
  }
} 