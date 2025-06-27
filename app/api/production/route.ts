import { NextResponse } from "next/server"
import * as db from "@/lib/supabase-db"
import { ApiResponse, ProductionEntry } from "@/lib/types"
import { revalidatePath } from "next/cache"

import { formatDateForDatabase } from '@/lib/date-utils';

// Helper to properly serialize dates for API responses
const serializeEntry = (entry: ProductionEntry): any => {
  return {
    ...entry,
    date: entry.date instanceof Date ? formatDateForDatabase(entry.date) : entry.date,
    expiration_date: 'expiration_date' in entry && entry.expiration_date instanceof Date 
      ? formatDateForDatabase(entry.expiration_date) 
      : entry.expiration_date,
  };
};

// GET all production entries
export async function GET() {
  try {
    const entries = await db.getProductionEntries()
    // Serialize dates to ISO strings for API response
    const serializedEntries = entries.map(serializeEntry)
    
    return NextResponse.json({
      success: true,
      data: serializedEntries,
      statusCode: 200
    } as ApiResponse<ProductionEntry[]>)
  } catch (error) {
    console.error("Error getting production entries:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get production entries",
      statusCode: 500
    } as ApiResponse<ProductionEntry[]>, { status: 500 })
  }
}

// POST create a new production entry
export async function POST(request: Request) {
  try {
    const entry = await request.json()
    
    // Validate the entry
    if (!entry.product_name || !entry.product_id || !entry.staff_name || 
        !entry.date || !entry.quantity || !entry.shift || !entry.expiration_date) {
      return NextResponse.json({
        success: false,
        error: "Invalid production entry data. Required fields are missing.",
        statusCode: 400
      } as ApiResponse<ProductionEntry>, { status: 400 })
    }
    
    // Validate dates
    const productionDate = new Date(entry.date)
    const expirationDate = new Date(entry.expiration_date)
    
    if (isNaN(productionDate.getTime())) {
      return NextResponse.json({
        success: false,
        error: "Invalid production date format",
        statusCode: 400
      } as ApiResponse<ProductionEntry>, { status: 400 })
    }
    
    if (isNaN(expirationDate.getTime())) {
      return NextResponse.json({
        success: false,
        error: "Invalid expiration date format",
        statusCode: 400
      } as ApiResponse<ProductionEntry>, { status: 400 })
    }
    
    // Ensure expiration date is after production date
    if (expirationDate <= productionDate) {
      return NextResponse.json({
        success: false,
        error: "Expiration date must be after production date",
        statusCode: 400
      } as ApiResponse<ProductionEntry>, { status: 400 })
    }
    
    // Validate quantity
    if (typeof entry.quantity !== 'number' || entry.quantity <= 0) {
      return NextResponse.json({
        success: false,
        error: "Invalid quantity value",
        statusCode: 400
      } as ApiResponse<ProductionEntry>, { status: 400 })
    }
    
    // Ensure the product exists
    const product = await db.getProduct(entry.product_id)
    if (!product) {
      return NextResponse.json({
        success: false,
        error: "Product not found",
        statusCode: 404
      } as ApiResponse<ProductionEntry>, { status: 404 })
    }
    
    const newEntry = await db.createProductionEntry(entry)
    
    if (!newEntry) {
      return NextResponse.json({
        success: false,
        error: "Failed to create production entry",
        statusCode: 500
      } as ApiResponse<ProductionEntry>, { status: 500 })
    }
    
    revalidatePath("/production")
    revalidatePath("/entries")
    revalidatePath("/dashboard")
    
    return NextResponse.json({
      success: true,
      data: serializeEntry(newEntry),
      statusCode: 201
    } as ApiResponse<ProductionEntry>, { status: 201 })
  } catch (error) {
    console.error("Error creating production entry:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create production entry",
      statusCode: 500
    } as ApiResponse<ProductionEntry>, { status: 500 })
  }
}

