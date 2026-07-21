import { createTextSample, hasAdequateNativeText } from "../analyzer/metadata";
import { TEXT_SAMPLE_MAX_PAGES, type ExtractedTextSample } from "../analyzer/types";
import type { LocalOcrResult } from "./ocr";

export async function resolveExtractedText(
  nativeText: string,
  ocrFallback: () => Promise<LocalOcrResult>,
): Promise<ExtractedTextSample> {
  if (hasAdequateNativeText(nativeText)) {
    return createTextSample(nativeText, undefined, "native-text");
  }

  const ocr = await ocrFallback();
  if (ocr.status === "success") {
    return createTextSample(ocr.text, undefined, "local-ocr");
  }

  return {
    status: "unavailable",
    method: "unavailable",
    failure: ocr.reason,
    sample: "",
    characterCount: 0,
    truncated: false,
    pageLimit: TEXT_SAMPLE_MAX_PAGES,
  };
}
