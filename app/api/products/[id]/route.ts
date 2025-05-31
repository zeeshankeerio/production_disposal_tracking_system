import { NextResponse } from "next/server"
import * as db from "@/lib/json-db"
import { ApiResponse, Product } from "@/lib/types"
import { revalidatePath } from "next/cache"

interface RouteParams {
  params: {
    id: string
  }
}

// GET a specific product by ID
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const product = db.getProduct(params.id)
    
    if (!product) {
      return NextResponse.json({
        success: false,
        error: "Product not found",
        statusCode: 404
      } as ApiResponse<Product>, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: product,
      statusCode: 200
    } as ApiResponse<Product>)
  } catch (error) {
    console.error("Error getting product:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to get product",
      statusCode: 500
    } as ApiResponse<Product>, { status: 500 })
  }
}

// PUT update an existing product
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const productData = await request.json()
    
    // Validate the product
    if (!productData.name || !productData.category || !productData.unit) {
      return NextResponse.json({
        success: false,
        error: "Invalid product data. Name, category and unit are required.",
        statusCode: 400
      } as ApiResponse<Product>, { status: 400 })
    }
    
    // Ensure the ID in the URL matches the product
    const product: Product = {
      ...productData,
      id: params.id
    }
    
    const updatedProduct = db.updateProduct(product)
    
    if (!updatedProduct) {
      return NextResponse.json({
        success: false,
        error: "Product not found or a product with this name already exists",
        statusCode: 404
      } as ApiResponse<Product>, { status: 404 })
    }
    
    revalidatePath("/products")
    revalidatePath("/dashboard")
    
    return NextResponse.json({
      success: true,
      data: updatedProduct,
      statusCode: 200
    } as ApiResponse<Product>)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update product",
      statusCode: 500
    } as ApiResponse<Product>, { status: 500 })
  }
}

// DELETE a product
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const result = db.deleteProduct(params.id)
    
    if (!result) {
      return NextResponse.json({
        success: false,
        error: "Product not found",
        statusCode: 404
      } as ApiResponse<null>, { status: 404 })
    }
    
    revalidatePath("/products")
    revalidatePath("/dashboard")
    
    return NextResponse.json({
      success: true,
      statusCode: 200
    } as ApiResponse<null>)
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to delete product",
      statusCode: 500
    } as ApiResponse<null>, { status: 500 })
  }
} 