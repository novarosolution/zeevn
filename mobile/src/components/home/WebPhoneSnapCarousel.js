import React, { useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useKankregLayout } from "../../theme/kankregBreakpoints";

const GAP = 12;
const PEEK = 36;

/**
 * Phone-web snap carousel — one card in view with a peek of the next, plus dots.
 * `renderItem(item, { width })` must return a card sized to the given width.
 */
export default function WebPhoneSnapCarousel({
  items = [],
  renderItem,
  keyExtractor = (item, i) => item?.key ?? String(i),
  dotColor = "#1F331F",
  dotMuted = "rgba(31,51,31,0.22)",
  style,
}) {
  const { width, pageGutterClamp } = useKankregLayout();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef(null);

  const viewport = Math.min(width, 520);
  const cardWidth = Math.max(240, viewport - pageGutterClamp - PEEK - GAP);
  const step = cardWidth + GAP;

  const onScroll = (e) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / step);
    if (next !== index) setIndex(Math.max(0, Math.min(items.length - 1, next)));
  };

  if (!items.length) return null;

  return (
    <View style={[styles.wrap, style]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={step}
        snapToAlignment="start"
        contentContainerStyle={[
          styles.row,
          { paddingLeft: pageGutterClamp, paddingRight: pageGutterClamp },
        ]}
      >
        {items.map((item, i) => (
          <View key={keyExtractor(item, i)} style={{ width: cardWidth }}>
            {renderItem(item, { width: cardWidth, index: i, active: i === index })}
          </View>
        ))}
      </ScrollView>

      {items.length > 1 ? (
        <View style={styles.dots} accessibilityRole="tablist">
          {items.map((item, i) => (
            <View
              key={`dot-${keyExtractor(item, i)}`}
              style={[
                styles.dot,
                { backgroundColor: i === index ? dotColor : dotMuted },
                i === index && styles.dotOn,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    gap: 14,
  },
  row: {
    flexDirection: "row",
    gap: GAP,
    alignItems: "stretch",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOn: {
    width: 18,
  },
});
