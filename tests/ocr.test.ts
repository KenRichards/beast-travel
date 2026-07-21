import assert from "node:assert/strict";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  OcrProcessError,
  runLocalOcr,
  type OcrProcessRunner,
} from "../src/lib/import/extraction/ocr";
import { resolveExtractedText } from "../src/lib/import/extraction/text";

test("adequate native text bypasses OCR", async () => {
  let ocrCalls = 0;
  const nativeText = "Native reservation content with useful labeled fields. ".repeat(5);
  const result = await resolveExtractedText(nativeText, async () => {
    ocrCalls += 1;
    return { status: "success", text: "unused", truncated: false, pageCount: 1 };
  });

  assert.equal(result.method, "native-text");
  assert.equal(ocrCalls, 0);
});

test("insufficient native text selects local OCR fallback", async () => {
  const result = await resolveExtractedText("", async () => ({
    status: "success",
    text: "OCR reservation content with enough structured text",
    truncated: false,
    pageCount: 1,
  }));

  assert.equal(result.method, "local-ocr");
  assert.equal(result.status, "extracted");
});

test("OCR unavailable and timeout failures remain explicit", async () => {
  for (const reason of ["tool-unavailable", "timeout"] as const) {
    const result = await resolveExtractedText("", async () => ({
      status: "unavailable",
      reason,
    }));
    assert.equal(result.method, "unavailable");
    assert.equal(result.failure, reason);
  }
});

test("OCR uses fingerprint-safe temporary paths, bounds text, and cleans up", async () => {
  const cacheDirectory = await mkdtemp(join(tmpdir(), "bt023-ocr-test-"));
  const seenPaths: string[] = [];
  const runner: OcrProcessRunner = async (request) => {
    if (request.command === "pdftoppm") {
      const outputPrefix = request.args.at(-1);
      assert.ok(outputPrefix);
      seenPaths.push(outputPrefix);
      await writeFile(`${outputPrefix}-1.png`, "synthetic image");
      return { exitCode: 0, stdout: new Uint8Array(), stderr: "" };
    }
    return {
      exitCode: 0,
      stdout: new TextEncoder().encode("  OCR   line one\n\nline two with extra text  "),
      stderr: "",
    };
  };

  try {
    const result = await runLocalOcr(
      new TextEncoder().encode("%PDF-synthetic"),
      "b".repeat(64),
      1,
      { cacheDirectory, processRunner: runner, maximumCharacters: 20 },
    );
    assert.equal(result.status, "success");
    if (result.status === "success") {
      assert.equal(result.text, "OCR line one\n\nline t");
      assert.equal(result.truncated, true);
    }
    assert.match(seenPaths[0], /ocr-b{64}-/);
    assert.deepEqual(await readdir(cacheDirectory), []);
  } finally {
    await rm(cacheDirectory, { recursive: true, force: true });
  }
});

test("OCR process failures clean temporary artifacts", async () => {
  const cacheDirectory = await mkdtemp(join(tmpdir(), "bt023-ocr-failure-"));
  const runner: OcrProcessRunner = async () => {
    throw new OcrProcessError("timeout");
  };

  try {
    const result = await runLocalOcr(
      new TextEncoder().encode("%PDF-synthetic"),
      "c".repeat(64),
      1,
      { cacheDirectory, processRunner: runner },
    );
    assert.deepEqual(result, { status: "unavailable", reason: "timeout" });
    assert.deepEqual(await readdir(cacheDirectory), []);
  } finally {
    await rm(cacheDirectory, { recursive: true, force: true });
  }
});

test("unsafe OCR fingerprints are rejected before creating temporary files", async () => {
  const cacheDirectory = await mkdtemp(join(tmpdir(), "bt023-ocr-path-"));
  try {
    const result = await runLocalOcr(
      new TextEncoder().encode("%PDF-synthetic"),
      "../unsafe",
      1,
      { cacheDirectory },
    );
    assert.deepEqual(result, { status: "unavailable", reason: "failed" });
    assert.deepEqual(await readdir(cacheDirectory), []);
  } finally {
    await rm(cacheDirectory, { recursive: true, force: true });
  }
});
