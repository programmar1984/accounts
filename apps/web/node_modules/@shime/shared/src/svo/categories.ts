export const SERVICE_CATEGORIES = [
  "TRANSPORT",
  "INSPECTION",
  "SHIPPING",
  "VANNING",
  "OTHER",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export function parseServiceCategory(value: string): ServiceCategory | null {
  return SERVICE_CATEGORIES.includes(value as ServiceCategory)
    ? (value as ServiceCategory)
    : null;
}
