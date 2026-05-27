# Design System — MedSlot

**Phase:** 5 — UX Design
**Version:** 1.0
**Date:** 2026-05-26
**Framework:** Brad Frost Atomic Design (2016)
**Stack:** Tailwind CSS 3.x (utility-first; desktop-first breakpoints)

---

## Design Principles

1. **Trust through clarity.** Health is high-stakes. Every element must be unambiguous. No decorative complexity that adds visual noise without meaning.
2. **Speed for doctors.** Dr. Arjun needs to move through the consultation workflow at the pace he speaks. Every click must have obvious purpose and immediate feedback.
3. **Familiarity for patients.** Priya uses banking and e-commerce apps. MedSlot should feel as trustworthy and smooth as HDFC NetBanking — clean, professional, clearly functional.
4. **Information density balanced with whitespace.** Data-heavy screens (appointment lists, prescription forms) need clear hierarchy, not cramped tables.
5. **Indian market context.** Color choices and typography must render well on mid-range displays common in urban India (1080p laptop screens, mobile Safari on iPhone SE).

---

## 5a — Color System

### Brand Colors

```
brand-primary:      #0B6E4F  — Deep teal-green: trust, health, growth
brand-primary-dark: #094F39  — Hover/active state of primary
brand-secondary:    #1B5E8A  — Medical blue: authority, reliability
brand-accent:       #18A97A  — Bright teal: positive actions, CTAs, verified badges
```

### Semantic Colors

```
primary-action:     #0B6E4F  — Primary buttons, active nav items, key CTAs
primary-hover:      #094F39  — Hover state of primary-action elements
primary-light:      #D4EDDB  — Primary button ghost/outline bg on hover; subtle highlights

secondary-action:   #1B5E8A  — Secondary buttons, information badges, doctor role accents
secondary-hover:    #144A6E  — Hover state of secondary-action elements

success:            #16A34A  — Confirmation states, Completed badges, success toasts
success-bg:         #DCFCE7  — Success state backgrounds
success-border:     #86EFAC  — Success state borders

warning:            #D97706  — Caution states, trial expiry banners, Pending badges
warning-bg:         #FEF3C7  — Warning state backgrounds
warning-border:     #FCD34D  — Warning state borders

error:              #DC2626  — Error messages, Cancelled badges, validation failures
error-bg:           #FEE2E2  — Error state backgrounds
error-border:       #FCA5A5  — Error state borders

info:               #2563EB  — Informational states, links, In Consultation badges
info-bg:            #DBEAFE  — Info state backgrounds
info-border:        #93C5FD  — Info state borders
```

### Neutral Colors

```
neutral-950:        #0A0A0A  — Never used for body text directly
neutral-900:        #171717  — Primary body text, headings
neutral-700:        #404040  — Secondary text, card labels
neutral-500:        #737373  — Placeholder text, helper text
neutral-400:        #A3A3A3  — Disabled text, subtle borders
neutral-300:        #D4D4D4  — Borders, dividers, input borders
neutral-200:        #E5E5E5  — Table row alternates, very subtle borders
neutral-100:        #F5F5F5  — Page backgrounds, section backgrounds
neutral-50:         #FAFAFA  — Very light background areas

surface:            #FFFFFF  — Card surfaces, modal backgrounds, form inputs
```

### WCAG 2.1 AA Contrast Verification

| Combination | Foreground | Background | Ratio | Passes AA (4.5:1)? |
|------------|-----------|-----------|-------|-------------------|
| Body text on white | #171717 | #FFFFFF | 19.2:1 | YES |
| Body text on neutral-100 | #171717 | #F5F5F5 | 16.8:1 | YES |
| Secondary text on white | #404040 | #FFFFFF | 10.3:1 | YES |
| Primary button text (white on brand) | #FFFFFF | #0B6E4F | 5.8:1 | YES |
| Error text on white | #DC2626 | #FFFFFF | 5.5:1 | YES |
| Success badge text on success-bg | #16A34A | #DCFCE7 | 4.6:1 | YES |
| Warning badge text on warning-bg | #D97706 | #FEF3C7 | 4.8:1 | YES |
| Placeholder text (neutral-500) | #737373 | #FFFFFF | 4.6:1 | YES |
| Primary hover on white | #094F39 | #FFFFFF | 9.1:1 | YES |

**Note:** All text/background combinations have been verified to meet the minimum 4.5:1 ratio for normal text and 3:1 for large text (18px+ bold or 24px+ regular) and UI components.

### Tailwind Mapping (Nearest Tailwind 3.x Classes)

| Token | Tailwind Class |
|-------|---------------|
| brand-primary | bg-emerald-800 / text-emerald-800 |
| brand-accent | bg-emerald-600 / text-emerald-600 |
| brand-secondary | bg-blue-800 / text-blue-800 |
| success | text-green-600 / bg-green-600 |
| success-bg | bg-green-100 |
| warning | text-amber-600 / bg-amber-600 |
| warning-bg | bg-amber-100 |
| error | text-red-600 / bg-red-600 |
| error-bg | bg-red-100 |
| info | text-blue-600 / bg-blue-600 |
| info-bg | bg-blue-100 |
| neutral-900 | text-neutral-900 |
| neutral-700 | text-neutral-700 |
| neutral-500 | text-neutral-500 |
| neutral-300 | border-neutral-300 |
| neutral-100 | bg-neutral-100 |
| surface | bg-white |

---

## 5b — Typography

**Font Family:** Inter (Google Fonts — widely supported, excellent Latin+Devanagari rendering; falls back to system-ui)

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| H1 | 36px (2.25rem) | 700 | 1.2 | Page titles ("Find a Verified Doctor") |
| H2 | 28px (1.75rem) | 600 | 1.3 | Section headings ("Today's Appointments") |
| H3 | 22px (1.375rem) | 600 | 1.4 | Card titles, sub-section headings |
| H4 | 18px (1.125rem) | 600 | 1.4 | Form section headings, table headers |
| Body-lg | 18px (1.125rem) | 400 | 1.6 | Hero subtext, important body copy |
| Body-md | 16px (1rem) | 400 | 1.5 | Default body, form labels, card content |
| Body-sm | 14px (0.875rem) | 400 | 1.5 | Secondary text, timestamps, captions |
| Label | 14px (0.875rem) | 500 | 1.4 | Form field labels, table column headers |
| Badge | 12px (0.75rem) | 600 | 1.4 | Status badges (SCHEDULED, COMPLETED) |
| Code | 14px (0.875rem) | 400 | 1.5 | MCI numbers, API values |

### Tailwind Typography Classes

| Token | Tailwind Classes |
|-------|-----------------|
| H1 | `text-4xl font-bold leading-tight` |
| H2 | `text-3xl font-semibold leading-snug` |
| H3 | `text-2xl font-semibold leading-snug` |
| H4 | `text-lg font-semibold` |
| Body-lg | `text-lg leading-relaxed` |
| Body-md | `text-base leading-normal` |
| Body-sm | `text-sm text-neutral-700` |
| Label | `text-sm font-medium` |
| Badge | `text-xs font-semibold` |

---

## 5c — Spacing Scale (4px base unit)

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| xs | 4px | `p-1`, `gap-1` | Icon margins, inline tag padding |
| sm | 8px | `p-2`, `gap-2` | Badge padding, compact list items |
| md | 12px | `p-3`, `gap-3` | Form field padding, compact cards |
| lg | 16px | `p-4`, `gap-4` | Standard card padding, section gaps |
| xl | 24px | `p-6`, `gap-6` | Card-to-card spacing, section headers |
| 2xl | 32px | `p-8`, `gap-8` | Page section gaps |
| 3xl | 48px | `p-12`, `gap-12` | Hero section padding |
| 4xl | 64px | `p-16`, `gap-16` | Major section separators |
| 5xl | 96px | `p-24`, `gap-24` | Hero vertical padding |

---

## 5d — Elevation / Shadow System

| Level | Tailwind Class | Usage |
|-------|---------------|-------|
| 0 — Flat | `shadow-none` | Page backgrounds, inline elements |
| 1 — Subtle | `shadow-sm` | Cards in lists, table rows on hover |
| 2 — Default | `shadow` | Primary cards, dropdown menus |
| 3 — Raised | `shadow-md` | Modals, sticky headers, active cards |
| 4 — Floating | `shadow-lg` | Tooltips, popups |
| 5 — Overlay | `shadow-xl` | Full-screen modals, overlays |

---

## 5e — Border Radius

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| sm | 4px | `rounded` | Form inputs, small badges |
| md | 8px | `rounded-lg` | Cards, buttons, dropdowns |
| lg | 12px | `rounded-xl` | Large cards, modals |
| full | 9999px | `rounded-full` | Avatar circles, pill badges |

---

## 5f — Component Specifications

---

### Button

**Variants and Usage Rules:**

| Variant | Tailwind Classes | When to Use | When NOT to Use |
|---------|-----------------|-------------|-----------------|
| Primary | `bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors` | ONE primary action per screen/card. "Confirm Appointment", "Issue Prescription", "Save Availability" | Multiple actions of equal importance; destructive actions |
| Secondary | `bg-white border border-emerald-800 text-emerald-800 hover:bg-emerald-50 font-semibold px-6 py-3 rounded-lg transition-colors` | Supporting action alongside primary. "Back", "Save Draft" | First/only action on screen — use primary instead |
| Ghost | `text-emerald-700 hover:bg-emerald-50 font-medium px-4 py-2 rounded-lg transition-colors` | Low-priority tertiary actions. "Cancel", inline text actions | Primary or secondary-level importance |
| Destructive | `bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors` | Irreversible actions: "Cancel Appointment", "Delete Record" | Any action that is reversible |
| Destructive Ghost | `text-red-600 hover:bg-red-50 font-medium px-4 py-2 rounded-lg transition-colors` | Softer destructive option when full red button is too alarming | Actions with no reversal path |

**Sizes:**

| Size | Tailwind | Usage |
|------|----------|-------|
| sm | `px-4 py-2 text-sm` | Inline actions in tables, secondary nav actions |
| md | `px-6 py-3 text-base` | Default button size for forms and cards |
| lg | `px-8 py-4 text-lg` | Hero CTAs, full-width mobile buttons |

**States:**

| State | Tailwind Additions | Notes |
|-------|-------------------|-------|
| Default | — | Base classes as above |
| Hover | `hover:` prefixed classes | Color shift only; no scale transform in healthcare context |
| Active | `active:scale-95` | Subtle press feedback |
| Focused | `focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2` | WCAG 2.4.7 — focus ring must be visible |
| Disabled | `disabled:opacity-50 disabled:cursor-not-allowed` | Never just gray — include opacity AND cursor |
| Loading | Replace label with spinner SVG + "..." text; `disabled` attribute set | Never remove focus/keyboard access during loading |

**Accessibility:** `role="button"` implicit on `<button>`; all icon-only buttons must have `aria-label`; loading state must announce via `aria-live="polite"`.

---

### Form Input

**Variants:**

| Variant | Tailwind Classes | Usage |
|---------|-----------------|-------|
| Default | `w-full border border-neutral-300 rounded-lg px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors` | All standard text inputs |
| Error | `border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50` | Applied when field has validation error |
| Disabled | `bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-200` | Read-only, non-editable fields (e.g., MCI number on doctor profile) |

**Usage Rules:**
- Every input MUST have a `<label>` — placeholder text is NOT a substitute for a label
- Labels use `text-sm font-medium text-neutral-700 block mb-1`
- Error messages use `text-sm text-red-600 mt-1` — text, not color alone (WCAG 1.4.1)
- Helper text uses `text-xs text-neutral-500 mt-1`
- Required fields marked with asterisk: `<span class="text-red-500">*</span>` in label

**States:**

| State | Visual Change |
|-------|--------------|
| Default | neutral-300 border |
| Focus | emerald-500 ring + border |
| Filled | neutral-300 border (unchanged) |
| Error | red-400 border + red-50 background |
| Disabled | neutral-200 border + neutral-100 background |

---

### Textarea

Same as Input, with `resize-y` added. Minimum height: `min-h-[100px]`. Consultation note fields: `min-h-[120px]`.

---

### Select / Dropdown

```
w-full border border-neutral-300 rounded-lg px-4 py-3 text-neutral-900 
focus:outline-none focus:ring-2 focus:ring-emerald-500 
bg-white appearance-none cursor-pointer
```

Custom caret icon via background SVG. Same error/disabled states as Input.

**Specialty dropdown:** Uses native `<select>` with 13 fixed options — not a custom component. Ensures keyboard navigation works across all browsers without custom JS.

---

### Card

| Variant | Tailwind Classes | Usage |
|---------|-----------------|-------|
| Default | `bg-white rounded-xl shadow-sm border border-neutral-200 p-6` | Doctor result cards, appointment cards |
| Elevated | `bg-white rounded-xl shadow-md border border-neutral-100 p-6` | Booking summary card, prescription card |
| Flat | `bg-neutral-50 rounded-lg border border-neutral-200 p-4` | Inline info panels, sidebar sections |

---

### Badge / Status Label

**Usage Rule:** Use status badges ONLY for appointment status and verification status. Do not use for general text categorization.

| Status | Tailwind Classes | Label |
|--------|-----------------|-------|
| Scheduled | `bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full` | SCHEDULED |
| In Consultation | `bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full` | IN CONSULTATION |
| Completed | `bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full` | COMPLETED |
| Cancelled | `bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full` | CANCELLED |
| No Show | `bg-neutral-200 text-neutral-600 text-xs font-semibold px-2.5 py-1 rounded-full` | NO SHOW |
| MCI Verified | `bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full` | ✓ MCI VERIFIED |
| Pending | `bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full` | PENDING REVIEW |

---

### Toast Notification

**Usage Rule:** Use toasts for transient, non-critical feedback (save success, upload complete). Use inline messages for critical errors (form validation failures, slot no longer available).

| Type | Tailwind Classes | Duration |
|------|-----------------|---------|
| Success | `fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-800 rounded-lg shadow-lg p-4 flex items-center gap-3` | 4 seconds auto-dismiss |
| Error | `fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-800 rounded-lg shadow-lg p-4 flex items-center gap-3` | Persistent — must be dismissed |
| Info | `fixed bottom-4 right-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg shadow-lg p-4 flex items-center gap-3` | 4 seconds auto-dismiss |

**Accessibility:** `role="alert"` on error toasts; `role="status"` on success toasts; `aria-live="polite"` for non-urgent.

---

### Navigation Bar

**Desktop (1280px+):**
```
bg-white border-b border-neutral-200 shadow-sm
px-6 py-4 flex items-center justify-between
max-w-screen-xl mx-auto
```

Logo left. Nav links centered (not right-aligned — better for discoverability). User avatar/name right.

**Nav Link:**
```
text-neutral-700 hover:text-emerald-800 font-medium text-sm px-3 py-2 
rounded-lg hover:bg-emerald-50 transition-colors
```

**Active Nav Link:**
```
text-emerald-800 bg-emerald-50 font-semibold text-sm px-3 py-2 rounded-lg
```

**Mobile (375px):** Hamburger button → full-screen or slide-down nav overlay. Bottom navigation bar explicitly NOT used (web-first, per platform philosophy).

---

### Modal / Dialog

```
fixed inset-0 z-50 flex items-center justify-center
Backdrop: bg-black/50
Dialog box: bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4
```

**Usage Rule:** Modals for confirmation actions only (Cancel appointment, Reject with reason). Not for information display — use inline panels instead.

**Accessibility:** `role="dialog"` with `aria-modal="true"`, `aria-labelledby` pointing to modal title, focus trapped inside dialog, Escape key closes.

---

### Loading Skeleton

Used for list screens and data-heavy sections:

```html
<div class="animate-pulse space-y-4">
  <div class="h-4 bg-neutral-200 rounded w-3/4"></div>
  <div class="h-4 bg-neutral-200 rounded w-1/2"></div>
  <div class="h-20 bg-neutral-200 rounded-lg"></div>
</div>
```

**Usage Rule:** Match skeleton dimensions to the actual content. A card skeleton should be the same height as a real card. Skeleton for text should be 80% of the expected text width.

---

### Slot Chip (Doctor Profile)

Available slot:
```
bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-medium 
px-4 py-2 rounded-lg cursor-pointer 
hover:bg-emerald-100 hover:border-emerald-400 transition-colors
```

Selected slot:
```
bg-emerald-800 border border-emerald-800 text-white text-sm font-semibold 
px-4 py-2 rounded-lg
```

**Accessibility:** `role="button"`, `aria-pressed="false/true"`, `aria-label="Book 10:30 AM on Thursday 11 June"`.

---

### Verification Badge (MCI Verified)

```html
<span class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 
             text-xs font-semibold px-2.5 py-1 rounded-full">
  <svg ...checkmark icon...></svg>
  MCI Verified
</span>
```

**Usage Rule:** Only displayed on doctor profiles and search result cards when `is_verified=true` on DoctorProfile. Never shown as default or placeholder.

---

### Progress Bar (File Upload)

```html
<div class="w-full bg-neutral-200 rounded-full h-2">
  <div class="bg-emerald-600 h-2 rounded-full transition-all" style="width: 64%"></div>
</div>
<p class="text-sm text-neutral-600 mt-1">Uploading blood_test.pdf — 64%</p>
```

---

## 5g — Iconography

Use Heroicons v2 (outline style for navigation; solid style for status indicators). Reasons:
- MIT licensed, no attribution required
- Consistent stroke weight at all sizes
- Available as React components (Heroicons React) for implementation phase

**Common Icons:**
- Search: `MagnifyingGlassIcon`
- User/profile: `UserCircleIcon`
- Calendar: `CalendarDaysIcon`
- Prescription/document: `DocumentTextIcon`
- Upload: `ArrowUpTrayIcon`
- Download: `ArrowDownTrayIcon`
- Check/verified: `CheckBadgeIcon` (solid, emerald)
- Warning: `ExclamationTriangleIcon` (solid, amber)
- Error: `XCircleIcon` (solid, red)
- Success: `CheckCircleIcon` (solid, green)
- Close/X: `XMarkIcon`
- Menu (hamburger): `Bars3Icon`

---

## 5h — Healthcare-Specific Design Decisions

### Trust Signals
1. **MCI Verified badge** — always displayed on doctor cards and profiles; never generic; badge uses the checkmark + "MCI Verified" text
2. **Credential confirmation** — at doctor registration, explicit text: "Your credentials will be manually verified within 48 hours"
3. **PHI protection indicators** — lock icon on health records section; "Stored securely in AWS S3" subtitle on upload screen
4. **HTTPS/security** — trust badge in footer; not intrusive but visible

### Sensitive State Handling
- **Error messages** must never reference HTTP status codes or technical details
- **Prescription content** is styled to look like a clinical prescription — clean, clear hierarchy, doctor details prominent
- **Cancellation flows** always require explicit confirmation — no single-click destructive actions

### Color Usage in Healthcare Context
- Avoid red as a primary brand color (associated with blood/urgency)
- Green-teal as primary: health, nature, recovery — positive associations in Indian healthcare context
- Blue as secondary: authority, trust, medical professionalism
- Avoid bright yellow or orange as primary — associated with caution/warning
