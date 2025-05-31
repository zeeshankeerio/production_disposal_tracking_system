export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          created_at?: string
        }
      }
      production_entries: {
        Row: {
          id: string
          staff_name: string
          date: string
          product_id: string
          product_name: string
          quantity: number
          shift: string
          expiration_date: string
          created_at: string
        }
        Insert: {
          id?: string
          staff_name: string
          date: string
          product_id: string
          product_name: string
          quantity: number
          shift: string
          expiration_date: string
          created_at?: string
        }
        Update: {
          id?: string
          staff_name?: string
          date?: string
          product_id?: string
          product_name?: string
          quantity?: number
          shift?: string
          expiration_date?: string
          created_at?: string
        }
      }
      disposal_entries: {
        Row: {
          id: string
          staff_name: string
          date: string
          product_id: string
          product_name: string
          quantity: number
          shift: string
          reason: string
          notes?: string
          created_at: string
        }
        Insert: {
          id?: string
          staff_name: string
          date: string
          product_id: string
          product_name: string
          quantity: number
          shift: string
          reason: string
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          staff_name?: string
          date?: string
          product_id?: string
          product_name?: string
          quantity?: number
          shift?: string
          reason?: string
          notes?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

