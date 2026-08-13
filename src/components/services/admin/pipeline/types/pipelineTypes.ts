export interface Clinic {
  id: number;
  name: string;
  description?: string;
  address?: string;
  district_name?: string;
  working_hours?: string;
  rating?: number;
  review_count?: number;
  phones?: string[];
  emails?: string[];
  websites?: string[];
  instagram?: string;
  facebook?: string;
  whatsapp?: string[];
  telegram?: string[];
  has_instagram: boolean;
  is_private: boolean;
  priority?: "A" | "B" | "C" | null;
  priority_display?: string;
  priority_reason?: string;
  recommended_channel?: string;
  pipeline_stage: string;
  pipeline_stage_display: string;
  next_step?: string;
  next_step_date?: string;
  responsible?: string;
  sales_comment?: string;
  categories?: string[];
  latitude?: number | null;
  longitude?: number | null;
}

export interface Stats {
  total: number;
  has_instagram: number;
  is_private: number;
  by_stage: Record<string, number>;
  by_priority: Record<string, number>;
  by_district: Array<{ district__name_ru: string; total: number; a: number }>;
  by_city: string[];
}
