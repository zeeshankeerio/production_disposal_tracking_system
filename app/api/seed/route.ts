import { NextResponse } from "next/server"
import { seedDatabase } from "@/lib/seed-database"
import { revalidatePath } from "next/cache"

// This endpoint seeds the database with initial data
export async function POST() {
  try {
    await seedDatabase()
    
    // Revalidate all important paths
    revalidatePath("/products")
    revalidatePath("/production")
    revalidatePath("/disposal")
    revalidatePath("/entries")
    revalidatePath("/dashboard")
    
    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      statusCode: 200
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to seed database",
      statusCode: 500
    }, { status: 500 })
  }
} 