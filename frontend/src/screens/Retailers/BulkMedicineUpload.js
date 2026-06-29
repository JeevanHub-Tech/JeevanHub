import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './BulkMedicineUpload.css';
import ImageUploaderCell from '../../components/ImageUploaderCell';

// Initial structure for a single medicine row
const createEmptyRow = (id) => ({
    id,
    name: '',
    price: '',
    quantity: '',
    category: '',
    description: '',
    prescription: false,
    images: [],
    isValid: true,
    isArchived: false
});
const CATEGORY_OPTIONS = [
    "Churna", "Bhasma", "Asava/Arishta", "Vati/Guti", 
    "Taila", "Ghrita", "Lehya", "Syrup", "Capsules", "Ointment", "Other"
];

const CustomCategoryCombobox = ({ value, onChange, onKeyDown, className, disabled }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [filteredOptions, setFilteredOptions] = React.useState(CATEGORY_OPTIONS);
    const wrapperRef = React.useRef(null);

    React.useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        onChange(val);
        setFilteredOptions(CATEGORY_OPTIONS.filter(opt => opt.toLowerCase().includes(val.toLowerCase())));
        setIsOpen(true);
    };

    return (
        <div ref={wrapperRef} className="custom-combobox-wrapper">
            <input
                type="text"
                value={value}
                onChange={handleInputChange}
                onKeyDown={onKeyDown}
                onFocus={() => {
                    setFilteredOptions(CATEGORY_OPTIONS.filter(opt => opt.toLowerCase().includes((value || '').toLowerCase())));
                    setIsOpen(true);
                }}
                className={`custom-combobox-input ${className || ''}`}
                disabled={disabled}
                placeholder="Select or type..."
            />
            <span 
                className="custom-combobox-arrow" 
                onClick={() => {
                    if (!disabled) {
                        setFilteredOptions(CATEGORY_OPTIONS);
                        setIsOpen(!isOpen);
                    }
                }}
            >▼</span>
            
            {isOpen && !disabled && (
                <ul className="custom-combobox-dropdown">
                    {filteredOptions.map((opt, i) => (
                        <li key={i} onMouseDown={() => {
                            onChange(opt);
                            setIsOpen(false);
                        }}>{opt}</li>
                    ))}
                    {filteredOptions.length === 0 && (
                        <li className="no-options">Press Enter for custom</li>
                    )}
                </ul>
            )}
        </div>
    );
};

const BulkMedicineUpload = () => {
    const createEmptyRows = (count) => {
        return Array.from({ length: count }).map((_, i) => createEmptyRow(Date.now().toString() + i));
    };

    const [rows, setRows] = useState(createEmptyRows(1));
    const [saveStatus, setSaveStatus] = useState('All changes saved to cloud.');
    const [zipFile, setZipFile] = useState(null);
    const [zipError, setZipError] = useState(null);
    const [activeErrorModalIndex, setActiveErrorModalIndex] = useState(null);
    const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState(null);
    const [stagedAbove, setStagedAbove] = useState(false);
    const [stagedBelow, setStagedBelow] = useState(false);
    const tableWrapperRef = React.useRef(null);
    const debounceTimeout = React.useRef(null);

    // Debounced auto-save logic
    const autoSaveDraft = useCallback((currentRows, past, future) => {
        setSaveStatus('Saving...');
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(async () => {
            try {
                const token = localStorage.getItem('token');
                await axios.post(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/drafts/medicine`, {
                    present: currentRows
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSaveStatus('All changes saved to cloud.');
            } catch (error) {
                console.error("Failed to save draft", error);
                setSaveStatus('Error saving draft. Retrying...');
            }
        }, 1200); // Wait 1.2s after last change before hitting API
    }, []);

    // Load draft on mount
    useEffect(() => {
        const fetchDraft = async () => {
            try {
                setSaveStatus('Loading draft...');
                const token = localStorage.getItem('token');
                const res = await axios.get(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/drafts/medicine`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data && res.data.present && res.data.present.length > 0) {
                    setRows(res.data.present);
                }
                setSaveStatus('All changes saved to cloud.');
            } catch (error) {
                console.error("Failed to load draft", error);
                setSaveStatus('Error loading draft.');
            }
        };
        fetchDraft();
    }, []);

    // Syncs to backend (used for structural changes)
    const updateRowsAndSync = (newRows) => {
        setRows(newRows);
        autoSaveDraft(newRows);
    };

    // Fast local state update for typing
    const handleCellChange = (index, field, value) => {
        // Prevent editing if previous row is empty (sequential entry)
        if (index > 0) {
            const prev = rows[index - 1];
            const isPrevEmpty = prev.name.trim() === '' && prev.price === '' && prev.quantity === '' && prev.category === '' && prev.description.trim() === '' && prev.images.length === 0;
            if (isPrevEmpty && field !== 'isArchived') {
                alert("Please fill out the previous row before continuing.");
                return;
            }
        }

        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        // Validate row
        const r = newRows[index];
        r.isValid = checkIsRowValid(r);
        setRows(newRows);
        
        // Background sync to backend
        autoSaveDraft(newRows);
    };
    
    const deleteImagesFromCloudinary = async (urls) => {
        const cloudinaryUrls = urls.filter(url => url && url.includes('cloudinary'));
        if (cloudinaryUrls.length === 0) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/medicines/delete-images`, {
                urls: cloudinaryUrls
            }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
            console.error("Failed to delete images from cloudinary", err);
        }
    };

    // Check if a row is completely empty
    const isRowEmpty = (r) => {
        return r.name.trim() === '' && r.price === '' && r.quantity === '' && r.category === '' && r.description.trim() === '' && r.images.length === 0;
    };

    // Check if a row has all required fields valid
    const checkIsRowValid = (r) => {
        return r.name.trim() !== '' && r.price > 0 && r.quantity > 0 && r.category !== '' && r.description.trim() !== '';
    };

    // Determine if a cell should be highlighted red
    const shouldHighlightInvalid = (row, index, fieldIsInvalid) => {
        if (isRowEmpty(row)) return false; // Never highlight completely empty rows
        if (activeRowIndex === index) return false; // Never highlight rows currently being edited
        return fieldIsInvalid;
    };

    const handleClearDraft = () => {
        if (window.confirm("Are you sure you want to clear the active draft? Archived rows will be kept.")) {
            const activeRows = rows.filter(r => !r.isArchived);
            const archivedRows = rows.filter(r => r.isArchived);
            
            // Collect all images to delete from cloud (only from active rows)
            const activeImages = activeRows.flatMap(r => r.images || []);

            const empty = createEmptyRows(1);
            const newRows = [...archivedRows, ...empty];
            
            // 1. UPDATE UI INSTANTLY
            setRows(newRows);
            
            // 2. BACKGROUND TASKS (Do not block the UI)
            deleteImagesFromCloudinary(activeImages).catch(e => console.error("Failed to delete images", e));
            
            const token = localStorage.getItem('token');
            axios.post(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/drafts/medicine`, {
                present: newRows
            }, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(() => {
                setSaveStatus('All changes saved to cloud.');
            }).catch(e => {
                console.error("Failed to clear draft on backend", e);
            });
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            if (tableWrapperRef.current) {
                tableWrapperRef.current.scrollTo({
                    top: tableWrapperRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 50);
    };

    const checkStagedVisibility = useCallback(() => {
        if (!tableWrapperRef.current) return;
        const wrapper = tableWrapperRef.current;
        const rowsElements = wrapper.querySelectorAll('.bulk-table tbody tr.staged-row');
        let above = false;
        let below = false;

        const wrapperTopRaw = wrapper.getBoundingClientRect().top;
        const header = wrapper.querySelector('thead');
        const headerHeight = header ? header.getBoundingClientRect().height : 0;
        const wrapperTop = wrapperTopRaw + headerHeight;
        const wrapperBottom = wrapper.getBoundingClientRect().bottom;

        rowsElements.forEach(rowEl => {
            const rect = rowEl.getBoundingClientRect();
            const rowHeight = rect.height;
            // Consider row "above" if less than 70% of it is visible at the top
            if (rect.bottom < wrapperTop + 0.7 * rowHeight) above = true;
            // Consider row "below" if less than 70% of it is visible at the bottom
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
        const rowsElements = Array.from(wrapper.querySelectorAll('.bulk-table tbody tr.staged-row'));
        
        const wrapperTopRaw = wrapper.getBoundingClientRect().top;
        const header = wrapper.querySelector('thead');
        const headerHeight = header ? header.getBoundingClientRect().height : 0;
        const wrapperTop = wrapperTopRaw + headerHeight;
        const wrapperBottom = wrapper.getBoundingClientRect().bottom;

        const scrollToAndFocus = (rowEl, align) => {
            const rect = rowEl.getBoundingClientRect();
            
            let scrollDiff = 0;
            if (align === 'start') {
                // Align row's top edge to the wrapper's top edge
                scrollDiff = rect.top - wrapperTop - 5; // subtract 5px for a little breathing room
            } else {
                // Align row's bottom edge to the wrapper's bottom edge
                scrollDiff = rect.bottom - wrapperBottom + 5; // add 5px for breathing room
            }
            
            wrapper.scrollTo({ top: wrapper.scrollTop + scrollDiff, behavior: 'smooth' });
            
            // Find the name input (in the second column) and put the cursor in it
            const nameInput = rowEl.querySelector('td:nth-child(2) input');
            if (nameInput) nameInput.focus({ preventScroll: true });
        };

        if (direction === 'up') {
            for (let i = rowsElements.length - 1; i >= 0; i--) {
                const rect = rowsElements[i].getBoundingClientRect();
                const rowHeight = rect.height;
                if (rect.bottom < wrapperTop + 0.7 * rowHeight) {
                    scrollToAndFocus(rowsElements[i], 'start');
                    break;
                }
            }
        } else {
            for (let i = 0; i < rowsElements.length; i++) {
                const rect = rowsElements[i].getBoundingClientRect();
                const rowHeight = rect.height;
                if (rect.top > wrapperBottom - 0.7 * rowHeight) {
                    scrollToAndFocus(rowsElements[i], 'end');
                    break;
                }
            }
        }
    };

    const dismissError = (rowIndex, errorId) => {
        const newRows = [...rows];
        const r = newRows[rowIndex];
        if (r.errors) {
            r.errors = r.errors.filter(e => e.id !== errorId);
        }
        updateRowsAndSync(newRows);
    };

    const handleSubmit = async () => {
        // Only submit active, manually accepted (unstaged), completely valid rows
        const validRows = rows.filter(r => !r.isArchived && !r.isStaged && r.isValid && r.name.trim() !== '');
        if (validRows.length === 0) {
            alert("No valid, unstaged rows ready to submit. Please ensure you have accepted staged rows and filled out all required fields.");
            return;
        }

        if (!window.confirm(`You are about to submit ${validRows.length} valid medicine(s). Proceed?`)) return;

        setSaveStatus("Submitting to database...");
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/medicines/add-bulk`, { medicines: validRows }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Medicines added successfully!");
            
            // Keep any rows that were NOT submitted (half-filled, invalid, staged, archived, or completely empty)
            const remainingRows = rows.filter(r => r.isArchived || r.isStaged || !r.isValid || r.name.trim() === '');
            
            // Ensure there is at least one active row available to type in
            const activeRemaining = remainingRows.filter(r => !r.isArchived);
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
        if (e.key === 'Enter') {
            e.preventDefault();
            if (rowIndex === rows.length - 1) {
                // If on the last row, add a new one
                const newRows = [...rows, createEmptyRow(Date.now().toString())];
                updateRowsAndSync(newRows);
                scrollToBottom();
            } else {
                // Not the last row, move focus down 1 row same column?
                // Tab naturally handles left-to-right.
            }
        }
    };

    const handleZipChange = (e) => {
        setZipFile(e.target.files[0]);
    };

    const handleZipSubmit = async (e) => {
        e.preventDefault();
        if (!zipFile) {
            setZipError("Please upload a zip file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", zipFile);

        try {
            const token = localStorage.getItem("token");
            setZipError("Parsing file..."); // Provide loading feedback
            const response = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/medicines/parse-bulk-upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                const newStagedRows = data.stagedRows || [];
                
                // Remove trailing empty rows so staged rows flow cleanly after manual entries
                let filteredRows = [...rows];
                while (filteredRows.length > 0 && isRowEmpty(filteredRows[filteredRows.length - 1]) && !filteredRows[filteredRows.length - 1].isStaged) {
                    filteredRows.pop();
                }
                
                updateRowsAndSync([...filteredRows, ...newStagedRows]);
                alert("File parsed successfully! Please review the staged items.");
                setZipFile(null);
                setZipError(null);
            } else {
                const data = await response.json();
                setZipError(data.message || "Failed to add items from zip");
            }
        } catch (error) {
            setZipError("An error occurred while uploading the zip file");
        }
    };

    const renderRow = (row, originalIndex, displayIndex, isArchivedTable) => {
        const isDisabled = isArchivedTable;
        
        return (
            <tr 
                key={row.id} 
                className={`${(!isArchivedTable && !row.isValid && !isRowEmpty(row) && activeRowIndex !== originalIndex) ? 'invalid-row' : ''} ${row.isStaged ? 'staged-row' : ''}`}
                onFocus={() => !isDisabled && setActiveRowIndex(originalIndex)}
                onBlur={(e) => {
                    if (!isDisabled && !e.currentTarget.contains(e.relatedTarget)) {
                        setActiveRowIndex(null);
                    }
                }}
            >
                <td className="row-number" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    {row.isStaged && !isArchivedTable && (
                        <button 
                            className="accept-row-btn" 
                            title="Accept Row"
                            onClick={() => handleCellChange(originalIndex, 'isStaged', false)}
                        >✓</button>
                    )}
                    <span>{displayIndex}</span>
                </td>
                <td>
                    <input 
                        type="text" 
                        value={row.name} 
                        onChange={(e) => handleCellChange(originalIndex, 'name', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, originalIndex)}
                        placeholder="Name"
                        className={!isDisabled && shouldHighlightInvalid(row, originalIndex, row.name.trim() === '') ? 'invalid-cell' : ''}
                        disabled={isDisabled}
                    />
                </td>
                <td>
                    <textarea 
                        value={row.description} 
                        onChange={(e) => handleCellChange(originalIndex, 'description', e.target.value)}
                        onFocus={(e) => {
                            if (isDisabled) return;
                            setActiveRowIndex(originalIndex);
                            e.target.style.height = '62px';
                            e.target.style.height = Math.min(Math.max(e.target.scrollHeight, 62), 102) + 'px';
                        }}
                        onBlur={(e) => {
                            if (isDisabled) return;
                            e.target.style.height = '62px';
                            e.target.scrollTop = e.target.scrollHeight;
                        }}
                        onInput={(e) => {
                            if (isDisabled) return;
                            e.target.style.height = '62px';
                            e.target.style.height = Math.min(Math.max(e.target.scrollHeight, 62), 102) + 'px';
                            e.target.scrollTop = e.target.scrollHeight;
                        }}
                        placeholder="Description"
                        style={{ height: '62px' }}
                        className={`desc-textarea ${!isDisabled && shouldHighlightInvalid(row, originalIndex, row.description.trim() === '') ? 'invalid-cell' : ''}`}
                        disabled={isDisabled}
                    />
                </td>
                <td>
                    <input 
                        type="number" 
                        value={row.price} 
                        onChange={(e) => handleCellChange(originalIndex, 'price', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, originalIndex)}
                        placeholder="0.00"
                        className={!isDisabled && shouldHighlightInvalid(row, originalIndex, row.price <= 0 || row.price === '') ? 'invalid-cell' : ''}
                        disabled={isDisabled}
                    />
                </td>
                <td>
                    <input 
                        type="number" 
                        value={row.quantity} 
                        onChange={(e) => handleCellChange(originalIndex, 'quantity', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, originalIndex)}
                        placeholder="0"
                        className={!isDisabled && shouldHighlightInvalid(row, originalIndex, row.quantity <= 0 || row.quantity === '') ? 'invalid-cell' : ''}
                        disabled={isDisabled}
                    />
                </td>
                <td>
                    <CustomCategoryCombobox
                        value={row.category}
                        onChange={(val) => handleCellChange(originalIndex, 'category', val)}
                        onKeyDown={(e) => handleKeyDown(e, originalIndex)}
                        className={!isDisabled && shouldHighlightInvalid(row, originalIndex, row.category === '') ? 'invalid-cell' : ''}
                        disabled={isDisabled}
                    />
                </td>
                <td>
                    <div className="toggle-switch">
                        <input 
                            type="checkbox" 
                            id={`presc-${row.id}`}
                            checked={row.prescription} 
                            onChange={(e) => {
                                handleCellChange(originalIndex, 'prescription', e.target.checked);
                            }}
                            disabled={isDisabled}
                        />
                        <label htmlFor={`presc-${row.id}`}>Req</label>
                    </div>
                </td>
                <td>
                    <ImageUploaderCell 
                        images={row.images || []} 
                        onImagesChange={(newImages) => {
                            if (!isDisabled) {
                                handleCellChange(originalIndex, 'images', newImages);
                            }
                        }} 
                        disabled={isDisabled}
                    />
                </td>
                <td>
                    <div className="action-buttons-inline">
                        {isDisabled ? (
                            <>
                                <button className="unarchive-btn" onClick={() => {
                                    const newRows = [...rows];
                                    const item = newRows.splice(originalIndex, 1)[0];
                                    item.isArchived = false;
                                    
                                    // Find index of last filled row
                                    let lastFilledIndex = -1;
                                    for (let i = 0; i < newRows.length; i++) {
                                        if (!newRows[i].isArchived && !isRowEmpty(newRows[i])) {
                                            lastFilledIndex = i;
                                        }
                                    }
                                    
                                    if (lastFilledIndex === -1) {
                                        // If absolutely no filled active rows exist, put it at the very top of active rows
                                        let firstActive = newRows.findIndex(r => !r.isArchived);
                                        if (firstActive === -1) newRows.push(item);
                                        else newRows.splice(firstActive, 0, item);
                                    } else {
                                        // Insert safely after the last filled active row
                                        newRows.splice(lastFilledIndex + 1, 0, item);
                                    }
                                    
                                    updateRowsAndSync(newRows);
                                }} title="Unarchive row">↺</button>
                                <button className="delete-row-btn" onClick={() => {
                                    if (window.confirm("Are you sure you want to permanently delete this archived row?")) {
                                        deleteImagesFromCloudinary(rows[originalIndex]?.images || []);
                                        const newRows = [...rows];
                                        newRows.splice(originalIndex, 1);
                                        updateRowsAndSync(newRows);
                                    }
                                }} title="Delete row">×</button>
                            </>
                        ) : (
                            <>
                                <button 
                                    className="archive-row-btn" 
                                    onClick={() => {
                                        if (isRowEmpty(row)) return;
                                        handleCellChange(originalIndex, 'isArchived', true);
                                    }} 
                                    title="Archive row"
                                    disabled={isRowEmpty(row)}
                                    style={{ opacity: isRowEmpty(row) ? 0.3 : 1, cursor: isRowEmpty(row) ? 'not-allowed' : 'pointer' }}
                                >⚑</button>
                                {row.isStaged && row.errors && row.errors.length > 0 && (
                                    <button 
                                        className="row-error-icon"
                                        title="View Errors"
                                        onClick={() => setActiveErrorModalIndex(originalIndex)}
                                    >ⓘ</button>
                                )}
                                <button className="delete-row-btn" onClick={() => {
                                    deleteImagesFromCloudinary(rows[originalIndex]?.images || []);
                                    const newRows = [...rows];
                                    newRows.splice(originalIndex, 1);
                                    updateRowsAndSync(newRows);
                                }} title="Delete row">×</button>
                            </>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <div className="bulk-upload-container">
            <div className="bulk-header">
                <div>
                    <h2>Bulk Medicine Upload</h2>
                    <div className="bulk-status">{saveStatus}</div>
                </div>
                
                <div className="header-actions" style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <form className="zip-form-inline" onSubmit={handleZipSubmit} style={{ margin: 0 }}>
                        {zipError && <span className="zip-error">{zipError}</span>}
                        <label className="zip-file-label" title={zipFile ? zipFile.name : 'Choose ZIP File'}>
                            <input 
                                type="file" 
                                accept=".zip" 
                                onClick={(e) => { e.target.value = null; }}
                                onChange={handleZipChange} 
                                style={{ display: 'none' }} 
                                required 
                            />
                            <span>{zipFile ? zipFile.name : 'Choose File'}</span>
                        </label>
                        <button type="submit" className="zip-btn">Upload</button>
                    </form>
                   <div className="bulk-actions" style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={handleClearDraft} style={{ background: '#ef5350' }}>Clear Draft</button>
                    <button type="button" onClick={handleSubmit} style={{ background: '#4caf50' }}>Save & Submit</button>
                </div>
            </div>
        </div>
            
            <div className="bulk-table-wrapper" ref={tableWrapperRef} onScroll={checkStagedVisibility}>
                <table className="bulk-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Medicine Name *</th>
                            <th>Description *</th>
                            <th>Price (₹) *</th>
                            <th>Quantity *</th>
                            <th>Category *</th>
                            <th>Prescription</th>
                            <th>Images</th>
                            <th>Actions</th>
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

            <div className="add-rows-container">
                <button onClick={() => {
                    updateRowsAndSync([...rows, createEmptyRow(Date.now().toString())]);
                    scrollToBottom();
                }}>+ Add 1 Row</button>
                <button onClick={() => {
                    const newRows = Array.from({ length: 10 }).map((_, i) => createEmptyRow(Date.now().toString() + i));
                    updateRowsAndSync([...rows, ...newRows]);
                    scrollToBottom();
                }}>+ Add 10 Rows</button>
            </div>
            
            {rows.some(r => r.isArchived) && (
                <div className="archived-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button className="toggle-archive-btn" onClick={() => setIsArchiveExpanded(!isArchiveExpanded)}>
                            {isArchiveExpanded ? "▼ Hide Archived Rows" : "▶ Show Archived Rows"} ({rows.filter(r => r.isArchived).length})
                        </button>
                        {isArchiveExpanded && (
                            <button className="delete-all-archived-btn" onClick={() => {
                                if (window.confirm("Are you sure you want to delete ALL archived rows? This cannot be undone.")) {
                                    const archivedImages = rows.filter(r => r.isArchived).flatMap(r => r.images || []);
                                    deleteImagesFromCloudinary(archivedImages);
                                    const newRows = rows.filter(r => !r.isArchived);
                                    updateRowsAndSync(newRows);
                                    setIsArchiveExpanded(false);
                                }
                            }}>Delete All</button>
                        )}
                    </div>
                    {isArchiveExpanded && (
                        <div className="archived-table-wrapper">
                            <table className="bulk-table archived-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Medicine Name *</th>
                                        <th>Description *</th>
                                        <th>Price (₹) *</th>
                                        <th>Quantity *</th>
                                        <th>Category *</th>
                                        <th>Prescription</th>
                                        <th>Images</th>
                                        <th>Actions</th>
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
                    )}
                </div>
            )}

            {/* Floating Navigation Arrows & Actions for Staged Rows */}
            {rows.some(r => r.isStaged && !r.isArchived) && (
                <>
                    <div className="staged-nav-container left-nav">
                        <button 
                            style={{ background: '#4caf50' }}
                            title="Accept All Valid Staged Rows"
                            onClick={() => {
                                const newRows = rows.map(r => {
                                    const isValid = checkIsRowValid(r);
                                    if (r.isStaged && isValid && (!r.errors || r.errors.length === 0)) {
                                        return { ...r, isStaged: false, isValid: true };
                                    }
                                    return r;
                                });
                                updateRowsAndSync(newRows);
                            }}
                        >✓ All</button>
                        <div className="staged-nav-divider"></div>
                        <div className="nav-arrows-group">
                            <button 
                                onClick={() => jumpToStagedRowViewport('up')} 
                                title="Previous Staged Row"
                                disabled={!stagedAbove}
                                style={{ opacity: stagedAbove ? 1 : 0.4, cursor: stagedAbove ? 'pointer' : 'default' }}
                            >↑</button>
                            <button 
                                onClick={() => jumpToStagedRowViewport('down')} 
                                title="Next Staged Row"
                                disabled={!stagedBelow}
                                style={{ opacity: stagedBelow ? 1 : 0.4, cursor: stagedBelow ? 'pointer' : 'default' }}
                            >↓</button>
                        </div>
                    </div>

                    <div className="staged-nav-container right-nav">
                        <button 
                            style={{ background: '#ef5350' }}
                            title="Reject All Staged Rows"
                            onClick={() => {
                                if (window.confirm("Are you sure you want to reject and delete all staged rows?")) {
                                    const stagedImages = rows.filter(r => r.isStaged && !r.isArchived).flatMap(r => r.images || []);
                                    deleteImagesFromCloudinary(stagedImages);
                                    const newRows = rows.filter(r => !(r.isStaged && !r.isArchived));
                                    updateRowsAndSync(newRows);
                                }
                            }}
                        >× All</button>
                    </div>
                </>
            )}

            {/* Error Details Modal */}
            {activeErrorModalIndex !== null && rows[activeErrorModalIndex] && (
                <div className="error-modal-overlay" onClick={() => setActiveErrorModalIndex(null)}>
                    <div className="error-modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Row {activeErrorModalIndex + 1} Errors</h3>
                        <div className="error-list">
                            {rows[activeErrorModalIndex].errors?.map(err => (
                                <div key={err.id || Math.random()} className="error-item">
                                    <span>⚠️ {err.message}</span>
                                    <button 
                                        className="dismiss-error-btn"
                                        onClick={() => dismissError(activeErrorModalIndex, err.id)}
                                        title="Dismiss this error"
                                    >Dismiss</button>
                                </div>
                            ))}
                            {(!rows[activeErrorModalIndex].errors || rows[activeErrorModalIndex].errors.length === 0) && (
                                <div className="success-text">No complex errors remaining.</div>
                            )}
                        </div>
                        <button className="close-modal-btn" onClick={() => setActiveErrorModalIndex(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkMedicineUpload;
