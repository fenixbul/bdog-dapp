import { Principal } from '@dfinity/principal';
import { AccountIdentifier } from '@dfinity/ledger-icp';

/**
 * Converts a Principal ID to an Account Identifier
 * @param principal - The Principal object or string to convert
 * @returns The Account Identifier as a string
 */
export const principalToAccountIdentifier = (principal: Principal | string): string => {
  const userPrincipal = typeof principal === 'string' 
    ? Principal.fromText(principal) 
    : principal;
    
  const userAccountIdentifier = AccountIdentifier.fromPrincipal({
    principal: userPrincipal
  });
  
  return userAccountIdentifier.toHex();
}; 