const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n: number) => n.toString().padStart(2, '0');

function parts(d: Date) {
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    dayName: DAY_NAMES[d.getDay()],
    hour: pad(d.getHours()),
    min: pad(d.getMinutes()),
  };
}

export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

// "14:30"
export function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const { hour, min } = parts(new Date(dateStr));
  return `${hour}:${min}`;
}

// "4.17"
export function formatMonthDay(dateStr: string | null): string {
  if (!dateStr) return '';
  const { month, day } = parts(new Date(dateStr));
  return `${month}.${day}`;
}

// "4.17 (Fri) 14:30"
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const { month, day, dayName, hour, min } = parts(new Date(dateStr));
  return `${month}.${day} (${dayName}) ${hour}:${min}`;
}

// "2026.4.17 (Fri) 14:30"
export function formatDateFull(dateStr: string | null): string {
  if (!dateStr) return '';
  const { year, month, day, dayName, hour, min } = parts(new Date(dateStr));
  return `${year}.${month}.${day} (${dayName}) ${hour}:${min}`;
}

// Date object variants (for date pickers)
export function formatPickerDate(date: Date): string {
  const { year, month, day, dayName } = parts(date);
  return `${year}.${month}.${day} (${dayName})`;
}

export function formatPickerTime(date: Date): string {
  const { hour, min } = parts(date);
  return `${hour}:${min}`;
}
