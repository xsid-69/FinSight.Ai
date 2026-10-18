import {
  isPdfFile,
  isPdfEncrypted,
  extractPdfTextStreams,
  parseBankStatementLines,
  extractStatementWithPassword,
} from "../pdfStatementParser";

describe("pdfStatementParser", () => {
  describe("isPdfFile", () => {
    it("identifies PDF filenames and mime types", () => {
      expect(isPdfFile("statement.pdf")).toBe(true);
      expect(isPdfFile("SBI_Statement_Aug2025.PDF")).toBe(true);
      expect(isPdfFile("file.csv", "application/pdf")).toBe(true);
      expect(isPdfFile("file.csv")).toBe(false);
      expect(isPdfFile("statement.xlsx")).toBe(false);
    });
  });

  describe("isPdfEncrypted", () => {
    it("detects encrypted PDF markers", () => {
      const encryptedPdf = "%PDF-1.4\n5 0 obj\n<< /Filter /Standard /V 2 /R 3 /Encrypt 6 0 R >>\nendobj";
      const plainPdf = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj";

      expect(isPdfEncrypted(encryptedPdf)).toBe(true);
      expect(isPdfEncrypted(plainPdf)).toBe(false);
    });
  });

  describe("extractPdfTextStreams", () => {
    it("extracts text from standard PDF parenthesis text operators", () => {
      const rawPdf = `
        BT
        /F1 12 Tf
        (01/08/2025 Swiggy Food Order 450.00 Dr) Tj
        ET
      `;
      const extracted = extractPdfTextStreams(rawPdf);
      expect(extracted).toContain("01/08/2025 Swiggy Food Order 450.00 Dr");
    });
  });

  describe("parseBankStatementLines", () => {
    it("parses valid transaction lines into structured records", () => {
      const text = `
        STATE BANK OF INDIA
        Statement of Account
        Date        Description                      Debit     Credit    Balance
        15/07/2025  UPI/Swiggy/523412/Payment        350.00              14,500.00
        18/07/2025  SALARY CREDITED FOR JULY                   65,000.00 79,500.00
        20/07/2025  Amazon India Marketplace         1,299.00            78,201.00
      `;

      const parsed = parseBankStatementLines(text, "sbi_statement.pdf");
      expect(parsed.transactions.length).toBe(3);

      expect(parsed.transactions[0]).toMatchObject({
        type: "DEBIT",
        amount: 350,
      });

      expect(parsed.transactions[1]).toMatchObject({
        type: "CREDIT",
        amount: 65000,
      });

      expect(parsed.transactions[2]).toMatchObject({
        type: "DEBIT",
        amount: 1299,
      });
    });
  });

  describe("extractStatementWithPassword", () => {
    it("throws PASSWORD_REQUIRED when attempting to parse encrypted PDF without password", async () => {
      const encryptedPdf = "%PDF-1.4\n<< /Filter /Standard /Encrypt 4 0 R >>\nstream\n(secret)\nendstream";

      await expect(
        extractStatementWithPassword(encryptedPdf, "HDFC_Statement.pdf", "")
      ).rejects.toMatchObject({
        code: "PASSWORD_REQUIRED",
      });
    });

    it("parses text when provided with the correct statement content", async () => {
      const samplePdfText = `
        01/08/2025  Netflix Subscription  499.00 Dr
        05/08/2025  Interest Credit                120.00 Cr
      `;

      const result = await extractStatementWithPassword(
        samplePdfText,
        "statement.pdf",
        "myPassword123"
      );

      expect(result.transactions.length).toBe(2);
      expect(result.transactions[0].amount).toBe(499);
      expect(result.transactions[0].type).toBe("DEBIT");
      expect(result.transactions[1].amount).toBe(120);
      expect(result.transactions[1].type).toBe("CREDIT");
    });
  });
});
