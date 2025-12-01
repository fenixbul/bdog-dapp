import { Principal } from '@dfinity/principal';
import { HttpAgent } from '@dfinity/agent';
import { LedgerCanister } from '@dfinity/ledger-icp';

class ICPLedgerStore {
  private canisters: Map<string, LedgerCanister> = new Map();

  async getCanister(agent: HttpAgent, canisterId: Principal): Promise<LedgerCanister> {
    const canisterIdString = canisterId.toString();
    
    if (this.canisters.has(canisterIdString)) {
      return this.canisters.get(canisterIdString)!;
    }

    // Create real ICP ledger canister instance
    const ledgerCanister = LedgerCanister.create({
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

export const icpLedgerStore = new ICPLedgerStore();


