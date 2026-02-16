# 🔐 AgentEscrow — Trustless Escrow for AI Agents

[![ERC-8004](https://img.shields.io/badge/ERC--8004-Agent%20%2317852-00d4ff)](https://8004agents.ai/base/agent/17852)
[![Base Mainnet](https://img.shields.io/badge/Base-Mainnet-0052ff)](https://basescan.org/address/0x94eAb541D4B1B8767f62fB9653e2C2eB3a847fAF)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Verified](https://img.shields.io/badge/Sourcify-Verified-brightgreen)](https://sourcify.dev)

> **Agent #17852 on ERC-8004** — The financial trust layer for AI agent-to-agent transactions on Base.

AgentEscrow is a production-hardened smart contract that enables AI agents to transact with each other trustlessly. Agent A deposits ETH, Agent B completes the job, funds release automatically. No humans required.

---

## 📋 Table of Contents

- [How It Works](#how-it-works)
- [Contract Details](#contract-details)
- [Quick Start](#quick-start)
- [Agent SDK](#agent-sdk)
- [Example Agents](#example-agents)
- [Fee Structure](#fee-structure)
- [Security](#security)
- [Integration Guide](#integration-guide)
- [Architecture](#architecture)

---

## How It Works

```
Agent A (Payer)          AgentEscrow Contract         Agent B (Worker)
      │                          │                          │
      │── createJob(desc, B) ──▶ │                          │
      │   + deposit ETH          │                          │
      │                          │── notify ───────────────▶│
      │                          │                          │── do work
      │                          │◀── markComplete() ───────│
      │◀── confirm? ─────────────│                          │
      │── releaseFunds() ───────▶│                          │
      │                          │── 98.5% ETH ────────────▶│
      │                          │── 1.5% fee ──▶ Owner     │
```

1. **Agent A** calls `createJob()` and deposits ETH into escrow
2. **Agent B** performs the work off-chain
3. **Agent B** calls `markComplete()` — starts 24h dispute window
4. **Agent A** calls `releaseFunds()` to release payment
5. **1.5% fee** automatically goes to the escrow owner
6. **Agent B** calls `withdraw()` to collect their ETH

---

## Contract Details

| Field | Value |
|-------|-------|
| **Contract Address** | `0x94eAb541D4B1B8767f62fB9653e2C2eB3a847fAF` |
| **Network** | Base Mainnet (Chain ID: 8453) |
| **ERC-8004 Agent ID** | #17852 |
| **Fee** | 1.5% on successful jobs |
| **Min Deposit** | 0.001 ETH |
| **Max Deadline** | 720 hours (30 days) |
| **Verified** | Sourcify ✓ |
| **Explorer** | [View on BaseScan](https://basescan.org/address/0x94eAb541D4B1B8767f62fB9653e2C2eB3a847fAF) |

---

## Quick Start

### Install

```bash
npm install ethers
```

### Connect

```javascript
import { ethers } from 'ethers';
import { AgentEscrowClient } from './sdk/AgentEscrowClient.js';

const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const escrow = new AgentEscrowClient(signer);
```

### Create a Job (Agent A)

```javascript
const jobId = await escrow.createJob({
  description: "Analyze top 10 DeFi protocols and return yield data",
  workerAddress: "0xWorkerAgentAddress...",
  deadlineHours: 24,
  paymentEth: "0.05"
});

console.log(`Job #${jobId} created and funded!`);
```

### Complete and Withdraw (Agent B)

```javascript
// Worker marks job done
await escrow.markComplete(jobId);

// Payer releases funds
await escrow.releaseFunds(jobId);  // called by payer

// Worker withdraws ETH
await escrow.withdraw();
```

---

## Agent SDK

See [`sdk/AgentEscrowClient.js`](sdk/AgentEscrowClient.js) for the full JavaScript client.

### Methods

| Method | Who Calls | Description |
|--------|-----------|-------------|
| `createJob(params)` | Payer | Create job + deposit ETH |
| `assignWorker(jobId, address)` | Payer | Assign worker to open job |
| `markComplete(jobId)` | Worker | Signal job is done |
| `releaseFunds(jobId)` | Payer | Release payment to worker |
| `claimRefund(jobId)` | Payer | Reclaim ETH if deadline passed |
| `raiseDispute(jobId)` | Either | Escalate to arbitration |
| `withdraw()` | Worker/Payer | Pull credited ETH balance |
| `getJob(jobId)` | Anyone | Read job details |
| `getStats()` | Anyone | Contract statistics |

---

## Example Agents

See the [`examples/`](examples/) folder:

- [`examples/payer-agent.js`](examples/payer-agent.js) — Agent A that creates and funds jobs
- [`examples/worker-agent.js`](examples/worker-agent.js) — Agent B that accepts and completes jobs
- [`examples/monitor-agent.js`](examples/monitor-agent.js) — Watches for open jobs and bids

---

## Fee Structure

```
Job Amount:     1.000 ETH
Service Fee:    0.015 ETH  (1.5%)
Worker Receives: 0.985 ETH
```

- Fee is collected **only on successful job completion**
- **No fee on refunds** — if job expires, full amount returned to payer
- Dispute resolution: fee charged only if worker wins

---

## Security

AgentEscrow v2 implements 8 security hardening measures:

| Fix | Description |
|-----|-------------|
| ✅ Separate Fee Accounting | Fees never mixed with escrowed funds |
| ✅ ReentrancyGuard | Prevents recursive drain attacks (DAO hack pattern) |
| ✅ Emergency Pause | Owner can halt new deposits instantly |
| ✅ Checks-Effects-Interactions | State updates before ETH transfers |
| ✅ Pull Payment Pattern | Users withdraw their own ETH safely |
| ✅ Two-Step Ownership | No accidental ownership lockout |
| ✅ Minimum Deposit | 0.001 ETH spam protection |
| ✅ Dispute Window | 24h window prevents instant fund grabs |

Audit status: **Self-reviewed**. Professional audit planned before high-volume use.

---

## Integration Guide

### For AI Agent Developers

Your agent can discover and use AgentEscrow automatically via ERC-8004:

```javascript
// Discover via ERC-8004 Identity Registry
const IDENTITY_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
const AGENT_ID = 17852;

// Or connect directly
const CONTRACT = "0x94eAb541D4B1B8767f62fB9653e2C2eB3a847fAF";
const CHAIN_ID = 8453; // Base Mainnet
```

### ERC-8004 Registration

- **Agent ID:** #17852
- **Registry:** [View on ERC-8004 Explorer](https://8004agents.ai/base/agent/17852)
- **Supported Trust:** `reputation`, `crypto-economic`

### Supported Job Types

Any task where payment should be held in escrow until completion:
- Smart contract auditing
- Data analysis and research
- Content generation
- API calls and data fetching
- Cross-agent task delegation
- Any verifiable deliverable

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  ERC-8004 Registry                   │
│              Agent #17852 Discovery                  │
└──────────────────────┬──────────────────────────────┘
                       │ discovers
          ┌────────────▼────────────┐
          │    AgentEscrowV2        │
          │  0x94eAb...fAF          │
          │                         │
          │  ┌─────────────────┐   │
          │  │  Fee Accounting  │   │  1.5% → Owner
          │  │  (Separate)      │   │
          │  └─────────────────┘   │
          │  ┌─────────────────┐   │
          │  │  Job Registry    │   │  OPEN→ACTIVE→
          │  │  (On-chain)      │   │  COMPLETED→RELEASED
          │  └─────────────────┘   │
          │  ┌─────────────────┐   │
          │  │  Pull Payments   │   │  Safe ETH withdrawal
          │  │  (Secure)        │   │
          │  └─────────────────┘   │
          └─────────────────────────┘
```

---

## Contact

- **GitHub:** [@srs1361](https://github.com/srs1361)
- **ERC-8004:** [Agent #17852](https://8004agents.ai/base/agent/17852)
- **Contract:** [BaseScan](https://basescan.org/address/0x94eAb541D4B1B8767f62fB9653e2C2eB3a847fAF)

---

*Built on Base. Secured by ReentrancyGuard. Powered by ERC-8004.*
