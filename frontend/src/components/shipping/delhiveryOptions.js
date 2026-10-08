export const getDelhiveryOptions = (t) => {
	if (!t) return DELHIVERY_OPTIONS;
	return [
		{
			id: "apiToken",
			title: t("delhiveryOptions.apiToken.title", "API token"),
			tagline: t("delhiveryOptions.apiToken.tagline", "Simplest. One token from your Delhivery dashboard."),
			badge: t("delhiveryOptions.apiToken.badge", "Recommended"),
			helpTitle: t("delhiveryOptions.apiToken.helpTitle", "How to get your Delhivery API token"),
			helpSteps: t("delhiveryOptions.apiToken.helpSteps", {
				returnObjects: true,
				defaultValue: [
					"Sign in to Delhivery One (one.delhivery.com) with the account that books your shipments.",
					"Open the profile menu at the top right and go to Settings → API Setup. On some plans this sits under Integrations → API.",
					"Find the API Token section and click Generate (or Show) for the Production token.",
					"Copy the long alphanumeric string. Treat it like a password.",
					"Paste it in the field here and click Connect. JeevanHub encrypts it before saving and never displays it again.",
				]
			}),
			helpNotes: t("delhiveryOptions.apiToken.helpNotes", {
				returnObjects: true,
				defaultValue: [
					"If you only see a Staging / UAT token, ask your Delhivery account manager to enable production API access — a staging token cannot track real shipments.",
					"If you ever regenerate the token in Delhivery, come back and connect again, otherwise tracking will start failing.",
				]
			}),
		},
		{
			id: "oauth2",
			title: t("delhiveryOptions.oauth2.title", "OAuth2 / MCP client credentials"),
			tagline: t("delhiveryOptions.oauth2.tagline", "For accounts issued a client ID and secret instead of a token."),
			helpTitle: t("delhiveryOptions.oauth2.helpTitle", "How to get your OAuth2 (MCP) credentials"),
			helpSteps: t("delhiveryOptions.oauth2.helpSteps", {
				returnObjects: true,
				defaultValue: [
					"Sign in to Delhivery One and go to Settings → Developer. Delhivery also labels this MCP or API client credentials depending on your plan.",
					"Click Create client (or Generate credentials).",
					"Delhivery shows a JSON block containing D1_CLIENT_ID, D1_CLIENT_SECRET, D1_AUTH_URL and D1_REALM.",
					"Copy the whole JSON block — the client secret is shown only once.",
					"Paste it into the box here and click Fill fields, or type the four values in manually.",
					"Click Connect. JeevanHub exchanges these for a short-lived access token whenever it checks your shipments, and stores the secret encrypted.",
				]
			}),
			helpNotes: t("delhiveryOptions.oauth2.helpNotes", {
				returnObjects: true,
				defaultValue: [
					"D1_AUTH_URL must be a full https:// URL — that is the endpoint we call to get the access token.",
					"If your account manager set this up for you, ask them for the same JSON block rather than re-generating it (regenerating invalidates the old secret).",
				]
			}),
		},
		{
			id: "webhook",
			title: t("delhiveryOptions.webhook.title", "Webhook push"),
			tagline: t("delhiveryOptions.webhook.tagline", "Delhivery pushes each scan to us. No token to share."),
			helpTitle: t("delhiveryOptions.webhook.helpTitle", "How to register the JeevanHub webhook in Delhivery"),
			helpSteps: t("delhiveryOptions.webhook.helpSteps", {
				returnObjects: true,
				defaultValue: [
					"Click Generate webhook details here. JeevanHub creates a URL and a secret unique to your store, and shows them once.",
					"Copy both values before closing this dialog. The secret cannot be shown again — you can always generate a fresh one, which replaces the old.",
					"Sign in to Delhivery One and go to Settings → Webhooks. If you do not see it, email your Delhivery account manager and ask them to register a shipment status push (also called an NSL webhook) for your account.",
					"Add a new webhook with Method POST, Content-Type application/json, and the URL you copied.",
					"Add a custom header named X-Secret whose value is the secret you copied. Pushes without the exact header are rejected.",
					"Subscribe to all shipment status events — Manifested, In Transit, Out for Delivery, Delivered and RTO.",
					"Save. From then on Delhivery notifies JeevanHub on every scan, so delivery is detected within seconds.",
				]
			}),
			helpNotes: t("delhiveryOptions.webhook.helpNotes", {
				returnObjects: true,
				defaultValue: [
					"With this method JeevanHub holds no Delhivery credentials, so it cannot fetch tracking on demand — the timeline is built only from what Delhivery pushes. Nothing appears until the first scan after you register the webhook.",
					"The URL must be reachable from the public internet. If it shows localhost, you are on a local server: run a tunnel (for example ngrok http 8080) and set BASE_URL in the backend .env to the tunnel URL, then generate again.",
				]
			}),
		},
	];
};

export const DELHIVERY_METHOD_LABELS = {
	apiToken: "API token",
	oauth2: "OAuth2 / MCP",
	webhook: "Webhook push",
};

