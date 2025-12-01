import { Principal } from '@dfinity/principal';
import { AccountIdentifier } from '@dfinity/ledger-icp';

/**
 * Validates if a string is a valid Principal ID
 * @param str - The string to validate
 * @returns true if valid Principal, false otherwise
 */
export function isValidPrincipal(str: string): boolean {
  try {
    Principal.fromText(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid ICP Account Identifier
 * @param str - The hex string to validate
 * @returns true if valid Account Identifier, false otherwise
 */
export function isValidAccountIdentifier(str: string): boolean {
  try {
    AccountIdentifier.fromHex(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates an address and determines its type
 * @param str - The address string to validate
 * @returns Object with validation result and address type
 */
export function validateAddress(str: string): {
  isValid: boolean;
  type: 'principal' | 'account' | 'invalid';
} {
  if (isValidPrincipal(str)) {
    return { isValid: true, type: 'principal' };
  }
  
  if (isValidAccountIdentifier(str)) {
    return { isValid: true, type: 'account' };
  }
  
  return { isValid: false, type: 'invalid' };
}


