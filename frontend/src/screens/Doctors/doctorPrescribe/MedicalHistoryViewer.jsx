import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { FileText } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import { DocumentViewerModal } from '../../../components/DocumentViewerModal';
import './PrescriptionHistory.css';
import { BACKEND_URL } from '../../../config';

export function MedicalHistoryViewer({ patientId }) {
	const { auth } = useContext(AuthContext);
	const [documents, setDocuments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [viewingDoc, setViewingDoc] = useState(null);

	useEffect(() => {
		const fetchMedicalHistory = async () => {
			try {
				const response = await axios.get(
					`${BACKEND_URL}/api/patients/${patientId}/medical-history`,
					{ headers: { Authorization: `Bearer ${auth.token}` } }
				);
				setDocuments(response.data.medicalHistory || []);
			} catch (error) {
				console.error("Error fetching patient medical history:", error);
			} finally {
				setLoading(false);
			}
		};

		if (patientId && auth.token) fetchMedicalHistory();
	}, [patientId, auth.token]);

	if (loading) return <p className="empty-state">Loading medical history...</p>;

	return (
		<div className="prescription-history-container">
			<div className="history-section-">
				<div className="section-header">
					<h3 className="section-title">
						<FileText className="section-icon" />
						Uploaded Documents ({documents.length})
					</h3>
				</div>
				<div className="record-list">
					{documents.length > 0 ? (
						documents.map((doc) => (
							<button
								key={doc._id}
								type="button"
								onClick={() => setViewingDoc(doc)}
								className="record-card"
								style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
							>
								<FileText className="record-item-icon" />
								<span>{doc.fileName}</span>
							</button>
						))
					) : (
						<p className="empty-state">No medical history documents uploaded by this patient.</p>
					)}
				</div>
			</div>

			{viewingDoc && <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />}
		</div>
	);
}
