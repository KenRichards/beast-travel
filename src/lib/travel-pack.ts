import type { ApprovedReservation } from "@/lib/import/reservation";
import { mergeImportedLogistics } from "@/lib/import/logistics";
import { tripDateKey } from "@/lib/trip-time";
import type { Itinerary } from "@/types/itinerary";
import type { Accommodation, ReservationContact } from "@/types/logistics";

export interface TravelPackConfirmation {
  id: string;
  type: ApprovedReservation["type"];
  provider: string | null;
  confirmationNumber: string | null;
  detailHref: string;
  dateSummary: string;
  locationSummary: string | null;
  contact: string | null;
}

export interface TravelPackFlight {
  reservationId: string;
  airline: string | null;
  flightNumber: string | null;
  route: string;
  departure: string | null;
  arrival: string | null;
  confirmationNumber: string | null;
}

export interface TravelPackRentalCar {
  reservationId: string;
  provider: string | null;
  pickupLocation: string | null;
  pickup: string | null;
  dropoffLocation: string | null;
  dropoff: string | null;
  vehicle: string | null;
  confirmationNumber: string | null;
}

export interface TravelPackAddress {
  id: string;
  label: string;
  address: string;
  mapHref: string;
}

export interface TravelPackContact {
  id: string;
  label: string;
  phone?: string;
  email?: string;
  detail?: string;
  emergency?: boolean;
}

export interface TravelPackReminder {
  title: string;
  status: string;
  detail: string;
}

export interface TravelPack {
  schemaVersion: 1;
  generatedAt: string;
  tripId: string;
  tripTitle: string;
  currentHotel: Accommodation | null;
  confirmations: TravelPackConfirmation[];
  flights: TravelPackFlight[];
  rentalCars: TravelPackRentalCar[];
  contacts: TravelPackContact[];
  addresses: TravelPackAddress[];
  reminders: TravelPackReminder[];
  swissEmergencyNotes: string[];
  approvedReservations: ApprovedReservation[];
}

export const SWISS_EMERGENCY_CONTACTS: readonly TravelPackContact[] = [
  { id: "european-emergency", label: "European emergency", phone: "112", emergency: true },
  { id: "police", label: "Police", phone: "117", emergency: true },
  { id: "fire", label: "Fire brigade", phone: "118", emergency: true },
  { id: "ambulance", label: "Ambulance", phone: "144", emergency: true },
  { id: "poison", label: "Tox Info Suisse", phone: "145", emergency: true },
  {
    id: "rega",
    label: "Rega air rescue",
    phone: "1414",
    detail: "For urgent air rescue within Switzerland",
    emergency: true,
  },
] as const;

function dateRange(start: string | null, end: string | null): string {
  if (start && end) return `${start} – ${end}`;
  return start ?? end ?? "Date not provided";
}

function confirmationFromReservation(
  reservation: ApprovedReservation,
): TravelPackConfirmation {
  if (reservation.type === "hotel") {
    return {
      id: reservation.id,
      type: reservation.type,
      provider: reservation.provider,
      confirmationNumber: reservation.confirmationNumber,
      detailHref: `/reservations/${reservation.id}`,
      dateSummary: dateRange(
        reservation.hotel.checkInDate,
        reservation.hotel.checkOutDate,
      ),
      locationSummary: reservation.hotel.address ?? reservation.hotel.city,
      contact: reservation.hotel.contact,
    };
  }

  if (reservation.type === "rental-car") {
    return {
      id: reservation.id,
      type: reservation.type,
      provider: reservation.rentalCar.rentalProvider ?? reservation.provider,
      confirmationNumber: reservation.confirmationNumber,
      detailHref: `/reservations/${reservation.id}`,
      dateSummary: dateRange(
        reservation.rentalCar.pickupLocalDateTime,
        reservation.rentalCar.dropoffLocalDateTime,
      ),
      locationSummary: reservation.rentalCar.pickupLocation,
      contact: null,
    };
  }

  const first = reservation.flight.segments.at(0);
  const last = reservation.flight.segments.at(-1);
  return {
    id: reservation.id,
    type: reservation.type,
    provider: reservation.flight.airline ?? reservation.provider,
    confirmationNumber: reservation.confirmationNumber,
    detailHref: `/reservations/${reservation.id}`,
    dateSummary: dateRange(
      first?.departureLocalDateTime ?? null,
      last?.arrivalLocalDateTime ?? null,
    ),
    locationSummary: first
      ? [first.departureAirport, first.arrivalAirport].filter(Boolean).join(" → ")
      : null,
    contact: null,
  };
}

function currentOrNextHotel(
  accommodations: Accommodation[],
  date: string,
): Accommodation | null {
  const active = accommodations
    .filter((hotel) => hotel.checkInDate <= date && date < hotel.checkOutDate)
    .sort((left, right) => {
      const confirmed = Number(right.status === "confirmed") - Number(left.status === "confirmed");
      return confirmed || right.checkInDate.localeCompare(left.checkInDate);
    });
  if (active[0]) return active[0];

  return (
    accommodations
      .filter((hotel) => hotel.checkInDate > date)
      .sort((left, right) => left.checkInDate.localeCompare(right.checkInDate))[0] ??
    null
  );
}

function addContact(
  target: TravelPackContact[],
  id: string,
  label: string,
  contact?: ReservationContact,
) {
  if (!contact?.phone && !contact?.email) return;
  target.push({ id, label: contact.name ?? label, phone: contact.phone, email: contact.email });
}

function mapHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function generateTravelPack(
  itinerary: Itinerary,
  approvedReservations: ApprovedReservation[],
  now = new Date(),
): TravelPack {
  const logistics = mergeImportedLogistics(
    itinerary.logistics,
    approvedReservations,
  );
  const actualDate = tripDateKey(now, itinerary.trip.timezone ?? "Europe/Zurich");
  const operationalDate = itinerary.trip.startDate && actualDate < itinerary.trip.startDate
    ? itinerary.trip.startDate
    : actualDate;
  const contacts: TravelPackContact[] = SWISS_EMERGENCY_CONTACTS.map((contact) => ({ ...contact }));

  for (const hotel of logistics.accommodations) {
    addContact(contacts, `${hotel.id}-contact`, hotel.name, hotel.contact);
  }
  for (const reservation of logistics.reservations) {
    addContact(contacts, `${reservation.id}-contact`, reservation.title, reservation.contact);
  }

  const addressMap = new Map<string, TravelPackAddress>();
  for (const hotel of logistics.accommodations) {
    if (!hotel.address) continue;
    addressMap.set(hotel.address, {
      id: hotel.id,
      label: hotel.name,
      address: hotel.address,
      mapHref: mapHref(hotel.address),
    });
  }
  for (const day of itinerary.days) {
    for (const location of day.locations) {
      if (!location.address || addressMap.has(location.address)) continue;
      addressMap.set(location.address, {
        id: `${day.day}-${location.id}`,
        label: location.name,
        address: location.address,
        mapHref: mapHref(location.address),
      });
    }
  }

  const reminders = itinerary.logistics.documents
    .filter((document) => document.type === "passport" || document.type === "insurance")
    .map((document) => ({
      title: document.title,
      status: document.status,
      detail: [document.storageLocation, ...(document.notes ?? [])].filter(Boolean).join(" · "),
    }));

  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    tripId: itinerary.trip.id,
    tripTitle: itinerary.trip.title,
    currentHotel: currentOrNextHotel(logistics.accommodations, operationalDate),
    confirmations: approvedReservations.map(confirmationFromReservation),
    flights: approvedReservations.flatMap((reservation) =>
      reservation.type === "flight"
        ? reservation.flight.segments.map((segment) => ({
            reservationId: reservation.id,
            airline: segment.airline ?? reservation.flight.airline,
            flightNumber: segment.flightNumber,
            route: [segment.departureAirport, segment.arrivalAirport].filter(Boolean).join(" → "),
            departure: segment.departureLocalDateTime,
            arrival: segment.arrivalLocalDateTime,
            confirmationNumber: reservation.confirmationNumber,
          }))
        : [],
    ),
    rentalCars: approvedReservations.flatMap((reservation) =>
      reservation.type === "rental-car"
        ? [{
            reservationId: reservation.id,
            provider: reservation.rentalCar.rentalProvider ?? reservation.provider,
            pickupLocation: reservation.rentalCar.pickupLocation,
            pickup: reservation.rentalCar.pickupLocalDateTime,
            dropoffLocation: reservation.rentalCar.dropoffLocation,
            dropoff: reservation.rentalCar.dropoffLocalDateTime,
            vehicle: reservation.rentalCar.vehicleCategory,
            confirmationNumber: reservation.confirmationNumber,
          }]
        : [],
    ),
    contacts,
    addresses: [...addressMap.values()],
    reminders,
    swissEmergencyNotes: [
      "Use 112 if you are unsure which emergency service you need.",
      "On a mobile phone, call the specific service when possible so location information can be shared.",
      "In mountain terrain, call Rega on 1414 when urgent air rescue is appropriate.",
      ...itinerary.logistics.emergencyNotes,
    ],
    approvedReservations,
  };
}
