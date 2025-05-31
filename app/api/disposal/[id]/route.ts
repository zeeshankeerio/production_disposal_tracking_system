import { NextResponse } from "next/server"
import * as db from "@/lib/supabase-db"
import { ApiResponse } from "@/lib/types"
import { revalidatePath } from "next/cache"

// DELETE a disposal entry by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: "Disposal entry ID is required",
        statusCode: 400
      } as ApiResponse<null>, { status: 400 })
    }
    
    const deleted = await db.deleteDisposalEntry(id)
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: "Failed to delete disposal entry",
        statusCode: 500
      } as ApiResponse<null>, { status: 500 })
    }
    
    // Revalidate paths to update UI
    revalidatePath("/disposal")
    revalidatePath("/entries")
    revalidatePath("/dashboard")
    
    return NextResponse.json({
      success: true,
      data: null,
      statusCode: 200
    } as ApiResponse<null>)
  } catch (error) {
    console.error("Error deleting disposal entry:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete disposal entry",
      statusCode: 500
    } as ApiResponse<null>, { status: 500 })
  }
} 