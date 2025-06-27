import { NextResponse } from "next/server"
import * as db from "@/lib/supabase-db"
import { ApiResponse, DisposalEntry } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { isValid } from "date-fns"
import { formatDateForDatabase } from '@/lib/date-utils';

// Helper function to validate disposal entry
const validateDisposalEntry = (entry: any): { isValid: boolean; error?: string } => {
  if (!entry.product_name || !entry.product_id || !entry.staff_name || 
      !entry.date || !entry.quantity || !entry.shift || !entry.reason) {
    return { isValid: false, error: "Invalid disposal entry data. Required fields are missing." }
  }

  // Validate date
  const entryDate = new Date(entry.date)
  if (!isValid(entryDate)) {
    return { isValid: false, error: "Invalid date format" }
  }

  // Validate quantity
  if (typeof entry.quantity !== 'number' || entry.quantity <= 0) {
    return { isValid: false, error: "Invalid quantity" }
  }

  return { isValid: true }
}

// Helper function to serialize entry dates
const serializeEntry = (entry: DisposalEntry) => ({
  ...entry,
  date: entry.date instanceof Date ? formatDateForDatabase(entry.date) : entry.date
})

// GET all disposal entries
export async function GET() {
  try {
    const entries = await db.getDisposalEntries()
    // Serialize dates to ISO strings for API response
    const serializedEntries = entries.map(serializeEntry)
    
    return NextResponse.json({
      success: true,
      data: serializedEntries,
      statusCode: 200
    } as ApiResponse<DisposalEntry[]>)
  } catch (error) {
    console.error("Error getting disposal entries:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get disposal entries",
      statusCode: 500
    } as ApiResponse<DisposalEntry[]>, { status: 500 })
  }
}

// POST create a new disposal entry
export async function POST(request: Request) {
  try {
    const entry = await request.json()
    
    // Validate the entry
    const validation = validateDisposalEntry(entry)
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
        statusCode: 400
      } as ApiResponse<DisposalEntry>, { status: 400 })
    }
    
    // Validate dates
    const disposalDate = new Date(entry.date)
    if (isNaN(disposalDate.getTime())) {
      return NextResponse.json({
        success: false,
        error: "Invalid disposal date format",
        statusCode: 400
      } as ApiResponse<DisposalEntry>, { status: 400 })
    }
    
    // Validate quantity
    if (typeof entry.quantity !== 'number' || entry.quantity <= 0) {
      return NextResponse.json({
        success: false,
        error: "Invalid quantity value",
        statusCode: 400
      } as ApiResponse<DisposalEntry>, { status: 400 })
    }
    
    // Validate reason
    if (!entry.reason || typeof entry.reason !== 'string' || entry.reason.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: "Disposal reason is required",
        statusCode: 400
      } as ApiResponse<DisposalEntry>, { status: 400 })
    }
    
    // Ensure the product exists
    const product = await db.getProduct(entry.product_id)
    if (!product) {
      return NextResponse.json({
        success: false,
        error: "Product not found",
        statusCode: 404
      } as ApiResponse<DisposalEntry>, { status: 404 })
    }
    
    // Convert date string to Date object if needed
    const entryWithDate = {
      ...entry,
      date: entry.date instanceof Date ? entry.date : new Date(entry.date)
    }
    
    const newEntry = await db.createDisposalEntry(entryWithDate)
    
    if (!newEntry) {
      return NextResponse.json({
        success: false,
        error: "Failed to create disposal entry",
        statusCode: 500
      } as ApiResponse<DisposalEntry>, { status: 500 })
    }
    
    revalidatePath("/disposal")
    revalidatePath("/entries")
    revalidatePath("/dashboard")
    
    return NextResponse.json({
      success: true,
      data: serializeEntry(newEntry),
      statusCode: 201
    } as ApiResponse<DisposalEntry>, { status: 201 })
  } catch (error) {
    console.error("Error creating disposal entry:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create disposal entry",
      statusCode: 500
    } as ApiResponse<DisposalEntry>, { status: 500 })
  }
}

