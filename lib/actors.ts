import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory } from "./canisters/bobpad.did.js";
import type { _SERVICE } from "./canisters/bobpad.did.d.ts";
import { idlFactory as boblaunchIdlFactory } from "./canisters/boblaunch.did.js";
import type { _SERVICE as BoblaunchService } from "./canisters/boblaunch.did.d.ts";
import { idlFactory as bobminingIdlFactory } from "./canisters/bobmining.did.js";
import type { _SERVICE as BobminingService } from "./canisters/bobmining.did.d.ts";
import { idlFactory as bobledgerIdlFactory } from "./canisters/bobledger.did.js";
import type { _SERVICE as BobledgerService } from "./canisters/bobledger.did.d.ts";

// Canister IDs
export const BOBPAD_CANISTER_ID = "cau4v-ziaaa-aaaas-amqta-cai";
export const BOBLAUNCH_CANISTER_ID = "h7uwa-hyaaa-aaaam-qbgvq-cai";
export const BOBMINING_CANISTER_ID = "6lnhz-oaaaa-aaaas-aabkq-cai";
export const BOBLEDGER_CANISTER_ID = "7pail-xaaaa-aaaas-aabmq-cai";

// Create anonymous agent for public calls
const createAnonymousAgent = () => {
  return new HttpAgent({
    host: "https://icp0.io",
  });
};

// Create bobpad actor (anonymous for public calls)
export const createBobpadActor = (): _SERVICE => {
  const agent = createAnonymousAgent();
  
  return Actor.createActor(idlFactory, {
    agent,
    canisterId: BOBPAD_CANISTER_ID,
  });
};

// Create boblaunch actor (anonymous for public calls)
export const createBoblaunchActor = (): BoblaunchService => {
  const agent = createAnonymousAgent();
  
  return Actor.createActor(boblaunchIdlFactory, {
    agent,
    canisterId: BOBLAUNCH_CANISTER_ID,
  });
};

// Create bobmining actor (anonymous for public calls)
export const createBobminingActor = (): BobminingService => {
  const agent = createAnonymousAgent();
  
  return Actor.createActor(bobminingIdlFactory, {
    agent,
    canisterId: BOBMINING_CANISTER_ID,
  });
};

// Create bobledger actor (anonymous for public calls)
export const createBobledgerActor = (): BobledgerService => {
  const agent = createAnonymousAgent();
  
  return Actor.createActor(bobledgerIdlFactory, {
    agent,
    canisterId: BOBLEDGER_CANISTER_ID,
  });
};

// Singleton actor instances
let bobpadActor: _SERVICE | null = null;
let boblaunchActor: BoblaunchService | null = null;
let bobminingActor: BobminingService | null = null;
let bobledgerActor: BobledgerService | null = null;

export const getBobpadActor = (): _SERVICE => {
  if (!bobpadActor) {
    bobpadActor = createBobpadActor();
  }
  return bobpadActor;
};

export const getBoblaunchActor = (): BoblaunchService => {
  if (!boblaunchActor) {
    boblaunchActor = createBoblaunchActor();
  }
  return boblaunchActor;
};

export const getBobminingActor = (): BobminingService => {
  if (!bobminingActor) {
    bobminingActor = createBobminingActor();
  }
  return bobminingActor;
};

export const getBobledgerActor = (): BobledgerService => {
  if (!bobledgerActor) {
    bobledgerActor = createBobledgerActor();
  }
  return bobledgerActor;
};
