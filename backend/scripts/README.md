# Session notes — Prescription OCR feature

## Run backend + frontend

Backend (Docker, from repo root):
```
docker compose up -d mongo backend
```
Backend runs at `http://localhost:5000`. Mongo data persists in the `mongo_data` Docker volume — survives container restarts (`docker compose down` without `-v`), wiped only by `docker compose down -v` or removing the volume directly.

Frontend (from `frontend/`):
```
npm start
```
Runs at `http://localhost:3000` (Vite). Needs `frontend/.env` with:
```
VITE_AYURVEDA_BACKEND_URL=http://localhost:5000
```

## Test accounts (seeded in local Mongo)

| Role    | Email              | Password    |
|---------|--------------------|-------------|
| Patient | patient@test.com   | Test1234!   |
| Doctor  | doctor@test.com    | Test1234!   |

They have an accepted `Booking` between them, so the doctor can see the patient's Medical History tab.

## What was added this session

**Feature: Gemini OCR + doctor review on medical history documents.**
On the doctor's Medical History tab, opening an uploaded document now shows a side-by-side panel: image/PDF on the left, an "AI Transcription" panel on the right. Doctor clicks "Run OCR" (on-demand, not automatic on upload) to get a Gemini transcription, then can edit a corrected version and set a 0–100 correctness score, saved as a review.

Backend:
- `backend/models/Patient.js` — `medicalHistory` subdocs gained `ocr` (status/text/unclearNotes/model/error/analyzedAt/analyzedBy) and `review` (correctedText/correctnessPercent/reviewerId/reviewedAt) fields.
- `backend/services/prescriptionOcr/` (new) — Gemini call (`@google/genai`, same pattern as the existing doctor-match agent), structured JSON response, same rate-limit/parse-error handling.
- `backend/controllers/patientController.js` — `runMedicalHistoryOcr` and `submitMedicalHistoryReview`, gated to admin or a doctor with an actual booking to that patient.
- `backend/routes/patientRoutes.js` — `POST /:id/medical-history/:docId/ocr`, `POST /:id/medical-history/:docId/review`.
- `backend/config/medicalHistoryStorage.js` (new) — medical-history uploads use Cloudinary when real credentials are set in `.env`; otherwise fall back to local disk (`backend/uploads/medical-history`, served via the existing `/uploads` static route) so the feature works without a Cloudinary account. **Local-disk mode is demo-only — files there don't survive a Render redeploy (ephemeral filesystem). Set real `CLOUDINARY_*` creds before deploying.**

Frontend:
- `frontend/src/components/ui/slider.jsx` (new) — correctness-score slider, built on `@base-ui/react/slider`.
- `frontend/src/components/OcrReviewPanel.jsx` (new) — the Run OCR / transcription / review form.
- `frontend/src/components/DocumentViewerModal.jsx` — now supports a `showOcrPanel` prop that renders the side-by-side layout; off by default, only turned on from the doctor's Medical History tab.
- `frontend/src/screens/Doctors/doctorPrescribe/MedicalHistoryViewer.jsx` — passes `showOcrPanel`, shows a status badge per document (Transcribing… / OCR done — needs review / Reviewed / OCR failed).

Env vars needed in `backend/.env`: `GEMINI_API_KEY` (already set), `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` (still placeholders — local-disk fallback active).

## Demo data already seeded

Test Patient's Medical History has 20 real prescription images (from a public illegible-prescription dataset, copied into `backend/scripts/demo_images/`), all 20 transcribed via OCR, 2 with a doctor review saved — so the doctor's Medical History tab has documents in every state (pending / OCR done / reviewed) to show.

**To redo this (or seed it into another environment, e.g. Render's DB):**
```
node scripts/seed.medicalHistory.js --email patient@test.com --ocrCount 6 --reviewCount 2
```
Uploads every image in `scripts/demo_images/` to that patient's `medicalHistory`, runs OCR on the first `ocrCount` of them, and saves a sample review on the first `reviewCount` of those. Point `MDB` in `.env` at the target database before running. Re-running adds another batch on top (doesn't dedupe) — don't run it twice against the same DB unless you want doubled documents.

## Not done / follow-ups

- `frontend/Dockerfile`, `frontend/.dockerignore`, and the `frontend` service in `docker-compose.yml` were removed — frontend now runs locally via `npm start`, not Docker.
- `backend/pnpm-workspace.yaml` was deleted — it had no `packages:` field, which crash-looped `pnpm start` inside Docker.

## To deploy this on Render

1. **Push to `main`.** `.env` is gitignored — no secrets go with the push, so Render's existing env vars are untouched by default. Nothing else needs undoing.
2. **Set env vars in Render's dashboard** (Render service → Environment):
   - `GEMINI_API_KEY` — required, or OCR returns 503.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — required for uploads to persist. Without real values, the code silently falls back to local disk, which Render wipes on every redeploy/restart (ephemeral filesystem) — uploads would disappear.
3. **The 20 demo documents seeded locally will NOT appear on Render** unless Render's `MDB` points at the same MongoDB as local dev. If it's a separate database (typical), run `node scripts/seed.medicalHistory.js` directly against the deployed backend's DB (point `MDB` at it) to get demo data showing there too.
4. No other migration needed — the new `ocr`/`review` fields are additive on the existing `Patient.medicalHistory` schema, nothing to backfill.
