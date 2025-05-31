import { NextResponse } from "next/server"
import * as supabaseDb from "@/lib/supabase-db"
import { ApiResponse } from "@/lib/types"
import { revalidatePath } from "next/cache"

// DELETE clear all production entries
export async function DELETE() {
  try {
    const result = await supabaseDb.clearProductionEntries()
    
    if (!result) {
      return NextResponse.json({
        success: false,
        error: "Failed to clear production entries",
        statusCode: 500
      } as ApiResponse<null>, { status: 500 })
    }
    
    revalidatePath("/production")
    revalidatePath("/entries")
    revalidatePath("/dashboard")
    
    return NextResponse.json({
      success: true,
      statusCode: 200
    } as ApiResponse<null>)
  } catch (error) {
    console.error("Error clearing production entries:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to clear production entries",
      statusCode: 500
    } as ApiResponse<null>, { status: 500 })
  }
} 