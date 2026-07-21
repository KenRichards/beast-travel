# Reservation Import Architecture

BT-022 extends the read-only reservation import path at `/travel-inbox` with
server-side PDF analysis. It remains separate from the itinerary reader and
does not save normalized reservations.

## Analysis and import flow

```text
travel-data/incoming PDF
  -> secure filename and file validation
  -> server-only PDF metadata, text sample, and SHA-256 analysis
  -> filename + metadata + bounded-text classifier
  -> recognition-status decision
  -> registered provider parser (when supported)
  -> mock NormalizedReservation
  -> privacy-filtered reservation preview
```

The parser registry invokes document analysis before it selects a provider
parser. Recognized type/provider combinations continue through the existing
mock parser pipeline. A recognized provider with no matching parser produces
an unsupported-provider result, and an unknown type or provider produces an
unknown-document result. Neither outcome throws during normal rendering.

Current generic parsers support the runtime Air Canada flight format and the
Booking.com hotel and rental-car formats. Other evidence-based provider matches
can be classified without being treated as parser support.

## Module boundaries

| Module | Responsibility |
| --- | --- |
| `src/lib/import/documents.ts` | Lists files and validates selected incoming filenames. |
| `src/lib/import/analyzer/analyzer.ts` | Enforces server-only file access, safety limits, and PDF parsing. |
| `src/lib/import/analyzer/fingerprint.ts` | Generates deterministic SHA-256 fingerprints from complete file bytes. |
| `src/lib/import/analyzer/metadata.ts` | Normalizes PDF metadata and bounded extracted text. |
| `src/lib/import/analyzer/types.ts` | Defines internal analysis, public analysis, limit, and safe error contracts. |
| `src/lib/import/classifier.ts` | Scores filename, metadata, and bounded-text evidence and maps recognition status. |
| `src/lib/import/parser.ts` | Runs analysis first, selects a supported provider parser, and returns a result union. |
| `src/lib/import/reservation.ts` | Defines the normalized discriminated reservation model. |
| `src/lib/import/providers/` | Contains independent mock provider implementations and their registry. |

## Security boundaries

- Only a plain, non-hidden filename is accepted. Absolute paths, path
  separators, null bytes, and traversal segments are rejected.
- The resolved candidate must stay within `travel-data/incoming/` and must be a
  regular file. Symbolic links are rejected by discovery and opened with the
  platform no-follow flag.
- The analysis module is marked `server-only`. Browsers receive a deliberately
  limited analysis result, never file bytes, an absolute path, or extracted
  text.
- A selected file must have a `.pdf` extension, the PDF magic signature, and a
  size no greater than 25 MiB before parsing.
- The preview route is read-only. It has no write path to `travel-data` or
  itinerary data.
- Incoming runtime documents remain ignored by Git according to the repository
  [ignore rules](../.gitignore). They are not test fixtures and must never be
  committed.

There is an unavoidable check/open race in normal filesystem code. The
analyzer mitigates it by opening with no-follow semantics and then deriving
size and modification time from the opened file descriptor before reading the
same descriptor.

## Metadata and fingerprint behavior

Every successful analysis returns filename, lowercase extension,
`application/pdf` MIME type, byte size, filesystem modification time, and a
lowercase hexadecimal SHA-256 fingerprint calculated from the complete file
contents. The same bytes always produce the same fingerprint, regardless of
filename or filesystem timestamps.

When present, the analyzer also returns PDF title, author, subject, creator,
producer, creation date, modification date, page count, and PDF version. The
UI abbreviates fingerprints visually while preserving the complete value in
accessible label and title text.

## Bounded text extraction

The analyzer uses `pdf-parse`, a Node-compatible PDF.js-based library, without
OCR or an external service. It requests at most the first 10 pages, collapses
whitespace, and retains at most 12,000 characters. These limits provide useful
classification evidence while bounding the retained sample.

The internal text sample is passed only to the classifier. It is explicitly
removed from the public analysis object and is not rendered or serialized as
preview data. The public result reports only whether text was found, the sample
length, the page limit, and whether character truncation occurred. A valid PDF
with no extractable text is treated as image-only and returns an unknown result
when filename and metadata evidence are insufficient.

## Classification and parser selection

Type scoring uses generic reservation vocabulary found in the filename, PDF
metadata, and bounded text. Provider detection uses named-provider or provider
domain evidence. Signals are category labels rather than copied document
content. Confirmation numbers and private values are never classifier rules.

The classifier returns:

- probable type: `flight`, `hotel`, `rental-car`, or `unknown`;
- probable provider, when evidence exists;
- confidence: `high`, `medium`, `low`, or `unknown`, plus an internal numeric
  score used by the existing mock normalized source record;
- recognition status: `recognized-supported`, `recognized-unsupported`, or
  `unknown`.

Provider order remains the tie-breaker when multiple registered parsers report
support. Adding a provider still requires a stable parser ID, a `canParse`
contract, a `parse` implementation, registration in
`src/lib/import/providers/index.ts`, and generic classifier evidence where
needed.

## Error and privacy behavior

Missing or renamed files, traversal attempts, non-PDF data, oversized files,
malformed PDFs, encrypted PDFs, unreadable files, image-only PDFs, unsupported
providers, and unknown documents produce user-readable outcomes. Browser
messages do not include stack traces, parser internals, absolute paths, or raw
document contents.

The UI intentionally displays available PDF metadata because it is part of the
selected document preview. It does not display extracted text. Provider parsers
still return clearly labeled mock normalized reservation data; full
provider-specific extraction, OCR, persistence, and itinerary updates remain
out of scope.
