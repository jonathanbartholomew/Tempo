import { useState, useEffect, useCallback } from 'react';
import { toDateKey } from '../utils/helpers';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export function useGoogleCalendar(sources) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sourcesKey = (sources || []).map((s) => `${s.id}:${s.accessToken}`).join('|');

  const refresh = useCallback(async () => {
    const validSources = (sources || []).filter((s) => s.accessToken && s.expiresAt > Date.now());
    if (validSources.length === 0) {
      setEvents([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const timeMin = new Date();
      timeMin.setHours(0, 0, 0, 0);
      const timeMax = new Date(timeMin);
      timeMax.setDate(timeMax.getDate() + 14);

      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '50',
      });

      const results = await Promise.all(
        validSources.map(async (source) => {
          const res = await fetch(`${CALENDAR_API}?${params}`, {
            headers: { Authorization: `Bearer ${source.accessToken}` },
          });
          if (!res.ok) return [];
          const data = await res.json();
          return (data.items || []).map((item) => mapEvent(item, source)).filter(Boolean);
        })
      );
      setEvents(results.flat());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcesKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { events, loading, error, refresh };
}

function mapEvent(item, source) {
  if (!item.start) return null;

  const selfAttendee = item.attendees?.find((a) => a.self);
  if (selfAttendee?.responseStatus === 'declined') return null;

  const allDay = !item.start.dateTime;
  const base = {
    id: `g-${source.id}-${item.id}`,
    title: item.summary || '(No title)',
    link: item.htmlLink,
    source: 'google',
    account: source.label,
    accountEmail: source.email,
    accountColor: source.color,
  };

  if (allDay) {
    return { ...base, date: item.start.date, time: null, duration: 0, allDay: true };
  }

  const startDate = new Date(item.start.dateTime);
  const time = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
  let duration = 60;
  if (item.end?.dateTime) {
    const endDate = new Date(item.end.dateTime);
    duration = Math.max(15, Math.round((endDate - startDate) / 60000));
  }

  return { ...base, date: toDateKey(startDate), time, duration, allDay: false };
}
