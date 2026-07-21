import assert from "node:assert/strict";
import test from "node:test";

import type { AnalyzedDocument } from "../src/lib/import/analyzer/types";
import {
  classifyDocument,
  mapRecognitionStatus,
} from "../src/lib/import/classifier";

function syntheticAnalysis(
  filename: string,
  text = "",
): AnalyzedDocument {
  return {
    document: {
      filename,
      size: 100,
      lastModified: "2026-01-01T00:00:00.000Z",
      extension: ".pdf",
    },
    metadata: {
      filename,
      extension: ".pdf",
      mimeType: "application/pdf",
      fileSize: 100,
      filesystemModifiedAt: "2026-01-01T00:00:00.000Z",
      sha256: "a".repeat(64),
      pdf: { pageCount: 1 },
    },
    text: {
      status: text ? "extracted" : "image-only",
      sample: text,
      characterCount: text.length,
      truncated: false,
      pageLimit: 10,
    },
  };
}

test("filename evidence classifies all supported reservation types", () => {
  assert.equal(
    classifyDocument(syntheticAnalysis("my_flight.pdf")).probableType,
    "flight",
  );
  assert.equal(
    classifyDocument(syntheticAnalysis("city_hotel.pdf")).probableType,
    "hotel",
  );
  assert.equal(
    classifyDocument(syntheticAnalysis("rental_car.pdf")).probableType,
    "rental-car",
  );
});

test("metadata and bounded text identify a provider without private values", () => {
  const analysis = syntheticAnalysis(
    "reservation.pdf",
    "Booking.comReservation accommodation check-in room guest",
  );
  const classification = classifyDocument(analysis, () => true);

  assert.equal(classification.probableType, "hotel");
  assert.equal(classification.probableProvider?.id, "booking-com");
  assert.equal(classification.recognitionStatus, "recognized-supported");
});

test("unknown filenames and text do not fall back to a reservation type", () => {
  const classification = classifyDocument(
    syntheticAnalysis("scanned_document.pdf"),
  );

  assert.equal(classification.probableType, "unknown");
  assert.equal(classification.confidence, "unknown");
  assert.equal(classification.recognitionStatus, "unknown");
});

test("a recognized provider without parser support is marked unsupported", () => {
  const classification = classifyDocument(
    syntheticAnalysis(
      "hotel.pdf",
      "Expedia accommodation check-in room guest",
    ),
    () => false,
  );

  assert.equal(classification.probableType, "hotel");
  assert.equal(classification.probableProvider?.id, "expedia");
  assert.equal(classification.recognitionStatus, "recognized-unsupported");
});

test("recognition status maps supported, unsupported, and unknown outcomes", () => {
  assert.equal(
    mapRecognitionStatus("flight", true, true),
    "recognized-supported",
  );
  assert.equal(
    mapRecognitionStatus("hotel", true, false),
    "recognized-unsupported",
  );
  assert.equal(mapRecognitionStatus("rental-car", false, true), "unknown");
  assert.equal(mapRecognitionStatus("unknown", true, true), "unknown");
});
