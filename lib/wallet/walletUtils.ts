/**
 * Truncates an address for display purposes
 * @param address The full address to truncate
 * @param startChars Number of characters to keep at the start
 * @param endChars Number of characters to keep at the end
 * @returns The truncated address with ellipsis
 */
export const truncateAddress = (
  address: string,
  startChars = 4,
  endChars = 4
): string => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Formats a numeric balance with the specified number of decimal places
 * @param balance The balance to format
 * @param decimals Number of decimal places to display
 * @returns The formatted balance as a string
 */
export const formatBalance = (balance: string | number, decimals = 4): string => {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (isNaN(num)) return '0';
  
  return num.toFixed(decimals);
}; 