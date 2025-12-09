import { Principal } from '@dfinity/principal';
import { HttpAgent, Actor } from '@dfinity/agent';
import { IcrcLedgerCanister } from '@dfinity/ledger-icrc';

class LedgerStore {
  private canisters: Map<string, IcrcLedgerCanister> = new Map();

  async getCanister(agent: HttpAgent, canisterId: Principal): Promise<IcrcLedgerCanister> {
    const canisterIdString = canisterId.toString();
    // Include agent identity in cache key to prevent stale actor identity issues
    const agentPrincipal = (await agent.getPrincipal()).toText();
    const cacheKey = `${canisterIdString}-${agentPrincipal}`;
    
    if (this.canisters.has(cacheKey)) {
      return this.canisters.get(cacheKey)!;
    }

    // Create real ICRC ledger canister instance
    const ledgerCanister = IcrcLedgerCanister.create({
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

export const ledgerStore = new LedgerStore(); 