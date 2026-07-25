// Daily.co REST client -- replaces the meet.jit.si join flow, which left both
// sides stuck on "waiting for moderator" since anonymous users on the public
// Jitsi server can never become one. Daily rooms + per-user meeting tokens
// let us mark the doctor as room owner so the call actually starts.
// Docs: https://docs.daily.co/reference/rest-api
const axios = require("axios");

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_BASE = "https://api.daily.co/v1";

const dailyClient = axios.create({
	baseURL: DAILY_API_BASE,
	headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
});

const isDailyConfigured = () => Boolean(DAILY_API_KEY);

const createDailyRoom = async (roomName) => {
	const { data } = await dailyClient.post("/rooms", {
		name: roomName,
		privacy: "private",
		properties: {
			exp: Math.floor(Date.now() / 1000) + 6 * 60 * 60, // room stays valid 6h
			enable_chat: true,
		},
	});
	return data; // { name, url, ... }
};

const createDailyMeetingToken = async ({ roomName, isOwner, userName }) => {
	const { data } = await dailyClient.post("/meeting-tokens", {
		properties: {
			room_name: roomName,
			is_owner: isOwner,
			user_name: userName,
		},
	});
	return data.token;
};

module.exports = { isDailyConfigured, createDailyRoom, createDailyMeetingToken };
