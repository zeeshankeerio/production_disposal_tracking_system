import { NextResponse } from "next/server"
import * as db from "@/lib/supabase-db"
import { ApiResponse, Product } from "@/lib/types"
import { revalidatePath } from "next/cache"

// GET all products
export async function GET() {
  try {
    const products = await db.getProducts()
    return NextResponse.json({
      success: true,
      data: products,
      statusCode: 200
    } as ApiResponse<Product[]>)
  } catch (error) {
    console.error("Error getting products:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get products",
      statusCode: 500
    } as ApiResponse<Product[]>, { status: 500 })
  }
}

// POST create a new product
export async function POST(request: Request) {
  try {
    const product = await request.json()
    
    // Validate the product
    if (!product.name || !product.category || !product.unit) {
      return NextResponse.json({
        success: false,
        error: "Invalid product data. Name, category and unit are required.",
        statusCode: 400
      } as ApiResponse<Product>, { status: 400 })
    }
    
    const newProduct = await db.createProduct(product)
    
    if (!newProduct) {
      return NextResponse.json({
        success: false,
        error: "A product with this name already exists",
        statusCode: 409
      } as ApiResponse<Product>, { status: 409 })
    }
    
    revalidatePath("/products")
    revalidatePath("/dashboard")
    
    return NextResponse.json({
      success: true,
      data: newProduct,
      statusCode: 201
    } as ApiResponse<Product>, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create product",
      statusCode: 500
    } as ApiResponse<Product>, { status: 500 })
  }
}

