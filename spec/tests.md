---
id: TM-001
title: "CLI Agent Evals Test Matrix"
type: TestMatrix
---

# CLI Agent Evals Test Matrix

## Requirements Traceability

### Functional Requirement Coverage

| Functional Req | Acceptance Criteria      | Test Cases             | Coverage Status                                                       |
| -------------- | ------------------------ | ---------------------- | --------------------------------------------------------------------- |
| FR-001         | FR-001-AC-1              | TC-008                 | ⛔ Blocked pending explicit approval for external model data transfer |
| FR-001         | FR-001-AC-2              | TC-001                 | ✅ Complete                                                           |
| FR-002         | FR-002-AC-2              | TC-004                 | ✅ Complete                                                           |
| FR-002         | FR-002-AC-3              | TC-007                 | ✅ Complete                                                           |
| FR-004         | FR-004-AC-1..FR-004-AC-5 | TC-003, TC-009..TC-012 | ✅ Complete                                                           |
| FR-004         | FR-004-AC-6              | TC-013                 | 🚧 Planned pending public release                                     |
| FR-005         | FR-005-AC-1              | TC-015                 | ✅ Complete                                                           |
| FR-005         | FR-005-AC-2              | TC-016                 | ✅ Complete                                                           |
| FR-005         | FR-005-AC-3              | TC-017                 | ✅ Complete                                                           |

### Constraint Coverage

| Constraint   | Test Cases | Coverage Status |
| ------------ | ---------- | --------------- |
| FR-004-CON-1 | TC-014     | ✅ Complete     |
| FR-004-CON-2 | TC-012     | ✅ Complete     |
| FR-004-CON-3 | TC-010     | ✅ Complete     |

### Option Permutations

| `keep` | Transcript observed | Expected retention | Expected path      | Test Case |
| ------ | ------------------- | ------------------ | ------------------ | --------- |
| false  | yes                 | `not-retained`     | absent             | TC-009    |
| false  | no                  | `unavailable`      | absent             | TC-009    |
| true   | yes                 | `retained`         | safe relative path | TC-010    |
| true   | no                  | `unavailable`      | absent             | TC-010    |

## Test Case Summary

| Test ID | Title                                  | Type        | Priority | Traces To                | Status                                                                |
| ------- | -------------------------------------- | ----------- | -------- | ------------------------ | --------------------------------------------------------------------- |
| TC-001  | Selector parsing                       | Unit        | P0       | FR-001-AC-2              | ✅ Complete                                                           |
| TC-002  | Claude transcript metric parsing       | Unit        | P0       | US-001-AC-2              | ✅ Complete                                                           |
| TC-003  | Deterministic suite report generation  | Unit        | P0       | US-001-AC-2              | ✅ Complete                                                           |
| TC-004  | Driver binary probe                    | Integration | P0       | FR-002-AC-2              | ✅ Complete                                                           |
| TC-005  | ix-flow suite config load              | Integration | P0       | IT-001-AC-1              | ✅ Complete                                                           |
| TC-006  | quoin suite config load                | Integration | P0       | IT-001-AC-2              | ✅ Complete                                                           |
| TC-007  | Existing report rebuild                | Integration | P1       | FR-002-AC-3, IT-001-AC-3 | ✅ Complete                                                           |
| TC-008  | Live agent scenario run                | Integration | P0       | NFR-001-AC-1             | ⛔ Blocked pending explicit approval for external model data transfer |
| TC-009  | Default transcript cleanup identity    | Integration | P0       | FR-004-AC-1              | ✅ Complete                                                           |
| TC-010  | Retained transcript report identity    | Integration | P0       | FR-004-AC-2              | ✅ Complete                                                           |
| TC-011  | Retained transcript mutation detection | Unit        | P0       | FR-004-AC-3              | ✅ Complete                                                           |
| TC-012  | Strict report-contract decoding        | Unit        | P0       | FR-004-AC-4              | ✅ Complete                                                           |
| TC-013  | Released report-contract identity      | Inspection  | P0       | FR-004-AC-6              | 🚧 Planned                                                            |
| TC-014  | Consumer-neutral ownership boundary    | Inspection  | P0       | FR-004-CON-1             | ✅ Complete                                                           |
| TC-015  | External provider happy path           | Unit        | P0       | FR-005-AC-1              | ✅ Complete                                                           |
| TC-016  | External provider refusal path         | Unit        | P0       | FR-005-AC-2              | ✅ Complete                                                           |
| TC-017  | External provider boundary             | Static      | P0       | FR-005-AC-3              | ✅ Complete                                                           |
