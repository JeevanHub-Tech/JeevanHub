import { useEffect, useState } from "react";

function loadDraft(key) {
	try {
		const raw = localStorage.getItem(key);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

// Keeps a blog editor's in-progress fields mirrored to localStorage so an
// accidental refresh/tab-close doesn't lose unsaved work. A saved draft under
// this key wins over `seed` (the existing post being edited, or blank for a
// new one) since it represents more recent unsaved edits -- callers should
// skip overwriting from a server fetch when `hadDraft` is true. Call
// `clearDraft()` after a successful publish/save so the next visit starts fresh.
function useBlogDraft(draftKey, seed = {}) {
	const [draft] = useState(() => loadDraft(draftKey));
	const initial = draft || seed;

	const [title, setTitle] = useState(initial.title || "");
	const [category, setCategory] = useState(initial.category || "");
	const [description, setDescription] = useState(initial.description || "");
	const [coverImage, setCoverImage] = useState(initial.coverImage || "");
	const [url, setUrl] = useState(initial.url || "");

	useEffect(() => {
		try {
			localStorage.setItem(draftKey, JSON.stringify({ title, category, description, coverImage, url }));
		} catch {
			// localStorage full/unavailable -- draft persistence is a nicety, not
			// worth surfacing an error over.
		}
	}, [draftKey, title, category, description, coverImage, url]);

	const clearDraft = () => {
		try {
			localStorage.removeItem(draftKey);
		} catch {
			// ignore
		}
	};

	return {
		title,
		setTitle,
		category,
		setCategory,
		description,
		setDescription,
		coverImage,
		setCoverImage,
		url,
		setUrl,
		clearDraft,
		hadDraft: !!draft,
	};
}

export { useBlogDraft };
