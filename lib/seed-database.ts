import * as db from "./json-db"
import { Product, ProductionEntry, DisposalEntry } from "./types"
import { v4 as uuidv4 } from "uuid"
import { calculateExpirationDate } from "./data-service"

// Initial sample products
const sampleProducts: Omit<Product, "id">[] = [
  { name: "Pão Francês", category: "Pães", description: "Pão tradicional francês crocante", unit: "unit" },
  { name: "Pão de Forma", category: "Pães", description: "Pão de forma macio para sanduíches", unit: "loaf" },
  { name: "Croissant", category: "Confeitaria", description: "Croissant de massa folhada amanteigada", unit: "piece" },
  { name: "Bolo de Chocolate", category: "Bolos", description: "Bolo macio de chocolate com cobertura", unit: "cake" },
  { name: "Coxinha", category: "Salgados", description: "Salgado de massa de batata recheado com frango", unit: "piece" },
  { name: "Esfiha", category: "Salgados", description: "Massa recheada com carne temperada", unit: "piece" },
  { name: "Bolo de Cenoura", category: "Bolos", description: "Bolo de cenoura com cobertura de chocolate", unit: "cake" },
  { name: "Pão de Queijo", category: "Salgados", description: "Pão de queijo mineiro tradicional", unit: "piece" },
  { name: "Torta de Limão", category: "Confeitaria", description: "Torta de limão com massa crocante", unit: "piece" },
  { name: "Brigadeiro", category: "Confeitaria", description: "Doce tradicional de chocolate", unit: "piece" }
]

// Add seed products to the database
export const seedProducts = async (): Promise<Product[]> => {
  const products: Product[] = []
  
  for (const product of sampleProducts) {
    const newProduct = db.createProduct(product)
    if (newProduct) {
      products.push(newProduct)
    }
  }
  
  return products
}

// Generate random date within the last 30 days
const getRandomDate = (): Date => {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * 30))
  return date
}

// Format a date for display if needed
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Add sample production entries
export const seedProductionEntries = async (products: Product[]): Promise<void> => {
  const staffNames = ["Maria Silva", "João Oliveira", "Ana Santos"]
  const shifts: ("morning" | "afternoon" | "night")[] = ["morning", "afternoon", "night"]
  
  for (const product of products) {
    for (let i = 0; i < 3; i++) {
      const randomDate = getRandomDate()
      const entry: Omit<ProductionEntry, "id"> = {
        staff_name: staffNames[i % staffNames.length],
        date: randomDate,
        product_id: product.id,
        product_name: product.name,
        quantity: Math.floor(Math.random() * 100) + 10,
        shift: shifts[i % shifts.length],
        notes: `Generated entry for ${product.name}`,
        expiration_date: calculateExpirationDate(formatDate(randomDate), product.category as any),
      }
      
      db.createProductionEntry(entry)
    }
  }
}

// Add sample disposal entries
export const seedDisposalEntries = async (products: Product[]): Promise<void> => {
  const staffNames = ["Carlos Mendes", "Luiza Costa", "Roberto Alves"]
  const shifts: ("morning" | "afternoon" | "night")[] = ["morning", "afternoon", "night"]
  const reasons = [
    "Expired/Vencidos",
    "Damaged/Danificados",
    "Unsold/Não Vendido",
    "Quality Issues/Problemas de Qualidade",
    "Return/Devoluções de Clientes"
  ]
  
  for (const product of products) {
    for (let i = 0; i < 2; i++) {
      const randomDate = getRandomDate()
      const entry: Omit<DisposalEntry, "id"> = {
        staff_name: staffNames[i % staffNames.length],
        date: randomDate,
        product_id: product.id,
        product_name: product.name,
        quantity: Math.floor(Math.random() * 20) + 5,
        shift: shifts[i % shifts.length],
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        notes: Math.random() > 0.5 ? "Sample disposal entry" : undefined
      }
      
      db.createDisposalEntry(entry)
    }
  }
}

// Seed the entire database
export const seedDatabase = async (): Promise<void> => {
  try {
    console.log("Seeding database...")
    
    // Clear any existing data
    db.clearProducts()
    db.clearProductionEntries()
    db.clearDisposalEntries()
    
    // Seed products first
    const products = await seedProducts()
    console.log(`Seeded ${products.length} products`)
    
    // Then seed entries that depend on products
    await seedProductionEntries(products)
    console.log(`Seeded production entries`)
    
    await seedDisposalEntries(products)
    console.log(`Seeded disposal entries`)
    
    console.log("Database seeding complete!")
  } catch (error) {
    console.error("Error seeding database:", error)
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedDatabase()
} 