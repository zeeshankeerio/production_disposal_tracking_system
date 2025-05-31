"use client"

import { useState, useEffect } from "react"
import type { Product, ProductionEntry, DisposalEntry, ProductCategory } from "./types"

// Mock products data
const mockProducts: Product[] = [
  { id: "p1", name: "Pão Francês", category: "Other" },
  { id: "p2", name: "Bolo de Chocolate", category: "Confeitaria" },
  { id: "p3", name: "Croissant", category: "Other" },
  { id: "p4", name: "Torta de Morango", category: "Confeitaria" },
  { id: "p5", name: "Pão de Queijo", category: "Other" },
]

// Local storage keys
const PRODUCTION_KEY = "padokka-production-entries"
const DISPOSAL_KEY = "padokka-disposal-entries"

// Helper to generate ID
const generateId = () => Math.random().toString(36).substring(2, 9)

// Helper to calculate expiration date (7 days from entry date)
export const calculateExpirationDate = (entryDate: string, category: ProductCategory): string => {
  const date = new Date(entryDate)
  // Add 7 days for Confeitaria products, 3 days for others
  const daysToAdd = category === "Confeitaria" ? 7 : 3
  date.setDate(date.getDate() + daysToAdd)
  return date.toISOString().split("T")[0]
}

// Get all products
export const getProducts = (): Product[] => {
  return mockProducts
}

// Get product by ID
export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find((product) => product.id === id)
}

// Get product by name (for autocomplete)
export const getProductsByName = (query: string): Product[] => {
  if (!query) return mockProducts
  return mockProducts.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()))
}

// Hook for production entries
export const useProductionEntries = () => {
  const [entries, setEntries] = useState<ProductionEntry[]>([])

  // Load entries from localStorage on component mount
  useEffect(() => {
    const storedEntries = localStorage.getItem(PRODUCTION_KEY)
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries))
    }
  }, [])

  // Save entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(PRODUCTION_KEY, JSON.stringify(entries))
  }, [entries])

  // Add a new production entry
  const addEntry = (entry: Omit<ProductionEntry, "id" | "createdAt">) => {
    const product = getProductById(entry.productId)
    const newEntry: ProductionEntry = {
      ...entry,
      id: generateId(),
      expirationDate: calculateExpirationDate(entry.date, product?.category || "Other"),
      createdAt: new Date().toISOString(),
    }
    setEntries((prev) => [newEntry, ...prev])
    return newEntry
  }

  return { entries, addEntry }
}

// Hook for disposal entries
export const useDisposalEntries = () => {
  const [entries, setEntries] = useState<DisposalEntry[]>([])

  // Load entries from localStorage on component mount
  useEffect(() => {
    const storedEntries = localStorage.getItem(DISPOSAL_KEY)
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries))
    }
  }, [])

  // Save entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(DISPOSAL_KEY, JSON.stringify(entries))
  }, [entries])

  // Add a new disposal entry
  const addEntry = (entry: Omit<DisposalEntry, "id" | "createdAt">) => {
    const newEntry: DisposalEntry = {
      ...entry,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    setEntries((prev) => [newEntry, ...prev])
    return newEntry
  }

  return { entries, addEntry }
}

