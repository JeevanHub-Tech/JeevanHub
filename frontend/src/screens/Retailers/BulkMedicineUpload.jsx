import { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { Check, X, ChevronUp, ChevronDown, Flag, Info, RotateCcw, ChevronDownIcon } from "lucide-react";

import ImageUploaderCell from "../../components/ImageUploaderCell";
import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const createEmptyRow = (id) => ({
	id,
	name: "",
	price: "",
	quantity: "",
	category: "",
	description: "",
	prescription: false,
	diseasesTreated: "",
	images: [],
	isValid: true,
	isArchived: false,
});

const CATEGORY_OPTIONS = ["Churna", "Bhasma", "Asava/Arishta", "Vati/Guti", "Taila", "Ghrita", "Lehya", "Syrup", "Capsules", "Ointment", "Other"];

const CustomCategoryCombobox = ({ value, onChange, onKeyDown, className, disabled }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [filteredOptions, setFilteredOptions] = useState(CATEGORY_OPTIONS);
	const wrapperRef = useRef(null);

	const [dropdownStyles, setDropdownStyles] = useState({});

	useEffect(() => {
		function handleClickOutside(event) {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
				if (!event.target.closest(".custom-combobox-dropdown-portal")) {
					setIsOpen(false);
				}
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		if (isOpen && wrapperRef.current) {
			const rect = wrapperRef.current.getBoundingClientRect();
			setDropdownStyles({
				position: "fixed",
				top: rect.bottom + "px",
				left: rect.left + "px",
				width: rect.width + "px",
				zIndex: 9999,
			});
		}

		const handleScroll = (e) => {
			if (isOpen) {
				if (e.target && e.target.classList && e.target.classList.contains("custom-combobox-dropdown-portal")) {
					return;
				}
				setIsOpen(false);
			}
		};

		if (isOpen) {
			window.addEventListener("scroll", handleScroll, true);
		}
		return () => window.removeEventListener("scroll", handleScroll, true);
	}, [isOpen]);

	const handleInputChange = (e) => {
		const val = e.target.value;
		onChange(val);
		setFilteredOptions(CATEGORY_OPTIONS.filter((opt) => opt.toLowerCase().includes(val.toLowerCase())));
		if (!isOpen) setIsOpen(true);
	};

	return (
		<div ref={wrapperRef} className="relative flex size-full items-stretch">
			<input
				type="text"
				value={value}
				onChange={handleInputChange}
				onKeyDown={onKeyDown}
				onFocus={() => {
					setFilteredOptions(CATEGORY_OPTIONS.filter((opt) => opt.toLowerCase().includes((value || "").toLowerCase())));
					setIsOpen(true);
				}}
				onClick={() => {
					if (!isOpen) {
						setFilteredOptions(CATEGORY_OPTIONS.filter((opt) => opt.toLowerCase().includes((value || "").toLowerCase())));
						setIsOpen(true);
					}
				}}
				className={`w-full border-0 bg-transparent p-3 pr-7 text-sm outline-none ${className || ""}`}
				disabled={disabled}
				placeholder="Select or type..."
			/>
			<span
				className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground"
				onClick={() => {
					if (!disabled) {
						if (!isOpen) setFilteredOptions(CATEGORY_OPTIONS);
						setIsOpen(!isOpen);
					}
				}}
			>
				<ChevronDownIcon className="size-3.5" />
			</span>

			{isOpen && !disabled
				? ReactDOM.createPortal(
						<ul
							className="custom-combobox-dropdown-portal m-0 max-h-52 list-none overflow-y-auto rounded-md border border-border bg-popover p-0 shadow-lg"
							style={dropdownStyles}
						>
							{filteredOptions.map((opt, i) => (
								<li
									key={i}
									onMouseDown={() => {
										onChange(opt);
										setIsOpen(false);
									}}
									className="cursor-pointer border-b border-border px-3 py-2.5 text-sm text-popover-foreground last:border-b-0 hover:bg-accent"
								>
									{opt}
								</li>
							))}
							{filteredOptions.length === 0 ? (
								<li className="cursor-default px-3 py-2.5 text-sm text-muted-foreground italic">Press Enter for custom</li>
							) : null}
						</ul>,
						document.body
					)
				: null}
		</div>
	);
};

const BulkMedicineUpload = () => {
	const createEmptyRows = (count) => {
		return Array.from({ length: count }).map((_, i) => createEmptyRow(Date.now().toString() + i));
	};

	const [rows, setRows] = useState(createEmptyRows(1));
	const [saveStatus, setSaveStatus] = useState("All changes saved to cloud.");
	const [zipFile, setZipFile] = useState(null);
	const [zipError, setZipError] = useState(null);
	const [activeErrorModalIndex, setActiveErrorModalIndex] = useState(null);
	const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);
	const [activeRowIndex, setActiveRowIndex] = useState(null);
	const [stagedAbove, setStagedAbove] = useState(false);
	const [stagedBelow, setStagedBelow] = useState(false);
	const tableWrapperRef = useRef(null);
	const debounceTimeout = useRef(null);

	const autoSaveDraft = useCallback((currentRows) => {
		setSaveStatus("Saving...");
		if (debounceTimeout.current) {
			clearTimeout(debounceTimeout.current);
		}
		debounceTimeout.current = setTimeout(async () => {
			try {
				const token = localStorage.getItem("token");
				await axios.post(
					`${BACKEND_URL || "http://localhost:8080"}/api/drafts/medicine`,
					{
						present: currentRows,
					},
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);
				setSaveStatus("All changes saved to cloud.");
			} catch (error) {
				console.error("Failed to save draft", error);
				setSaveStatus("Error saving draft. Retrying...");
			}
		}, 1200);
	}, []);

	useEffect(() => {
		const fetchDraft = async () => {
			try {
				setSaveStatus("Loading draft...");
				const token = localStorage.getItem("token");
				const res = await axios.get(`${BACKEND_URL || "http://localhost:8080"}/api/drafts/medicine`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.data && res.data.present && res.data.present.length > 0) {
					setRows(res.data.present);
				}
				setSaveStatus("All changes saved to cloud.");
			} catch (error) {
				console.error("Failed to load draft", error);
				setSaveStatus("Error loading draft.");
			}
		};
		fetchDraft();
	}, []);

	const updateRowsAndSync = (newRows) => {
		setRows(newRows);
		autoSaveDraft(newRows);
	};

	const handleCellChange = (index, field, value) => {
		if (index > 0) {
			const prev = rows[index - 1];
			const isPrevEmpty =
				prev.name.trim() === "" &&
				prev.price === "" &&
				prev.quantity === "" &&
				prev.category === "" &&
				prev.description.trim() === "" &&
				prev.images.length === 0;
			if (isPrevEmpty && field !== "isArchived") {
				alert("Please fill out the previous row before continuing.");
				return;
			}
		}

		const newRows = [...rows];
		newRows[index] = { ...newRows[index], [field]: value };
		const r = newRows[index];
		r.isValid = checkIsRowValid(r);
		setRows(newRows);

		autoSaveDraft(newRows);
	};

	const deleteImagesFromCloudinary = async (urls) => {
		const cloudinaryUrls = urls.filter((url) => url && url.includes("cloudinary"));
		if (cloudinaryUrls.length === 0) return;
		try {
			const token = localStorage.getItem("token");
			await axios.post(
				`${BACKEND_URL || "http://localhost:8080"}/api/medicines/delete-images`,
				{
					urls: cloudinaryUrls,
				},
				{ headers: { Authorization: `Bearer ${token}` } }
			);
		} catch (err) {
			console.error("Failed to delete images from cloudinary", err);
		}
	};

	const isRowEmpty = (r) => {
		return r.name.trim() === "" && r.price === "" && r.quantity === "" && r.category === "" && r.description.trim() === "" && r.images.length === 0;
	};

	const checkIsRowValid = (r) => {
		return r.name.trim() !== "" && r.price > 0 && r.quantity > 0 && r.category !== "" && r.description.trim() !== "";
	};

	const shouldHighlightInvalid = (row, index, fieldIsInvalid) => {
		if (isRowEmpty(row)) return false;
		if (activeRowIndex === index) return false;
		return fieldIsInvalid;
	};

	const handleClearDraft = () => {
		if (window.confirm("Are you sure you want to clear the active draft? Archived rows will be kept.")) {
			const activeRows = rows.filter((r) => !r.isArchived);
			const archivedRows = rows.filter((r) => r.isArchived);

			const activeImages = activeRows.flatMap((r) => r.images || []);

			const empty = createEmptyRows(1);
			const newRows = [...archivedRows, ...empty];

			setRows(newRows);

			deleteImagesFromCloudinary(activeImages).catch((e) => console.error("Failed to delete images", e));

			const token = localStorage.getItem("token");
			axios
				.post(
					`${BACKEND_URL || "http://localhost:8080"}/api/drafts/medicine`,
					{
						present: newRows,
					},
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				)
				.then(() => {
					setSaveStatus("All changes saved to cloud.");
				})
				.catch((e) => {
					console.error("Failed to clear draft on backend", e);
				});
		}
	};

	const scrollToBottom = () => {
		setTimeout(() => {
			if (tableWrapperRef.current) {
				tableWrapperRef.current.scrollTo({
					top: tableWrapperRef.current.scrollHeight,
					behavior: "smooth",
				});
			}
		}, 50);
	};

	const checkStagedVisibility = useCallback(() => {
		if (!tableWrapperRef.current) return;
		const wrapper = tableWrapperRef.current;
		const rowsElements = wrapper.querySelectorAll(".bulk-table tbody tr.staged-row");
		let above = false;
		let below = false;

		const wrapperTopRaw = wrapper.getBoundingClientRect().top;
		const header = wrapper.querySelector("thead");
		const headerHeight = header ? header.getBoundingClientRect().height : 0;
		const wrapperTop = wrapperTopRaw + headerHeight;
		const wrapperBottom = wrapper.getBoundingClientRect().bottom;

		rowsElements.forEach((rowEl) => {
			const rect = rowEl.getBoundingClientRect();
			const rowHeight = rect.height;
			if (rect.bottom < wrapperTop + 0.7 * rowHeight) above = true;
			if (rect.top > wrapperBottom - 0.7 * rowHeight) below = true;
		});

		setStagedAbove(above);
		setStagedBelow(below);
	}, []);

	useEffect(() => {
		checkStagedVisibility();
	}, [rows, checkStagedVisibility]);

	const jumpToStagedRowViewport = (direction) => {
		if (!tableWrapperRef.current) return;
		const wrapper = tableWrapperRef.current;
		const rowsElements = Array.from(wrapper.querySelectorAll(".bulk-table tbody tr.staged-row"));

		const wrapperTopRaw = wrapper.getBoundingClientRect().top;
		const header = wrapper.querySelector("thead");
		const headerHeight = header ? header.getBoundingClientRect().height : 0;
		const wrapperTop = wrapperTopRaw + headerHeight;
		const wrapperBottom = wrapper.getBoundingClientRect().bottom;

		const scrollToAndFocus = (rowEl, align) => {
			const rect = rowEl.getBoundingClientRect();

			let scrollDiff = 0;
			if (align === "start") {
				scrollDiff = rect.top - wrapperTop - 5;
			} else {
				scrollDiff = rect.bottom - wrapperBottom + 5;
			}

			wrapper.scrollTo({ top: wrapper.scrollTop + scrollDiff, behavior: "smooth" });

			const nameInput = rowEl.querySelector("td:nth-child(2) input");
			if (nameInput) nameInput.focus({ preventScroll: true });
		};

		if (direction === "up") {
			for (let i = rowsElements.length - 1; i >= 0; i--) {
				const rect = rowsElements[i].getBoundingClientRect();
				const rowHeight = rect.height;
				if (rect.bottom < wrapperTop + 0.7 * rowHeight) {
					scrollToAndFocus(rowsElements[i], "start");
					break;
				}
			}
		} else {
			for (let i = 0; i < rowsElements.length; i++) {
				const rect = rowsElements[i].getBoundingClientRect();
				const rowHeight = rect.height;
				if (rect.top > wrapperBottom - 0.7 * rowHeight) {
					scrollToAndFocus(rowsElements[i], "end");
					break;
				}
			}
		}
	};

	const dismissError = (rowIndex, errorId) => {
		const newRows = [...rows];
		const r = newRows[rowIndex];
		if (r.errors) {
			r.errors = r.errors.filter((e) => e.id !== errorId);
		}
		updateRowsAndSync(newRows);
	};

	const handleSubmit = async () => {
		const validRows = rows.filter((r) => !r.isArchived && !r.isStaged && r.isValid && r.name.trim() !== "");
		if (validRows.length === 0) {
			alert("No valid, unstaged rows ready to submit. Please ensure you have accepted staged rows and filled out all required fields.");
			return;
		}

		if (!window.confirm(`You are about to submit ${validRows.length} valid medicine(s). Proceed?`)) return;

		setSaveStatus("Submitting to database...");
		try {
			const token = localStorage.getItem("token");
			const payloadRows = validRows.map((r) => ({
				...r,
				diseasesTreated: (r.diseasesTreated || "")
					.split(",")
					.map((entry) => entry.trim())
					.filter(Boolean),
			}));
			await axios.post(
				`${BACKEND_URL || "http://localhost:8080"}/api/medicines/add-bulk`,
				{ medicines: payloadRows },
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			alert("Medicines added successfully!");

			const remainingRows = rows.filter((r) => r.isArchived || r.isStaged || !r.isValid || r.name.trim() === "");

			const activeRemaining = remainingRows.filter((r) => !r.isArchived);
			if (activeRemaining.length === 0) {
				remainingRows.push(createEmptyRow(Date.now().toString()));
			}

			setRows(remainingRows);
			autoSaveDraft(remainingRows);

			setSaveStatus("All changes saved to cloud.");
		} catch (error) {
			console.error("Failed to submit", error);
			setSaveStatus("Error submitting data.");
			alert("Failed to submit medicines.");
		}
	};

	const handleKeyDown = (e, rowIndex) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (rowIndex === rows.length - 1) {
				const newRows = [...rows, createEmptyRow(Date.now().toString())];
				updateRowsAndSync(newRows);
				scrollToBottom();
			}
		}
	};

	const handleZipChange = (e) => {
		setZipFile(e.target.files[0]);
	};

	const SUPPORTED_BULK_EXTENSIONS = [".zip", ".csv", ".xlsx"];

	const getFileExtension = (file) => {
		const name = file?.name || "";
		const idx = name.lastIndexOf(".");
		return idx === -1 ? "" : name.slice(idx).toLowerCase();
	};

	const handleZipSubmit = async (e) => {
		e.preventDefault();
		if (!zipFile) {
			setZipError("Please upload a .zip, .csv, or .xlsx file.");
			return;
		}

		const ext = getFileExtension(zipFile);
		if (!SUPPORTED_BULK_EXTENSIONS.includes(ext)) {
			setZipError(`Unsupported file type "${ext || "unknown"}". Please upload a .zip, .csv, or .xlsx file.`);
			return;
		}

		const formData = new FormData();
		formData.append("file", zipFile);

		try {
			const token = localStorage.getItem("token");
			setZipError("Parsing file...");
			const response = await authFetch(`${BACKEND_URL || "http://localhost:8080"}/api/medicines/parse-bulk-upload`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});

			if (response.ok) {
				const data = await response.json();
				const newStagedRows = data.stagedRows || [];

				let filteredRows = [...rows];
				while (
					filteredRows.length > 0 &&
					isRowEmpty(filteredRows[filteredRows.length - 1]) &&
					!filteredRows[filteredRows.length - 1].isStaged
				) {
					filteredRows.pop();
				}

				updateRowsAndSync([...filteredRows, ...newStagedRows]);
				alert("File parsed successfully! Please review the staged items.");
				setZipFile(null);
				setZipError(null);
			} else {
				const data = await response.json();
				setZipError(data.message || "Failed to add items from file");
			}
		} catch (error) {
			setZipError("An error occurred while uploading the file");
		}
	};

	const cellBase = "w-full border-0 bg-transparent p-3 text-sm outline-none focus:bg-primary/10 focus-visible:ring-0";
	const invalidCell = "bg-destructive/10 focus:bg-destructive/10";

	const renderRow = (row, originalIndex, displayIndex, isArchivedTable) => {
		const isDisabled = isArchivedTable;

		return (
			<tr
				key={row.id}
				className={[
					"border-b-2 border-border transition-colors hover:bg-muted/30",
					!isArchivedTable && !row.isValid && !isRowEmpty(row) && activeRowIndex !== originalIndex ? "bg-destructive/5" : "",
					row.isStaged ? "staged-row bg-accent" : "",
				]
					.filter(Boolean)
					.join(" ")}
				onFocus={() => !isDisabled && setActiveRowIndex(originalIndex)}
				onBlur={(e) => {
					if (!isDisabled && !e.currentTarget.contains(e.relatedTarget)) {
						setActiveRowIndex(null);
					}
				}}
			>
				<td className="border-r border-border p-3 text-center align-middle">
					<div className="flex items-center justify-center gap-1">
						{row.isStaged && !isArchivedTable ? (
							<button
								className="font-bold text-primary transition-transform hover:scale-125"
								title="Accept Row"
								onClick={() => handleCellChange(originalIndex, "isStaged", false)}
							>
								<Check size={16} />
							</button>
						) : null}
						<span className="font-bold text-muted-foreground">{displayIndex}</span>
					</div>
				</td>
				<td className="border-r border-border align-middle">
					<input
						type="text"
						value={row.name}
						onChange={(e) => handleCellChange(originalIndex, "name", e.target.value)}
						onKeyDown={(e) => handleKeyDown(e, originalIndex)}
						placeholder="Name"
						className={`${cellBase} ${!isDisabled && shouldHighlightInvalid(row, originalIndex, row.name.trim() === "") ? invalidCell : ""}`}
						disabled={isDisabled}
					/>
				</td>
				<td className="border-r border-border align-middle">
					<textarea
						value={row.description}
						onChange={(e) => handleCellChange(originalIndex, "description", e.target.value)}
						onFocus={(e) => {
							if (isDisabled) return;
							setActiveRowIndex(originalIndex);
							e.target.style.height = "62px";
							e.target.style.height = Math.min(Math.max(e.target.scrollHeight, 62), 102) + "px";
						}}
						onBlur={(e) => {
							if (isDisabled) return;
							e.target.style.height = "62px";
							e.target.scrollTop = e.target.scrollHeight;
						}}
						onInput={(e) => {
							if (isDisabled) return;
							e.target.style.height = "62px";
							e.target.style.height = Math.min(Math.max(e.target.scrollHeight, 62), 102) + "px";
							e.target.scrollTop = e.target.scrollHeight;
						}}
						placeholder="Description"
						style={{ height: "62px" }}
						className={`${cellBase} min-w-37.5 resize-none overflow-y-auto ${!isDisabled && shouldHighlightInvalid(row, originalIndex, row.description.trim() === "") ? invalidCell : ""}`}
						disabled={isDisabled}
					/>
				</td>
				<td className="border-r border-border align-middle">
					<input
						type="number"
						value={row.price}
						onChange={(e) => handleCellChange(originalIndex, "price", e.target.value)}
						onKeyDown={(e) => handleKeyDown(e, originalIndex)}
						placeholder="0.00"
						className={`${cellBase} ${!isDisabled && shouldHighlightInvalid(row, originalIndex, row.price <= 0 || row.price === "") ? invalidCell : ""}`}
						disabled={isDisabled}
					/>
				</td>
				<td className="border-r border-border align-middle">
					<input
						type="number"
						value={row.quantity}
						onChange={(e) => handleCellChange(originalIndex, "quantity", e.target.value)}
						onKeyDown={(e) => handleKeyDown(e, originalIndex)}
						placeholder="0"
						className={`${cellBase} ${!isDisabled && shouldHighlightInvalid(row, originalIndex, row.quantity <= 0 || row.quantity === "") ? invalidCell : ""}`}
						disabled={isDisabled}
					/>
				</td>
				<td className="border-r border-border align-middle">
					<CustomCategoryCombobox
						value={row.category}
						onChange={(val) => handleCellChange(originalIndex, "category", val)}
						onKeyDown={(e) => handleKeyDown(e, originalIndex)}
						className={!isDisabled && shouldHighlightInvalid(row, originalIndex, row.category === "") ? invalidCell : ""}
						disabled={isDisabled}
					/>
				</td>
				<td className="border-r border-border align-middle">
					<input
						type="text"
						value={row.diseasesTreated || ""}
						onChange={(e) => handleCellChange(originalIndex, "diseasesTreated", e.target.value)}
						onKeyDown={(e) => handleKeyDown(e, originalIndex)}
						placeholder="e.g. Diabetes, Arthritis"
						className={cellBase}
						disabled={isDisabled}
					/>
				</td>
				<td className="border-r border-border align-middle">
					<div className="flex items-center gap-2 p-3">
						<input
							type="checkbox"
							id={`presc-${row.id}`}
							className="size-4 cursor-pointer"
							checked={row.prescription}
							onChange={(e) => {
								handleCellChange(originalIndex, "prescription", e.target.checked);
							}}
							disabled={isDisabled}
						/>
						<label htmlFor={`presc-${row.id}`} className="text-sm text-foreground/80">
							Req
						</label>
					</div>
				</td>
				<td className="border-r border-border align-middle">
					<ImageUploaderCell
						images={row.images || []}
						onImagesChange={(newImages) => {
							if (!isDisabled) {
								handleCellChange(originalIndex, "images", newImages);
							}
						}}
						disabled={isDisabled}
					/>
				</td>
				<td className="align-middle">
					<div className="flex items-center justify-center gap-2">
						{isDisabled ? (
							<>
								<Button
									variant="ghost"
									size="icon"
									className="size-8 text-primary"
									title="Unarchive row"
									onClick={() => {
										const newRows = [...rows];
										const item = newRows.splice(originalIndex, 1)[0];
										item.isArchived = false;

										let lastFilledIndex = -1;
										for (let i = 0; i < newRows.length; i++) {
											if (!newRows[i].isArchived && !isRowEmpty(newRows[i])) {
												lastFilledIndex = i;
											}
										}

										if (lastFilledIndex === -1) {
											let firstActive = newRows.findIndex((r) => !r.isArchived);
											if (firstActive === -1) newRows.push(item);
											else newRows.splice(firstActive, 0, item);
										} else {
											newRows.splice(lastFilledIndex + 1, 0, item);
										}

										updateRowsAndSync(newRows);
									}}
								>
									<RotateCcw size={16} />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="size-8 text-destructive hover:text-destructive"
									title="Delete row"
									onClick={() => {
										if (window.confirm("Are you sure you want to permanently delete this archived row?")) {
											deleteImagesFromCloudinary(rows[originalIndex]?.images || []);
											const newRows = [...rows];
											newRows.splice(originalIndex, 1);
											updateRowsAndSync(newRows);
										}
									}}
								>
									<X size={18} />
								</Button>
							</>
						) : (
							<>
								<Button
									variant="ghost"
									size="icon"
									className="size-8 text-primary disabled:opacity-30"
									title="Archive row"
									disabled={isRowEmpty(row)}
									onClick={() => {
										if (isRowEmpty(row)) return;
										handleCellChange(originalIndex, "isArchived", true);
									}}
								>
									<Flag size={16} />
								</Button>
								{row.isStaged && row.errors && row.errors.length > 0 ? (
									<Button
										variant="ghost"
										size="icon"
										className="size-8 text-primary"
										title="View Errors"
										onClick={() => setActiveErrorModalIndex(originalIndex)}
									>
										<Info size={16} />
									</Button>
								) : null}
								<Button
									variant="ghost"
									size="icon"
									className="size-8 text-destructive hover:text-destructive"
									title="Delete row"
									onClick={() => {
										deleteImagesFromCloudinary(rows[originalIndex]?.images || []);
										const newRows = [...rows];
										newRows.splice(originalIndex, 1);
										updateRowsAndSync(newRows);
									}}
								>
									<X size={18} />
								</Button>
							</>
						)}
					</div>
				</td>
			</tr>
		);
	};

	return (
		<div>
			<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-4">
					<h2 className="text-xl font-bold text-primary">Bulk Medicine Upload</h2>
					<Badge variant="secondary">{saveStatus}</Badge>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					<form className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-1.5" onSubmit={handleZipSubmit}>
						{zipError ? <span className="text-xs text-destructive">{zipError}</span> : null}
						<label
							className="max-w-37.5 cursor-pointer overflow-hidden rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-medium text-ellipsis whitespace-nowrap text-foreground hover:bg-muted/70"
							title={zipFile ? zipFile.name : "Choose .zip, .csv, or .xlsx File"}
						>
							<input
								type="file"
								accept=".zip,.csv,.xlsx,application/zip,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
								onClick={(e) => {
									e.target.value = null;
								}}
								onChange={handleZipChange}
								className="hidden"
								required
							/>
							<span>{zipFile ? zipFile.name : "Choose File"}</span>
						</label>
						<Button type="submit" size="sm" variant="secondary">
							Upload
						</Button>
					</form>
					<div className="flex gap-3">
						<Button type="button" variant="destructive" onClick={handleClearDraft}>
							Clear Draft
						</Button>
						<Button type="button" onClick={handleSubmit}>
							Save & Submit
						</Button>
					</div>
				</div>
			</div>

			<div className="max-h-[65vh] overflow-auto rounded-lg bg-card shadow-sm" ref={tableWrapperRef} onScroll={checkStagedVisibility}>
				<table className="bulk-table min-w-225 w-full border-collapse">
					<thead>
						<tr>
							{["#", "Medicine Name *", "Description *", "Price (₹) *", "Quantity *", "Category *", "Diseases Treated", "Prescription", "Images", "Actions"].map(
								(label) => (
									<th
										key={label}
										className="sticky top-0 z-10 border-r border-b-2 border-border bg-muted/60 p-3 text-left text-xs font-bold text-primary last:border-r-0"
									>
										{label}
									</th>
								)
							)}
						</tr>
					</thead>
					<tbody>
						{(() => {
							let activeIndex = 0;
							return rows.map((row, index) => {
								if (row.isArchived) return null;
								activeIndex++;
								return renderRow(row, index, activeIndex, false);
							});
						})()}
					</tbody>
				</table>
			</div>

			<div className="mt-4 flex gap-3 px-1">
				<Button
					variant="secondary"
					onClick={() => {
						updateRowsAndSync([...rows, createEmptyRow(Date.now().toString())]);
						scrollToBottom();
					}}
				>
					+ Add 1 Row
				</Button>
				<Button
					variant="secondary"
					onClick={() => {
						const newRows = Array.from({ length: 10 }).map((_, i) => createEmptyRow(Date.now().toString() + i));
						updateRowsAndSync([...rows, ...newRows]);
						scrollToBottom();
					}}
				>
					+ Add 10 Rows
				</Button>
			</div>

			{rows.some((r) => r.isArchived) ? (
				<div className="mt-10 rounded-lg border border-border bg-muted/30 p-4">
					<div className="flex items-center justify-between">
						<button
							className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
							onClick={() => setIsArchiveExpanded(!isArchiveExpanded)}
						>
							{isArchiveExpanded ? "▼ Hide Archived Rows" : "▶ Show Archived Rows"} ({rows.filter((r) => r.isArchived).length})
						</button>
						{isArchiveExpanded ? (
							<Button
								variant="destructive"
								size="sm"
								onClick={() => {
									if (window.confirm("Are you sure you want to delete ALL archived rows? This cannot be undone.")) {
										const archivedImages = rows.filter((r) => r.isArchived).flatMap((r) => r.images || []);
										deleteImagesFromCloudinary(archivedImages);
										const newRows = rows.filter((r) => !r.isArchived);
										updateRowsAndSync(newRows);
										setIsArchiveExpanded(false);
									}
								}}
							>
								Delete All
							</Button>
						) : null}
					</div>
					{isArchiveExpanded ? (
						<div className="mt-4 overflow-x-auto">
							<table className="bulk-table min-w-225 w-full border-collapse opacity-80">
								<thead>
									<tr>
										{["#", "Medicine Name *", "Description *", "Price (₹) *", "Quantity *", "Category *", "Diseases Treated", "Prescription", "Images", "Actions"].map(
											(label) => (
												<th
													key={label}
													className="sticky top-0 z-10 border-r border-b-2 border-border bg-muted/60 p-3 text-left text-xs font-bold text-primary last:border-r-0"
												>
													{label}
												</th>
											)
										)}
									</tr>
								</thead>
								<tbody>
									{(() => {
										let archivedIndex = 0;
										return rows.map((row, index) => {
											if (!row.isArchived) return null;
											archivedIndex++;
											return renderRow(row, index, archivedIndex, true);
										});
									})()}
								</tbody>
							</table>
						</div>
					) : null}
				</div>
			) : null}

			{/* Floating Navigation Arrows & Actions for Staged Rows */}
			{rows.some((r) => r.isStaged && !r.isArchived) ? (
				<>
					<div className="fixed top-[40%] left-5 z-100 flex flex-col gap-2.5">
						<Button
							className="rounded-full shadow-lg"
							title="Accept All Valid Staged Rows"
							onClick={() => {
								const newRows = rows.map((r) => {
									const isValid = checkIsRowValid(r);
									if (r.isStaged && isValid && (!r.errors || r.errors.length === 0)) {
										return { ...r, isStaged: false, isValid: true };
									}
									return r;
								});
								updateRowsAndSync(newRows);
							}}
						>
							<Check data-icon="inline-start" /> All
						</Button>
						<div className="mt-2.5 flex flex-col gap-1 rounded-full bg-primary/10 p-1.5">
							<Button
								variant="secondary"
								size="icon"
								className="rounded-full"
								onClick={() => jumpToStagedRowViewport("up")}
								title="Previous Staged Row"
								disabled={!stagedAbove}
							>
								<ChevronUp size={18} />
							</Button>
							<Button
								variant="secondary"
								size="icon"
								className="rounded-full"
								onClick={() => jumpToStagedRowViewport("down")}
								title="Next Staged Row"
								disabled={!stagedBelow}
							>
								<ChevronDown size={18} />
							</Button>
						</div>
					</div>

					<div className="fixed top-[40%] right-5 z-100">
						<Button
							variant="destructive"
							className="rounded-full shadow-lg"
							title="Reject All Staged Rows"
							onClick={() => {
								if (window.confirm("Are you sure you want to reject and delete all staged rows?")) {
									const stagedImages = rows.filter((r) => r.isStaged && !r.isArchived).flatMap((r) => r.images || []);
									deleteImagesFromCloudinary(stagedImages);
									const newRows = rows.filter((r) => !(r.isStaged && !r.isArchived));
									updateRowsAndSync(newRows);
								}
							}}
						>
							<X data-icon="inline-start" /> All
						</Button>
					</div>
				</>
			) : null}

			{/* Error Details Modal */}
			<Dialog open={activeErrorModalIndex !== null} onOpenChange={(open) => !open && setActiveErrorModalIndex(null)}>
				<DialogContent className="max-w-md">
					{activeErrorModalIndex !== null && rows[activeErrorModalIndex] ? (
						<>
							<DialogHeader>
								<DialogTitle className="text-destructive">Row {activeErrorModalIndex + 1} Errors</DialogTitle>
							</DialogHeader>
							<div className="flex max-h-[60vh] flex-col gap-2.5 overflow-y-auto">
								{rows[activeErrorModalIndex].errors?.map((err) => (
									<div
										key={err.id || Math.random()}
										className="flex items-center justify-between gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
									>
										<span>{err.message}</span>
										<Button size="sm" variant="destructive" onClick={() => dismissError(activeErrorModalIndex, err.id)} title="Dismiss this error">
											Dismiss
										</Button>
									</div>
								))}
								{!rows[activeErrorModalIndex].errors || rows[activeErrorModalIndex].errors.length === 0 ? (
									<div className="rounded-md bg-primary/10 p-5 text-center font-medium text-primary">No complex errors remaining.</div>
								) : null}
							</div>
							<DialogFooter>
								<Button variant="secondary" onClick={() => setActiveErrorModalIndex(null)}>
									Close
								</Button>
							</DialogFooter>
						</>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default BulkMedicineUpload;
