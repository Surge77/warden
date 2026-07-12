import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'daily-reminder';
const DAILY_IDENTIFIER = 'warden-daily-nudge';
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
    identifier: DAILY_IDENTIFIER,
    content: {
      title: 'Warden',
      body: 'Bought something today? Snap the receipt before it fades.',
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

// Cancel only the daily nudge — item deadline reminders must survive this toggle.
export async function disableDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_IDENTIFIER).catch(() => {});
}
