import { useCallback, useEffect, useState } from "react";
import { fetchMyNotifications } from "../../../services/userService";

export default function useNotifications({ isAuthenticated, token, pollMs = 60000 }) {
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setUnreadNotificationCount(0);
      return;
    }
    try {
      const notifications = await fetchMyNotifications(token);
      const unread = (Array.isArray(notifications) ? notifications : []).filter(
        (item) => !item?.isRead && !item?.isArchived
      ).length;
      setUnreadNotificationCount(unread);
    } catch {
      setUnreadNotificationCount(0);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    refresh();
    if (!isAuthenticated || !token) return undefined;
    const timer = setInterval(refresh, pollMs);
    return () => clearInterval(timer);
  }, [isAuthenticated, pollMs, refresh, token]);

  return {
    unreadNotificationCount,
    refresh,
  };
}
