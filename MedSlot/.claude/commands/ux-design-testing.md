---
allowed-tools: ["Read", "Write", "Glob"]
description: "⚠️ TESTING VERSION — Phase 5 UI/UX Design agent invoking command. Restricted to 3 highest-value screens selected autonomously by the agent based on PRD priority. All artifacts (journey maps, wireframe specs, HTML files, design system, accessibility) are scoped to those 3 screens only. Use for rapid test cycles and team review. For full production execution use /sdlc:ux-design."
---

# /sdlc:ux-design-testing

Invoke the **UX Design Agent (Testing Version)** to execute a restricted Phase 5 run — 3 screens only.

## Usage

```
/sdlc:ux-design-testing
```

## Prerequisites

- Phase 4 complete: `docs/design/ARCHITECTURE.md` approved

## What Makes This Different from /sdlc:ux-design

| | `/sdlc:ux-design` | `/sdlc:ux-design-testing` |
|--|---|---|
| Agent file | `05_ux_design_agent.md` | `05_ux_design_agent_testing.md` |
| Screens covered | All screens (full inventory) | 3 highest-value screens only |
| HTML wireframes | One per screen (full suite) | Exactly 3 files |
| Journey maps | All personas | Personas touching the 3 screens |
| Design system | Full component library | Components present in 3 screens only |
| CLAUDE.md status | ✅ Complete | ⚠️ Test Run Complete |
| Purpose | Production SDLC run | Team review & agent quality testing |

## Outputs

| File | Description |
|------|-------------|
| `docs/ux/USER-JOURNEYS.md` | Journey maps scoped to the 3 selected screens |
| `docs/ux/WIREFRAMES.md` | 3 screen specifications with all states (markdown reference) |
| `docs/visuals/ux/SCR-[ID]-[slug]/` × 3 | One directory per screen — separate HTML file per state, loading type per classification, absolute-positioned annotations |
| `docs/ux/DESIGN-SYSTEM.md` | Design tokens and components scoped to the 3 screens |
| `docs/ux/ACCESSIBILITY.md` | WCAG 2.1 AA spec scoped to the 3 screens |

## Human Gate

Product Owner reviews the 3-screen test output. On APPROVED, choose:
- **a)** Continue testing → `/sdlc:task-breakdown`
- **b)** Run full production UX → `/sdlc:ux-design`, then `/sdlc:task-breakdown`

---
*AI SDLC Suite — Phase 5 of 14 (Testing Version)*

Use `@.claude/agents/05_ux_design_agent_testing.md` as the agent for this command.
