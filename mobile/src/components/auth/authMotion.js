import { Platform } from "react-native";
import { contentIn, panelIn, riseIn } from "../../theme/motion";

/**
 * Entrances for Login / Register, which run on web as well as native.
 *
 * Reanimated's web build pins an element that has a custom entering animation (`withInitialValues` — what `riseIn` and
 * `panelIn` use) to its final box with `position: absolute` once the animation ends, which pulls it out of the layout and
 * stacks the form on top of the hero. Web therefore gets the plain fade; native keeps the short rise.
 */
const web = Platform.OS === "web";

/** The form block coming up under the hero. */
export const AUTH_BODY_IN = web ? contentIn : riseIn(0, { distance: 14 });

/** The error banner appearing above the button. */
export const AUTH_PANEL_IN = web ? contentIn : panelIn;
