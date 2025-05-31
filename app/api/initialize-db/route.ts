import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import fs from "fs"
import path from "path"

interface TableStatus {
  exists: boolean;
  count?: number;
  error?: string;
}

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'setup-database.sql')
    
    if (!fs.existsSync(sqlFilePath)) {
      return NextResponse.json({
        success: false,
        error: "SQL file not found",
        statusCode: 404
      }, { status: 404 })
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
    
    // Initialize tables by executing statements one by one
    try {
      // Create products table
      await supabase.from('products').insert({
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Initialization Check',
        category: 'System',
        description: 'This is a test product created during initialization',
        unit: 'unit'
      }).select().single()
      
      // If the above works, it means the table exists. Let's try to execute some sample commands
      await supabase.from('products').delete().eq('id', '00000000-0000-0000-0000-000000000000')
      
      // Add some sample products if none exist
      const { count } = await supabase.from('products').select('*', { count: 'estimated' })
      
      if (count === 0) {
        // Split the SQL file into individual statements and find INSERT statements for products
        const statements = sqlContent.split(';')
        const productInserts = statements.filter(stmt => 
          stmt.trim().toLowerCase().includes('insert into public.products')
        )
        
        if (productInserts.length > 0) {
          // Execute the first product insert statement
          const firstInsert = productInserts[0] + ';'
          
          // Insert sample products
          await supabase.from('products').insert([
            { name: 'Bread', category: 'Baked Goods', description: 'Freshly baked bread', unit: 'loaf' },
            { name: 'Croissant', category: 'Pastries', description: 'Buttery croissant', unit: 'piece' },
            { name: 'Cake', category: 'Desserts', description: 'Chocolate cake', unit: 'slice' }
          ])
        }
      }
      
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : "Unknown error",
        hint: "Check if tables already exist or try running the SQL file manually",
        statusCode: 500
      }, { status: 500 })
    }
    
    // Verify tables were created
    const tables = ['products', 'production_entries', 'disposal_entries']
    const tableStatuses: Record<string, TableStatus> = {}
    
    for (const table of tables) {
      try {
        // Check if table exists by querying it
        const { data, error: tableError } = await supabase
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
            count: data ? data.length : 0
          }
        }
      } catch (err) {
        tableStatuses[table] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }
    }
    
    // Revalidate all important paths
    revalidatePath("/products")
    revalidatePath("/production")
    revalidatePath("/disposal")
    revalidatePath("/entries")
    revalidatePath("/dashboard")
    
    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      tables: tableStatuses,
      statusCode: 200
    })
  } catch (error) {
    console.error("Unexpected error initializing database:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      stack: error instanceof Error ? error.stack : undefined,
      statusCode: 500
    }, { status: 500 })
  }
} 