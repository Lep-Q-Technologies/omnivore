# Current Card Design Reference

**Date**: December 20, 2024
**Source**: Screenshots from current implementation
**Status**: Keep these designs, update with new functionality

---

## 📸 Current Implementation (Screenshots)

### **Compact View** (Screenshot #1)
```
┌─────────────────────────────────────────────┐
│ ⭐                                          │ ← Star: top-left (current)
│ What Do We Do With AI?                     │
│ Will Douglas Heaven · MIT Technology Review│
│ 2d ago  ⏱️ [reading time icon]              │
│                                             │
│ [Book icon] [Archive] [Tag] [Share] [Delete]│ ← Hover menu (icons only)
│                                             │
│ ● AI    ● E...                             │ ← Tags (purple/blue pills)
│                                             │
│ ████████████░░░░░░░░░░░░░ 45%              │ ← Progress bar (keep design!)
└─────────────────────────────────────────────┘
```

**Design Specs**:
- **Background**: #1a1a1a or #2a2a2a (dark)
- **Border radius**: 8px
- **Padding**: 12px (compact mode)
- **Star icon**: Top-left (MOVE TO TOP-RIGHT per feedback)
- **Progress bar**:
  - Gradient: Blue (#4A9EFF) → Green (#4CAF50)
  - Height: 4px
  - Border radius: 2px
  - Percentage text: 12px, #898989, right-aligned
  - **KEEP THIS DESIGN** ✅
- **Tags**:
  - Purple pill: #8B5CF6 background, white text
  - Border radius: 9999px (full pill)
  - Padding: 4px 12px
  - Font: 11px, medium weight
- **Hover menu**:
  - Icons: Book, Archive, Tag, Share, Delete
  - Size: 20px each
  - Color: #898989, hover: #FFFFFF
  - Spacing: 8px gap

---

### **Comfortable View** (Screenshot #2)
```
┌─────────────────────────────────────────────┐
│                                             │
│  [Large cover image - coffee cup scene]    │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  [Hover menu overlay on image]             │
│  [Book] [Archive] [Tag] [Share] [Delete]   │ ← Hover menu (centered on image)
│                                             │
│  ⭐ 2d ago  ⏱️ 12 min                        │ ← Star: bottom-left (current)
│                                             │
│  What Do We Do With AI?                    │ ← Title (larger)
│  Will Douglas Heaven · MIT Technology Review│
│                                             │
│  ● AI    ● Ethics                          │ ← Tags (visible, not truncated)
│                                             │
│  ████████████░░░░░░░░░░░░░ 45%             │ ← Progress bar (same design)
└─────────────────────────────────────────────┘
```

**Design Specs**:
- **Background**: #2a2a2a
- **Border radius**: 8px
- **Padding**: 16px (more spacious)
- **Cover image**:
  - Height: 200px
  - Border radius: 8px 8px 0 0
  - Object-fit: cover
- **Star icon**: Bottom-left (MOVE TO TOP-RIGHT per feedback)
- **Hover menu**:
  - Appears as overlay on image (centered)
  - Background: rgba(0, 0, 0, 0.6) (semi-transparent)
  - Icons: Same as compact
- **Progress bar**: Same design as compact ✅
- **Tags**: Same design, more visible (not truncated)

---

## 🔄 Changes Needed (Based on Feedback)

### **1. Star Icon Position** ⭐
**Current**:
- Compact: top-left
- Comfortable: bottom-left

**NEW**:
- **All views**: top-right corner
- **Styling**:
  - Default (not starred): ⭐ outline, #666666 (gray)
  - Hover: ⭐ outline, #FFD234 (yellow)
  - Starred: ⭐ filled, #FFD234 (yellow)
  - Always visible (not just on hover)

### **2. Remove Green Checkmark** ❌
**Current**: Green checkmark appears on completed items (100% progress)

**NEW**:
- Remove checkmark completely
- Progress bar at 100% is sufficient indicator
- Text: "100% complete" (green) if needed

### **3. Progress Bar** ✅
**Current design is PERFECT** - keep as-is:
- Gradient: Blue → Green
- Percentage: 45%, 68%, 100%, etc.
- Text placement: Right-aligned

### **4. Hover Menu Updates** 🔧
**Current**: [Book] [Archive] [Tag] [Share] [Delete]

**NEW**: Add more actions:
- [👁️ Read Now] - Opens reader
- [⏰ Read Later] - Add to queue (NEW)
- [⭐ Star/Unstar] - Toggle starred
- [✅ Mark as Read] - Set 100% progress (NEW)
- [🏷️ Edit Tags] - Open tag picker
- [🗑️ Delete] - Move to trash

### **5. Tag Click Behavior** 🏷️
**NEW**:
- Click tag → Navigate to Library page
- Apply filter: selected tag
- URL: `/library?tags=ai`
- Show filtered results

---

## 📐 Design System Reference

### **Colors** (From screenshots):
```css
/* Backgrounds */
--bg-primary: #1a1a1a;
--bg-secondary: #2a2a2a;
--bg-tertiary: #252525;

/* Progress Bar */
--progress-start: #4A9EFF; /* Blue */
--progress-end: #4CAF50;   /* Green */
--progress-bg: #2a2a2a;    /* Track */

/* Star Icon */
--star-default: #666666;   /* Gray outline */
--star-hover: #FFD234;     /* Yellow outline */
--star-active: #FFD234;    /* Yellow filled */

/* Tags */
--tag-purple: #8B5CF6;     /* AI tag */
--tag-blue: #4A9EFF;       /* Other tags */
--tag-text: #FFFFFF;

/* Text */
--text-primary: #FFFFFF;
--text-secondary: #D9D9D9;
--text-tertiary: #898989;
```

### **Typography**:
```css
/* Title */
font-size: 16px;
font-weight: 700;
color: #FFFFFF;
line-height: 1.4;

/* Metadata */
font-size: 12px;
font-weight: 400;
color: #898989;

/* Progress percentage */
font-size: 12px;
color: #898989;
```

### **Spacing** (4px baseline grid):
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
```

---

## 🎯 Implementation Notes

1. **Keep progress bar design exactly as-is** ✅
   - Gradient colors
   - Height (4px)
   - Border radius
   - Percentage text placement

2. **Move star icon to top-right** ⭐
   - All view modes (compact, comfortable, spacious)
   - Always visible
   - Yellow outline/fill on hover/starred

3. **Remove green checkmark** ❌
   - Progress bar at 100% is sufficient

4. **Update hover menu** 🔧
   - Add "Read Later" action
   - Add "Mark as Read" action

5. **Tag click navigation** 🏷️
   - Click tag → filter library
   - Smooth navigation

---

**Reference Screenshots**:
- Image #1: Compact view (current)
- Image #2: Comfortable view (current)

**Next**: Apply these changes to LOVABLE-PROMPT-FINAL-MVP-v2.1.md
