import { createContext, useContext } from "react";

// Shared between the toolbar's upload button and the drag/drop plugin so both
// insertion paths register into the same Cloudinary-deletion registry (see
// ImageLifecyclePlugin) instead of duplicating the upload/tracking logic.
export const ImageUploadContext = createContext(null);

export function useImageUpload() {
	const ctx = useContext(ImageUploadContext);
	if (!ctx) throw new Error("useImageUpload must be used within an ImageUploadContext.Provider");
	return ctx;
}
