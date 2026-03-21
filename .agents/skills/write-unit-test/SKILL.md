---
name: write-unit-test
description: Analyze code changes and create or update unit tests if necessary
inputs:
  - code_changes
outputs:
  - test_changes
depends_on:
  - coding-conventions
triggers:
  - after code implementation
---

# 🧪 Unit Test Generation

## 🎯 Goal
Ensure all meaningful code changes are covered by unit tests.

---

## 🧠 Decision Logic (IMPORTANT)

You MUST first decide:

### Step 1 — Analyze Changes
- Read code_changes:
  - modified_files
  - new_files

### Step 2 — Determine if testing is needed

Write or update tests IF:
- New business logic is added
- Existing logic is modified
- Edge cases are introduced

SKIP test creation IF:
- Only comments changed
- Formatting only
- Non-functional refactor

---

## 🔧 Steps (if tests required)

1. Locate test files:
   - Match project structure
2. Create or update:
   - Unit tests
3. Cover:
   - Happy path
   - Edge cases
   - Failure cases
4. Mock dependencies if needed

---

## 📦 Output: test_changes

Must include:

- test_files_created
- test_files_updated
- coverage_summary

---

## ⚠️ Rules

- DO NOT create unnecessary tests
- DO NOT duplicate existing tests
- ENSURE tests are meaningful and runnable