import { useQuery } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import { api } from "@/convex/_generated/api";
import { useLocalization } from "@/localization/LocalizationProvider";
import {
  cancelAllEasyReminders,
  rescheduleEasyReminders,
  type EasyScheduleReminderLabels,
} from "@/lib/notification-scheduler";

// ============================================
// CONTEXT TYPE
// ============================================

type NotificationSyncContextType = {
  triggerSync: () => Promise<void>;
  cancelReminders: () => Promise<void>;
  isSyncing: boolean;
};

const NotificationSyncContext = createContext<NotificationSyncContextType>({
  triggerSync: async () => {},
  cancelReminders: async () => {},
  isSyncing: false,
});

export function useNotificationSync() {
  return useContext(NotificationSyncContext);
}

// ============================================
// PROVIDER COMPONENT
// ============================================

// Minimum time between auto-syncs (5 minutes)
const MIN_SYNC_INTERVAL_MS = 5 * 60 * 1000;

export function NotificationSyncProvider({ children }: { children: ReactNode }) {
  const { t } = useLocalization();
  const lastSyncRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  // Get data needed for scheduling
  const babyProfile = useQuery(api.babyProfiles.getActive);
  const reminderEnabled = useQuery(api.appState.get, { key: "easyScheduleReminderEnabled" });
  const advanceMinutes = useQuery(api.appState.get, { key: "easyScheduleReminderAdvanceMinutes" });

  // Get formula rule if baby has one selected
  const formulaRule = useQuery(
    api.easyFormulaRules.getById,
    babyProfile?.selectedEasyFormulaId
      ? { ruleId: babyProfile.selectedEasyFormulaId, babyId: babyProfile._id }
      : "skip"
  );

  // Create labels for notifications
  const labels: EasyScheduleReminderLabels = {
    eat: t("easySchedule.activityLabels.eat"),
    activity: t("easySchedule.activityLabels.activity"),
    sleep: (napNumber: number) =>
      t("easySchedule.activityLabels.sleep").replace("{{number}}", String(napNumber)),
    yourTime: t("easySchedule.activityLabels.yourTime"),
    reminderTitle: ({ emoji, activity }) =>
      t("easySchedule.reminder.title", { defaultValue: `${emoji} ${activity} time!` }),
    reminderBody: ({ activity, time, advance }) =>
      t("easySchedule.reminder.body", {
        defaultValue: `${activity} starts at ${time} (in ${advance} min)`,
      }),
  };

  // Cancel all reminders
  const cancelReminders = useCallback(async () => {
    console.log("[NotificationSync] Canceling all E.A.S.Y. reminders");
    await cancelAllEasyReminders();
  }, []);

  // Trigger notification sync
  const triggerSync = useCallback(async () => {
    // Prevent concurrent syncs
    if (isSyncingRef.current) {
      console.log("[NotificationSync] Sync already in progress, skipping");
      return;
    }

    // Check if reminders are enabled
    if (reminderEnabled !== "true") {
      console.log("[NotificationSync] Reminders disabled, canceling existing");
      await cancelReminders();
      return;
    }

    // Check if we have all required data
    if (!babyProfile || !formulaRule) {
      console.log("[NotificationSync] Missing baby profile or formula, skipping");
      return;
    }

    const firstWakeTime = babyProfile.firstWakeTime ?? "07:00";
    const advance = parseInt(advanceMinutes ?? "5", 10);

    // Parse phases from formula
    const phases =
      typeof formulaRule.phases === "string"
        ? JSON.parse(formulaRule.phases)
        : formulaRule.phases;

    try {
      isSyncingRef.current = true;
      console.log("[NotificationSync] Starting notification sync");

      const count = await rescheduleEasyReminders(
        babyProfile,
        firstWakeTime,
        advance,
        { ...formulaRule, phases },
        labels
      );

      lastSyncRef.current = Date.now();
      console.log(`[NotificationSync] Scheduled ${count} notifications`);
    } catch (error) {
      console.error("[NotificationSync] Sync failed:", error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [babyProfile, formulaRule, reminderEnabled, advanceMinutes, labels, cancelReminders]);

  // Sync on app focus (with debounce)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        const timeSinceLastSync = Date.now() - lastSyncRef.current;
        if (timeSinceLastSync > MIN_SYNC_INTERVAL_MS) {
          console.log("[NotificationSync] App became active, triggering sync");
          triggerSync();
        } else {
          console.log("[NotificationSync] App became active, but recently synced");
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [triggerSync]);

  // Initial sync when data is loaded
  useEffect(() => {
    if (babyProfile !== undefined && reminderEnabled !== undefined) {
      // Only sync if we haven't synced recently
      const timeSinceLastSync = Date.now() - lastSyncRef.current;
      if (timeSinceLastSync > MIN_SYNC_INTERVAL_MS) {
        triggerSync();
      }
    }
  }, [babyProfile, reminderEnabled, triggerSync]);

  return (
    <NotificationSyncContext.Provider
      value={{
        triggerSync,
        cancelReminders,
        isSyncing: isSyncingRef.current,
      }}
    >
      {children}
    </NotificationSyncContext.Provider>
  );
}
