import { Principal } from '@dfinity/principal';
import { HttpAgent, Actor } from '@dfinity/agent';
import { IcrcLedgerCanister } from '@dfinity/ledger-icrc';

class LedgerStore {
  private canisters: Map<string, IcrcLedgerCanister> = new Map();

  async getCanister(agent: HttpAgent, canisterId: Principal): Promise<IcrcLedgerCanister> {
    const canisterIdString = canisterId.toString();
    
    if (this.canisters.has(canisterIdString)) {
      return this.canisters.get(canisterIdString)!;
    }

    // Create real ICRC ledger canister instance
    const ledgerCanister = IcrcLedgerCanister.create({
      agent,
      canisterId
    });

    this.canisters.set(canisterIdString, ledgerCanister);
    return ledgerCanister;
  }

  clearCache(): void {
    this.canisters.clear();
  }
}

export const ledgerStore = new LedgerStore(); 