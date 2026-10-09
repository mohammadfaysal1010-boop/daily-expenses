// Asia/Dhaka Timezone & Bangladeshi Taka Currency Utilities

export const TIMEZONE = 'Asia/Dhaka';

export function toBengaliDigits(input: string | number): string {
  const bengaliNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(input).replace(/[0-9]/g, (w) => bengaliNumbers[parseInt(w, 10)]);
}

export function formatBDT(
  amount: number,
  options: { showSymbol?: boolean; bengaliDigits?: boolean; fractionDigits?: number } = {}
): string {
  const { showSymbol = true, bengaliDigits = false, fractionDigits = 0 } = options;
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  
  // Format with standard South Asian or thousand comma separator
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(safeAmount);

  if (bengaliDigits) {
    const bnStr = toBengaliDigits(formattedNumber);
    return showSymbol ? `৳${bnStr}` : bnStr;
  }

  return showSymbol ? `৳${formattedNumber}` : formattedNumber;
}

// Get current date string (YYYY-MM-DD) in Asia/Dhaka
export function getTodayDate(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // en-CA yields YYYY-MM-DD
}

// Get current time (HH:mm) in Asia/Dhaka
export function getCurrentTime(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(now);
}

// Format readable date: "9 October 2026"
export function formatReadableDate(dateString: string): string {
  if (!dateString) return '';
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatReadableMonth(monthKey: string): string {
  // monthKey format: YYYY-MM
  if (!monthKey) return '';
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0));
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getDayName(dateString: string, short = false): string {
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    weekday: short ? 'short' : 'long',
  }).format(date);
}

// Date navigation helpers
export function addDays(dateString: string, days: number): string {
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() + days);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekStartAndEnd(
  anchorDate: string,
  startDayPref: 'monday' | 'sunday' | 'saturday' = 'monday'
): { start: string; end: string; dates: string[] } {
  const [y, m, d] = anchorDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayOfWeek = date.getUTCDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday

  let startOffset = 0;
  if (startDayPref === 'monday') {
    // 0(Sun)->6, 1(Mon)->0, 2(Tue)->1, 3(Wed)->2, 4(Thu)->3, 5(Fri)->4, 6(Sat)->5
    startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  } else if (startDayPref === 'sunday') {
    startOffset = dayOfWeek; // 0(Sun)->0, 1(Mon)->1 ...
  } else if (startDayPref === 'saturday') {
    // 6(Sat)->0, 0(Sun)->1, 1(Mon)->2, 2(Tue)->3, 3(Wed)->4, 4(Thu)->5, 5(Fri)->6
    startOffset = (dayOfWeek + 1) % 7;
  }

  const startDateStr = addDays(anchorDate, -startOffset);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(startDateStr, i));
  }

  return {
    start: startDateStr,
    end: dates[6],
    dates,
  };
}

// Month Week Segments: Splits month chronologically into non-overlapping calendar-week segments
export interface MonthWeekSegment {
  segmentIndex: number; // 1-indexed (Week 1, Week 2, etc.)
  label: string; // e.g. "Week 1 (Oct 1 - Oct 4)"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dates: string[];
}

export function splitMonthIntoCalendarWeeks(
  monthKey: string, // YYYY-MM
  startDayPref: 'monday' | 'sunday' | 'saturday' = 'monday'
): MonthWeekSegment[] {
  const [year, month] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const segments: MonthWeekSegment[] = [];

  let currentSegmentDates: string[] = [];
  let segmentNum = 1;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const fullDateStr = `${year}-${String(month).padStart(2, '0')}-${dayStr}`;
    const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const dayOfWeek = dateObj.getUTCDay();

    // Check if this day triggers the start of a new week segment (except day 1)
    let isWeekStart = false;
    if (day > 1) {
      if (startDayPref === 'monday' && dayOfWeek === 1) isWeekStart = true;
      else if (startDayPref === 'sunday' && dayOfWeek === 0) isWeekStart = true;
      else if (startDayPref === 'saturday' && dayOfWeek === 6) isWeekStart = true;
    }

    if (isWeekStart && currentSegmentDates.length > 0) {
      const sStart = currentSegmentDates[0];
      const sEnd = currentSegmentDates[currentSegmentDates.length - 1];
      const sStartDay = Number(sStart.split('-')[2]);
      const sEndDay = Number(sEnd.split('-')[2]);
      const monthShort = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', month: 'short' }).format(dateObj);

      segments.push({
        segmentIndex: segmentNum,
        label: `Week ${segmentNum} (${monthShort} ${sStartDay} – ${monthShort} ${sEndDay})`,
        startDate: sStart,
        endDate: sEnd,
        dates: [...currentSegmentDates],
      });
      segmentNum++;
      currentSegmentDates = [];
    }

    currentSegmentDates.push(fullDateStr);
  }

  // Push final segment
  if (currentSegmentDates.length > 0) {
    const sStart = currentSegmentDates[0];
    const sEnd = currentSegmentDates[currentSegmentDates.length - 1];
    const sStartDay = Number(sStart.split('-')[2]);
    const sEndDay = Number(sEnd.split('-')[2]);
    const dateObj = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
    const monthShort = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', month: 'short' }).format(dateObj);

    segments.push({
      segmentIndex: segmentNum,
      label: `Week ${segmentNum} (${monthShort} ${sStartDay} – ${monthShort} ${sEndDay})`,
      startDate: sStart,
      endDate: sEnd,
      dates: [...currentSegmentDates],
    });
  }

  return segments;
}

// Generate all dates in a month YYYY-MM
export function getDaysInMonthArray(monthKey: string): string[] {
  const [year, month] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dates: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  return dates;
}
