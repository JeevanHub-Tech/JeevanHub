import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { FileText } from "lucide-react";

import { AuthContext } from "../../../context/AuthContext";
import { DocumentViewerModal } from "../../../components/DocumentViewerModal";
import { BACKEND_URL } from "../../../config";
import { Card } from "@/components/ui/card";

export function MedicalHistoryViewer({ patientId }) {
	const { auth } = useContext(AuthContext);
	const [documents, setDocuments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [viewingDoc, setViewingDoc] = useState(null);

	useEffect(() => {
		const fetchMedicalHistory = async () => {
			try {
				const response = await axios.get(`${BACKEND_URL}/api/patients/${patientId}/medical-history`, {
					headers: { Authorization: `Bearer ${auth.token}` },
				});
				setDocuments(response.data.medicalHistory || []);
			} catch (error) {
				console.error("Error fetching patient medical history:", error);
			} finally {
				setLoading(false);
			}
		};

		if (patientId && auth.token) fetchMedicalHistory();
	}, [patientId, auth.token]);

	if (loading) {
		return (
			<Card className="p-4.5">
				<p className="rounded-lg border border-dashed border-border bg-muted/40 p-5 text-center text-sm text-muted-foreground">
					Loading medical history...
				</p>
			</Card>
		);
	}

	return (
		<Card className="p-4.5">
			<div>
				<h3 className="mb-3.5 flex items-center gap-2 border-b-2 border-border pb-2.5 text-base font-bold text-foreground">
					<FileText className="size-[1.15rem] text-primary" />
					Uploaded Documents ({documents.length})
				</h3>
				<div className="grid gap-2.5">
					{documents.length > 0 ? (
						documents.map((doc) => (
							<button
								key={doc._id}
								type="button"
								onClick={() => setViewingDoc(doc)}
								className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-card p-3 text-left text-sm text-foreground transition-all hover:border-primary hover:shadow-sm"
							>
								<FileText className="size-4 shrink-0 text-muted-foreground" />
								<span>{doc.fileName}</span>
							</button>
						))
					) : (
						<p className="rounded-lg border border-dashed border-border bg-muted/40 p-5 text-center text-sm text-muted-foreground">
							No medical history documents uploaded by this patient.
						</p>
					)}
				</div>
			</div>

			{viewingDoc ? <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} /> : null}
		</Card>
	);
}
