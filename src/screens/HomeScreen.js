import React from "react";
import HomeScreenBody from "./home/HomeScreenBody";

/** Thin orchestrator — layout and data live in HomeScreenBody. */
export default function HomeScreen(props) {
  return <HomeScreenBody {...props} />;
}
