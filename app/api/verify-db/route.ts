import { NextResponse } from "next/server"
import * as db from "@/lib/json-db"
import { revalidatePath } from "next/cache"
import fs from "fs"
import path from "path"

// This endpoint verifies the database structure and files
export async function GET() {
  const DATA_DIR = path.join(process.cwd(), "data")
  const PRODUCTS_FILE = path.join(DATA_DIR, "products.json")
  const PRODUCTION_FILE = path.join(DATA_DIR, "production.json")
  const DISPOSAL_FILE = path.join(DATA_DIR, "disposal.json")
  
  const results = {
    dataDirectoryExists: false,
    productsFileExists: false,
    productionFileExists: false,
    disposalFileExists: false,
    productsCount: 0,
    productionEntriesCount: 0,
    disposalEntriesCount: 0,
    issues: [] as string[],
    fixes: [] as string[]
  }
  
  try {
    // Check data directory
    if (fs.existsSync(DATA_DIR)) {
      results.dataDirectoryExists = true
    } else {
      results.issues.push("Data directory does not exist")
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true })
        results.fixes.push("Created data directory")
      } catch (error) {
        results.issues.push(`Failed to create data directory: ${error}`)
      }
    }
    
    // Check products file
    if (fs.existsSync(PRODUCTS_FILE)) {
      results.productsFileExists = true
      try {
        const products = db.getProducts()
        results.productsCount = products.length
      } catch (error) {
        results.issues.push(`Products file is not valid JSON: ${error}`)
        try {
          fs.writeFileSync(PRODUCTS_FILE, "[]")
          results.fixes.push("Reset products file to empty array")
        } catch (writeError) {
          results.issues.push(`Failed to fix products file: ${writeError}`)
        }
      }
    } else {
      results.issues.push("Products file does not exist")
      try {
        fs.writeFileSync(PRODUCTS_FILE, "[]")
        results.fixes.push("Created empty products file")
      } catch (error) {
        results.issues.push(`Failed to create products file: ${error}`)
      }
    }
    
    // Check production file
    if (fs.existsSync(PRODUCTION_FILE)) {
      results.productionFileExists = true
      try {
        const entries = db.getProductionEntries()
        results.productionEntriesCount = entries.length
      } catch (error) {
        results.issues.push(`Production file is not valid JSON: ${error}`)
        try {
          fs.writeFileSync(PRODUCTION_FILE, "[]")
          results.fixes.push("Reset production file to empty array")
        } catch (writeError) {
          results.issues.push(`Failed to fix production file: ${writeError}`)
        }
      }
    } else {
      results.issues.push("Production file does not exist")
      try {
        fs.writeFileSync(PRODUCTION_FILE, "[]")
        results.fixes.push("Created empty production file")
      } catch (error) {
        results.issues.push(`Failed to create production file: ${error}`)
      }
    }
    
    // Check disposal file
    if (fs.existsSync(DISPOSAL_FILE)) {
      results.disposalFileExists = true
      try {
        const entries = db.getDisposalEntries()
        results.disposalEntriesCount = entries.length
      } catch (error) {
        results.issues.push(`Disposal file is not valid JSON: ${error}`)
        try {
          fs.writeFileSync(DISPOSAL_FILE, "[]")
          results.fixes.push("Reset disposal file to empty array")
        } catch (writeError) {
          results.issues.push(`Failed to fix disposal file: ${writeError}`)
        }
      }
    } else {
      results.issues.push("Disposal file does not exist")
      try {
        fs.writeFileSync(DISPOSAL_FILE, "[]")
        results.fixes.push("Created empty disposal file")
      } catch (error) {
        results.issues.push(`Failed to create disposal file: ${error}`)
      }
    }
    
    // Revalidate all important paths if any fixes were applied
    if (results.fixes.length > 0) {
      revalidatePath("/products")
      revalidatePath("/production")
      revalidatePath("/disposal")
      revalidatePath("/entries")
      revalidatePath("/dashboard")
    }
    
    return NextResponse.json({
      success: true,
      data: results,
      statusCode: 200
    })
  } catch (error) {
    console.error("Error verifying database:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to verify database",
      statusCode: 500,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 