import type { ReservationProviderParser } from "../parser";
import type { HotelReservation } from "../reservation";
import {
  cleanExtractedValue,
  createBaseReservation,
  firstCapture,
  inferBookingStayDates,
  normalizeClockTime,
  setEvidence,
} from "./shared";

const parserId = "booking-com-hotel-v2";

function propertyNameFromText(text: string): string | null {
  const beforeCheckIn = firstCapture(text, [
    /^([^\n]{3,180}?)\s+CHECK.?IN\s+CHECK.?OUT/im,
  ]);

  if (
    beforeCheckIn &&
    !/booking confirmation|confirmation number|pin code/i.test(beforeCheckIn)
  ) {
    return cleanExtractedValue(
      beforeCheckIn.replace(/^.*Booking Confirmation\s*/i, ""),
    );
  }

  const checkInLine = text
    .split("\n")
    .find((line) => /CHECK.?IN.*CHECK.?OUT/i.test(line));
  const inlineName = cleanExtractedValue(
    checkInLine
      ?.split(/CHECK.?IN/i)[0]
      ?.replace(/^.*Booking Confirmation\s*/i, ""),
  );
  if (inlineName && /[\p{L}]{3}/u.test(inlineName)) return inlineName;

  const beforeAddress = firstCapture(text, [
    /PIN CODE:[^\n]*\n(?:[^\n]*\n){0,5}?([^\n]{3,140})\nAddress:/i,
  ]);
  return beforeAddress && !/CHECK.?IN|CHECK.?OUT/i.test(beforeAddress)
    ? beforeAddress
    : null;
}

function addressFromText(text: string): string | null {
  return firstCapture(text, [
    /\bAddress:\s*([^\n]*?\bSwitzerland)\b/i,
    /\bAddress:\s*([^\n]+)/i,
  ]);
}

function cityFromAddress(address: string | null): string | null {
  if (!address) return null;
  const segments = address.split(",").map((segment) => segment.trim());
  const citySegment = segments.at(-2);
  return cleanExtractedValue(citySegment?.replace(/^\d{4,6}\s+/, ""));
}

function accommodationTypeFromText(text: string): string | null {
  const candidates = text
    .split("\n")
    .map((line) => cleanExtractedValue(line))
    .filter((line): line is string => Boolean(line))
    .filter(
      (line) =>
        /\b(room|apartment|house|cottage|suite|studio|chalet)\b/i.test(line) &&
        !/price|booking|property policies|hotel policies/i.test(line),
    );

  return candidates.find((line) => line.length <= 120) ?? null;
}

function extractTimes(text: string): {
  checkInTime: string | null;
  checkOutTime: string | null;
} {
  const match = /(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})[^\n]*?(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/.exec(
    text.slice(0, 2_000),
  );

  return {
    checkInTime: normalizeClockTime(match?.[1]),
    checkOutTime: normalizeClockTime(match?.[4]),
  };
}

export const genericHotelParser: ReservationProviderParser = {
  id: parserId,
  displayName: "Booking.com Accommodation",
  canParse(classification) {
    return (
      classification.probableType === "hotel" &&
      classification.probableProvider?.id === "booking-com"
    );
  },
  async parse(analysis, classification) {
    const text = analysis.text.sample;
    const base = createBaseReservation(
      "hotel",
      "Booking.com",
      parserId,
      analysis,
      classification,
    );
    const confirmationNumber = firstCapture(text, [
      /CONFIRMATION NUMBER:\s*([A-Z0-9 .-]{6,32})/i,
      /Booking (?:number|reference)[:\s]+([A-Z0-9.-]{6,32})/i,
    ])?.replace(/[ .]/g, "") ?? null;
    const propertyName = propertyNameFromText(text);
    const address = addressFromText(text);
    const city = cityFromAddress(address);
    const country = /\bSwitzerland\b/i.test(address ?? "")
      ? "Switzerland"
      : null;
    const sourceDate = new Date(
      analysis.metadata.pdf.creationDate ??
        analysis.metadata.filesystemModifiedAt,
    );
    const dates = inferBookingStayDates(
      text,
      Number.isNaN(sourceDate.getTime()) ? undefined : sourceDate.getUTCFullYear(),
    );
    const times = extractTimes(text);
    const accommodationType = accommodationTypeFromText(text);
    const guestCountValue = firstCapture(text, [
      /Number of guests:\s*(\d+)\s+adults?/i,
      /\(for\s+(\d+)\s+guests?\)/i,
    ]);
    const guestCount = guestCountValue ? Number(guestCountValue) : null;
    const contact = firstCapture(text, [
      /\bPhone:\s*([^\n]{5,40})/i,
      /property[^\n]{0,30}contact[^\n]*\n([^\n]{5,80})/i,
    ]);
    const evidence = base.evidence;

    setEvidence(evidence, "provider", base.provider, analysis);
    setEvidence(evidence, "confirmationNumber", confirmationNumber, analysis);
    setEvidence(evidence, "hotel.propertyName", propertyName, analysis);
    setEvidence(evidence, "hotel.address", address, analysis);
    setEvidence(evidence, "hotel.city", city, analysis, "inferred");
    setEvidence(evidence, "hotel.country", country, analysis);
    setEvidence(
      evidence,
      "hotel.checkInDate",
      dates.checkInDate,
      analysis,
      dates.inferred ? "inferred" : "structured",
    );
    setEvidence(
      evidence,
      "hotel.checkOutDate",
      dates.checkOutDate,
      analysis,
      dates.inferred ? "inferred" : "structured",
    );
    setEvidence(evidence, "hotel.checkInTime", times.checkInTime, analysis);
    setEvidence(evidence, "hotel.checkOutTime", times.checkOutTime, analysis);
    setEvidence(
      evidence,
      "hotel.accommodationType",
      accommodationType,
      analysis,
    );
    setEvidence(evidence, "hotel.guestCount", guestCount, analysis);
    setEvidence(evidence, "hotel.bookingReference", confirmationNumber, analysis);
    setEvidence(evidence, "hotel.contact", contact, analysis);

    return {
      ...base,
      type: "hotel",
      confirmationNumber,
      travelers: [],
      evidence,
      hotel: {
        propertyName,
        address,
        city,
        country,
        checkInDate: dates.checkInDate,
        checkOutDate: dates.checkOutDate,
        checkInTime: times.checkInTime,
        checkOutTime: times.checkOutTime,
        accommodationType,
        guestCount,
        bookingReference: confirmationNumber,
        contact,
      },
    } satisfies HotelReservation;
  },
};
