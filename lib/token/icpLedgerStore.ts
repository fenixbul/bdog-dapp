import { Principal } from '@dfinity/principal';
import { HttpAgent } from '@dfinity/agent';
import { LedgerCanister } from '@dfinity/ledger-icp';

class ICPLedgerStore {
  private canisters: Map<string, LedgerCanister> = new Map();

  async getCanister(agent: HttpAgent, canisterId: Principal): Promise<LedgerCanister> {
    const canisterIdString = canisterId.toString();
    // Include agent identity in cache key to prevent stale actor identity issues
    const agentPrincipal = (await agent.getPrincipal()).toText();
    const cacheKey = `${canisterIdString}-${agentPrincipal}`;
    
    if (this.canisters.has(cacheKey)) {
      return this.canisters.get(cacheKey)!;
    }

    // Create real ICP ledger canister instance
    const ledgerCanister = LedgerCanister.create({
      agent,
      canisterId
    });

    this.canisters.set(cacheKey, ledgerCanister);
    return ledgerCanister;
  }

  clearCache(): void {
    this.canisters.clear();
  }
}

export const icpLedgerStore = new ICPLedgerStore();



