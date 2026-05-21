/**
 * Design system — canonical exports.
 * Prefer: `import { Button, Card } from '@/components/ui';`
 */

export { default as Button } from "./Button";
export { default as IconButton } from "./IconButton";
export { default as Input } from "./Input";
export { default as Select } from "./Select";
export { default as Checkbox } from "./Checkbox";
export { default as Radio } from "./Radio";
export { default as Card } from "./Card";
export { default as Badge } from "./Badge";
export { default as Toast } from "./Toast";
export { default as Modal } from "./Modal";
export { default as Drawer } from "./Drawer";
export { default as Skeleton } from "./Skeleton";
export { default as EmptyState } from "./EmptyState";
export { default as PageHeader } from "./PageHeader";
export { default as Screen } from "./Screen";
export { default as SectionHeader } from "./SectionHeader";
export { default as ProgressRing } from "./ProgressRing";
export { default as Breadcrumb } from "./Breadcrumb";
export { default as Tabs } from "./Tabs";
export { default as Tooltip } from "./Tooltip";
export { default as Pagination } from "./Pagination";
export { default as Rating } from "./Rating";
export { default as AppImage } from "./AppImage";
export { default as Chip } from "./Chip";
export { default as ErrorBanner } from "./ErrorBanner";
export { default as Loader } from "./Loader";
export { default as Switch } from "./Switch";
export { default as StatCard } from "./StatCard";
export { default as StickyBar } from "./StickyBar";
export { default as ConfirmDialog } from "./ConfirmDialog";

/** Web DOM helpers (used internally by Button/Input; exported for edge cases). */
export { WebNativeButton, WebTextLink, WebNativeTextInput, toWebButtonStyle } from "./inputWebHelpers";
export { splitWebButtonLayoutStyle, WEB_BUTTON_SIZES } from "./webButtonLayout";

/** @deprecated Premium* shims — import canonical names above */
export { default as PremiumButton } from "./PremiumButton";
export { default as PremiumInput } from "./PremiumInput";
export { default as PremiumCard } from "./PremiumCard";
export { default as PremiumSectionHeader } from "./PremiumSectionHeader";
export { default as PremiumEmptyState } from "./PremiumEmptyState";
export { default as PremiumErrorBanner } from "./PremiumErrorBanner";
export { default as PremiumChip } from "./PremiumChip";
export { default as PremiumLoader } from "./PremiumLoader";
export { default as PremiumStatCard } from "./PremiumStatCard";
export { default as PremiumStickyBar } from "./PremiumStickyBar";
export { default as PremiumSwitch } from "./PremiumSwitch";
export { default as PremiumConfirmDialog } from "./PremiumConfirmDialog";

/** Legacy blocks (not yet migrated to canonical names) */
export { default as SkeletonBlock } from "./SkeletonBlock";
export { default as PriceTag } from "./PriceTag";
export { default as GoldHairline } from "./GoldHairline";
export { default as CollapsibleSection } from "./CollapsibleSection";
export { default as InteractiveListRow } from "./InteractiveListRow";
export { default as ProductImage } from "./ProductImage";
export { default as FormAlert } from "./FormAlert";
