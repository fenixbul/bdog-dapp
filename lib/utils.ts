import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import BigNumber from "bignumber.js"

export type Null = null | undefined;

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

/**
 * Check if value is undefined or null
 */
function isUndefinedOrNull(value: any): boolean {
  return value === null || value === undefined;
}

/**
 * Remove trailing zeros after decimal point
 */
function removeUselessZeroes(str: string): string {
  if (!str.includes('.')) return str;
  return str.replace(/\.?0+$/, '');
}

/**
 * Format amount options
 */
export interface FormatAmountOptions {
  digits?: number;
  min?: number;
  max?: number;
  fullNumber?: boolean;
  fullDigits?: number;
}

/**
 * Format amount with smart formatting
 * - Handles null/undefined values
 * - Shows compact notation for large numbers
 * - Removes trailing zeros
 * - Handles very small numbers with threshold
 */
export function formatAmount(
  num: number | string | Null,
  options?: FormatAmountOptions
): string {
  const { digits = 5, min = 0.00001, max = 1000, fullNumber, fullDigits = 5 } = options ?? {};

  if (isUndefinedOrNull(num)) return "-";
  if (new BigNumber(num).isEqualTo(0)) return "0.00";

  if (fullNumber) {
    return new BigNumber(num).toFormat(fullDigits);
  }

  if (new BigNumber(num).isLessThan(min)) {
    return `<${min}`;
  }

  if (new BigNumber(num).isLessThan(max)) {
    return removeUselessZeroes(new BigNumber(num).toFixed(digits));
  }

  return Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(num));
}

/**
 * Format seconds into human-readable duration string
 * Examples:
 * - 30 -> "30 seconds"
 * - 90 -> "1 minute 30 seconds"
 * - 3661 -> "1 hour 1 minute 1 second"
 * - 90000 -> "1 day 1 hour"
 * 
 * @param seconds - Number of seconds to format
 * @param options - Formatting options
 * @returns Human-readable duration string
 */
export function formatDuration(
  seconds: number | string,
  options: {
    compact?: boolean; // If true, use shorter format (e.g., "1h 30m" instead of "1 hour 30 minutes")
  } = {}
): string {
  const { compact = false } = options;
  
  const totalSeconds = typeof seconds === 'string' ? parseInt(seconds, 10) : Math.floor(seconds);
  
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return '0 seconds';
  }
  
  if (totalSeconds === 0) {
    return '0 seconds';
  }
  
  // Calculate all unit values
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  const parts: string[] = [];
  
  // If days exist, show days and hours (if hours > 0)
  if (days > 0) {
    if (compact) {
      parts.push(`${days}d`);
      if (hours > 0) {
        parts.push(`${hours}h`);
      }
    } else {
      parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
      if (hours > 0) {
        parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
      }
    }
  } else if (hours > 0) {
    // Only hours, no days - show just hours
    if (compact) {
      parts.push(`${hours}h`);
    } else {
      parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    }
  } else if (minutes > 0) {
    // Only minutes, no days/hours - show just minutes
    if (compact) {
      parts.push(`${minutes}m`);
    } else {
      parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    }
  } else {
    // Only seconds - show just seconds
    if (compact) {
      parts.push(`${secs}s`);
    } else {
      parts.push(`${secs} ${secs === 1 ? 'second' : 'seconds'}`);
    }
  }
  
  // Join parts with appropriate separator
  if (compact) {
    return parts.join(' ');
  }
  
  if (parts.length === 1) {
    return parts[0];
  } else {
    // Only case with 2 parts is days + hours
    return `${parts[0]} and ${parts[1]}`;
  }
}
