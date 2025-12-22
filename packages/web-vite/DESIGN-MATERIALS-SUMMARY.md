# Design Materials Summary

## What I Found

Located all design materials in `/Users/tim/Documents/Documents/Lep-Q/Projects/omnivore/packages/web-vite/design/`:

### 1. **Omnivore Design System: Developer Handoff v1.0.pdf** (152.4KB)
   - **Purpose**: Technical specifications for implementing the design system
   - **Key Content**:
     - Complete design tokens (colors, typography, spacing, radius, shadows, transitions)
     - LibraryCard component specifications (props, states, responsive behavior)
     - Label & Tag system details
     - Multi-Select Action Bar implementation
     - Accessibility checklist (WCAG 2.1 AA requirements)

   - **Core Philosophy**: "Structured for Power, Simple by Default"

### 2. **Omnivore Design System Overhaul Proposal.pdf** (332.4KB)
   - **Purpose**: Comprehensive design strategy and rationale
   - **Key Content**:
     - Product context and user personas (knowledge workers, avid readers, casual users)
     - Current design strengths and gaps analysis
     - 6 major design challenges with proposed solutions:
       1. Information Density vs. Readability
       2. Action Discoverability vs. Clutter
       3. Simplifying Label & Tag System
       4. Multi-Selection & Batch Actions
       5. Reading Progress & Completion
       6. Clear Item States (Processing, Error, Archived)
     - Visual hierarchy and style guide
     - Component redesign details
     - User research and validation plan
     - Implementation timeline and deliverables

### 3. **design-tokens.css** (in `/src/styles/`)
   - **Purpose**: Existing CSS implementation of design tokens
   - **Status**: Already implemented and in use
   - **Contains**: Color palette, typography scale, spacing, radius, shadows, transitions

### 4. **product-brief.md** (in `/docs/architecture/`)
   - **Purpose**: High-level product strategy
   - **Content**: Multi-content support vision, premium features, monetization strategy

## How to Use These Materials

### For External Design Tools (Lovable, v0, etc.)

I've created **`LOVABLE-DESIGN-PROMPT.md`** which synthesizes all design materials into a single, actionable prompt. This file:

✅ **Provides complete context** about Omnivore's design philosophy
✅ **Lists all design tokens** with exact values
✅ **Specifies key components** that need alignment (LibraryCard, Labels, Multi-Select, Navigation)
✅ **Defines all required states** (hover, focus, selected, processing, failed, etc.)
✅ **Includes accessibility requirements** (WCAG 2.1 AA)
✅ **Describes mobile patterns** (swipe gestures, touch targets)
✅ **Sets clear constraints** (DO/DON'T lists)
✅ **Defines success criteria** for the recalibration

### Recommended Workflow

1. **Review the Prompt**: Read `LOVABLE-DESIGN-PROMPT.md` to understand the full scope

2. **Feed to Design Tool**: Copy sections of the prompt into Lovable or similar tools:
   ```
   Option A: Full prompt at once (comprehensive but may be too long)
   Option B: Component-by-component (LibraryCard first, then Navigation, etc.)
   Option C: Problem-focused (density modes, then mobile actions, then progress indicators)
   ```

3. **Iterate on Outputs**:
   - Start with LibraryCard component (highest impact)
   - Validate against design tokens
   - Check accessibility requirements
   - Test mobile responsiveness

4. **Reference Source PDFs**: When design tool needs clarification:
   - **Developer Handoff PDF**: For exact specifications and technical details
   - **Overhaul Proposal PDF**: For design rationale and user research context

## Key Design Decisions to Make

The prompt highlights several open questions that need design exploration:

1. **Progress Indicators**: Percentage vs. time remaining vs. color-only bar?
2. **Density Toggle**: How to make it obvious without cluttering UI?
3. **Mobile Swipe Hints**: How to communicate swipe actions to new users?
4. **Primary Action**: Persistent "Read" button or just clickable card area?
5. **Information Balance**: How much density is too much?

## Current Implementation Gaps

Based on the design system analysis, these areas need the most attention:

### High Priority
- ✅ **Density modes**: Compact/Comfortable/Spacious toggle
- ✅ **Mobile touch actions**: Swipe gestures and long-press
- ✅ **Progress clarity**: Add percentage/time to progress bars
- ✅ **State visibility**: Better processing/failed/archived indicators

### Medium Priority
- ⚠️ **Label distinction**: Clearer visual difference between system labels and user tags
- ⚠️ **Multi-select UX**: Easier entry into batch operations
- ⚠️ **Action discoverability**: Make archive/tag/delete more obvious

### Low Priority (Polish)
- 🔧 **Spacing consistency**: Apply 4px grid system everywhere
- 🔧 **Focus states**: Ensure all interactive elements have visible focus
- 🔧 **Animation refinement**: Respect prefers-reduced-motion

## Quick Reference: Design Tokens

```css
/* Core Colors */
Brand Yellow: #FFD234
Action Blue: #4A9EFF
Success Green: #4CAF50
Warning Orange: #FF9500
Danger Red: #8B0000

/* Backgrounds (Dark Theme) */
Primary: #1a1a1a
Secondary: #2a2a2a
Tertiary: #252525
Elevated: #333333

/* Text Colors */
Primary: #FFFFFF
Secondary: #D9D9D9
Tertiary: #898989
Muted: #666666

/* Spacing (4px grid) */
space-1: 4px
space-2: 8px
space-3: 12px
space-4: 16px
space-6: 24px

/* Typography */
Font: Inter
Heading: 16px / 700
Body: 14px / 400-500
Caption: 12px
Micro: 11px
```

## Next Steps

### Immediate (This Session)
1. ✅ **DONE**: Located all design materials
2. ✅ **DONE**: Created comprehensive Lovable prompt
3. **NEXT**: Feed prompt to Lovable or similar design tool

### Short Term (Next 1-2 Days)
1. Generate high-fidelity mockups for LibraryCard component
2. Design mobile interaction patterns (swipe gestures)
3. Create density mode variations (compact/comfortable/spacious)
4. Define progress indicator style

### Medium Term (Next Week)
1. Complete all component mockups
2. Create interactive prototype
3. Validate against accessibility requirements
4. Prepare for implementation handoff

## File Locations

```
omnivore/
├── packages/web-vite/
│   ├── design/
│   │   ├── Omnivore Design System_ Developer Handoff v1.0.pdf
│   │   └── Omnivore Design System Overhaul Proposal.pdf
│   ├── src/styles/
│   │   └── design-tokens.css
│   ├── LOVABLE-DESIGN-PROMPT.md (CREATED)
│   └── DESIGN-MATERIALS-SUMMARY.md (THIS FILE)
└── docs/architecture/
    └── product-brief.md
```

## Design Tool Recommendations

### For Prototyping
- **Lovable**: AI-powered, can interpret natural language prompts
- **v0 by Vercel**: Component-focused, React/Tailwind output
- **Figma**: Manual but full control, industry standard

### For Implementation
- **Storybook**: Component library documentation
- **Chromatic**: Visual regression testing
- **Accessibility Insights**: WCAG compliance testing

## Questions?

If the design tool needs clarification on:
- **Technical specs**: Reference Developer Handoff PDF (page-specific)
- **Design rationale**: Reference Overhaul Proposal PDF (includes user research)
- **Existing code**: Check `design-tokens.css` for current implementation
- **Product vision**: Review `product-brief.md` for strategic context

---

**Status**: ✅ All design materials located and synthesized
**Blocker**: None - ready to feed to external design tools
**Recommendation**: Start with LibraryCard component using Lovable prompt
