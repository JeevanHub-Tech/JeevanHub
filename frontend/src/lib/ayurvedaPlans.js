// A single "Generate Plan" action always produces both the diet plan and the
// yoga plan together -- there is no separate yoga-only generate button
// anywhere in the UI. Used by the patient's wellness intake (AyurvedaDashboard)
// and by the doctor's Diet/Yoga review panels alike.
//
// `postJson(url, body)` must POST and resolve with the parsed response body,
// throwing (with a `.message`) on a non-ok response -- callers wrap their own
// fetch/axios client to that shape so this stays HTTP-client-agnostic.
export async function generateBothPlans(postJson, patientId) {
	const body = patientId ? { patientId } : {};
	const [dietResult, yogaResult] = await Promise.allSettled([
		postJson("/api/ayurveda/diet-plan/generate", body),
		postJson("/api/ayurveda/yoga-plan/generate", body),
	]);

	const dietOk = dietResult.status === "fulfilled";
	const yogaOk = yogaResult.status === "fulfilled";

	if (!dietOk && !yogaOk) {
		throw new Error(dietResult.reason?.message || "Failed to generate your plan.");
	}

	return {
		dietOk,
		yogaOk,
		plan: dietOk ? dietResult.value.plan : null,
		yogaPlan: yogaOk ? yogaResult.value.plan : null,
		dietError: !dietOk ? (dietResult.reason?.message || "Diet plan generation failed.") : null,
		yogaError: !yogaOk ? (yogaResult.reason?.message || "Yoga plan generation failed.") : null,
	};
}
