# Reservation Import Architecture

BT-021 introduces a read-only reservation import path at `/travel-inbox`. It
is deliberately separate from the existing itinerary reader and does not save
normalized reservations.

## Phase 1 flow

```text
travel-data/incoming document
  -> filename classifier
  -> registered provider parser
  -> NormalizedReservation
  -> reservation preview
```

The server reads document metadata from `travel-data/incoming/` at request
time. Selecting a document passes its verified filename and metadata into the
pipeline. Phase 1 uses filenames for classification and provider parsers return
clearly labeled mock values; PDF content extraction, OCR, AI, persistence, and
itinerary updates remain out of scope.

## Module boundaries

| Module | Responsibility |
| --- | --- |
| `src/lib/import/documents.ts` | Lists files and safely resolves a selected incoming document. |
| `src/lib/import/classifier.ts` | Classifies PDFs as hotel, rental car, or flight reservations. |
| `src/lib/import/parser.ts` | Defines the common parser contract and runs the import pipeline. |
| `src/lib/import/reservation.ts` | Defines the normalized discriminated reservation model. |
| `src/lib/import/providers/` | Contains independent provider implementations and their registry. |

The normalized model shares provider, date, confirmation, traveler, location,
source, and parsed-field data while preserving strongly typed hotel, rental
car, and flight details.

## Adding a provider

1. Add a module under `src/lib/import/providers/` that implements
   `ReservationProviderParser`.
2. Give it a stable ID and implement `canParse` and `parse`.
3. Register the module in `src/lib/import/providers/index.ts`.
4. Add classifier signals or a provider hint only when the new format needs
   them.

Existing provider modules do not need to change. Provider order is the
tie-breaker when more than one parser reports that it can handle a document.

## Safety constraints

- Incoming filenames are rejected when they contain path segments or refer to
  hidden entries.
- Directory entries and symbolic links are not imported as documents.
- Incoming documents remain ignored by Git according to the repository
  [ignore rules](../.gitignore).
- The preview route has no write path to `travel-data` or itinerary data.

See the local-first [Travel Data structure](../travel-data/README.md) for the
directory lifecycle and privacy rules.
