import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  LinearTransition,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { EASE_OUT, motionTiming, panelIn, panelOut, riseIn } from "../../theme/motion";
import { STORE_SUPPORT } from "../../content/storefrontContent";
import { useStoreTheme } from "../../theme/storefront";
import { hapticTap } from "../../utils/haptics";
import PressableScale from "./PressableScale";
import StoreBanner from "./StoreBanner";
import { Bone, ShimmerProvider } from "./StoreSkeleton";
import StoreScreen, { useScreenOrigin } from "./StoreScreen";
import { Card, EmptyState, Group, Rise, SectionLabel } from "./StoreKit";

function when(value) {
  const d = new Date(value || 0);
  if (Number.isNaN(d.getTime()) || !d.getTime()) return "";
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return sameDay ? time : `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time}`;
}

function ContactTile({ icon, title, sub, tone, onPress }) {
  const { c, type } = useStoreTheme();
  const tint = tone === "gold" ? c.goldSoft : c.brandSoft;
  const ink = tone === "gold" ? c.goldText : c.brand;
  return (
    <Card onPress={onPress} style={styles.tile} accessibilityRole="button" accessibilityLabel={`${title}. ${sub}`}>
      <View style={[styles.tileIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={24} color={ink} />
      </View>
      <Text style={type.ui(16, "extrabold", c.ink)} numberOfLines={1}>
        {title}
      </Text>
      <Text style={type.ui(12.5, "medium", c.inkMute)} numberOfLines={1}>
        {sub}
      </Text>
    </Card>
  );
}

function Bubble({ item, index }) {
  const { c, type } = useStoreTheme();
  const mine = item.senderRole !== "admin";
  // Only the first few bubbles stagger; a message sent later must not wait behind a delay.
  const entering = useMemo(() => riseIn(index < 6 ? index : 0, { step: 50 }), [index]);
  return (
    <Animated.View
      entering={entering}
      style={[styles.bubbleRow, mine ? styles.mineRow : styles.theirRow]}
    >
      <View
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: c.brand, borderBottomRightRadius: 6 }
            : { backgroundColor: c.soft, borderBottomLeftRadius: 6 },
        ]}
      >
        <Text style={type.ui(15, "medium", mine ? c.onBrand : c.ink, { lineHeight: 21 })}>{item.message}</Text>
      </View>
      <Text style={[type.ui(11.5, "medium", c.inkMute), styles.stamp]}>
        {mine ? STORE_SUPPORT.you : STORE_SUPPORT.shop} · {when(item.createdAt)}
      </Text>
    </Animated.View>
  );
}

function Composer({ value, onChange, onSend, sending }) {
  const { c, r, type, isDark } = useStoreTheme();
  const [focused, setFocused] = useState(false);
  const ready = value.trim().length > 0 && !sending;
  const colors = isDark ? ["#C9DA8C", "#9DB45B"] : ["#4C7138", "#244424"];
  return (
    <View style={styles.composer}>
      <View
        style={[
          styles.inputBox,
          { backgroundColor: c.cardSoft, borderColor: focused ? c.brand : c.line, borderWidth: focused ? 1.5 : 1, borderRadius: r.xl },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={STORE_SUPPORT.placeholder}
          placeholderTextColor={c.inkMute}
          selectionColor={c.brand}
          multiline
          style={[type.ui(16, "medium", c.ink), styles.input]}
        />
      </View>
      <PressableScale
        onPress={() => {
          if (!ready) return;
          hapticTap();
          onSend();
        }}
        scaleTo={0.9}
        disabled={!ready}
        accessibilityRole="button"
        accessibilityLabel={STORE_SUPPORT.send}
        style={[styles.send, { opacity: ready || sending ? 1 : 0.45 }]}
      >
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {sending ? (
          <ActivityIndicator size="small" color={isDark ? "#18200C" : "#FFFFFF"} />
        ) : (
          <Ionicons name="paper-plane" size={20} color={isDark ? "#18200C" : "#FFFFFF"} style={styles.plane} />
        )}
      </PressableScale>
    </View>
  );
}

function FaqItem({ q, a, open, onToggle }) {
  const { c, type } = useStoreTheme();
  const turn = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    turn.value = withTiming(open ? 1 : 0, { duration: motionTiming.toggle + 20, easing: EASE_OUT });
  }, [open, turn]);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(turn.value, [0, 1], [0, 180])}deg` }] }));
  return (
    <Animated.View layout={LinearTransition.duration(240)}>
      <PressableScale
        onPress={onToggle}
        scaleTo={0.99}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={q}
        style={styles.faq}
      >
        <View style={styles.faqHead}>
          <Text style={[type.ui(15.5, open ? "extrabold" : "semibold", c.ink), styles.faqQ]}>{q}</Text>
          <Animated.View style={chevron}>
            <Ionicons name="chevron-down" size={19} color={open ? c.brand : c.inkMute} />
          </Animated.View>
        </View>
        {open ? (
          <Animated.Text
            entering={panelIn}
            exiting={panelOut}
            style={[type.ui(14.5, "medium", c.inkSoft, { lineHeight: 21 }), styles.faqA]}
          >
            {a}
          </Animated.Text>
        ) : null}
      </PressableScale>
    </Animated.View>
  );
}

function ChatSkeleton() {
  return (
    <ShimmerProvider>
      <View style={styles.skeleton}>
        <Bone width="72%" height={52} radius={20} />
        <Bone width="55%" height={44} radius={20} style={styles.skeletonMine} />
        <Bone width="64%" height={52} radius={20} />
      </View>
    </ShimmerProvider>
  );
}

function SupportBody({ scrollRef, error, onDismissError, toast, loading, thread, message, onMessage, sending, onSend, onEmail, emailLabel, extraContacts = [], faqs = [] }) {
  const { c, type } = useStoreTheme();
  const origin = useScreenOrigin();
  const chatY = useRef(0);
  const [openFaq, setOpenFaq] = useState(-1);
  const messages = thread?.messages || [];
  const status = String(thread?.status || "open");

  return (
    <>
      {error ? <StoreBanner message={error} onClose={onDismissError} /> : null}
      {toast ? <StoreBanner tone="success" message={toast} /> : null}

      <Rise index={0} style={styles.tiles}>
        <ContactTile
          icon="chatbubble-ellipses"
          title={STORE_SUPPORT.chat.title}
          sub={STORE_SUPPORT.chat.sub}
          tone="gold"
          onPress={() => scrollRef.current?.scrollTo?.({ y: Math.max(0, origin + chatY.current - 84), animated: true })}
        />
        <ContactTile icon="mail" title={STORE_SUPPORT.email} sub={emailLabel} tone="brand" onPress={onEmail} />
      </Rise>

      {extraContacts.length ? (
        <Rise index={1} style={styles.tiles}>
          {extraContacts.map((contact) => (
            <ContactTile key={contact.key} icon={contact.icon} title={contact.title} sub={contact.sub} tone={contact.tone === "gold" ? "gold" : "brand"} onPress={contact.onPress} />
          ))}
          {extraContacts.length === 1 ? <View style={styles.tileSpacer} /> : null}
        </Rise>
      ) : null}

      <Rise index={1} onLayout={(e) => (chatY.current = e.nativeEvent.layout.y)}>
        <View style={styles.chatHead}>
          <SectionLabel style={styles.noMargin}>{STORE_SUPPORT.conversation}</SectionLabel>
          {thread ? (
            <View style={[styles.status, { backgroundColor: status === "open" ? c.brandSoft : c.soft }]}>
              <View style={[styles.statusDot, { backgroundColor: status === "open" ? c.brand : c.inkMute }]} />
              <Text style={type.ui(12, "bold", status === "open" ? c.brand : c.inkMute)}>{status[0].toUpperCase() + status.slice(1)}</Text>
            </View>
          ) : null}
        </View>
        <Card padded={false}>
          {loading ? (
            <ChatSkeleton />
          ) : messages.length === 0 ? (
            <EmptyState icon="chatbubbles-outline" title={STORE_SUPPORT.empty.title} body={STORE_SUPPORT.empty.body} />
          ) : (
            <View style={styles.thread}>
              {messages.map((item, index) => (
                <Bubble key={`${index}-${item.createdAt || ""}`} item={item} index={index} />
              ))}
            </View>
          )}
          <View style={[styles.composerWrap, { borderTopColor: c.line }]}>
            <Composer value={message} onChange={onMessage} onSend={onSend} sending={sending} />
          </View>
        </Card>
      </Rise>

      {faqs.length ? (
      <Rise index={2}>
        <SectionLabel>{STORE_SUPPORT.faqTitle}</SectionLabel>
        <Group>
          {faqs.map((item, index) => (
            <FaqItem key={`${item.q}-${index}`} q={item.q} a={item.a} open={openFaq === index} onToggle={() => setOpenFaq(openFaq === index ? -1 : index)} />
          ))}
        </Group>
      </Rise>
      ) : null}
    </>
  );
}

/** Native help centre: contact tiles, the live chat thread with a composer, and an animated FAQ. */
export default function StoreSupport({ navigation, ...body }) {
  const scrollRef = useRef(null);
  return (
    <StoreScreen title={STORE_SUPPORT.title} navigation={navigation} scrollRef={scrollRef}>
      <SupportBody scrollRef={scrollRef} {...body} />
    </StoreScreen>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: "row", gap: 12 },
  tile: { flex: 1, gap: 4 },
  tileSpacer: { flex: 1 },
  tileIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  chatHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  noMargin: { marginBottom: 0 },
  status: { flexDirection: "row", alignItems: "center", gap: 6, height: 26, paddingHorizontal: 10, borderRadius: 13 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  thread: { padding: 16, gap: 14 },
  bubbleRow: { maxWidth: "86%", gap: 4 },
  mineRow: { alignSelf: "flex-end", alignItems: "flex-end" },
  theirRow: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 20 },
  stamp: { paddingHorizontal: 4 },
  composerWrap: { padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  inputBox: { flex: 1, minHeight: 50, maxHeight: 130, justifyContent: "center", paddingHorizontal: 14 },
  input: { paddingVertical: 10, minHeight: 28 },
  send: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  plane: { marginLeft: 2 },
  faq: { paddingHorizontal: 16, paddingVertical: 15 },
  faqHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  faqQ: { flex: 1 },
  faqA: { marginTop: 10, marginRight: 30 },
  skeleton: { padding: 16, gap: 12 },
  skeletonMine: { alignSelf: "flex-end" },
});
