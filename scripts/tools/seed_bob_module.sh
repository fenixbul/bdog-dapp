#!/bin/bash

# Seed script for BOB Academy Module
# Creates the first module with lessons and quiz

set -e

SKILL_MODULE_CANISTER="skill_module"
NETWORK="${NETWORK:-local}"

# Build lessons array
lessons_array='vec {
  record { id = 1 : nat; data = "{\"id\":\"what-is-bob\",\"title\":\"What is BOB?\",\"subtitle\":\"The first token to make ICP burn for real.\",\"content\":\"BOB is the first-ever proof-of-work token built on the Internet Computer, created entirely through burning ICP for computation. It represents a fully transparent, community-driven asset with zero premine, no insider allocation, and no privileged access.\",\"icon\":\"/images/bob_logo.png\"}"; order = 1 : nat };
  record { id = 2 : nat; data = "{\"id\":\"fair-launch\",\"title\":\"Fair Launch Proof\",\"subtitle\":\"No early insiders. No secret deals. Just pure mining.\",\"content\":\"Every BOB in existence had to be mined by burning ICP—no team wallets, no VC rounds, no airdrops, no backdoor allocations. This places BOB among the fairest and most decentralized token launches in the entire crypto industry.\",\"icon\":\"scale\"}"; order = 2 : nat };
  record { id = 3 : nat; data = "{\"id\":\"mining-work\",\"title\":\"On-Chain Mining\",\"subtitle\":\"Mining powered by ICP burn… not electricity.\",\"content\":\"Miners spent ICP to buy computation (cycles) and used that on-chain power to mint BOB through real proof-of-work. The entire process was open, verifiable, and identical for every participant, giving BOB unmatched transparency.\",\"icon\":\"pickaxe\"}"; order = 3 : nat };
  record { id = 4 : nat; data = "{\"id\":\"end-of-mining\",\"title\":\"Fixed Supply Forever\",\"subtitle\":\"The door to new supply is permanently closed.\",\"content\":\"The mining phase is fully completed, meaning BOB now has a fixed and fully distributed supply. This eliminates emission pressure forever and makes BOB one of the rare static-supply assets on the ICP network.\",\"icon\":\"check-circle\"}"; order = 4 : nat };
  record { id = 5 : nat; data = "{\"id\":\"deflationary\",\"title\":\"ICP Burn Engine\",\"subtitle\":\"BOB burned millions in ICP to come alive.\",\"content\":\"Every BOB minted required ICP to be burned, reducing the ICP supply and helping the network reach periods of net deflation. BOB is one of the few community tokens that materially strengthened the economic health of the Internet Computer.\",\"icon\":\"flame\"}"; order = 5 : nat };
  record { id = 6 : nat; data = "{\"id\":\"governance\",\"title\":\"NNS Secured Token\",\"subtitle\":\"Unruggable by design, secured by the NNS.\",\"content\":\"Control of BOB has been transferred to the Internet Computer'\''s NNS governance system, removing single-developer risk entirely. This makes BOB immune to rug pulls, misuse, or unilateral changes—an institutional-grade safety feature.\",\"icon\":\"shield\"}"; order = 6 : nat };
  record { id = 7 : nat; data = "{\"id\":\"long-term\",\"title\":\"Long-Term Upside\",\"subtitle\":\"Scarcity, strong holders, and a growing narrative.\",\"content\":\"With fixed supply, fair distribution, strong long-term holders, and NNS-backed security, BOB sits as a rare and high-conviction asset in a still-early ecosystem. If ICP enters a major growth phase, BOB'\''s unique origin and deflationary impact create asymmetric upside potential.\",\"icon\":\"trending-up\"}"; order = 7 : nat }
}'

# Build questions array
questions_array='vec {
  record { id = 1 : nat; questionText = "What makes BOB unique?"; options = vec {"Team mint at launch"; "ICO raised early bags"; "All minted by ICP burn"; "Mining with cheap fees"}; correctAnswer = 2 : nat; points = 1 : nat };
  record { id = 2 : nat; questionText = "Why BOB called fair?"; options = vec {"Devs got silent share"; "Miners followed same rules"; "Private round allowed few"; "Early list on CEX"}; correctAnswer = 1 : nat; points = 1 : nat };
  record { id = 3 : nat; questionText = "What powered BOB mining?"; options = vec {"GPU rigs + energy"; "Validators stake rewards"; "ICP → cycles → work"; "Network fees recycling"}; correctAnswer = 2 : nat; points = 1 : nat };
  record { id = 4 : nat; questionText = "What happens to supply?"; options = vec {"Slow inflation continues"; "Mining restarts if needed"; "Fully capped, forever fixed"; "Adjusts by network load"}; correctAnswer = 2 : nat; points = 1 : nat };
  record { id = 5 : nat; questionText = "How BOB impacts ICP?"; options = vec {"Trading burns tiny amounts"; "Mining burned real ICP"; "Staking locks supply up"; "Fees redirected to burn"}; correctAnswer = 1 : nat; points = 1 : nat };
  record { id = 6 : nat; questionText = "Why BOB unruggable now?"; options = vec {"Dev multisig controls token"; "NNS owns canister logic"; "Community votes manually"; "Locked by legal trust"}; correctAnswer = 1 : nat; points = 1 : nat };
  record { id = 7 : nat; questionText = "Why long-term BOB appeal?"; options = vec {"Supply grows with hype"; "CEX listings boost mint"; "Scarcity + origin story"; "Rewards paid every week"}; correctAnswer = 2 : nat; points = 1 : nat }
}'

# Build quiz array (1 minute = 60 seconds = 60 * 1_000_000_000 nanoseconds)
time_limit_nanos=60000000000
quizzes_array="vec {
  record { id = 1 : nat; title = \"BOB Knowledge Quiz\"; description = null; questions = ${questions_array}; passingScore = 80 : nat; timeLimit = opt (${time_limit_nanos} : int) }
}"

# Build module input
candid_input="record {
  title = \"Learn About BOB\";
  description = opt \"Master the basics, test your knowledge... Complete all lessons to unlock the quiz.\";
  lessons = ${lessons_array};
  quizzes = ${quizzes_array};
  status = variant { Published };
  order = 1 : nat
}"

# Create module and extract ID
dfx canister --network ${NETWORK} call ${SKILL_MODULE_CANISTER} create_module "(${candid_input})" 2>&1 | grep -o "id = [0-9]*" | head -1 | cut -d' ' -f3
