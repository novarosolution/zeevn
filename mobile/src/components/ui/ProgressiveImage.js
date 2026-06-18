import React, { useEffect, useMemo, useState } from "react";
import { Image } from "expo-image";
import { Platform, StyleSheet, View } from "react-native";
import { HtmlImg, toImageSrc } from "../home/compareWebDom";
import { getPreviewImageUri, PRODUCT_HERO_BLURHASH } from "../../utils/image";
import { ImageLoadPriority, preloadImage } from "../../utils/imageLoadBalancer";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import SkeletonBlock from "./SkeletonBlock";

const PREVIEW_CLASS = "kankreg-progressive-preview";
const FULL_CLASS = "kankreg-progressive-full";

if (Platform.OS === "web") {
  injectWebCssOnce(
    "kankreg-progressive-image",
    `.${PREVIEW_CLASS}{
  position:absolute;inset:0;width:100%;height:100%;
  filter:blur(14px);transform:scale(1.06);transform-origin:center;
  pointer-events:none;
}
.${FULL_CLASS}{
  position:absolute;inset:0;width:100%;height:100%;
  opacity:0;transition:opacity .35s ease;
}
.${FULL_CLASS}.kankreg-progressive-ready{opacity:1;}
@media (prefers-reduced-motion:reduce){
  .${FULL_CLASS}{transition:none!important;}
}`
  );
}

function resolvePriority(priority) {
  if (priority === "high") return ImageLoadPriority.HIGH;
  if (priority === "low") return ImageLoadPriority.LOW;
  return ImageLoadPriority.NORMAL;
}

/**
 * Low-quality preview first, full resolution via load balancer, crossfade when ready.
 * `priority="high"` shows the full image immediately (hero LCP).
 */
export default function ProgressiveImage({
  source,
  previewSource,
  uri,
  alt = "",
  style,
  className,
  contentFit = "cover",
  contentPosition = "center",
  onError,
  priority = "normal",
  recyclingKey,
  rounded = 0,
  showSkeleton = true,
  width = 960,
  quality = "auto:good",
  skipFullLoad = false,
  imageClassName,
  onLoad,
}) {
  const eager = priority === "high";
  const [fullReady, setFullReady] = useState(eager);

  const fullSrc = useMemo(() => {
    if (uri) return toImageSrc(uri, { width, quality });
    if (source != null) return toImageSrc(source, { width, quality });
    return null;
  }, [quality, source, uri, width]);

  const previewSrc = useMemo(() => {
    if (eager) return null;
    if (previewSource != null) {
      return toImageSrc(previewSource, { width: 48, quality: "auto:low" });
    }
    const raw = uri || source;
    if (!raw) return null;
    const fromHelper = getPreviewImageUri(raw);
    if (fromHelper) return fromHelper;
    return toImageSrc(raw, { width: 48, quality: "auto:low" });
  }, [eager, previewSource, source, uri]);

  useEffect(() => {
    setFullReady(eager);
    if (skipFullLoad || !fullSrc || Platform.OS !== "web") return undefined;

    if (eager) {
      preloadImage(fullSrc, ImageLoadPriority.HIGH).catch(() => {});
      return undefined;
    }

    let cancelled = false;
    preloadImage(fullSrc, resolvePriority(priority))
      .then(() => {
        if (!cancelled) setFullReady(true);
      })
      .catch(() => {
        if (!cancelled) onError?.();
      });

    return () => {
      cancelled = true;
    };
  }, [eager, fullSrc, onError, priority, skipFullLoad]);

  if (!fullSrc && !previewSrc) return null;

  const objectFit = contentFit;
  const objectPosition = contentPosition || "center";
  const showFull = fullReady || eager;

  if (Platform.OS === "web") {
    return (
      <View style={[styles.shell, rounded ? { borderRadius: rounded } : null, style]} className={className}>
        {showSkeleton && !previewSrc && !showFull ? (
          <View style={styles.layer} pointerEvents="none">
            <SkeletonBlock width="100%" height="100%" rounded={rounded || 0} />
          </View>
        ) : null}
        {previewSrc && !showFull ? (
          <HtmlImg
            src={previewSrc}
            alt=""
            aria-hidden
            loading="eager"
            decoding="async"
            className={PREVIEW_CLASS}
            style={{ objectFit, objectPosition }}
          />
        ) : null}
        {fullSrc && !skipFullLoad ? (
          <HtmlImg
            src={fullSrc}
            alt={alt}
            loading={eager ? "eager" : priority === "low" ? "lazy" : "lazy"}
            fetchPriority={eager ? "high" : priority === "low" ? "low" : "auto"}
            decoding="async"
            className={[FULL_CLASS, showFull ? "kankreg-progressive-ready" : "", imageClassName]
              .filter(Boolean)
              .join(" ")}
            style={{ objectFit, objectPosition }}
            onLoad={() => {
              setFullReady(true);
              onLoad?.();
            }}
            onError={onError}
          />
        ) : null}
      </View>
    );
  }

  const previewUri = previewSrc || (previewSource ? String(previewSource) : undefined);

  return (
    <View style={[styles.shell, style]}>
      {showSkeleton && !fullReady ? (
        <View style={styles.layer} pointerEvents="none">
          <SkeletonBlock width="100%" height="100%" rounded={rounded || 0} />
        </View>
      ) : null}
      <Image
        source={{ uri: fullSrc || previewUri }}
        style={styles.layer}
        contentFit={contentFit}
        contentPosition={contentPosition}
        placeholder={previewUri ? { uri: previewUri } : { blurhash: PRODUCT_HERO_BLURHASH }}
        placeholderContentFit={contentFit}
        transition={eager ? 0 : 320}
        cachePolicy="memory-disk"
        priority={priority}
        recyclingKey={recyclingKey || fullSrc || previewUri}
        onLoad={() => setFullReady(true)}
        onLoadEnd={() => setFullReady(true)}
        onError={onError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#1a1410",
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
