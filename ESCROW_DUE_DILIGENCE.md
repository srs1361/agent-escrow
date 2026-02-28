# Escrow Smart Contract Due Diligence Checklist

Use this checklist before trusting any escrow protocol with real funds.

## Project
- Name:
- Repo URL:
- Claimed network(s):
- Claimed contract address(es):
- Review date:
- Reviewer:

---

## 1) Deployment Reality Check
**Goal:** Confirm the claimed contract actually exists on the claimed chain.

- [ ] Run `eth_getCode` against the claimed chain RPC for each claimed address.
- [ ] Record result (`0x` means no deployed code).

**Evidence**
- RPC endpoint:
- Address:
- Result:
- Timestamp:

**Fail condition:** Any claimed production contract returns `0x`.

---

## 2) Source Verification on Explorer
**Goal:** Ensure source is verified where users are expected to trust it.

- [ ] Open contract page on chain explorer.
- [ ] Confirm source is verified/published (not only bytecode/decompile).
- [ ] Record compiler version and optimization settings if shown.

**Evidence**
- Explorer URL:
- Verification status:
- Compiler info:

**Fail condition:** Explorer asks to “Verify and Publish” or equivalent.

---

## 3) Docs/Metadata vs On-Chain Consistency
**Goal:** Catch misleading or stale claims.

Compare README / website / registry metadata vs chain facts:

- [ ] Network + chainId
- [ ] Contract address
- [ ] Fee model and percentages
- [ ] Min/max deposit/deadline constraints
- [ ] Pausable/ownership claims
- [ ] Public methods/events advertised

**Evidence**
- Claimed values:
- Observed values:
- Mismatches:

**Fail condition:** Any material mismatch in production-facing claims.

---

## 4) Registry/Profile Consistency (ERC-8004 or similar)
**Goal:** Ensure discovery metadata points to the same audited deployment.

- [ ] Agent/profile registry references correct chain + address.
- [ ] Endpoint metadata (JSON/IPFS/GitHub raw) matches current deployment.
- [ ] No mixed mainnet/testnet claims.

**Evidence**
- Registry/profile URL:
- Referenced contract:
- Chain:

**Fail condition:** Profile points to testnet while marketing claims mainnet.

---

## 5) Interface Sanity (Read Calls)
**Goal:** Confirm expected interface is callable and coherent.

- [ ] Call key read methods (`getStats`, health checks, config getters).
- [ ] Confirm return values are internally consistent.
- [ ] Check advertised methods actually exist in ABI.

**Evidence**
- Methods tested:
- Results:
- Reverts/errors:

**Fail condition:** Core advertised reads are missing or unexpectedly broken.

---

## 6) Security Claims Cross-Check
**Goal:** Validate claims with source/behavior, not marketing text.

For each claim, mark **Verified / Not Verified / Contradicted**:

- [ ] Reentrancy protection
- [ ] Pull payment withdrawal model
- [ ] Pause/emergency controls
- [ ] Fee accounting separation
- [ ] Dispute window logic
- [ ] Ownership transfer safety (e.g., 2-step ownership)

**Evidence**
- Claim:
- Verification basis (source section/event/behavior):
- Status:

**Fail condition:** Security claims cannot be evidenced or are contradicted.

---

## 7) Reproducibility & Repo Hygiene
**Goal:** Ensure deployed artifact can be reproduced from repository.

- [ ] Solidity source present in repo.
- [ ] Build toolchain/config pinned.
- [ ] ABI artifacts generated from same source.
- [ ] Example paths/scripts actually run.
- [ ] Tags/releases align with deployed version.

**Evidence**
- Commit/tag reviewed:
- Build command:
- Repro status:

**Fail condition:** Cannot map deployed bytecode to repository state.

---

## 8) Audit Posture
**Goal:** Distinguish “self-reviewed” from independent assurance.

- [ ] External audit report exists.
- [ ] Auditor identity and scope documented.
- [ ] Report date and commit hash linked.
- [ ] Critical/high findings resolved.

**Evidence**
- Audit link(s):
- Scope:
- Status:

**Fail condition:** “Audit planned” presented as production-ready assurance.

---

## Risk Verdict
- [ ] **GREEN** — All critical checks pass; no material inconsistencies.
- [ ] **YELLOW** — Minor issues only; no chain/security contradictions.
- [ ] **RED** — Any chain/address/verification mismatch or major trust gap.

### Summary Notes
- Key risks:
- User impact:
- Recommended next actions:

---

## Optional Quick CLI Snippets

### Check deployed code (JSON-RPC)
```bash
curl -s -X POST "$RPC_URL" \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["'$ADDRESS'","latest"],"id":1}'
```

### Compare across networks
Repeat `eth_getCode` for each claimed chain/address pair and store outputs.

---

## Minimum Bar Before Real Funds
1. Correct chain + deployed bytecode confirmed
2. Source verified for that exact address
3. Claims match source + runtime behavior
4. Independent audit completed and current
5. Operational docs are accurate and current
