/**
 * Converts an array of key-value pairs to an object.
 * This is commonly used for converting ICRC token metadata arrays to objects.
 * @param array - Array of key-value pairs
 * @returns Object with keys and values
 */
export function convertArrayToObject(array: Array<[string, any]>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of array) {
    // Handle different value types that might come from ICRC metadata
    if (value && typeof value === 'object' && 'Text' in value) {
      result[key] = value.Text;
    } else if (value && typeof value === 'object' && 'Nat' in value) {
      result[key] = Number(value.Nat);
    } else if (value && typeof value === 'object' && 'Int' in value) {
      result[key] = Number(value.Int);
    } else if (value && typeof value === 'object' && 'Blob' in value) {
      result[key] = value.Blob;
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Formats a large number with appropriate suffixes (K, M, B, T)
 * @param num - The number to format
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatLargeNumber(num: number, decimals: number = 2): string {
  const units = ['', 'K', 'M', 'B', 'T'];
  let unitIndex = 0;
  let value = num;
  
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }
  
  return `${value.toFixed(decimals)}${units[unitIndex]}`;
}

/**
 * Safely converts a value to a bigint
 * @param value - The value to convert
 * @returns BigInt value or 0n if conversion fails
 */
export function toBigInt(value: any): bigint {
  try {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number') return BigInt(Math.floor(value));
    if (typeof value === 'string') return BigInt(value);
    return BigInt(0);
  } catch {
    return BigInt(0);
  }
} 