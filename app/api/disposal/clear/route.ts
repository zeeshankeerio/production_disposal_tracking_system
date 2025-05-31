import { NextResponse } from "next/server"
import * as supabaseDb from "@/lib/supabase-db"
import { ApiResponse } from "@/lib/types"
import { revalidatePath } from "next/cache"

// DELETE clear all disposal entries
export async function DELETE() {
  try {
    const result = await supabaseDb.clearDisposalEntries()
    
    if (!result) {
      return NextResponse.json({
        success: false,
        error: "Failed to clear disposal entries",
        statusCode: 500
      } as ApiResponse<null>, { status: 500 })
    }
    
    revalidatePath("/disposal")
    revalidatePath("/entries")
    revalidatePath("/dashboard")
    
    return NextResponse.json({
      success: true,
      statusCode: 200
    } as ApiResponse<null>)
  } catch (error) {
    console.error("Error clearing disposal entries:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to clear disposal entries",
      statusCode: 500
    } as ApiResponse<null>, { status: 500 })
  }
} 