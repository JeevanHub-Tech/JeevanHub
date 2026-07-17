import React from 'react';
import { X } from 'lucide-react';
import './DocumentViewerModal.css';

// Renders a medical-history document (image or PDF) inline in an overlay so
// patients/doctors never have to leave the site to view it.
export function DocumentViewerModal({ doc, onClose }) {
	if (!doc) return null;

	const isImage = doc.mimeType?.startsWith('image/');

	return (
		<div className="doc-viewer-overlay" onClick={onClose}>
			<div className="doc-viewer-panel" onClick={(e) => e.stopPropagation()}>
				<div className="doc-viewer-header">
					<span className="doc-viewer-title">{doc.fileName}</span>
					<button type="button" className="doc-viewer-close" onClick={onClose} aria-label="Close">
						<X size={20} />
					</button>
				</div>
				<div className="doc-viewer-body">
					{isImage ? (
						<img src={doc.url} alt={doc.fileName} className="doc-viewer-image" />
					) : (
						<iframe src={doc.url} title={doc.fileName} className="doc-viewer-iframe" />
					)}
				</div>
			</div>
		</div>
	);
}
