---
id: SPEC-001
title: "CLI Agent Evals"
type: master-requirements
component_type: library
org: agent-ix
name: cli-agent-evals
---

# Master Requirements Specification

## Purpose

Define the requirements for `cli-agent-evals`, a shared TypeScript library and
`cli-evals` command for running live coding-agent CLI evaluations through a
common suite model.

## Scope

This specification covers the shared library API, CLI command surface, built-in
agent driver behavior, plugin distribution assets, docs, and conversion of the
current `ix-flow` and `quoin` eval suites.

## System Overview

The package runs local scenario suites by preparing isolated workspaces,
launching real coding-agent CLIs through `agent-pty`, detecting completion
sentinels, collecting available metrics, asserting project-specific outcomes,
and writing JSON reports.

## Requirements Architecture

Stakeholder requirements define why a unified eval toolkit is needed. User
stories define suite-running and suite-authoring workflows. Functional
requirements define the shared API, CLI, and plugin packaging. Non-functional
requirements define live validation expectations.

## Requirements Index

| ID      | Title                              | Type           |
| ------- | ---------------------------------- | -------------- |
| StR-001 | Unified agent eval harness         | Stakeholder    |
| US-001  | Run a live eval suite              | Use Case       |
| US-002  | Author reusable eval scenarios     | Use Case       |
| FR-001  | Suite configuration API            | Functional     |
| FR-002  | Live agent runner CLI              | Functional     |
| FR-003  | Agent plugin distribution          | Functional     |
| FR-004  | Versioned retained reports         | Functional     |
| NFR-001 | Real-agent validation              | Non-Functional |
| IT-001  | Converted ix-flow and quoin suites | Integration    |

## References

- `@agent-ix/agent-pty`
- `@agent-ix/ix-cli-core`
- `ix-flow/evals`
- `quoin/evals`
