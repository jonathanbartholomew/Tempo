import { useEffect, useRef } from 'react';

function showNotification(meeting) {
  const minutes = Math.max(0, Math.round((new Date(`${meeting.date}T${meeting.time}`) - new Date()) / 60000));
  new Notification(meeting.title, {
    body: `Starting in ${minutes} minute${minutes === 1 ? '' : 's'}`,
  });
}

function fireNotification(meeting) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    showNotification(meeting);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') showNotification(meeting);
    });
  }
}

export function useNotifications(meetings) {
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    function checkReminders() {
      const now = new Date();
      for (const meeting of meetings) {
        if (!meeting.reminder || notifiedRef.current.has(meeting.id)) continue;
        const meetingTime = new Date(`${meeting.date}T${meeting.time}`);
        const reminderTime = new Date(meetingTime.getTime() - meeting.reminderMins * 60000);
        if (now >= reminderTime && now < meetingTime) {
          notifiedRef.current.add(meeting.id);
          fireNotification(meeting);
        }
      }
    }

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [meetings]);
}
