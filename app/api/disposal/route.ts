import { NextResponse } from "next/server"
import * as db from "@/lib/supabase-db"
import { ApiResponse, DisposalEntry } from "@/lib/types"
import { revalidatePath } from "next/cache"

// Helper to properly serialize dates for API responses
const serializeEntry = (entry: DisposalEntry): any => {
  return {
    ...entry,
    date: entry.date instanceof Date ? entry.date.toISOString() : entry.date,
  };
};

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
    if (!entry.product_name || !entry.product_id || !entry.staff_name || 
        !entry.date || !entry.quantity || !entry.shift || !entry.reason) {
      return NextResponse.json({
        success: false,
        error: "Invalid disposal entry data. Required fields are missing.",
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
    
    const newEntry = await db.createDisposalEntry(entry)
    
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

