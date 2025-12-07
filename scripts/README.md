# Scripts Directory

Deployment and utility scripts for local development.

---

## Setup Guide

Follow these steps in order to set up your local development environment:

### Step 1: Restart DFX

**Always start here** - This ensures a clean state by killing all DFX processes and restarting with fresh ports.

```bash
./scripts/restart_dfx.sh
```

This script:
- Stops DFX properly
- Kills any remaining DFX processes
- Frees DFX ports (8080, 4943, 8000)
- Starts DFX with clean state

### Step 2: Deploy Players Canister

Deploy the `players` canister for user management.

```bash
./scripts/deploy/players_deploy.sh
```

This script:
- Creates and builds the `players` canister
- Generates TypeScript declarations
- Deploys using `--mode reinstall` for fresh state

### Step 3: Deploy ICRC Tokens

Deploy local token ledgers (ICP, BOB, BDOG) for development.

```bash
./scripts/deploy/icrc_deploy.sh
```

This script:
- Deploys ICP (`ryjl3-tyaaa-aaaaa-aaaba-cai`)
- Deploys BOB (`7pail-xaaaa-aaaas-aabmq-cai`)
- Deploys BDOG (`2qqix-tiaaa-aaaam-qeria-cai`)
- Uses fixed canister IDs for local development

### Step 4: Deploy Skill Module + Seed Data

Deploy the skill module canister and seed it with BOB learning content.

```bash
# Deploy skill module
./scripts/deploy/skill_module_deploy.sh

# Seed BOB module data
./scripts/tools/seed_bob_module.sh
```

The skill module script:
- Creates and builds the `skill_module` canister
- Generates TypeScript declarations
- Deploys using `--mode reinstall`

The seeder script:
- Creates the BOB Academy module
- Adds lessons and quiz content

### Step 5: Deploy Rewards System

Deploy and configure the rewards canister.

```bash
./scripts/deploy/rewards_deploy.sh
```

This script:
- Deploys the `rewards` canister
- Sets players and skill_module canister IDs
- Registers tokens (ICP, BOB, BDOG)
- Configures reward amounts (UserVerified: 50 BDOG, ModulePassed: 100 BDOG)
- Funds canister with BDOG tokens

### Step 6: Deploy Internet Identity

Deploy Internet Identity for authentication.

```bash
./scripts/deploy/internet_identity_deploy.sh
```

This script:
- Deploys the `internet_identity` canister
- Required for user authentication

### Step 7: Deploy Site (Frontend)

Build and deploy the frontend application.

```bash
./scripts/deploy/site_deploy.sh
```

This script:
- Builds the Next.js frontend
- Deploys the `site` canister with frontend assets
- Provides access URL for the application

---

## Utility Scripts

### Clean Build Artifacts

Remove build artifacts for fresh builds. Use this when you need a completely clean build state.

```bash
./scripts/clean.sh
```

**When to use:**
- Before starting a fresh deployment cycle
- When experiencing build issues or stale artifacts
- When switching between different deployment configurations
- After making significant changes to build configuration

This script removes:
- `.next/` - Next.js build cache
- `out/` - Next.js output directory
- `.dfx/local/canisters/*` - DFX canister build artifacts

**Note:** This does not remove the `.dfx` directory itself, only build artifacts. Canister IDs and configurations are preserved.

---

## Directory Structure

```
scripts/
├── restart_dfx.sh              # Cold restart DFX (kills processes, frees ports)
├── clean.sh                    # Clean build artifacts (.next, out, .dfx/local/canisters)
├── setup-authorizations.sh    # Canister authorization setup
├── README.md                   # This file
│
├── deploy/                     # Individual deploy scripts
│   ├── users_deploy.sh         # Deploy players canister
│   ├── skill_module_deploy.sh  # Deploy skill module canister
│   ├── icrc_deploy.sh          # Deploy token ledgers
│   ├── rewards_deploy.sh       # Deploy & configure rewards
│   ├── internet_identity_deploy.sh  # Deploy Internet Identity
│   └── site_deploy.sh          # Build & deploy frontend
│
└── tools/                      # Utility scripts
    ├── seed_bob_module.sh      # Seed skill module data
    ├── transfer_tokens.sh      # Transfer tokens utility
    └── interactive_skill_module_tool.sh  # Interactive skill module testing
```

---

## Notes

- All scripts should be run from the **project root** directory
- DFX must be running before deploying canisters
- Token ledgers use fixed canister IDs for local development
- Rewards canister requires players and skill_module to be deployed first
- Use `--mode reinstall` scripts for fresh deployments (clears all data)
