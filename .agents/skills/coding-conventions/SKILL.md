---
name: coding-conventions
description: Implement code changes following existing patterns and architecture
inputs:
  - user_request
  - architecture_report
outputs:
  - code_changes
depends_on:
  - architecture-analysis
triggers:
  - after architecture-analysis
---

# 💻 Coding Conventions & Implementation

## 🎯 Goal
Implement the requested feature strictly based on architecture analysis.

---

## 🧠 Input Contract

You MUST use:

- architecture_report:
  - affected_modules
  - target_files
  - implementation_path

---

## 🔧 Steps

1. Read architecture_report
2. Identify:
   - Where to add/change code
3. Implement:
   - Follow existing patterns
   - Respect naming conventions
   - Reuse existing modules
4. Ensure:
   - Minimal and scoped changes
   - No architecture deviation

---

## 📦 Output: code_changes

Must include:

- modified_files
- new_files
- summary_of_changes

---

## ⚠️ Rules

- DO NOT override architecture decisions
- DO NOT introduce new structure unless required
- DO NOT modify unrelated files