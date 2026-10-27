import { Text, TextInput } from "react-native";

/**
 * How far the system text size (Settings → Display → Text Size, up to the 3.1× "Larger Accessibility Sizes") may enlarge
 * any text. The app's headers, tabs, chips and buttons have fixed heights; past about this the "4 minutes" greeting, the
 * tab labels and the order strip are clipped to a few letters. Text that sets its own `maxFontSizeMultiplier` keeps it.
 *
 * React 19 no longer reads `defaultProps` on function components, so the default is added to the props `Text` and
 * `TextInput` render with.
 */
export const MAX_FONT_SCALE = 1.35;

function capFontScale(Component) {
  const render = Component?.render;
  if (typeof render !== "function" || render.cappedFontScale) return;
  const capped = function cappedRender(props, ref) {
    return render.call(this, props?.maxFontSizeMultiplier == null ? { ...props, maxFontSizeMultiplier: MAX_FONT_SCALE } : props, ref);
  };
  capped.cappedFontScale = true;
  Component.render = capped;
}

capFontScale(Text);
capFontScale(TextInput);
