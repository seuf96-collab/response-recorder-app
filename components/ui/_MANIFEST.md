# _MANIFEST — /components/ui

shadcn/ui component library built on Radix UI primitives. All components follow the same pattern: Radix primitive + Tailwind styling + `cn()` class merging.

---

## Tier 1 — Canonical (most frequently used)

| File | Purpose |
|------|---------|
| `button.tsx` | Button with variants (default, destructive, outline, secondary, ghost, link) and sizes |
| `card.tsx` | Card container with header, title, description, content, footer slots |
| `dialog.tsx` | Modal dialog with overlay, close button, header/footer/content |
| `input.tsx` | Styled text input |
| `label.tsx` | Form label with required-field error styling |
| `select.tsx` | Dropdown select with Radix — trigger, content, item, separator |
| `form.tsx` | React Hook Form integration with field, label, control, message, description |
| `table.tsx` | Data table with header, body, row, head, cell, caption, footer |
| `tabs.tsx` | Tab navigation with list, trigger, content |
| `toast.tsx` | Toast notification with title, description, action, close |
| `toaster.tsx` | Toast viewport renderer |
| `use-toast.ts` | Toast state management hook (reducer-based) |

## Tier 2 — Domain (load when needed)

| File | Purpose |
|------|---------|
| `accordion.tsx` | Expandable/collapsible content sections |
| `alert.tsx` | Alert banner with variants (default, destructive) |
| `alert-dialog.tsx` | Confirmation dialog with action/cancel buttons |
| `aspect-ratio.tsx` | Fixed aspect ratio container |
| `avatar.tsx` | User avatar with image + fallback |
| `badge.tsx` | Inline badge/tag with variants |
| `breadcrumb.tsx` | Navigation breadcrumb trail |
| `calendar.tsx` | Date picker calendar (react-day-picker) |
| `carousel.tsx` | Image/content carousel (embla-carousel) |
| `checkbox.tsx` | Styled checkbox with indicator |
| `collapsible.tsx` | Collapsible panel |
| `command.tsx` | Command palette / searchable list (cmdk) |
| `context-menu.tsx` | Right-click context menu |
| `date-range-picker.tsx` | Date range picker with calendar popover |
| `drawer.tsx` | Bottom/side drawer (vaul) |
| `dropdown-menu.tsx` | Dropdown menu with items, separators, sub-menus |
| `hover-card.tsx` | Hover-triggered information card |
| `input-otp.tsx` | One-time password input |
| `menubar.tsx` | Application menu bar |
| `navigation-menu.tsx` | Navigation menu with links and indicators |
| `pagination.tsx` | Page navigation controls |
| `popover.tsx` | Click-triggered popover |
| `progress.tsx` | Progress bar |
| `radio-group.tsx` | Radio button group |
| `resizable.tsx` | Resizable panel layout (react-resizable-panels) |
| `scroll-area.tsx` | Custom scrollbar container |
| `separator.tsx` | Visual separator line |
| `sheet.tsx` | Side sheet / slide-over panel |
| `skeleton.tsx` | Loading placeholder skeleton |
| `slider.tsx` | Range slider |
| `sonner.tsx` | Sonner toast alternative |
| `switch.tsx` | Toggle switch |
| `task-card.tsx` | Custom task card component |
| `textarea.tsx` | Multi-line text input |
| `toggle.tsx` | Toggle button |
| `toggle-group.tsx` | Group of toggle buttons |
| `tooltip.tsx` | Hover tooltip |
