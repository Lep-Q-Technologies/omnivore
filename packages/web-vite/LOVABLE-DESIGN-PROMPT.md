# Omnivore Design System Recalibration Prompt for External Design Tools

## Project Context

Omnivore is an open-source read-it-later application targeting power users (researchers, students) and casual readers. We need to recalibrate the current implementation to match the original design intent documented in our design system.

## Core Design Philosophy

**"Structured for Power, Simple by Default"**

- Information-dense for power users, yet elegant and simple for newcomers
- Performance, accessibility (WCAG 2.1 AA), and responsiveness as primary goals
- Content-first philosophy - saved articles are the star of the show

## Current Implementation State

### What's Working
- Dark theme foundation (#1a1a1a background, #2a2a2a surface cards)
- Hover-action card pattern on desktop
- Label chips for user-created tags
- Card information hierarchy (metadata → title → source → tags → progress)
- Design tokens file exists at `src/styles/design-tokens.css`

### What Needs Alignment

1. **Inconsistent Spacing**: Not following 4px baseline grid systematically
2. **Visual Emphasis**: Primary actions (opening articles) not distinctly highlighted
3. **Label Confusion**: System labels (flairs) vs user tags not clearly differentiated
4. **Fixed Density**: No toggle for compact/comfortable/spacious views
5. **Touch-Unfriendly**: Hover actions don't work on mobile
6. **Progress Clarity**: Color-only progress bars without percentage/time indicators
7. **State Visibility**: Processing/failed/archived states not obvious

## Design System Foundation

### Design Tokens (Already Defined)

```css
/* COLORS */
--color-brand-yellow: #FFD234;  /* Primary branding, CTAs */
--color-action-blue: #4A9EFF;   /* Links, focus rings */
--color-state-success: #4CAF50;  /* Completed states */
--color-state-warning: #FF9500;  /* Warnings */
--color-state-danger: #8B0000;   /* Errors */

/* TEXT COLORS */
--color-text-primary: #FFFFFF;
--color-text-secondary: #D9D9D9;
--color-text-tertiary: #898989;
--color-text-muted: #666666;

/* BACKGROUNDS */
--color-bg-primary: #1a1a1a;
--color-bg-secondary: #2a2a2a;
--color-bg-tertiary: #252525;
--color-bg-elevated: #333333;

/* TYPOGRAPHY */
--font-primary: 'Inter', sans-serif;
--font-size-heading: 16px;
--font-size-body: 14px;
--font-size-caption: 12px;
--font-size-micro: 11px;
--font-weight-bold: 700;
--font-weight-medium: 500;
--font-weight-regular: 400;

/* SPACING (4px baseline grid) */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;

/* RADIUS */
--radius-sm: 4px;   /* Small buttons */
--radius-md: 5px;   /* Tags/Chips */
--radius-lg: 8px;   /* Cards */
--radius-full: 9999px; /* Pills */

/* TRANSITIONS */
--transition-fast: 200ms ease-in-out;
```

## Key Components to Align

### 1. LibraryCard Component

**Critical Requirements:**

**Density Modes** (must support all three):
- **Compact**: No thumbnails (or tiny), single-line titles, --space-2 padding, 1-line title clamp
- **Comfortable**: Medium thumbnail (150px), 2-line title clamp, --space-3 padding (DEFAULT)
- **Spacious**: Large thumbnail (180px), 2-3 line title clamp, --space-4 padding

**Visual Hierarchy** (in order of importance):
1. **Metadata Row** (top): Small icons + timestamp + reading time (12px, #898989)
2. **Title**: 16px, 700 weight, #FFFFFF, clamped to 1-3 lines depending on density
3. **Author/Source**: 12px, #D9D9D9, secondary info
4. **User Tags**: Colored chips (max 3 visible, "+2 more" if overflow)
5. **Progress Bar**: 4px height, bottom of card, blue→green gradient OR percentage/time text

**States to Design:**
- **Default**: Clean, minimal
- **Hover** (desktop): Slight elevation (2px translateY), reveal action icons, box-shadow
- **Focus** (keyboard): Same as hover + 2px blue outline (--color-action-blue)
- **Selected** (multi-select): Blue border (2px solid), background change to #3A3A3A
- **Processing**: Skeleton/shimmer effect OR spinner overlay
- **Failed**: Red error icon, "Retry" button visible
- **Archived**: Reduced opacity (0.6) OR "Archived" badge
- **Completed (100% read)**: Green checkmark OR full green progress bar

**Actions (Desktop - Hover to Reveal):**
- Icon-only toolbar (read, archive, label, share, delete, overflow menu)
- Semi-transparent dark background overlay
- Placed at bottom or top-right corner of card
- Icons: 16px, light gray, highlighted on hover
- Must include aria-labels for accessibility

**Actions (Mobile - Touch-Friendly):**
- **Swipe left**: Reveal archive + delete actions (destructive)
- **Swipe right**: Favorite or mark as read
- **Long-press**: Enter multi-select mode + select that item
- **Overflow menu (⋯)**: Always visible, shows all actions with text labels
- Touch targets: minimum 44x44pt (iOS), 48x48dp (Android)

**Progress Indicator Options** (choose best UX):
- Option A: Color bar only (blue 0% → green 100%)
- Option B: Bar + percentage text (e.g., "45%")
- Option C: Bar + time remaining (e.g., "3 min left")
- Option D: Icon/badge ("In Progress", "✓ Done")

### 2. Label & Tag System

**System Labels (Flairs)** - Icon-only, metadata line:
- Small monochrome icons (⭐ favorite, 📰 newsletter, 📌 pinned)
- 12px size, muted color (#898989)
- Tooltips on hover ("Favorited", "Newsletter")
- Clickable for filtering

**User Tags** - Colored chips with text:
- Pill-shaped (--radius-full)
- Semi-transparent background + solid border (same color)
- 11-12px font, medium weight
- Format: `● Tag Name` OR just colored background
- Colors: red, orange, yellow, green, blue, purple, pink, gray
- Max 3 visible, "+2 more" for overflow
- Clickable for filtering

**Visual Distinction:**
- System = outlined icons OR grey/gold single color
- User = filled color backgrounds with text
- Never mix styles or placement

### 3. Multi-Select Action Bar

**Trigger Methods:**
- Desktop: "Select" button in toolbar OR Shift+Click ranges
- Mobile: Long-press on card OR dedicated select toggle

**Visual Design:**
- **Mobile**: Fixed to bottom, respects safe area insets
- **Desktop**: Top of content grid, below filters
- **Content**: "X items selected" + action buttons (Archive, Tag, Delete)
- **Style**: Dark elevated background (#333333), 48px height
- **Buttons**: Icon + text labels, touch-friendly spacing

**Behavior:**
- Persistent selections (don't clear on navigation unless user exits mode)
- "Exit multi-select" button clearly visible
- Checkboxes appear on all cards when active
- Toast notification after batch action ("Archived 20 articles") with undo option

### 4. Navigation & Layout

**Top App Bar** (48px height):
- Search input (prominent, center or left, expands on focus)
- "+ Add" button (bright blue or yellow, stands out)
- User menu/avatar (right)
- Background: #2a2a2a

**Filters/Actions Bar** (below top bar):
- Filter by label/feed dropdown
- List/Grid view toggle icons ([☰] / [⊞])
- Multi-select toggle
- Sort order ("Date ▼")
- Density toggle (Compact/Comfortable/Spacious)
- Background: #1f1f1f (slightly different from top bar)

**Section Tabs** (horizontal):
- Inbox (unread) | Archive | Favorites | Trash
- Active tab: underline or background highlight
- 40px height

**Responsive Mobile:**
- Collapse to single top bar with hamburger menu
- Search becomes icon → opens overlay
- Filters in slide-out sheet

## Accessibility Requirements (Non-Negotiable)

1. **Keyboard Navigation**: All interactive elements focusable with Tab, operable with Enter/Space
2. **ARIA Labels**: All icon-only buttons must have descriptive aria-label
3. **Focus States**: Visible 2px outline (--color-action-blue) on all focusable elements
4. **Color Contrast**: Minimum 4.5:1 ratio (test all text colors)
5. **Screen Reader Order**: Logical DOM structure (Title → Metadata → Source → Tags)
6. **Touch Targets**: 44x44pt minimum, 8dp spacing between targets
7. **Reduced Motion**: Respect prefers-reduced-motion, disable/reduce animations

## Mobile-Specific Patterns

1. **Swipe Gestures**:
   - Must provide visual hint (peeking icon on first use OR tutorial)
   - Fallback: Long-press for action menu
   - Common pattern: Left swipe = archive/delete, Right swipe = favorite

2. **Always-Visible Primary Action**:
   - Unlike desktop hover, need persistent affordance
   - Options: "Read" button overlay on thumbnail OR clear tap area

3. **Progressive Disclosure**:
   - Hide less critical metadata in compact mobile view
   - Show on tap/expand

## Responsive Breakpoints

```css
/* Mobile: 1 column */
@media (max-width: 640px) {
  grid-template-columns: 1fr;
}

/* Tablet: 2-3 columns */
@media (min-width: 641px) and (max-width: 1024px) {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

/* Desktop: Auto-fill based on density */
@media (min-width: 1025px) {
  /* Compact: More columns, Spacious: Fewer columns */
  grid-template-columns: repeat(auto-fill, minmax(var(--card-min-width), 1fr));
}
```

## Design Deliverables Needed

Please create:

1. **LibraryCard Component Variations**:
   - Desktop: Default, Hover, Focus, Selected states
   - Mobile: Default, Actions revealed (swipe), Long-press
   - Density: Compact, Comfortable, Spacious (all states)
   - Status: Processing (skeleton), Failed, Archived, Completed

2. **Label & Tag Examples**:
   - System labels (icon-only with tooltips)
   - User tags (colored chips, various colors)
   - Mixed display (card with both types)
   - Tag overflow ("+2 more" state)

3. **Multi-Select Mode**:
   - Desktop: Action bar at top, cards with checkboxes
   - Mobile: Action bar at bottom, touch-friendly
   - Selection states and feedback

4. **Navigation Components**:
   - Top app bar (search, add, user menu)
   - Filter/actions bar (density toggle, view switchers, filters)
   - Section tabs (Inbox, Archive, etc.)
   - Mobile responsive (hamburger menu, collapsed)

5. **Progress Indicators**:
   - Various completion percentages (0%, 25%, 50%, 90%, 100%)
   - With/without text labels
   - Different color treatments

6. **Interaction Patterns**:
   - Hover animations (card lift, shadow)
   - Swipe gesture hints (mobile)
   - Loading states (skeletons, spinners)
   - Toast notifications (undo actions)

## Design Constraints

**DO:**
- ✅ Use ONLY colors from the defined design tokens
- ✅ Follow 4px baseline grid for ALL spacing
- ✅ Use Inter font family exclusively
- ✅ Ensure 4.5:1 minimum contrast ratio
- ✅ Design for both light backgrounds (reader) and dark UI
- ✅ Include focus states for all interactive elements
- ✅ Show loading/error states for async operations
- ✅ Design for touch (44pt minimum targets)

**DON'T:**
- ❌ Introduce new colors outside the palette
- ❌ Use arbitrary spacing (must be multiples of 4px)
- ❌ Rely on color alone to convey information
- ❌ Create hover-only interactions without mobile alternatives
- ❌ Design components without considering keyboard navigation
- ❌ Use font sizes smaller than 11px
- ❌ Ignore screen reader experience

## Success Criteria

The design recalibration is successful if:

1. **Density is Flexible**: Users can switch between compact/comfortable/spacious seamlessly
2. **Actions are Discoverable**: New users can find archive/tag/delete without instruction
3. **Labels are Clear**: Obvious difference between system status and user organization
4. **Mobile Works Well**: Touch-friendly, no reliance on hover, swipe gestures intuitive
5. **Progress is Visible**: Easy to tell unread vs in-progress vs completed at a glance
6. **States are Obvious**: Processing/failed/archived items clearly distinguished
7. **Accessible**: Fully keyboard navigable, screen reader friendly, proper contrast
8. **Consistent**: Uses design tokens throughout, no arbitrary values

## Reference Examples (Inspiration)

- **Instapaper**: Clean text-only list (compact density inspiration)
- **Pocket**: Robust tagging system (label/tag patterns)
- **Matter**: Visual card grid (spacious density inspiration)
- **Gmail**: Multi-select with floating action bar (batch operations)
- **iOS Mail**: Swipe-to-archive pattern (mobile actions)

## Questions to Consider in Your Design

1. Should progress be shown as percentage, time remaining, or just color bar?
2. How can we make the density toggle obvious without cluttering the UI?
3. What's the best way to hint at swipe actions on mobile?
4. Should "Read" be a persistent button or just card click area?
5. How do we balance information density with white space?

## Technical Notes for Implementation

- Using React/Vite/TypeScript stack
- CSS-in-JS with Stitches (design tokens as CSS custom properties)
- Components should be modular and reusable
- Support lazy-loading for images (performance)
- Implement virtual scrolling for large libraries (1000+ items)

---

**Current Status**: ARC-016 Phase 1 Complete (Newsletter subscriptions backend/frontend done, awaiting production testing)

**Next Focus**: Design system alignment before Phase 2 deployment

**Timeline**: 3-5 days for design recalibration

**Output Format**: Figma file, high-fidelity mockups, interactive prototype, component specifications
