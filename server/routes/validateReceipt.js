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

    const hasGCash    = /gcash/i.test(text);
    const hasMaya     = /maya|paymaya/i.test(text);
    const hasBranding = hasGCash || hasMaya;
    const detectedApp = hasGCash ? "GCash" : hasMaya ? "Maya" : null;

    // ── STEP 3: BRANDING CHECK ───────────────────────────────────
    if (!hasBranding) {
      return res.status(200).json({
        success: true,
        isValid: false,
        detectedApp: null,
        reason: "Invalid receipt. No GCash or Maya branding detected."
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

    // ── STEP 5: AMOUNT + REF NO CHECK ───────────────────────────
    const hasAmount = /[₱p]\s?\d+[\.,]\d{2}/i.test(text)
                   || /total amount|amount sent/i.test(text);

    const hasRefNo  = /ref\.?\s?no\.?\s?\d+/i.test(text)
                   || /reference\s?no/i.test(text)
                   || /\b\d{10,}\b/.test(text);

    const hasDate   = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s+\d{4}/i.test(text)
                   || /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text);

    const isValid    = hasBranding && hasAmount && hasRefNo;
    const score      = [hasBranding, hasAmount, hasRefNo, hasDate].filter(Boolean).length;
    const confidence = score === 4 ? "high" : score === 3 ? "medium" : "low";

    return res.status(200).json({
      success: true,
      isValid,
      confidence,
      detectedApp,
      reason: isValid
        ? `Valid ${detectedApp} receipt.`
        : `Invalid ${detectedApp} receipt. Missing amount or reference number.`
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      isValid: false,
      message: "Validation failed. Please try again."
    });
  }
});

export default router;