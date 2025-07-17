import { ProductionEntry, DisposalEntry, Product } from './types';

export interface ProductWasteReport {
  product_id: string;
  product_name: string;
  total_discarded: number;
  days_discarded: number;
  avg_per_day: number;
  total_produced: number;
  discard_rate: number; // percentage
}

export function generateProductWasteReport({
  productionEntries,
  disposalEntries,
  products,
  fromDate,
  toDate,
}: {
  productionEntries: ProductionEntry[];
  disposalEntries: DisposalEntry[];
  products: Product[];
  fromDate: Date;
  toDate: Date;
}): ProductWasteReport[] {
  // Helper to check if a date is in range (inclusive)
  const isInRange = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
    return d >= from && d <= to;
  };

  return products.map((product) => {
    // Filter entries for this product and date range
    const productDisposals = disposalEntries.filter(
      (entry) => entry.product_id === product.id && isInRange(new Date(entry.date))
    );
    const productProductions = productionEntries.filter(
      (entry) => entry.product_id === product.id && isInRange(new Date(entry.date))
    );

    const total_discarded = productDisposals.reduce((sum, entry) => sum + Number(entry.quantity), 0);
    const days_discarded = new Set(productDisposals.map((entry) => new Date(entry.date).toDateString())).size;
    const avg_per_day = days_discarded > 0 ? total_discarded / days_discarded : 0;
    const total_produced = productProductions.reduce((sum, entry) => sum + Number(entry.quantity), 0);
    const discard_rate = total_produced > 0 ? (total_discarded / total_produced) * 100 : 0;

    return {
      product_id: product.id,
      product_name: product.name,
      total_discarded,
      days_discarded,
      avg_per_day: Number(avg_per_day.toFixed(2)),
      total_produced,
      discard_rate: Number(discard_rate.toFixed(2)),
    };
  })
  // Optionally, sort by total_discarded descending
  .sort((a, b) => b.total_discarded - a.total_discarded);
} 