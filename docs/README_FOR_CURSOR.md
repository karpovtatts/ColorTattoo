# Color Mixing App — Spec-Driven Project (WEB)

## READ THIS FIRST

This is a **WEB APPLICATION** project.

- Platform: Web (browser-based)
- Online-only in v1
- No AI usage
- Deterministic, rule-based logic
- Tattoo practice is the primary domain

Text specifications are the **single source of truth**.
Code must be generated strictly from specs.

If something is unclear:
- DO NOT guess
- Create TODO or ask via comments

---

## Project Goal

Build a web-based color mixing assistant for tattoo artists.

Given a target color (code, name, or image):
- Explain how to mix it from available base colors
- Warn about dirty mixes in tattoo practice
- Explain warm / cool nature
- Show nearest achievable color if exact match is impossible

This tool prioritizes **real-life tattoo results**, not academic color theory.

---

## Document Responsibilities

### /docs/spec — WHAT the product is

Read these files first, in order:

1. `00_vision.md` — Product intent
2. `01_scope_and_constraints.md` — MVP boundaries
3. `02_users_and_use_cases.md` — Users and scenarios
4. `03_color_model.md` — Color logic and inputs
5. `04_core_flows.md` — Main user flows
6. `05_ui_ux.md` — Screens and interaction
7. `06_data_and_storage.md` — Data models (conceptual)
8. `07_non_functional.md` — Performance, limits
9. `08_platform_and_architecture.md` — Web-specific decisions
10. `09_roadmap.md` — MVP vs future
11. `10_open_questions.md` — Known unknowns

---

### /docs/rules — HOW color logic works

These define deterministic rules.

- `R01_clean_vs_dirty.md`
- `R02_black_usage_in_color.md`
- `R03_saturation_and_suppression.md`
- `R04_warm_cool_logic.md`

Rules override assumptions.

---

### /docs/features — IMPLEMENTATION UNITS

Each file = one feature.
Implement sequentially, MVP first.

MVP order:
1. F01
2. F02
3. F03
4. F04
5. F05
6. F06

Skip F09 unless explicitly requested.

---

## Execution Rules

Before coding:
- Generate an implementation plan
- Reference document names
- Identify dependencies

Do NOT:
- Change platform
- Add AI
- Add features not in specs

---

End of instructions.
