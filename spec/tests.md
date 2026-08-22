---
id: TM-001
title: "CLI Agent Evals Test Matrix"
type: TestMatrix
---

# CLI Agent Evals Test Matrix

## Requirements Traceability

### Functional Requirement Coverage

| Functional Req | Acceptance Criteria | Test Cases | Coverage Status |
|----------------|---------------------|------------|-----------------|
| FR-001 | FR-001-AC-1 | TC-008 | ⛔ Blocked pending explicit approval for external model data transfer |
| FR-001 | FR-001-AC-2 | TC-001 | ✅ Complete |
| FR-002 | FR-002-AC-2 | TC-004 | ✅ Complete |
| FR-002 | FR-002-AC-3 | TC-007 | ✅ Complete |
| FR-002 | FR-002-AC-4 | TC-009 | ✅ Complete |
| FR-002 | FR-002-AC-5 | TC-010 | ✅ Complete |
| FR-002 | FR-002-AC-6 | TC-011 | ✅ Complete |
| FR-002 | FR-002-AC-7 | TC-012 | ✅ Complete |

## Test Case Summary

| Test ID | Title                                 | Type        | Priority | Traces To                | Status                                                             |
| ------- | ------------------------------------- | ----------- | -------- | ------------------------ | ------------------------------------------------------------------ |
| TC-001  | Selector parsing                      | Unit        | P0       | FR-001-AC-2              | ✅ Complete |
| TC-002  | Claude transcript metric parsing      | Unit        | P0       | US-001-AC-2              | ✅ Complete |
| TC-003  | Deterministic suite report generation | Unit        | P0       | US-001-AC-2              | ✅ Complete |
| TC-004  | Driver binary probe                   | Integration | P0       | FR-002-AC-2              | ✅ Complete |
| TC-005  | ix-flow suite config load             | Integration | P0       | IT-001-AC-1              | ✅ Complete |
| TC-006  | quoin suite config load               | Integration | P0       | IT-001-AC-2              | ✅ Complete |
| TC-007  | Existing report rebuild               | Integration | P1       | FR-002-AC-3, IT-001-AC-3 | ✅ Complete |
| TC-008  | Live agent scenario run               | Integration | P0       | NFR-001-AC-1             | ⛔ Blocked pending explicit approval for external model data transfer |
| TC-009  | Codex loaded-model readiness          | Unit        | P0       | FR-002-AC-4              | ✅ Complete |
| TC-010  | Startup timeout fails closed          | Unit        | P0       | FR-002-AC-5              | ✅ Complete |
| TC-011  | Failure report terminal diagnostics   | Unit        | P0       | FR-002-AC-6              | ✅ Complete |
| TC-012  | Codex prompt submission confirmation  | Unit        | P0       | FR-002-AC-7              | ✅ Complete |
