/**
 * Converts an UPPERCASE color name to Title Case for display.
 * Seed-data stores colors in uppercase for ERPNext matching.
 * Examples: "ADAMINA" → "Adamina", "AIRY CONCRETE" → "Airy Concrete"
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
