---
id: TM-001
title: "CLI Agent Evals Test Matrix"
type: TestMatrix
---

# CLI Agent Evals Test Matrix

## Test Case Summary

| Test ID | Title                                 | Type        | Priority | Traces To                | Status                                                             |
| ------- | ------------------------------------- | ----------- | -------- | ------------------------ | ------------------------------------------------------------------ |
| TC-001  | Selector parsing                      | Unit        | P0       | FR-001-AC-2              | Complete                                                           |
| TC-002  | Claude transcript metric parsing      | Unit        | P0       | US-001-AC-2              | Complete                                                           |
| TC-003  | Deterministic suite report generation | Unit        | P0       | US-001-AC-2              | Complete                                                           |
| TC-004  | Driver binary probe                   | Integration | P0       | FR-002-AC-2              | Complete                                                           |
| TC-005  | ix-flow suite config load             | Integration | P0       | IT-001-AC-1              | Complete                                                           |
| TC-006  | quoin suite config load               | Integration | P0       | IT-001-AC-2              | Complete                                                           |
| TC-007  | Existing report rebuild               | Integration | P1       | FR-002-AC-3, IT-001-AC-3 | Complete                                                           |
| TC-008  | Live agent scenario run               | Integration | P0       | NFR-001-AC-1             | Blocked pending explicit approval for external model data transfer |
