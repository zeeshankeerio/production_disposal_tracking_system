import { NextResponse } from "next/server"
import * as db from "@/lib/json-db"
import fs from "fs"
import path from "path"
import { seedDatabase } from "@/lib/seed-database"
import { revalidatePath } from "next/cache"

// This endpoint completely rebuilds the database structure by recreating all files
export async function POST() {
  const DATA_DIR = path.join(process.cwd(), "data")
  const PRODUCTS_FILE = path.join(DATA_DIR, "products.json")
  const PRODUCTION_FILE = path.join(DATA_DIR, "production.json")
  const DISPOSAL_FILE = path.join(DATA_DIR, "disposal.json")
  
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    
    // Delete existing files if they exist
    const filesToDelete = [PRODUCTS_FILE, PRODUCTION_FILE, DISPOSAL_FILE]
    for (const file of filesToDelete) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
      }
    }
    
    // Create empty files
    fs.writeFileSync(PRODUCTS_FILE, "[]")
    fs.writeFileSync(PRODUCTION_FILE, "[]")
    fs.writeFileSync(DISPOSAL_FILE, "[]")
    
    // Seed the database with fresh data
    await seedDatabase()
    
    // Revalidate all important paths
    revalidatePath("/products")
    revalidatePath("/production")
    revalidatePath("/disposal")
    revalidatePath("/entries")
    revalidatePath("/dashboard")
    
    return NextResponse.json({
      success: true,
      message: "Database successfully rebuilt with fresh data",
      statusCode: 200
    })
  } catch (error) {
    console.error("Error rebuilding database:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to rebuild database",
      statusCode: 500,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 