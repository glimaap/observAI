export interface Credentials {
  apiKey: string;
  appKey: string;
  site?: string; // e.g. datadoghq.com, datadoghq.eu
}

export interface CostCharge {
  charge_type: string;
  cost: number;
  product_name: string;
}

export interface MonthlyCostEntry {
  date: string; // YYYY-MM
  total_cost: number;
  org_name: string;
  charges: CostCharge[];
}

export interface ProductCost {
  product_name: string;
  display_name: string;
  cost: number;
  percentage: number;
  change_mom?: number; // month-over-month % change
}

export interface CostSummary {
  current_month: string;
  total_cost: number;
  prev_month_cost: number;
  change_mom_pct: number;
  top_product: ProductCost;
  by_product: ProductCost[];
  monthly_trend: { month: string; cost: number }[];
}

export interface ApiError {
  message: string;
  status: number;
}
