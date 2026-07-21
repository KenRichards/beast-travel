export const TRIP_TIME_ZONE = "Europe/Zurich";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function formatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
}

function partsInTimeZone(date: Date, timeZone: string): DateTimeParts {
  const values = Object.fromEntries(
    formatter(timeZone)
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function dateKey(parts: Pick<DateTimeParts, "year" | "month" | "day">) {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function timeKey(parts: Pick<DateTimeParts, "hour" | "minute">) {
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function isIsoDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isClockTime(
  value?: string | null,
): value is `${number}:${number}` {
  if (!value) return false;
  const match = TIME_PATTERN.exec(value);
  if (!match) return false;
  return Number(match[1]) < 24 && Number(match[2]) < 60;
}

export function tripDateKey(date: Date, timeZone = TRIP_TIME_ZONE): string {
  return dateKey(partsInTimeZone(date, timeZone));
}

export function tripTimeKey(date: Date, timeZone = TRIP_TIME_ZONE): string {
  return timeKey(partsInTimeZone(date, timeZone));
}

export function tripMinuteOfDay(
  date: Date,
  timeZone = TRIP_TIME_ZONE,
): number {
  const parts = partsInTimeZone(date, timeZone);
  return parts.hour * 60 + parts.minute;
}

export function clockMinute(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function zonedDateTimeToEpoch(
  localDateTime: string,
  timeZone = TRIP_TIME_ZONE,
): number | undefined {
  const match = DATE_TIME_PATTERN.exec(localDateTime);
  if (!match) return undefined;

  const desired: DateTimeParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0),
  };
  if (
    !isIsoDate(localDateTime.slice(0, 10)) ||
    desired.hour > 23 ||
    desired.minute > 59 ||
    desired.second > 59
  ) {
    return undefined;
  }
  const utcGuess = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
    desired.second,
  );

  try {
    let epoch = utcGuess;
    for (let iteration = 0; iteration < 3; iteration += 1) {
      const actual = partsInTimeZone(new Date(epoch), timeZone);
      const representedAsUtc = Date.UTC(
        actual.year,
        actual.month - 1,
        actual.day,
        actual.hour,
        actual.minute,
        actual.second,
      );
      const correction = utcGuess - representedAsUtc;
      epoch += correction;
      if (correction === 0) break;
    }
    return epoch;
  } catch {
    return undefined;
  }
}

export interface ProjectedDateTime {
  date: string;
  time: string;
  epochMs: number;
}

export function projectLocalDateTime(
  localDateTime: string,
  sourceTimeZone: string,
  targetTimeZone = TRIP_TIME_ZONE,
): ProjectedDateTime | undefined {
  const epochMs = zonedDateTimeToEpoch(localDateTime, sourceTimeZone);
  if (epochMs === undefined) return undefined;
  const target = partsInTimeZone(new Date(epochMs), targetTimeZone);
  return { date: dateKey(target), time: timeKey(target), epochMs };
}

export function epochForTripDateTime(
  date: string,
  time: string,
  timeZone = TRIP_TIME_ZONE,
): number | undefined {
  if (!isIsoDate(date) || !isClockTime(time)) return undefined;
  return zonedDateTimeToEpoch(`${date}T${time}`, timeZone);
}

export function formatTripDate(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  },
): string {
  if (!isIsoDate(value)) return value;
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function formatClockTime(value: string): string {
  if (!isClockTime(value)) return value;
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, hour, minute)));
}
