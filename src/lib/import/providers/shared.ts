import type { AnalyzedDocument } from "../analyzer/types";
import type { DocumentClassification } from "../classifier";
import {
  reservationIdFromFingerprint,
  type EvidenceSource,
  type ExtractionConfidence,
  type FieldEvidence,
  type ReservationBase,
  type ReservationSource,
  type ReservationType,
} from "../reservation";

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const MONTH_PATTERN = Object.keys(MONTHS).join("|");

export interface ExtractedDate {
  date: string;
  index: number;
}

export interface BookingStayDates {
  checkInDate: string | null;
  checkOutDate: string | null;
  inferred: boolean;
}

export function cleanExtractedValue(value: string | undefined): string | null {
  if (!value) return null;

  const cleaned = value
    .replace(/[|©®™]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s:;,.\-–—]+|[\s:;,.\-–—]+$/g, "")
    .trim();

  return cleaned || null;
}

export function firstCapture(
  text: string,
  patterns: readonly RegExp[],
): string | null {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    const value = cleanExtractedValue(match?.[1]);
    if (value) return value;
  }

  return null;
}

export function extractionConfidence(
  method: AnalyzedDocument["text"]["method"],
  strength: "structured" | "inferred" = "structured",
): ExtractionConfidence {
  if (method === "unavailable") return "not-found";
  if (strength === "inferred") return "low";
  return method === "native-text" ? "high" : "medium";
}

export function evidenceFor(
  value: unknown,
  analysis: AnalyzedDocument,
  strength: "structured" | "inferred" = "structured",
): FieldEvidence {
  const found =
    value !== null &&
    value !== undefined &&
    value !== "" &&
    (!Array.isArray(value) || value.length > 0);

  return found
    ? {
        confidence: extractionConfidence(analysis.text.method, strength),
        source: analysis.text.method as EvidenceSource,
      }
    : { confidence: "not-found", source: "not-found" };
}

export function createSource(
  parserId: string,
  analysis: AnalyzedDocument,
  classification: DocumentClassification,
): ReservationSource {
  return {
    filename: analysis.document.filename,
    documentReference: `incoming/${analysis.document.filename}`,
    fingerprint: analysis.metadata.sha256,
    parserId,
    extractionMethod: analysis.text.method,
    classificationConfidence: classification.confidenceScore,
  };
}

export function createBaseReservation(
  type: ReservationType,
  provider: string,
  parserId: string,
  analysis: AnalyzedDocument,
  classification: DocumentClassification,
): ReservationBase {
  const importedAt = new Date().toISOString();

  return {
    schemaVersion: 2,
    id: reservationIdFromFingerprint(analysis.metadata.sha256),
    documentFingerprint: analysis.metadata.sha256,
    type,
    provider,
    confirmationNumber: null,
    status: "pending-review",
    sourceFilename: analysis.document.filename,
    importedAt,
    approvedAt: null,
    createdAt: null,
    modifiedAt: null,
    travelers: [],
    notes: [],
    source: createSource(parserId, analysis, classification),
    evidence: {},
    financial: null,
  };
}

function toIsoDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function extractFullDates(text: string): ExtractedDate[] {
  const matches: ExtractedDate[] = [];
  const patterns = [
    new RegExp(
      `\\b(${MONTH_PATTERN})[.]?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(20\\d{2}|\\d{2})\\b`,
      "gi",
    ),
    new RegExp(
      `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_PATTERN})[.]?,?\\s+(20\\d{2}|\\d{2})\\b`,
      "gi",
    ),
  ];

  for (const [patternIndex, pattern] of patterns.entries()) {
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text))) {
      const monthName = patternIndex === 0 ? match[1] : match[2];
      const day = Number(patternIndex === 0 ? match[2] : match[1]);
      const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
      const date = toIsoDate(year, MONTHS[monthName.toLowerCase()], day);

      if (date && !matches.some((candidate) => candidate.date === date)) {
        matches.push({ date, index: match.index });
      }
    }
  }

  return matches.sort((left, right) => left.index - right.index);
}

export function inferBookingStayDates(
  text: string,
  referenceYear?: number,
): BookingStayDates {
  const checkInIndex = text.search(/CHECK[ -]?IN/i);
  const priceIndex = text.search(/\nPRICE\b/i);
  const header =
    checkInIndex >= 0
      ? text.slice(
          Math.max(0, checkInIndex - 240),
          priceIndex > checkInIndex ? priceIndex : checkInIndex + 1_200,
        )
      : text.slice(0, 1_500);
  const explicit = extractFullDates(header);

  if (explicit.length >= 2) {
    return {
      checkInDate: explicit[0].date,
      checkOutDate: explicit[1].date,
      inferred: false,
    };
  }

  const allFullDates = extractFullDates(text);
  const numericYearMatch = /\b\d{1,2}[/-]\d{1,2}[/-](\d{2,4})\b/.exec(text);
  const compactOcrDate = Array.from(
    header.matchAll(/\b(\d{1,2})\s+[A-Za-z0-9]{3,9}\s+(\d{2,4})\b/g),
  ).find((match) => {
    const day = Number(match[1]);
    return day >= 1 && day <= 31;
  });
  const numericYear = numericYearMatch
    ? Number(
        numericYearMatch[1].length === 2
          ? `20${numericYearMatch[1]}`
          : numericYearMatch[1],
      )
    : Number(
        compactOcrDate?.[2].length === 2
          ? `20${compactOcrDate[2]}`
          : compactOcrDate?.[2],
      );
  const year =
    Number((allFullDates[0]?.date ?? "").slice(0, 4)) ||
    numericYear ||
    referenceYear ||
    0;
  const monthNames = Array.from(
    header.matchAll(new RegExp(`\\b(${MONTH_PATTERN})\\b`, "gi")),
    (match) => match[1].toLowerCase(),
  );
  const repeatedMonth = monthNames.find(
    (month, index, months) => months.indexOf(month) !== index,
  );
  const weekdays = Array.from(
    header.matchAll(
      /\b(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/gi,
    ),
    (match) => match[1].toLowerCase(),
  );
  const countryTail = /Switzerland([^\n]*)/i.exec(header)?.[1] ?? "";
  const dayCandidates = Array.from(countryTail.matchAll(/\b(\d{1,2})\b/g))
    .map((match) => Number(match[1]))
    .filter((day) => day >= 1 && day <= 31);
  const splitCalendarDays = /\b(\d{1,2})\s+(\d)\s+(\d)\s+\d+\s+\d+\b/.exec(
    countryTail,
  );
  const bookingCalendarFields = /\b(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d+)\s+(\d+)\b/.exec(
    countryTail,
  );

  if (referenceYear && repeatedMonth && weekdays.length >= 2 && bookingCalendarFields) {
    const month = MONTHS[repeatedMonth];
    const [, first, second, third, , nightsText] = bookingCalendarFields;
    const nights = Number(nightsText);
    const candidates = [
      [Number(first), Number(second)],
      [Number(first), Number(`${second}${third}`)],
      [Number(`${first}${second}`), Number(third)],
    ];
    const weekdayName = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "UTC",
    });

    for (const [checkInDay, checkOutDay] of candidates) {
      const checkInDate = toIsoDate(referenceYear, month, checkInDay);
      const checkOutDate = toIsoDate(referenceYear, month, checkOutDay);
      if (
        checkInDate &&
        checkOutDate &&
        checkOutDate > checkInDate &&
        Math.round((utcTime(checkOutDate) - utcTime(checkInDate)) / 86_400_000) === nights &&
        weekdayName.format(new Date(`${checkInDate}T12:00:00Z`)).toLowerCase() === weekdays[0] &&
        weekdayName.format(new Date(`${checkOutDate}T12:00:00Z`)).toLowerCase() === weekdays[1]
      ) {
        return { checkInDate, checkOutDate, inferred: true };
      }
    }
  }

  if (
    referenceYear &&
    repeatedMonth &&
    weekdays.length >= 2 &&
    splitCalendarDays
  ) {
    const month = MONTHS[repeatedMonth];
    const checkInDay = Number(splitCalendarDays[1]);
    const checkOutDay = Number(`${splitCalendarDays[2]}${splitCalendarDays[3]}`);
    const weekdayName = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "UTC",
    });

    for (let candidateYear = referenceYear; candidateYear <= referenceYear + 2; candidateYear += 1) {
      const checkInDate = toIsoDate(candidateYear, month, checkInDay);
      const checkOutDate = toIsoDate(candidateYear, month, checkOutDay);
      if (
        checkInDate &&
        checkOutDate &&
        checkOutDate > checkInDate &&
        weekdayName.format(new Date(`${checkInDate}T12:00:00Z`)).toLowerCase() === weekdays[0] &&
        weekdayName.format(new Date(`${checkOutDate}T12:00:00Z`)).toLowerCase() === weekdays[1]
      ) {
        return { checkInDate, checkOutDate, inferred: true };
      }
    }
  }

  // Some image-only Booking.com layouts render dates over decorative calendar
  // graphics. OCR can damage the short month next to the day while still
  // reading the adjacent calendar month and weekday headings. Derive the
  // bounded stay only when all of those neighboring cues are present.
  if (
    year &&
    compactOcrDate &&
    repeatedMonth &&
    weekdays.length >= 2
  ) {
    const checkInDay = Number(compactOcrDate[1]);
    const month = MONTHS[repeatedMonth];
    const checkInDate = toIsoDate(year, month, checkInDay);
    if (checkInDate) {
      const targetCheckoutWeekday = weekdays[1];
      const weekdayName = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "UTC",
      });
      for (let offset = 1; offset <= 7; offset += 1) {
        const checkout = new Date(`${checkInDate}T12:00:00Z`);
        checkout.setUTCDate(checkout.getUTCDate() + offset);
        if (weekdayName.format(checkout).toLowerCase() === targetCheckoutWeekday) {
          return {
            checkInDate,
            checkOutDate: checkout.toISOString().slice(0, 10),
            inferred: true,
          };
        }
      }
    }
  }

  if (!year || monthNames.length === 0 || weekdays.length < 2) {
    return {
      checkInDate: explicit[0]?.date ?? null,
      checkOutDate: null,
      inferred: true,
    };
  }

  const month = MONTHS[monthNames[0]];
  const weekdayName = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
  const matchingDates = weekdays.slice(0, 2).map((weekday) => {
    const matchingDay = dayCandidates.find((day) => {
      const candidate = toIsoDate(year, month, day);
      return (
        candidate !== null &&
        weekdayName
          .format(new Date(`${candidate}T12:00:00Z`))
          .toLowerCase() === weekday
      );
    });

    return matchingDay ? toIsoDate(year, month, matchingDay) : null;
  });

  return {
    checkInDate: matchingDates[0] ?? explicit[0]?.date ?? null,
    checkOutDate: matchingDates[1] ?? explicit[1]?.date ?? null,
    inferred: true,
  };
}

function utcTime(date: string): number {
  return Date.parse(`${date}T12:00:00Z`);
}

export function parseMonthDayYear(value: string): string | null {
  return extractFullDates(value)[0]?.date ?? null;
}

export function combineLocalDateTime(
  date: string | null,
  time: string | null,
): string | null {
  return date && time ? `${date}T${time}` : null;
}

export function normalizeClockTime(value: string | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})(?:\s*([AP])\.?M\.?)?$/i.exec(
    value.trim(),
  );
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (hour > 23 || minute > 59 || (meridiem && (hour < 1 || hour > 12))) {
    return null;
  }
  if (meridiem === "A" && hour === 12) hour = 0;
  if (meridiem === "P" && hour !== 12) hour += 12;

  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

export function setEvidence(
  evidence: Record<string, FieldEvidence>,
  path: string,
  value: unknown,
  analysis: AnalyzedDocument,
  strength: "structured" | "inferred" = "structured",
): void {
  evidence[path] = evidenceFor(value, analysis, strength);
}
