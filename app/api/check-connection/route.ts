import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

interface TableStatus {
  exists: boolean;
  count?: number;
  error?: string;
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    
    // Test querying the database without using aggregate functions
    // This simpler query should work even with restrictive RLS policies
    const { data, error } = await supabase.from('products').select('id').limit(1)
    
    if (error) {
      console.error("Supabase connection error:", error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        statusCode: 500
      }, { status: 500 })
    }
    
    // Check all required tables
    const tables = ['products', 'production_entries', 'disposal_entries']
    const tableStatuses: Record<string, TableStatus> = {}
    
    for (const table of tables) {
      try {
        // Use a simple select without aggregate functions
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('id')
          .limit(10)
        
        if (tableError) {
          tableStatuses[table] = {
            exists: false,
            error: tableError.message
          }
        } else {
          tableStatuses[table] = {
            exists: true,
            count: tableData ? tableData.length : 0
          }
        }
      } catch (err) {
        tableStatuses[table] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      connection: "OK",
      message: "Successfully connected to Supabase",
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configured" : "Missing",
      anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Configured" : "Missing",
      service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Configured" : "Missing",
      tables: tableStatuses,
      statusCode: 200
    })
  } catch (error) {
    console.error("Unexpected error checking Supabase connection:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      stack: error instanceof Error ? error.stack : undefined,
      statusCode: 500
    }, { status: 500 })
  }
} 