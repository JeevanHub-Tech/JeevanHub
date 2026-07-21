import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";

import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

const AddItem = () => {
	const [file, setFile] = useState(null);
	const [error, setError] = useState(null);
	const navigate = useNavigate();

	const handleFileChange = (e) => {
		setFile(e.target.files[0]);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!file) {
			setError("Please upload a zip file.");
			return;
		}

		const formData = new FormData();
		formData.append("file", file);

		try {
			const token = localStorage.getItem("token");
			const response = await authFetch(`${BACKEND_URL}/api/medicines/add`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});

			if (response.ok) {
				navigate("/my-items");
			} else {
				const data = await response.json();
				setError(data.message || "Failed to add items from zip");
			}
		} catch (error) {
			setError("An error occurred while uploading the zip file");
		}
	};

	return (
		<Card className="mx-auto max-w-lg p-6">
			<form onSubmit={handleSubmit}>
				<FieldGroup>
					{error ? <p className="text-sm text-destructive">{error}</p> : null}

					<Field>
						<FieldLabel htmlFor="file">Upload Zip File (Excel + Images)</FieldLabel>
						<input
							id="file"
							name="file"
							type="file"
							accept=".zip"
							onChange={handleFileChange}
							required
							className="rounded-lg border border-dashed border-input bg-muted/40 p-3 text-sm text-foreground file:mr-3.5 file:cursor-pointer file:rounded-full file:border-0 file:bg-primary file:px-5 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
						/>
					</Field>

					<Button type="submit">
						<Upload data-icon="inline-start" /> Upload Medicines from Zip
					</Button>
				</FieldGroup>
			</form>
		</Card>
	);
};

export default AddItem;
