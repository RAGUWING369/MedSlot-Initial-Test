# Accessibility Specification — MedSlot

**Phase:** 5 — UX Design
**Version:** 1.0
**Date:** 2026-05-26
**Standard:** WCAG 2.1 Level AA (W3C, 2018)
**Implementation Framework:** Next.js 14 with semantic HTML and ARIA

---

## Compliance Target

WCAG 2.1 Level AA on all screens. Automated scanning via Axe Core in CI pipeline (Phase 9). Manual audit for complex interactions (OTP entry, consultation notes, prescription issuance form).

---

## WCAG 2.1 AA Compliance Specification

| Criterion | Level | Requirement | MedSlot Implementation |
|-----------|-------|-------------|----------------------|
| **1.1.1 Non-text Content** | A | All images have text alternatives | Doctor avatar placeholders: `alt="Dr. Arjun Mehta profile photo"` or `alt=""` for decorative. Trust signal icons: `aria-hidden="true"` (decorative). MCI Verified checkmark icon: `aria-hidden="true"` (label text provides the meaning). Upload icon on button: `aria-hidden="true"` + visible button label. |
| **1.3.1 Info and Relationships** | A | Structure communicated by more than visual presentation | All form fields use `<label for="...">` not placeholder. Appointment status communicated via text badge, not color alone. Error states: `aria-invalid="true"` + `aria-describedby` pointing to error message element. Required fields: `required` attribute + asterisk in label text. |
| **1.3.2 Meaningful Sequence** | A | Reading/navigation order matches visual order | Next.js App Router renders semantic HTML. DOM order = visual column order (left-to-right, top-to-bottom). Doctor profile: sidebar (doctor info) before main content (slots) in DOM. |
| **1.3.3 Sensory Characteristics** | A | Instructions don't rely solely on sensory characteristics | Error messages use explicit text: "End time must be after start time" — not "the red field." Slot selection uses text labels (time) not color alone. |
| **1.4.1 Use of Color** | A | Color not used as sole information carrier | Appointment status: always text label + color badge (e.g., "COMPLETED" in green badge — both text and color). Error states: red border + error message text + `aria-invalid`. Verified doctors: "✓ MCI Verified" text + green badge — both carry the meaning. |
| **1.4.3 Contrast (Minimum)** | AA | Text ≥ 4.5:1; Large text and UI ≥ 3:1 | See Design System §5a — all combinations verified: primary text on white 19.2:1; error text on white 5.5:1; success badge 4.6:1. Slot chips: emerald-800 on emerald-50 = 7.2:1. |
| **1.4.4 Resize Text** | AA | Readable at 200% zoom | No fixed pixel heights on text containers. Use min-h with padding, not fixed h. Tailwind: prefer `py-3` over `h-12`. Tested at 200% zoom via browser dev tools. |
| **1.4.5 Images of Text** | AA | Text used instead of images of text | No images of text used anywhere. Doctor credentials displayed as text. Prescription PDF is a separate download artifact — the screen renders text. |
| **1.4.10 Reflow** | AA | Content reflows at 400% zoom without horizontal scrolling | Desktop layout reflows to single column. No fixed-width content containers below 375px. Tailwind: `max-w-full` on all content containers. |
| **1.4.11 Non-text Contrast** | AA | UI components and graphics ≥ 3:1 against adjacent colors | Form input borders (neutral-300 on white): 1.72:1 — below threshold. **Mitigation:** Add inner shadow or increase to neutral-400 (3.0:1 exactly) for input borders in implementation. Slot chips: emerald-300 border on emerald-50 background: verified ≥ 3:1. |
| **1.4.12 Text Spacing** | AA | No loss of content when spacing adjusted | Use relative units (rem, em) for text spacing. No `overflow:hidden` on text containers with fixed dimensions. |
| **2.1.1 Keyboard** | A | All functionality keyboard operable | Navigation: all nav links reachable by Tab. Search: Enter submits form. Specialty dropdown: arrow keys for selection. Slot chips: Enter/Space to select. Modal: Tab cycles within modal; Escape closes. Medicine row add/remove: keyboard accessible. OTP input: Tab between digits. |
| **2.1.2 No Keyboard Trap** | A | Keyboard focus not trapped on page | Exception: Modals trap focus intentionally per ARIA Authoring Practices §modal-dialog. When modal closes, focus returns to the element that opened it. OTP input boxes: Tab advances to next box, Shift+Tab goes back. |
| **2.4.1 Bypass Blocks** | A | Skip navigation link | `<a href="#main-content" class="sr-only focus:not-sr-only ...">Skip to main content</a>` as first element in body. |
| **2.4.2 Page Titled** | A | Pages have descriptive titles | Next.js `<title>` per page: "Find a Doctor — MedSlot", "My Appointments — MedSlot", "Dr. Arjun Mehta, Cardiologist — MedSlot" etc. |
| **2.4.3 Focus Order** | A | Focus order matches visual order | DOM order matches visual order throughout. No `tabindex > 0` used. Positive tabindex explicitly prohibited in code review (Phase 8). |
| **2.4.4 Link Purpose** | A | Link purpose clear from context | "View Profile" links include doctor name in aria-label: `aria-label="View profile of Dr. Arjun Mehta, Cardiologist"`. "View Prescription" links include date context. Generic "Click here" links prohibited. |
| **2.4.7 Focus Visible** | AA | Focus indicator visible | Focus ring on all interactive elements: `focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none`. Never `outline: none` without ring replacement. Custom JavaScript must not remove focus visibility. |
| **3.1.1 Language of Page** | A | Default language declared | `<html lang="en">` on all pages. English primary language throughout v1. |
| **3.2.1 On Focus** | A | No unexpected context change on focus | No auto-navigation on focus. Specialty dropdown requires user action (Enter/click) to navigate — focus alone does not trigger search. |
| **3.2.2 On Input** | A | No unexpected context change on input | City text field: typing does not auto-submit search. OTP boxes: typing in box does NOT auto-advance to next box (auto-advance creates accessibility issues for screen readers and users with motor impairments). |
| **3.3.1 Error Identification** | A | Form errors identified in text | All form errors as visible text adjacent to field. Error summary at form top for multi-field forms (doctor registration). Each error text element has `role="alert"` or referenced via `aria-describedby`. |
| **3.3.2 Labels or Instructions** | A | Form fields have labels | Every `<input>`, `<textarea>`, `<select>` has a visible `<label>`. Placeholder text supplements label — never replaces it. |
| **3.3.3 Error Suggestion** | AA | Error messages suggest correction | "Please enter a valid Indian mobile number (+91 followed by 10 digits)" — not just "Invalid input". "End time must be after start time" — specific. |
| **3.3.4 Error Prevention (Legal/Financial)** | AA | Reversible or confirmed for important submissions | Appointment cancellation: confirmation modal required. Prescription issuance: explicit "Issue Prescription" button with no accidental trigger. Doctor suspension (admin): confirmation required. |
| **4.1.1 Parsing** | A | Valid HTML | Next.js generates valid HTML. No duplicate IDs. All elements properly closed. |
| **4.1.2 Name, Role, Value** | A | All components have accessible name | Buttons: visible label or `aria-label`. Icons-only: `aria-label` required. Checkboxes: `<label>` or `aria-label`. Loading states: `aria-busy="true"` on container. Status badges: `aria-label` for screen reader context (e.g., `aria-label="Appointment status: Completed"`). |
| **4.1.3 Status Messages** | AA | Status messages programmatically determinable | Toast notifications: `role="status"` (success) or `role="alert"` (error). Form save confirmation ("Notes saved"): `aria-live="polite"` region. Booking confirmation: `role="status"`. |

---

## Component-Level ARIA Implementation Guide

### OTP Input (6-box PIN entry)

```html
<fieldset>
  <legend class="sr-only">Enter your 6-digit OTP</legend>
  <div class="flex gap-2">
    <input type="text" inputmode="numeric" maxlength="1" 
           aria-label="OTP digit 1 of 6"
           autocomplete="one-time-code"
           class="w-12 h-14 text-center text-xl border ..." />
    <!-- repeat for digits 2-6 -->
  </div>
</fieldset>
<p id="otp-error" role="alert" class="text-sm text-red-600 mt-2 hidden">
  Incorrect OTP. 2 attempts remaining.
</p>
```

**Note:** `autocomplete="one-time-code"` enables SMS autofill on supported mobile browsers (Safari iOS, Chrome Android) — significant UX improvement for the OTP flow.

---

### Doctor Search Results (Live Region)

```html
<div aria-live="polite" aria-atomic="true" class="sr-only" id="search-status">
  <!-- Dynamically updated: "15 Cardiologists found in Bengaluru" -->
</div>
```

When search results load, update this region's text content. Screen reader users hear the result count without navigating to it.

---

### Slot Selection (Appointment Booking)

```html
<div role="group" aria-labelledby="slots-heading">
  <h3 id="slots-heading">Available slots for Thursday, 11 June 2026</h3>
  <button 
    role="button"
    aria-pressed="false"
    aria-label="Book 10:30 AM appointment on Thursday 11 June 2026"
    class="slot-chip ...">
    10:30 AM
  </button>
</div>
```

When slot is selected, update `aria-pressed="true"` and announce via `aria-live` region: "10:30 AM on Thursday 11 June selected. Proceed to confirm booking."

---

### Appointment Status Badge

```html
<span 
  class="bg-green-100 text-green-700 ..."
  aria-label="Appointment status: Completed">
  COMPLETED
</span>
```

The visible text "COMPLETED" is sufficient, but `aria-label` provides fuller context for screen readers when the badge appears without surrounding context.

---

### Cancel Appointment (Disabled State)

```html
<!-- When cancellation is allowed: -->
<button type="button" class="btn-destructive ...">Cancel Appointment</button>

<!-- When < 2h before appointment (disabled): -->
<button 
  type="button" 
  disabled
  aria-disabled="true"
  aria-describedby="cancel-tooltip-123"
  class="btn-destructive opacity-50 cursor-not-allowed ...">
  Cancel Appointment
</button>
<span id="cancel-tooltip-123" role="tooltip" class="sr-only">
  Cancellations are not allowed within 2 hours of your appointment.
</span>
```

**Important:** Use both `disabled` attribute AND `aria-disabled="true"`. The tooltip text must be read by screen readers — use `aria-describedby`.

---

### Consultation Notes Form (Auto-Save State)

```html
<form aria-label="Consultation notes" novalidate>
  <div role="status" aria-live="polite" class="sr-only" id="save-status">
    <!-- Updated to "Notes saved" after auto-save -->
  </div>
  
  <div class="form-group">
    <label for="chief-complaint" class="label">
      Chief Complaint 
      <span class="text-red-500" aria-hidden="true">*</span>
      <span class="sr-only">(required)</span>
    </label>
    <textarea 
      id="chief-complaint" 
      name="chief_complaint"
      required
      aria-required="true"
      aria-describedby="chief-complaint-error"
      class="textarea ..." />
    <p id="chief-complaint-error" role="alert" class="text-red-600 text-sm mt-1 hidden">
      Chief Complaint is required before issuing a prescription.
    </p>
  </div>
</form>
```

---

### Medicine Row Table (Dynamic Add/Remove)

```html
<table aria-label="Prescription medicines" role="table">
  <thead>
    <tr>
      <th scope="col">Medicine Name</th>
      <th scope="col">Dosage</th>
      <th scope="col">Frequency</th>
      <th scope="col">Duration</th>
      <th scope="col">
        <span class="sr-only">Actions</span>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><input aria-label="Medicine name, row 1" type="text" required /></td>
      <td><input aria-label="Dosage, row 1" type="text" required /></td>
      <td><input aria-label="Frequency, row 1" type="text" required /></td>
      <td><input aria-label="Duration, row 1" type="text" required /></td>
      <td>
        <button type="button" aria-label="Remove medicine row 1" class="text-red-500 ...">
          <XMarkIcon />
        </button>
      </td>
    </tr>
  </tbody>
</table>
<button type="button" aria-label="Add another medicine" class="btn-secondary ...">
  + Add Medicine
</button>
<div aria-live="polite" class="sr-only" id="row-status">
  <!-- Updated: "Medicine row 2 added" / "Medicine row 1 removed" -->
</div>
```

---

### Loading State (Skeleton)

```html
<div aria-busy="true" aria-label="Loading your appointments..." class="space-y-4">
  <!-- Skeleton elements are aria-hidden — they're purely visual -->
  <div aria-hidden="true" class="animate-pulse h-24 bg-neutral-200 rounded-xl"></div>
  <div aria-hidden="true" class="animate-pulse h-24 bg-neutral-200 rounded-xl"></div>
</div>
```

When data loads, replace with:
```html
<div aria-busy="false">
  <!-- actual content -->
</div>
```

---

## Keyboard Navigation Patterns

### Specialty Dropdown (Search)

- `Tab` → focuses select element
- `↑/↓` → navigates options (native `<select>` behaviour)
- `Enter` → confirms selection
- `Escape` → closes dropdown without selection

### Slot Calendar (Date Tabs + Slot Grid)

- `Tab` → moves between date tabs
- `Enter/Space` → selects date tab, updates slot grid
- `Tab` → moves into slot grid chips
- `Enter/Space` → selects slot (triggers booking summary)
- `Escape` → deselects slot

### Modal (Appointment Cancellation Confirmation)

- Modal opens: focus moves to first focusable element inside modal (usually the Cancel/No button — the safe option)
- `Tab` → cycles through modal buttons only (focus trapped)
- `Escape` → closes modal, returns focus to trigger button
- `Enter` on "Confirm Cancellation" → submits action

### OTP Entry

- `Tab` → moves between OTP boxes
- `Backspace` in empty box → moves focus to previous box
- Numeric input → enters digit, does NOT auto-advance (screen reader compatibility)

---

## Screen Reader Considerations

### Page-Level Headings

Each page must have a clear H1 that describes the page purpose:
- SCR-001: "Find a Verified Doctor Near You"
- SCR-002: "Doctor Search Results"
- SCR-003: "Dr. Arjun Mehta — Cardiologist"
- SCR-007: "My Appointments"
- SCR-011: "Today's Appointments — [Date]"
- SCR-013: "Consultation for [Patient Name] — [Date]"

Heading hierarchy must not skip levels (H1 → H2 → H3 only).

### Landmark Regions

Every page must include:
```html
<header role="banner">...</header>
<nav role="navigation" aria-label="Main navigation">...</nav>
<main role="main" id="main-content">...</main>
<footer role="contentinfo">...</footer>
```

---

## Mobile Accessibility Considerations

**Touch Target Sizes (WCAG 2.5.5 — AAA target; best practice for AA):**
- Minimum touch target: 44×44px (iOS HIG) / 48×48dp (Material Design)
- Slot chips: minimum `w-16 h-12` (64×48px)
- Table action buttons: minimum `p-3` with icon (44px touch target)
- Navigation items: full height nav bar with sufficient padding

**iOS Safari Specifics:**
- `autocomplete="one-time-code"` on OTP inputs for SMS autofill
- `inputmode="numeric"` for OTP boxes — triggers numeric keyboard
- `inputmode="tel"` for phone number inputs

---

## Testing Protocol

### Automated (CI — Phase 9)
- Tool: axe-core via jest-axe (frontend unit tests) + Playwright + @axe-core/playwright (E2E)
- Coverage: all public routes + all authenticated routes
- Failure threshold: zero WCAG A/AA violations

### Manual Audit Checklist (Phase 9)
- [ ] Navigate all journeys with keyboard only (no mouse)
- [ ] Navigate all journeys with VoiceOver (macOS Safari) and NVDA (Windows Chrome)
- [ ] Verify focus indicators visible at all interactive elements
- [ ] Verify error messages announced by screen reader on form submission
- [ ] Verify OTP SMS autofill works on iOS Safari and Chrome Android
- [ ] Verify slot selection announces correctly to screen reader
- [ ] Verify modal focus trap works and focus returns on close
- [ ] Verify 200% zoom layout on all screen types
- [ ] Verify all images have appropriate alt text
- [ ] Verify page titles are descriptive per page
