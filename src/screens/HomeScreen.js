import React, { useEffect } from "react";
import { Platform } from "react-native";
import HomeScreenBody from "./home/HomeScreenBody";
import useRouteMeta from "../hooks/useRouteMeta";
import { clearHomeHeroPreload, preloadHomeHeroLcp } from "../utils/webHead";

/** Thin orchestrator — layout and data live in HomeScreenBody. */
export default function HomeScreen(props) {
  useRouteMeta("home");

  useEffect(() => {
    if (Platform.OS !== "web") return undefined;
    preloadHomeHeroLcp();
    return () => {
      clearHomeHeroPreload();
    };
  }, []);

  return <HomeScreenBody {...props} />;
}
