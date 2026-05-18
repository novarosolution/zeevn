import React from "react";
import { useAuth } from "./AuthContext";
import { ConnectivityProvider } from "./ConnectivityContext";

/** Wires auth getters into the offline replay queue (must sit inside AuthProvider). */
export default function ConnectivityBridge({ children }) {
  const { token, updateStoredUser } = useAuth();
  return (
    <ConnectivityProvider
      getAuth={() => ({
        token,
        updateStoredUser,
      })}
    >
      {children}
    </ConnectivityProvider>
  );
}
