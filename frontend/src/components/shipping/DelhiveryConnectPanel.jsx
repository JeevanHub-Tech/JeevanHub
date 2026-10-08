import { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { AlertCircle, Check, CheckCircle2, ChevronDown, Copy, HelpCircle, KeyRound, Link2, Webhook } from "lucide-react";

import { BACKEND_URL } from "../../config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getDelhiveryOptions, DELHIVERY_METHOD_LABELS } from "./delhiveryOptions";

const OPTION_ICONS = {
	apiToken: KeyRound,
	oauth2: Link2,
	webhook: Webhook,
};

const EMPTY_OAUTH = { clientId: "", clientSecret: "", authUrl: "", realm: "" };

// Pulls the four D1_* values out of whatever the retailer pasted. Delhivery hands
// these out in a few different wrappers depending on where you copy from, so accept
// { env: {...} }, { mcpServers: { name: { env: {...} } } } and a bare object. Falls
// back to a line-by-line scan so a plain "KEY=value" paste also works.
function extractOAuthFields(raw) {
	const text = (raw || "").trim();
	if (!text) return null;

	let env = null;
	try {
		const parsed = JSON.parse(text);
		env = parsed?.env
			|| (parsed?.mcpServers && Object.values(parsed.mcpServers)[0]?.env)
			|| parsed;
	} catch {
		// Not JSON -- scan for KEY=value / "KEY": "value" pairs.
		env = {};
		const pattern = /(D1_CLIENT_ID|D1_CLIENT_SECRET|D1_AUTH_URL|D1_REALM)\s*[:=]\s*"?([^"\s,}]+)"?/g;
		let match;
		while ((match = pattern.exec(text)) !== null) {
			env[match[1]] = match[2];
		}
	}

	if (!env || typeof env !== "object") return null;
	const fields = {
		clientId: env.D1_CLIENT_ID || "",
		clientSecret: env.D1_CLIENT_SECRET || "",
		authUrl: env.D1_AUTH_URL || "",
		realm: env.D1_REALM || "",
	};
	return Object.values(fields).some(Boolean) ? fields : null;
}

function CopyField({ label, value, multiline = false }) {
	const { t } = useTranslation();
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			// Clipboard API needs a secure context; fall back to the old trick so
			// http://localhost still works.
			const el = document.createElement("textarea");
			el.value = value;
			document.body.appendChild(el);
			el.select();
			document.execCommand("copy");
			document.body.removeChild(el);
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 1800);
	};

	return (
		<div className="flex flex-col gap-1">
			<Label className="text-xs text-muted-foreground">{label}</Label>
			<div className="flex items-start gap-2">
				<code className={`flex-1 rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-xs ${multiline ? "break-all" : "truncate"}`}>
					{value}
				</code>
				<Button type="button" size="icon-sm" variant="outline" onClick={copy} aria-label={t("delhiveryConnect.copyLabel", { label, defaultValue: `Copy ${label}` })}>
					{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
				</Button>
			</div>
		</div>
	);
}

/**
 * The three ways a retailer can hand over Delhivery delivery status.
 *
 * Each option is a row that expands in place (no separate page, no modal on top of
 * a modal) with its own form, plus a Help button on the right that reveals the
 * steps for getting those credentials.
 *
 * @param {string} retailerId
 * @param {string} token       JWT for the API calls
 * @param {Object|null} status current integration status from the API
 * @param {Function} onConnected called with the new status after a successful save
 */
function DelhiveryConnectPanel({ retailerId, token, status, onConnected }) {
	const { t } = useTranslation();
	const [openOption, setOpenOption] = useState(null);
	const [helpFor, setHelpFor] = useState(null);
	const [saving, setSaving] = useState(null);
	const [error, setError] = useState("");
	const [verifiedNote, setVerifiedNote] = useState("");

	const [apiToken, setApiToken] = useState("");
	const [oauthPaste, setOauthPaste] = useState("");
	const [oauth, setOauth] = useState(EMPTY_OAUTH);
	const [pasteNote, setPasteNote] = useState("");
	const [webhookDetails, setWebhookDetails] = useState(null);

	const options = getDelhiveryOptions(t);

	const toggleOption = (id) => {
		setError("");
		setVerifiedNote("");
		setOpenOption((current) => (current === id ? null : id));
	};

	const toggleHelp = (id) => {
		// Opening help also expands the option, so the steps appear right under it.
		setOpenOption(id);
		setHelpFor((current) => (current === id ? null : id));
	};

	const fillFromPaste = () => {
		const fields = extractOAuthFields(oauthPaste);
		if (!fields) {
			setPasteNote(t("delhiveryConnect.pasteError", "Could not find D1_CLIENT_ID / D1_CLIENT_SECRET / D1_AUTH_URL / D1_REALM in that text."));
			return;
		}
		setOauth(fields);
		const missing = Object.entries(fields).filter(([, v]) => !v).map(([k]) => k);
		setPasteNote(missing.length ? t("delhiveryConnect.pasteMissing", { missing: missing.join(", "), defaultValue: `Filled what was found. Still missing: ${missing.join(", ")}.` }) : t("delhiveryConnect.pasteAllFilled", "All four values filled in below."));
	};

	const save = async (method, payload) => {
		setSaving(method);
		setError("");
		setVerifiedNote("");
		try {
			const response = await axios.put(
				`${BACKEND_URL}/api/retailers/${retailerId}/shipping-integration`,
				{ method, ...payload },
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.data?.webhook) {
				// Shown once, right now -- the secret is not readable afterwards.
				setWebhookDetails(response.data.webhook);
			} else {
				setOpenOption(null);
			}
			setApiToken("");
			setOauthPaste("");
			setOauth(EMPTY_OAUTH);
			setPasteNote("");
			setVerifiedNote(response.data?.verificationDetail || "");
			onConnected?.(response.data?.delhivery || { isConfigured: true, method });
		} catch (err) {
			setError(err.response?.data?.message || err.message || t("delhiveryConnect.couldNotSave", "Could not save the integration."));
		} finally {
			setSaving(null);
		}
	};

	const disconnect = async () => {
		setSaving("disconnect");
		setError("");
		setVerifiedNote("");
		try {
			await axios.delete(`${BACKEND_URL}/api/retailers/${retailerId}/shipping-integration`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			setWebhookDetails(null);
			setOpenOption(null);
			onConnected?.({ isConfigured: false, method: null });
		} catch (err) {
			setError(err.response?.data?.message || err.message || t("delhiveryConnect.couldNotDisconnect", "Could not disconnect."));
		} finally {
			setSaving(null);
		}
	};

	const testWebhook = async () => {
		setSaving("testWebhook");
		setError("");
		setVerifiedNote("");
		try {
			const res = await axios.get(
				`${BACKEND_URL}/api/retailers/${retailerId}/shipping-integration/status`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			const del = res.data?.delhivery;
			if (del?.lastWebhookReceivedAt) {
				setVerifiedNote(t("delhiveryConnect.verifiedLastWebhook", { time: new Date(del.lastWebhookReceivedAt).toLocaleString(), defaultValue: `Verified! Last webhook received at: ${new Date(del.lastWebhookReceivedAt).toLocaleString()}` }));
			} else {
				setError(t("delhiveryConnect.noWebhookYet", "No webhook data received from Delhivery yet. Try sending a test ping from your Delhivery dashboard."));
			}
		} catch (err) {
			setError(t("delhiveryConnect.failedToCheckStatus", "Failed to check status."));
		} finally {
			setSaving(null);
		}
	};

	const renderForm = (id) => {
		if (id === "apiToken") {
			return (
				<form
					className="flex flex-col gap-2"
					onSubmit={(e) => {
						e.preventDefault();
						save("apiToken", { apiToken });
					}}
				>
					{error ? (
						<Alert variant="destructive">
							<AlertCircle />
							<AlertTitle>{t("delhiveryConnect.notConnectedRejected", "Not connected — Delhivery rejected these details")}</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}
					<Label htmlFor="jh-delhivery-token">{t("delhiveryConnect.apiTokenLabel", "API token")}</Label>
					<Input
						id="jh-delhivery-token"
						type="password"
						autoComplete="off"
						placeholder={t("delhiveryConnect.apiTokenPlaceholder", "Paste the production token from Delhivery One")}
						value={apiToken}
						onChange={(e) => setApiToken(e.target.value)}
					/>
					<p className="text-xs text-muted-foreground">
						{t("delhiveryConnect.apiTokenHelp", "Stored encrypted. It is never shown again, here or anywhere else in JeevanHub.")}
					</p>
					<div>
						<Button type="submit" size="sm" loading={saving === "apiToken"} disabled={apiToken.trim().length < 10}>
							{saving === "apiToken" ? t("delhiveryConnect.checkingWithDelhivery", "Checking with Delhivery…") : t("delhiveryConnect.verifyAndConnect", "Verify & connect")}
						</Button>
					</div>
				</form>
			);
		}

		if (id === "oauth2") {
			const ready = oauth.clientId && oauth.clientSecret && oauth.authUrl && oauth.realm;
			return (
				<form
					className="flex flex-col gap-3"
					onSubmit={(e) => {
						e.preventDefault();
						save("oauth2", {
							mcpConfig: {
								env: {
									D1_CLIENT_ID: oauth.clientId.trim(),
									D1_CLIENT_SECRET: oauth.clientSecret.trim(),
									D1_AUTH_URL: oauth.authUrl.trim(),
									D1_REALM: oauth.realm.trim(),
								},
							},
						});
					}}
				>
					{error ? (
						<Alert variant="destructive">
							<AlertCircle />
							<AlertTitle>{t("delhiveryConnect.notConnectedRejected", "Not connected — Delhivery rejected these details")}</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}
					<div className="flex flex-col gap-2">
						<Label htmlFor="jh-delhivery-mcp">{t("delhiveryConnect.oauthPasteLabel", "Paste the JSON from Delhivery (optional shortcut)")}</Label>
						<Textarea
							id="jh-delhivery-mcp"
							rows={4}
							className="font-mono text-xs"
							placeholder={'{ "env": { "D1_CLIENT_ID": "...", "D1_CLIENT_SECRET": "...", "D1_AUTH_URL": "https://...", "D1_REALM": "..." } }'}
							value={oauthPaste}
							onChange={(e) => setOauthPaste(e.target.value)}
						/>
						<div className="flex items-center gap-2">
							<Button type="button" size="sm" variant="outline" onClick={fillFromPaste} disabled={!oauthPaste.trim()}>
								{t("delhiveryConnect.fillFields", "Fill fields")}
							</Button>
							{pasteNote ? <span className="text-xs text-muted-foreground">{pasteNote}</span> : null}
						</div>
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="jh-d1-client-id">{t("delhiveryConnect.clientId", "Client ID")}</Label>
							<Input
								id="jh-d1-client-id"
								autoComplete="off"
								value={oauth.clientId}
								onChange={(e) => setOauth({ ...oauth, clientId: e.target.value })}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="jh-d1-client-secret">{t("delhiveryConnect.clientSecret", "Client secret")}</Label>
							<Input
								id="jh-d1-client-secret"
								type="password"
								autoComplete="off"
								value={oauth.clientSecret}
								onChange={(e) => setOauth({ ...oauth, clientSecret: e.target.value })}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="jh-d1-auth-url">{t("delhiveryConnect.authUrl", "Auth URL")}</Label>
							<Input
								id="jh-d1-auth-url"
								autoComplete="off"
								placeholder="https://..."
								value={oauth.authUrl}
								onChange={(e) => setOauth({ ...oauth, authUrl: e.target.value })}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="jh-d1-realm">{t("delhiveryConnect.realm", "Realm")}</Label>
							<Input
								id="jh-d1-realm"
								autoComplete="off"
								value={oauth.realm}
								onChange={(e) => setOauth({ ...oauth, realm: e.target.value })}
							/>
						</div>
					</div>

					<div>
						<Button type="submit" size="sm" loading={saving === "oauth2"} disabled={!ready}>
							{saving === "oauth2" ? t("delhiveryConnect.checkingWithDelhivery", "Checking with Delhivery…") : t("delhiveryConnect.verifyAndConnect", "Verify & connect")}
						</Button>
					</div>
				</form>
			);
		}

		// webhook
		return (
			<div className="flex flex-col gap-3">
				{error ? (
					<Alert variant="destructive">
						<AlertCircle />
						<AlertTitle>{t("delhiveryConnect.notConnectedRejected", "Not connected — Delhivery rejected these details")}</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}
				<p className="text-xs text-muted-foreground">
					{t("delhiveryConnect.webhookDesc", "Nothing to type here — JeevanHub generates the two values and you paste them into Delhivery. Generating again replaces the previous secret.")}
				</p>
				<div>
					<Button
						type="button"
						size="sm"
						loading={saving === "webhook"}
						onClick={() => save("webhook", {})}
					>
						{webhookDetails || (connected && status?.method === 'webhook') ? t("delhiveryConnect.generateNewWebhookDetails", "Generate new webhook details") : t("delhiveryConnect.generateWebhookDetails", "Generate webhook details")}
					</Button>
					{(webhookDetails || (connected && status?.method === 'webhook')) && (
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="ml-2"
							loading={saving === "testWebhook"}
							onClick={testWebhook}
						>
							{t("delhiveryConnect.testConnection", "Test Connection")}
						</Button>
					)}
				</div>

				{webhookDetails ? (
					<div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
						<p className="text-xs font-medium text-foreground">
							{t("delhiveryConnect.webhookCopyPrompt", "Copy these into Delhivery now — the secret is not shown again.")}
						</p>
						<CopyField label={t("delhiveryConnect.webhookUrlLabel", "Webhook URL (POST)")} value={webhookDetails.url} multiline />
						<CopyField label={t("delhiveryConnect.headerNameLabel", "Header name")} value={webhookDetails.secretHeader} />
						<CopyField label={t("delhiveryConnect.headerSecretLabel", "Header value (secret)")} value={webhookDetails.secret} multiline />
						{webhookDetails.url?.includes("localhost") ? (
							<Alert variant="destructive">
								<AlertCircle />
								<AlertTitle>{t("delhiveryConnect.webhookLocalhostTitle", "This URL is not reachable by Delhivery")}</AlertTitle>
								<AlertDescription>
									{t("delhiveryConnect.webhookLocalhostDesc", "It points at localhost. Expose your backend with a tunnel (e.g. ngrok http 8080), set BASE_URL in the backend .env to that public URL, restart the server, then generate again.")}
								</AlertDescription>
							</Alert>
						) : null}
					</div>
				) : null}
			</div>
		);
	};

	const connected = Boolean(status?.isConfigured);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-col gap-0.5">
					<p className="text-sm font-medium text-foreground">
						{connected ? t("delhiveryConnect.statusConnected", "Delhivery is connected") : t("delhiveryConnect.statusPrompt", "How should Delhivery share delivery status with JeevanHub?")}
					</p>
					<p className="text-xs text-muted-foreground">
						{connected
							? t("delhiveryConnect.statusSubConnected", { method: t(`delhiveryConnect.methods.${status.method}`, DELHIVERY_METHOD_LABELS[status.method] || status.method), defaultValue: `Using ${DELHIVERY_METHOD_LABELS[status.method] || status.method}. Pick another option below to switch.` })
							: t("delhiveryConnect.statusSubPrompt", "Pick whichever one your Delhivery plan gives you. You only need one.")}
					</p>
				</div>
				{connected ? (
					<div className="flex items-center gap-2">
						<Badge variant="success">{t("delhiveryConnect.badges.connected", "Connected")}</Badge>
						<Button type="button" size="sm" variant="ghost" loading={saving === "disconnect"} onClick={disconnect}>
							{t("delhiveryConnect.disconnect", "Disconnect")}
						</Button>
					</div>
				) : null}
			</div>

			{error && !openOption ? (
				<Alert variant="destructive">
					<AlertCircle />
					<AlertTitle>{t("delhiveryConnect.actionFailed", "Action failed")}</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			{/* Positive confirmation of what actually happened, so "Connected"
			    is never just an assumption. Alert only ships default/destructive,
			    so the sandbox case is tinted with the same token the badge uses. */}
			{!error && verifiedNote ? (
				<Alert
					className={
						status?.sandbox
							? "bg-[color-mix(in_srgb,var(--jh-turmeric-gold)_12%,transparent)] text-[#7a5a1e]"
							: undefined
					}
				>
					{status?.sandbox ? <AlertCircle /> : <CheckCircle2 />}
					<AlertTitle>{status?.sandbox ? t("delhiveryConnect.savedNotVerified", "Saved, but not verified") : t("delhiveryConnect.verifiedWithDelhivery", "Verified with Delhivery")}</AlertTitle>
					<AlertDescription>{verifiedNote}</AlertDescription>
				</Alert>
			) : null}

			<div className="flex flex-col gap-2">
				{options.map((option) => {
					const Icon = OPTION_ICONS[option.id];
					const isOpen = openOption === option.id;
					const isActive = connected && status.method === option.id;
					const showHelp = helpFor === option.id;

					return (
						<div
							key={option.id}
							className={`rounded-lg border transition-colors ${isOpen ? "border-primary/50 bg-muted/20" : "border-border"}`}
						>
							<div className="flex items-start gap-2 p-3">
								{/* The row itself is the disclosure control -- clicking it expands the form below. */}
								<button
									type="button"
									onClick={() => toggleOption(option.id)}
									aria-expanded={isOpen}
									className="flex flex-1 cursor-pointer items-start gap-3 text-left"
								>
									<Icon className="mt-0.5 size-4 shrink-0 text-primary" />
									<span className="flex flex-col gap-0.5">
										<span className="flex flex-wrap items-center gap-2">
											<span className="text-sm font-medium text-foreground">{option.title}</span>
											{option.badge && !connected ? <Badge variant="secondary">{t("delhiveryConnect.badges.recommended", option.badge)}</Badge> : null}
											{isActive ? <Badge variant="success">{t("delhiveryConnect.badges.inUse", "In use")}</Badge> : null}
										</span>
										<span className="text-xs text-muted-foreground">{option.tagline}</span>
									</span>
									<ChevronDown
										className={`mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
									/>
								</button>
								<Button
									type="button"
									size="sm"
									variant={showHelp ? "secondary" : "outline"}
									onClick={() => toggleHelp(option.id)}
									aria-expanded={showHelp}
									aria-label={showHelp ? t("delhiveryConnect.hideHelp", { title: option.title, defaultValue: `Hide steps for ${option.title}` }) : t("delhiveryConnect.showHelp", { title: option.title, defaultValue: `Show steps for ${option.title}` })}
								>
									<HelpCircle className="size-3.5" />
									{t("delhiveryConnect.help", "Help")}
								</Button>
							</div>

							{isOpen ? (
								<div className="flex flex-col gap-3 border-t border-border px-3 py-3">
									{showHelp ? (
										<div className="rounded-lg bg-muted/50 p-3">
											<p className="mb-2 text-sm font-medium text-foreground">{option.helpTitle}</p>
											<ol className="ml-4 flex list-decimal flex-col gap-1.5 text-xs text-muted-foreground">
												{option.helpSteps.map((step, i) => (
													<li key={i}>{step}</li>
												))}
											</ol>
											{option.helpNotes?.length ? (
												<ul className="mt-2 ml-4 flex list-disc flex-col gap-1 text-xs text-muted-foreground">
													{option.helpNotes.map((note, i) => (
														<li key={i}>{note}</li>
													))}
												</ul>
											) : null}
										</div>
									) : null}
									{renderForm(option.id)}
								</div>
							) : null}
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default DelhiveryConnectPanel;

