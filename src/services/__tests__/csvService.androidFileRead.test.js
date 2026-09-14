import { readFileSync } from "fs";
import { join } from "path";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import * as LegacyFileSystem from "expo-file-system/legacy";

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock("expo-file-system", () => ({
  File: jest.fn(),
}));

jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  writeBatch: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({
  auth: {
    currentUser: {
      uid: "android-fixture-user",
      getIdToken: jest.fn().mockResolvedValue("fresh-test-token"),
    },
  },
  db: { id: "test-firestore" },
}));

import { parseCsvStatement, pickCsvFile } from "../csvService";

const FIXTURE_PATH = join(
  __dirname,
  "fixtures",
  "dummy_bank_statement_60_records.csv",
);

beforeEach(() => {
  jest.clearAllMocks();
  LegacyFileSystem.copyAsync.mockResolvedValue(undefined);
  LegacyFileSystem.deleteAsync.mockResolvedValue(undefined);
});

test("copies an Android content URI into app cache, reads it, deletes it, and parses the supplied statement", async () => {
  const uri = "content://com.android.providers.downloads.documents/document/statement-60";
  const csv = readFileSync(FIXTURE_PATH, "utf8");
  const cachedFileText = jest.fn().mockResolvedValue(csv);

  File.mockImplementation((fileUri) => ({
    uri: fileUri,
    text: fileUri.startsWith("file:///cache/finsight-csv-import-")
      ? cachedFileText
      : jest.fn().mockRejectedValue(new Error("Raw content URI should not be the first reader")),
  }));
  LegacyFileSystem.readAsStringAsync.mockRejectedValue(
    new Error("Legacy fallback should not be needed when the cache File reader succeeds"),
  );
  DocumentPicker.getDocumentAsync.mockResolvedValue({
    canceled: false,
    assets: [{
      name: "dummy_bank_statement_60_records.csv",
      uri,
      size: csv.length,
      mimeType: "text/csv",
    }],
  });

  const picked = await pickCsvFile();
  const parsed = parseCsvStatement(picked.text, "android-fixture-user", {
    createdAt: "2026-09-01T00:00:00.000Z",
  });

  expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith(
    expect.objectContaining({ copyToCacheDirectory: false }),
  );
  expect(LegacyFileSystem.copyAsync).toHaveBeenCalledWith({
    from: uri,
    to: expect.stringMatching(
      /^file:\/\/\/cache\/finsight-csv-import-\d+-\d+\.csv$/,
    ),
  });

  const cacheUri = LegacyFileSystem.copyAsync.mock.calls[0][0].to;
  expect(File).toHaveBeenCalledWith(cacheUri);
  expect(cachedFileText).toHaveBeenCalledTimes(1);
  expect(LegacyFileSystem.readAsStringAsync).not.toHaveBeenCalled();
  expect(LegacyFileSystem.deleteAsync).toHaveBeenCalledWith(cacheUri, {
    idempotent: true,
  });
  expect(LegacyFileSystem.copyAsync.mock.invocationCallOrder[0]).toBeLessThan(
    cachedFileText.mock.invocationCallOrder[0],
  );
  expect(cachedFileText.mock.invocationCallOrder[0]).toBeLessThan(
    LegacyFileSystem.deleteAsync.mock.invocationCallOrder[0],
  );

  expect(picked).toMatchObject({
    canceled: false,
    fileName: "dummy_bank_statement_60_records.csv",
    text: csv,
  });
  expect(parsed).toMatchObject({
    importedCount: 60,
    debitCount: 46,
    creditCount: 14,
    skippedCount: 0,
  });
  expect(parsed.transactions).toHaveLength(60);
});
