# Acceptance test: "Let's make a react todo list"

This is a **manual** acceptance test (not a promptfoo case). It checks the one behavior
that defines superpony's value: process discipline that auto-triggers, followed by a
minimal implementation. It adapts the documented Superpowers acceptance test
("Let's make a react todo list" must trigger brainstorming first) and adds the Ponytail
minimalism gate on the other side.

## Scenario

In a fresh Claude Code session with the superpony skill tree installed, the user says:

> Let's make a react todo list

## Expected behavior

1. **Brainstorming auto-triggers FIRST.** Before writing any code, superpony enters the
   brainstorming/frame phase. It does NOT jump to an implementation. It asks scope-
   shrinking questions ("do you want persistence? routing? styling, or is plain markup
   fine?") and, in the Ponytail spirit, challenges the requirement ("a todo list can be
   one component with `useState` — do you need anything beyond add / toggle / delete?").

2. **Then a MINIMAL implementation.** Once scope is agreed, the implementation is the
   smallest viable thing that works:
   - Single component, local `useState` — no Redux/Zustand/Context, no router.
   - No new dependencies beyond React itself.
   - No speculative abstractions (no `TodoService`, no generic `List<T>`, no config
     for constants, no folder-per-file scaffolding).
   - One runnable check left behind for any non-trivial logic (e.g. the toggle/filter),
     or an explicit note that the logic is trivial enough not to need one.
   - Code first, prose minimal: a short note of what was skipped and when to add it.

## Manual run procedure

1. Open a NEW Claude Code session in a repo where superpony is the active skill tree
   (`skills/superpony/SKILL.md` present and discoverable).
2. Send exactly: `Let's make a react todo list`
3. Do NOT pre-answer any questions. Observe the FIRST response.
4. Record: did it brainstorm before coding? (Phase 0 gate)
5. Answer its scope questions minimally ("just add/toggle/delete, no persistence").
6. Observe the implementation it produces.
7. Record: dependency count added, component/file count, presence of a runnable check,
   presence of unrequested abstractions/features.

## Pass / fail criteria

PASS requires ALL of:

- [ ] First response is brainstorming/framing, NOT code. (process gate held)
- [ ] It challenged or scoped the requirement before building (Ponytail frame).
- [ ] Final implementation adds **zero** new dependencies beyond React.
- [ ] Final implementation is a single component with local state (no global state mgmt,
      no router) unless the user explicitly asked for more.
- [ ] No speculative abstractions (no single-caller service/factory/interface, no config
      for constants).
- [ ] One runnable check left for non-trivial logic, OR an explicit "trivial, no test"
      note.

FAIL if ANY of:

- It writes code in the first response without brainstorming. (superpowers gate missed)
- It scaffolds a multi-folder app, adds a state-management or routing library, or builds
  unrequested features (filters, persistence, drag-and-drop) without being asked.
  (ponytail gate missed)

## Why this test

It is the cleanest single discriminator between the three variants:

- **ponytail-only** tends to skip the brainstorming gate and dump minimal code immediately
  → fails the process criterion.
- **superpowers-only** tends to brainstorm well but then over-build (folders, services,
  a state library "for scale") → fails the minimalism criteria.
- **superpony** should be the only variant that passes BOTH halves.
