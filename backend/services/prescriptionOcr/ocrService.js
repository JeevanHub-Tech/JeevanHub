/**
 * Gemini-powered OCR extraction for patient-uploaded prescription documents.
 * Runs automatically at upload time (see patientController.uploadMedicalHistory)
 * -- the result is a draft only, shown to the patient for review/correction
 * before anything reaches a doctor. Doctors never see this raw output.
 *
 * Mirrors the Gemini call pattern used by the doctor-match agent
 * (services/doctorMatch/doctorMatchService.js): same SDK, same
 * responseJsonSchema structured-output approach, same error-code contract
 * (NO_KEY/DISABLED/RATE_LIMIT/JSON_PARSE_ERROR) so the controller can reuse
 * one status-mapping helper for both agents.
 */
const { PRESCRIPTION_OCR_ENABLED, PRESCRIPTION_OCR_MODEL } = require('./config');

const SUPPORTED_MIME_TYPES = /^image\/(jpeg|jpg|png)$|^application\/pdf$/;

const OCR_SCHEMA = {
  type: 'object',
  properties: {
    medicines: {
      type: 'array',
      description: 'One entry per medicine/drug listed on the prescription, in the order written.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Drug name exactly as written -- do not correct spelling.' },
          dosage: { type: 'string', description: 'e.g. "500mg". Empty string if not stated.' },
          frequency: { type: 'string', description: 'e.g. "twice daily". Empty string if not stated.' },
          duration: { type: 'string', description: 'e.g. "5 days". Empty string if not stated.' },
          instructions: { type: 'string', description: 'Any other note for this medicine (e.g. "after food"). Empty string if none.' },
        },
        required: ['name', 'dosage', 'frequency', 'duration', 'instructions'],
      },
    },
    doctorName: { type: 'string', description: 'Prescribing doctor\'s name as written. Empty string if not present.' },
    doctorRegistrationNumber: { type: 'string', description: 'Doctor\'s registration/license number if printed. Empty string if not present.' },
    prescriptionDate: { type: 'string', description: 'Date on the document, as written. Empty string if not present.' },
    patientNameOnDocument: { type: 'string', description: 'Patient name as written on the document. Empty string if not present.' },
    rawText: {
      type: 'string',
      description:
        'Verbatim full transcription of all handwritten/printed text, preserving line breaks with \\n, ' +
        'as a fallback for anything not captured by the structured fields above.',
    },
    unclearNotes: {
      type: 'string',
      description:
        'Short plain-language summary of which parts were uncertain or ambiguous and why (e.g. "Dosage ' +
        'on line 3 could be 5mg or 50mg"). Empty string if fully confident.',
    },
    isPrescriptionLike: {
      type: 'boolean',
      description: 'False if the document is clearly not a prescription. Fields should still be best-effort either way.',
    },
  },
  required: ['medicines', 'doctorName', 'doctorRegistrationNumber', 'prescriptionDate', 'patientNameOnDocument', 'rawText', 'unclearNotes', 'isPrescriptionLike'],
};

function buildPrompt() {
  return (
    'You are extracting structured data from a patient-uploaded prescription image/PDF, as a draft ' +
    'that the PATIENT (not a doctor) will review and correct before anyone else sees it. Extract each ' +
    'medicine with its name, dosage, frequency, and duration exactly as written -- drug names, dosages, ' +
    'and numbers verbatim, with no spelling correction and no filling in of missing or assumed values. ' +
    'Leave a field as an empty string if it is not present rather than guessing. Also provide a verbatim ' +
    'full-text transcription in rawText as a fallback, and summarize anything ambiguous or uncertain in ' +
    'unclearNotes.'
  );
}

/**
 * @param {object} args { fileBytesBase64: string, mimeType: string }
 * @returns {Promise<{ text: string, unclearNotes: string, isPrescriptionLike: boolean }>}
 */
async function transcribeDocument({ fileBytesBase64, mimeType }) {
  if (!PRESCRIPTION_OCR_ENABLED) { const e = new Error('Prescription OCR is disabled'); e.code = 'DISABLED'; throw e; }
  if (!SUPPORTED_MIME_TYPES.test(mimeType)) {
    const e = new Error(`Unsupported file type: ${mimeType}`);
    e.code = 'UNSUPPORTED_TYPE';
    throw e;
  }

  const { GoogleGenAI } = require('@google/genai');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { const e = new Error('GEMINI_API_KEY is not set'); e.code = 'NO_KEY'; throw e; }

  const ai = new GoogleGenAI({ apiKey });
  let resp;
  try {
    resp = await ai.models.generateContent({
      model: PRESCRIPTION_OCR_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: buildPrompt() },
            { inlineData: { mimeType, data: fileBytesBase64 } },
          ],
        },
      ],
      config: { responseMimeType: 'application/json', responseJsonSchema: OCR_SCHEMA, temperature: 0.1 },
    });
  } catch (error) {
    if (error.status === 429 || (error.message && (error.message.includes('429') || error.message.includes('quota')))) {
      const e = new Error('Gemini API rate limit exceeded');
      e.code = 'RATE_LIMIT';
      throw e;
    }
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(resp.text);
  } catch (_) {
    try {
      const m = String(resp.text || '').match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    } catch (parseError) {
      parsed = null;
    }
    if (!parsed) {
      const e = new Error('Failed to parse AI response');
      e.code = 'JSON_PARSE_ERROR';
      throw e;
    }
  }

  const medicines = Array.isArray(parsed.medicines)
    ? parsed.medicines.slice(0, 50).map((m) => ({
        name: String(m?.name || '').slice(0, 200),
        dosage: String(m?.dosage || '').slice(0, 100),
        frequency: String(m?.frequency || '').slice(0, 100),
        duration: String(m?.duration || '').slice(0, 100),
        instructions: String(m?.instructions || '').slice(0, 500),
      }))
    : [];

  return {
    medicines,
    doctorName: String(parsed.doctorName || '').slice(0, 200),
    doctorRegistrationNumber: String(parsed.doctorRegistrationNumber || '').slice(0, 100),
    prescriptionDate: String(parsed.prescriptionDate || '').slice(0, 100),
    patientNameOnDocument: String(parsed.patientNameOnDocument || '').slice(0, 200),
    rawText: String(parsed.rawText || '').slice(0, 20000),
    unclearNotes: String(parsed.unclearNotes || '').slice(0, 2000),
    isPrescriptionLike: Boolean(parsed.isPrescriptionLike),
  };
}

module.exports = { transcribeDocument };
