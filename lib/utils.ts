import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format number for human readability with K/M suffixes and proper spacing
 * @param value - Number to format
 * @param options - Formatting options
 * @returns Formatted string
 */
export function formatHumanReadable(
  value: number | bigint, 
  options: {
    decimals?: number;
    forceDecimals?: boolean;
    useSpacing?: boolean;
    maxValue?: number; // Above this value, use K/M notation
  } = {}
): string {
  const {
    decimals = 2,
    forceDecimals = false,
    useSpacing = true,
    maxValue = 100000
  } = options;

  const num = typeof value === 'bigint' ? Number(value) : value;
  
  if (num === 0) return '0';
  
  // Use K/M notation for large numbers
  if (Math.abs(num) >= maxValue) {
    if (Math.abs(num) >= 1000000) {
      const millions = num / 1000000;
      const formatted = forceDecimals || millions % 1 !== 0 
        ? millions.toFixed(decimals) 
        : millions.toFixed(0);
      return `${formatted}M`;
    } else if (Math.abs(num) >= 1000) {
      const thousands = num / 1000;
      const formatted = forceDecimals || thousands % 1 !== 0 
        ? thousands.toFixed(decimals) 
        : thousands.toFixed(0);
      return `${formatted}K`;
    }
  }
  
  // For smaller numbers, use spacing
  if (useSpacing && Math.abs(num) >= 1000) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: forceDecimals ? decimals : 0,
      maximumFractionDigits: decimals
    });
  }
  
  // For very small numbers
  return forceDecimals ? num.toFixed(decimals) : num.toString();
}

/**
 * Format token balance from bigint with decimals to human readable format
 * @param balance - Token balance as bigint
 * @param decimals - Token decimals (default: 8)
 * @param options - Formatting options
 * @returns Formatted balance string
 */
export function formatTokenBalance(
  balance: bigint, 
  decimals: number = 8,
  options: {
    showDecimals?: boolean;
    useKM?: boolean;
    maxValue?: number;
  } = {}
): string {
  const {
    showDecimals = true,
    useKM = true,
    maxValue = 100000
  } = options;

  const divisor = BigInt(10 ** decimals);
  const wholePart = balance / divisor;
  const fractionalPart = balance % divisor;
  
  // Convert to number for formatting
  const wholeNumber = Number(wholePart);
  const fractionalNumber = Number(fractionalPart) / (10 ** decimals);
  const totalNumber = wholeNumber + fractionalNumber;
  
  // Use K/M formatting for large numbers
  if (useKM && wholeNumber >= maxValue) {
    return formatHumanReadable(wholeNumber, {
      decimals: 1,
      forceDecimals: false,
      useSpacing: false,
      maxValue
    });
  }
  
  // For smaller numbers with fractional parts
  if (showDecimals && fractionalPart > 0n) {
    if (wholeNumber >= 1000) {
      // Use spacing for thousands but preserve some decimals
      return totalNumber.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    } else {
      // Show more precision for smaller numbers
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      const trimmedFractional = fractionalStr.replace(/0+$/, '');
      
      if (trimmedFractional === '') {
        return formatHumanReadable(wholeNumber, { useSpacing: true, maxValue });
      }
      
      return `${formatHumanReadable(wholeNumber, { useSpacing: true, maxValue })}.${trimmedFractional}`;
    }
  }
  
  // Whole numbers only
  return formatHumanReadable(wholeNumber, { 
    useSpacing: true, 
    maxValue: useKM ? maxValue : Infinity 
  });
}

/**
 * Format percentage with appropriate precision
 * @param percentage - Percentage value
 * @param options - Formatting options
 * @returns Formatted percentage string
 */
export function formatPercentage(
  percentage: number,
  options: {
    decimals?: number;
    showSymbol?: boolean;
  } = {}
): string {
  const { decimals = 2, showSymbol = true } = options;
  
  let formatted: string;
  
  if (percentage >= 10) {
    formatted = percentage.toFixed(1);
  } else if (percentage >= 1) {
    formatted = percentage.toFixed(2);
  } else if (percentage >= 0.01) {
    formatted = percentage.toFixed(3);
  } else {
    formatted = percentage.toFixed(4);
  }
  
  return showSymbol ? `${formatted}%` : formatted;
}
