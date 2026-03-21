---
name: architecture-analysis
description: Analyze codebase structure, architecture, and impacted areas before implementation
inputs:
  - user_request
outputs:
  - architecture_report
triggers:
  - before implementation
---

# 🧠 Architecture Analysis

## 🎯 Goal
Understand the codebase and determine where and how to implement the requested change.

---

## 🔍 Steps

1. Parse user_request
2. Identify:
   - Feature / bug / refactor
3. Explore codebase:
   - Folder structure
   - Key modules
   - Entry points
4. Locate:
   - Relevant files
   - Dependencies
5. Analyze:
   - Data flow
   - Design patterns

---

## 📦 Output: architecture_report

Must include:

- affected_modules
- target_files
- dependencies
- recommended_implementation_path
- risks_and_edge_cases

---

## ⚠️ Rules

- Do NOT modify code
- Do NOT assume based on partial reads
- Ensure full understanding before passing forward