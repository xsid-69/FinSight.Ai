import fs from "fs";
import { isExcelEncrypted, fastDecryptExcel } from "../excelDecryptor";
import * as XLSX from "xlsx";

describe("excelDecryptor", () => {
  const filePath = "d:/FinSight-AI/Email_Statement_23092026202314585503.xlsx";
  const password = "51770141204";

  test("detects encrypted Excel files", () => {
    const buffer = fs.readFileSync(filePath);
    expect(isExcelEncrypted(buffer)).toBe(true);
  });

  test("detects unencrypted Excel files as false", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([["A", "B"], [1, 2]]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const unenc = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    expect(isExcelEncrypted(unenc)).toBe(false);
  });

  test("decrypts real user bank statement with correct password in milliseconds", async () => {
    const buffer = fs.readFileSync(filePath);
    const start = Date.now();
    const decrypted = await fastDecryptExcel(buffer, password);
    const duration = Date.now() - start;

    expect(decrypted).toBeTruthy();
    expect(decrypted.length).toBeGreaterThan(1000);
    // Should be blazing fast (< 300ms in Jest, ~30ms in pure JS)
    expect(duration).toBeLessThan(1000);

    const wb = XLSX.read(decrypted, { type: "buffer" });
    expect(wb.SheetNames.length).toBeGreaterThan(0);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    expect(rows.length).toBe(485);
  });

  test("throws 'The password is incorrect' when given wrong password", async () => {
    const buffer = fs.readFileSync(filePath);
    await expect(fastDecryptExcel(buffer, "wrongpassword")).rejects.toThrow(
      "The password is incorrect",
    );
  });
});
