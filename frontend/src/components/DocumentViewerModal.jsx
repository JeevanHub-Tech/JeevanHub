import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Renders a medical-history document (image or PDF) inline in an overlay so
// patients/doctors never have to leave the site to view it.
export function DocumentViewerModal({ doc, onClose }) {
	if (!doc) return null;

	const isImage = doc.mimeType?.startsWith("image/");

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="flex h-[85vh] max-h-[85vh] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0">
				<div className="flex items-center justify-between border-b border-border px-5 py-3">
					<DialogTitle className="truncate pr-6 text-base">{doc.fileName}</DialogTitle>
				</div>
				<div className="flex flex-1 items-center justify-center overflow-auto bg-secondary/60">
					{isImage ? (
						<img src={doc.url} alt={doc.fileName} className="max-h-full max-w-full object-contain" />
					) : (
						<iframe src={doc.url} title={doc.fileName} className="size-full border-0" />
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
