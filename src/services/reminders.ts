import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'daily-reminder';
const REMINDER_HOUR = 21;

/**
 * Schedule (or reschedule) the daily 9pm "log today's spends" notification.
 * Returns false when the user denied notification permission.
 */
export async function enableDailyReminder(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  await disableDailyReminder(); // avoid duplicate schedules
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Receiptly',
      body: "Log today's spends — it takes 5 seconds.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: 0,
      channelId: CHANNEL_ID,
    },
  });
  return true;
}

export async function disableDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
