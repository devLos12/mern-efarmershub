import express from "express";
import multer from "multer";
import Tesseract from "tesseract.js";
import sharp from "sharp";
import jsQR from "jsqr";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/validate-receipt", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "No image uploaded." });
    }

    // ── Kunin ang payment method na pinili ng user ───────────────
    const paymentMethod = req.body.paymentMethod?.toLowerCase(); // "gcash" or "maya"

    // ── STEP 1: QR CODE DETECTION ────────────────────────────────
    const { data: pixels, info } = await sharp(file.buffer)
      .resize(500)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const qrCode = jsQR(pixels, info.width, info.height);

    if (qrCode) {
      return res.status(200).json({
        success: true,
        isValid: false,
        detectedApp: null,
        reason: "Invalid. QR code is not accepted — please upload a payment receipt screenshot."
      });
    }

    // ── STEP 2: OCR ──────────────────────────────────────────────
    const pngBuffer = await sharp(file.buffer).png().toBuffer();
    const { data: { text } } = await Tesseract.recognize(pngBuffer, "eng", {
      logger: () => {}
    });

    const normalizedText = text.replace(/\s+/g, " ").trim();

    const hasGCash = /gcash/i.test(normalizedText);
    const hasMaya  = /\bmaya\b|paymaya/i.test(normalizedText);
    const hasBranding = hasGCash || hasMaya;
    const detectedApp = hasGCash ? "GCash" : hasMaya ? "Maya" : null;

    // ── STEP 3: BRANDING CHECK ───────────────────────────────────
    if (!hasBranding) {
      return res.status(200).json({
        success: true,
        isValid: false,
        detectedApp: null,
        reason: "Invalid receipt."
      });
    }

    // ── STEP 4: CROSS-CHECK — tama ba ang payment method? ────────
    if (paymentMethod === "gcash" && !hasGCash) {
      return res.status(200).json({
        success: true,
        isValid: false,
        detectedApp,
        reason: `Invalid. You selected GCash but uploaded a ${detectedApp} receipt.`
      });
    }

    if (paymentMethod === "maya" && !hasMaya) {
      return res.status(200).json({
        success: true,
        isValid: false,
        detectedApp,
        reason: `Invalid. You selected Maya but uploaded a ${detectedApp} receipt.`
      });
    }

    // ── STEP 5: AMOUNT CHECK ─────────────────────────────────────
    // Matches: ₱2,000.00 / P2000.00 / - P2,000.00 / amount sent etc.
    const hasAmount =
      /[₱p]\s?\d[\d,\.]+/i.test(normalizedText) ||
      /total\s?amount|amount\s?sent|sent\s?money/i.test(normalizedText);

    // ── STEP 6: REFERENCE NUMBER CHECK ──────────────────────────
    // GCash: usually "Ref No. 1234567890" — long numeric string
    // Maya:  "Reference ID" followed by alphanumeric (e.g. "21D0 73AA 96DA")
    //        May have spaces between groups, mixed hex-like chars
    const hasRefNo =
      // GCash-style: "Ref No." + 10+ digits
      /ref\.?\s?no\.?\s*\d{10,}/i.test(normalizedText) ||
      // Generic reference keyword + numeric
      /reference\s?no\.?\s*\d+/i.test(normalizedText) ||
      // Maya-style: "Reference ID" keyword present (amount + branding sufficient)
      /reference\s?id/i.test(normalizedText) ||
      // Maya-style alphanumeric ref after keyword (e.g. "21D0 73AA 96DA")
      /reference\s?id[\s:]*([A-Z0-9]{4}\s?){2,}/i.test(normalizedText) ||
      // Fallback: standalone long numeric string (10+ digits)
      /\b\d{10,}\b/.test(normalizedText);

    // ── STEP 7: DATE CHECK ───────────────────────────────────────
    const hasDate =
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{1,2},?\s+\d{4}/i.test(normalizedText) ||
      /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(normalizedText);

    // ── STEP 8: STATUS CHECK (Maya-specific bonus signal) ────────
    // Maya receipts often show "Completed" or "Sent money to"
    const hasCompletedStatus = /completed|sent money to/i.test(normalizedText);

    // ── STEP 9: DETERMINE VALIDITY ───────────────────────────────
    const isValid = hasBranding && hasAmount && hasRefNo;

    // Score: 5 signals total (branding + amount + ref + date + status)
    const score = [hasBranding, hasAmount, hasRefNo, hasDate, hasCompletedStatus].filter(Boolean).length;
    const confidence =
      score >= 4 ? "high" :
      score === 3 ? "medium" : "low";

    return res.status(200).json({
      success: true,
      isValid,
      confidence,
      detectedApp,
      reason: isValid
        ? `Valid ${detectedApp} receipt.`
        : `Invalid ${detectedApp} receipt. Missing ${!hasAmount ? "amount" : ""}${!hasAmount && !hasRefNo ? " and " : ""}${!hasRefNo ? "reference number" : ""}.`
    });

  } catch (error) {
    console.error("Receipt validation error:", error);
    return res.status(500).json({
      success: false,
      isValid: false,
      message: "Validation failed. Please try again."
    });
  }
});

export default router;