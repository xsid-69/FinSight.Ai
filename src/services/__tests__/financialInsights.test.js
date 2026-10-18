import {
  merchantLabel,
  transactionMerchantLabel,
  categoryLabel,
  buildFinancialInsights,
} from "../financialInsights";

describe("financialInsights merchant extraction", () => {
  test("extracts clean merchant from SBI WDL/DEP UPI statements", () => {
    expect(
      merchantLabel(
        "WDL TFR UPI/DR/XXXX/Utkarsh /UTKS/s upercard /Paid XXXX AT 00306 AKOLA"
      )
    ).toBe("Utkarsh");

    expect(
      merchantLabel(
        "WDL TFR UPI/DR/XXXX/Bablu ki/YESB/p aytm.s22l/Paid XXXX AT 00306 AKOLA"
      )
    ).toBe("Bablu Kirana");

    expect(
      merchantLabel(
        "DEP TFR UPI/CR/XXXX/KRISH VI/SBIN/ XXXXXX9683/UPI XXXX AT 00306 AKOLA"
      )
    ).toBe("Krish V.");

    expect(
      merchantLabel(
        "DEP TFR UPI/CR/XXXX/OM RAJU /UBIN/ omtaskar7 /UPI XXXX AT 00306 AKOLA"
      )
    ).toBe("Om Raju");

    expect(
      merchantLabel(
        "DEP TFR UPI/CR/XXXX/PRASHIKR/SBIN/XXXXXX0462/Paid XXXX AT 00306 AKOLA"
      )
    ).toBe("Prashik R.");

    expect(
      merchantLabel(
        "WDL TFR UPI/DR/XXXX/New Yada/UTIB/g pay-11261/Paid XXXX AT 00306 AKOLA"
      )
    ).toBe("New Yadav");

    expect(
      merchantLabel(
        "WDL TFR UPI/DR/XXXX/Euronet /UTIB/e urosuperr/Paid XXXX AT 00306 AKOLA"
      )
    ).toBe("Euronet");
  });

  test("extracts clean merchant from standard UPI narratives", () => {
    expect(merchantLabel("UPI/DR/123/ZOMATO, ONLINE")).toBe("Zomato, Online");
    expect(merchantLabel("UPI/ZOMATO@upi/REF370064409283")).toBe("Zomato");
    expect(merchantLabel("UPI-WDL-112233-Zomato")).toBe("Zomato");
    expect(merchantLabel("WDL-UPI-41235123512-Swiggy")).toBe("Swiggy");
  });

  test("transactionMerchantLabel resolves brand display name when matching known brand", () => {
    expect(
      transactionMerchantLabel({
        sanitizedDescription: "WDL TFR UPI/DR/XXXX/Zomato/UTKS/supercard /Paid XXXX",
      })
    ).toBe("Zomato");

    expect(
      transactionMerchantLabel({
        sanitizedDescription: "UPI/DR/123/SWIGGY, ONLINE",
      })
    ).toBe("Swiggy");

    expect(
      transactionMerchantLabel({
        sanitizedDescription: "WDL TFR UPI/DR/XXXX/Utkarsh /UTKS/s upercard /Paid XXXX AT 00306 AKOLA",
      })
    ).toBe("Utkarsh");
  });
});
