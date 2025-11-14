export type LogicalOp = "AND" | "OR";

// Tipe untuk aturan filter individu
export interface FilterRule {
  field: string;
  operator: string;
  values: string[];
}

// Tipe untuk grup filter yang dapat berisi aturan dan/atau grup lainnya
export interface FilterGroup {
  operator: LogicalOp;
  conditions: FilterRule[];
  groups?: FilterGroup[];
}

export interface FilterPreset {
  id: number;
  name: string;
  filters: any;
  createdAt: string;
}

export interface GetMyPresetsData {
  myFilterPresets: FilterPreset[];
}
