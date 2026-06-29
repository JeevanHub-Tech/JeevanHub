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

const BulkMedicineUpload = () => {
    const createEmptyRows = (count) => {
        return Array.from({ length: count }).map((_, i) => createEmptyRow(Date.now().toString() + i));
    };

    const [rows, setRows] = useState(createEmptyRows(5));
    const [saveStatus, setSaveStatus] = useState('All changes saved to cloud.');
    const [zipFile, setZipFile] = useState(null);
    const [zipError, setZipError] = useState(null);
    const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState(null);
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
        r.isValid = r.name.trim() !== '' && r.price > 0 && r.quantity > 0 && r.category !== '' && r.description.trim() !== '';
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

    // Determine if a cell should be highlighted red
    const shouldHighlightInvalid = (row, index, fieldIsInvalid) => {
        if (isRowEmpty(row)) return false; // Never highlight completely empty rows
        if (activeRowIndex === index) return false; // Never highlight rows currently being edited
        return fieldIsInvalid;
    };

    const handleClearDraft = async () => {
        if (window.confirm("Are you sure you want to clear the entire draft? This cannot be undone.")) {
            // Collect all images to delete from cloud
            const allImages = rows.flatMap(r => r.images || []);
            await deleteImagesFromCloudinary(allImages);

            const empty = createEmptyRows(5);
            setRows(empty);
            autoSaveDraft(empty);
        }
    };

    const handleSubmit = async () => {
        const validRows = rows.filter(r => !r.isArchived && r.isValid && r.name.trim() !== '');
        if (validRows.length === 0) {
            alert("No valid active rows to submit.");
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
            
            // clear draft safely without confirmation
            const empty = [createEmptyRow(Date.now().toString())];
            setRows(empty);
            autoSaveDraft(empty);
            
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
                // The new row will focus naturally on the next click, or we can use refs.
                // For simplicity, just creating the row allows them to hit Tab to jump into it.
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
            const response = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/medicines/add`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                alert("Zip uploaded successfully!");
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
                className={(!isArchivedTable && !row.isValid && !isRowEmpty(row) && activeRowIndex !== originalIndex) ? 'invalid-row' : ''}
                onFocus={() => !isDisabled && setActiveRowIndex(originalIndex)}
                onBlur={(e) => {
                    if (!isDisabled && !e.currentTarget.contains(e.relatedTarget)) {
                        setActiveRowIndex(null);
                    }
                }}
            >
                <td className="row-number">{displayIndex}</td>
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
                    <select 
                        value={row.category} 
                        onChange={(e) => handleCellChange(originalIndex, 'category', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, originalIndex)}
                        className={!isDisabled && shouldHighlightInvalid(row, originalIndex, row.category === '') ? 'invalid-cell' : ''}
                        disabled={isDisabled}
                    >
                        <option value="">Select...</option>
                        <option value="Churna">Churna (Powder)</option>
                        <option value="Bhasma">Bhasma (Ash)</option>
                        <option value="Asava/Arishta">Asava/Arishta (Decoction)</option>
                        <option value="Vati/Guti">Vati/Guti (Tablets)</option>
                        <option value="Taila">Taila (Oil)</option>
                        <option value="Ghrita">Ghrita (Ghee)</option>
                        <option value="Lehya">Lehya (Electuary)</option>
                        <option value="Syrup">Syrup</option>
                        <option value="Capsule">Capsule</option>
                        <option value="Other">Other</option>
                    </select>
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
                        <input type="file" accept=".zip" onChange={handleZipChange} required />
                        <button type="submit" className="zip-btn">Upload ZIP</button>
                    </form>
                    
                    <button onClick={handleClearDraft} style={{ background: '#ef5350' }}>Clear Draft</button>
                    <button onClick={handleSubmit} style={{ background: '#2e7d32' }}>Save & Submit</button>
                </div>
            </div>
            
            <div className="bulk-table-wrapper">
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
                <button onClick={() => updateRowsAndSync([...rows, createEmptyRow(Date.now().toString())])}>+ Add 1 Row</button>
                <button onClick={() => {
                    const newRows = Array.from({ length: 10 }).map((_, i) => createEmptyRow(Date.now().toString() + i));
                    updateRowsAndSync([...rows, ...newRows]);
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
        </div>
    );
};

export default BulkMedicineUpload;
