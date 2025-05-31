import { createClientSupabaseClient } from "./supabase"
import { handleSupabaseError } from "./supabase"

export type FormSubmitResult<T> = {
  success: boolean
  data?: T
  error?: Error
}

export type ValidationError<T> = {
  field: keyof T
  message: string
}

export type ValidationResult<T> = {
  isValid: boolean
  errors: ValidationError<T>[]
}

export async function handleFormSubmit<T>(
  submitFn: (supabase: ReturnType<typeof createClientSupabaseClient>) => Promise<T>
): Promise<FormSubmitResult<T>> {
  try {
    const supabase = createClientSupabaseClient()
    const result = await submitFn(supabase)
    return {
      success: true,
      data: result,
    }
  } catch (err) {
    const error = handleSupabaseError(err)
    console.error("Form submission error:", error)
    return {
      success: false,
      error,
    }
  }
}

export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[],
  customMessages?: Partial<Record<keyof T, string>>
): ValidationResult<T> {
  const errors: ValidationError<T>[] = []

  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push({
        field,
        message: customMessages?.[field] || "This field is required",
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateNumber(value: string | number, min?: number, max?: number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return false
  if (min !== undefined && num < min) return false
  if (max !== undefined && num > max) return false
  return true
}

export function validateDate(date: string | Date): boolean {
  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
} 