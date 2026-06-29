import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import './ImageUploaderCell.css';

const MAX_IMAGES = 10;

const ImageUploaderCell = ({ images, onImagesChange, disabled = false }) => {
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [previewState, setPreviewState] = useState({ url: null, x: 0, y: 0 });
    const [previewImgAspect, setPreviewImgAspect] = useState(null);

    // Auto-scroll to the right when a new image is added and slots > 3
    useEffect(() => {
        if (containerRef.current && images.length >= 3) {
            setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.scrollTo({
                        left: containerRef.current.scrollWidth,
                        behavior: 'smooth'
                    });
                }
            }, 100); // Slight delay to let React render the new slot
        }
    }, [images.length]);

    // Close preview on outside click or scroll
    useEffect(() => {
        const handleGlobalClick = () => {
            if (previewState.url) {
                setPreviewState({ url: null, x: 0, y: 0 });
            }
        };

        const handleGlobalScroll = (e) => {
            // Ignore scrolls that happen inside the preview popup itself
            if (e.target.classList && e.target.classList.contains('fixed-small-preview')) {
                return;
            }
            if (previewState.url) {
                setPreviewState({ url: null, x: 0, y: 0 });
            }
        };
        
        if (previewState.url) {
            document.addEventListener('click', handleGlobalClick);
            document.addEventListener('scroll', handleGlobalScroll, true); // Use capture to catch all scrolls in the tree
        }
        return () => {
            document.removeEventListener('click', handleGlobalClick);
            document.removeEventListener('scroll', handleGlobalScroll, true);
        };
    }, [previewState.url]);

    const handleFileSelect = async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('image', file);
            const token = localStorage.getItem('token');
            const res = await axios.post(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/medicines/upload-image`, formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.url) {
                // Ensure URL starts with a slash or is absolute to render correctly from frontend
                const imgUrl = res.data.url.startsWith('http') ? res.data.url : `/${res.data.url}`;
                onImagesChange([...images, imgUrl]);
            }
        } catch (error) {
            console.error('Error uploading image', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemove = async (index, e) => {
        e.stopPropagation();
        const newImages = [...images];
        const removedUrl = newImages.splice(index, 1)[0];
        onImagesChange(newImages);

        if (removedUrl && removedUrl.includes('cloudinary')) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/medicines/delete-images`, {
                    urls: [removedUrl]
                }, { headers: { Authorization: `Bearer ${token}` }});
            } catch (err) {
                console.error("Failed to delete image from Cloudinary", err);
            }
        }
    };

    // Drag and Drop Logic
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Ghost image styling workaround for native HTML5 drag
        e.currentTarget.style.opacity = '0.4';
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        setDraggedIndex(null);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";
        
        // Auto-scroll logic
        if (containerRef.current) {
            const container = containerRef.current;
            const scrollThreshold = 40;
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            
            if (x < scrollThreshold) {
                container.scrollLeft -= 10;
            } else if (x > rect.width - scrollThreshold) {
                container.scrollLeft += 10;
            }
        }
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) return;

        const newImages = [...images];
        const draggedImage = newImages[draggedIndex];
        
        // Remove from old pos
        newImages.splice(draggedIndex, 1);
        // Insert into new pos
        newImages.splice(targetIndex, 0, draggedImage);

        onImagesChange(newImages);
    };

    const totalSlots = disabled ? images.length : Math.min(MAX_IMAGES, Math.max(3, images.length + 1));
    const isScrollable = totalSlots > 3;

    const openPreview = (e, imgUrl) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setPreviewImgAspect(null); // Reset before opening
        setPreviewState({
            url: imgUrl.startsWith('/') ? `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}${imgUrl}` : imgUrl,
            x: rect.left + rect.width / 2,
            y: rect.top - 10
        });
    };

    return (
        <div className={`img-cell-container ${isScrollable ? 'scrollable' : ''}`} ref={containerRef}>
            {/* Filled Slots */}
            {images.map((imgUrl, index) => (
                <div 
                    key={`filled-${index}`} 
                    className="img-box filled"
                    draggable={!disabled}
                    onDragStart={!disabled ? (e) => handleDragStart(e, index) : undefined}
                    onDragEnd={!disabled ? handleDragEnd : undefined}
                    onDragOver={!disabled ? (e) => handleDragOver(e, index) : undefined}
                    onDrop={!disabled ? (e) => handleDrop(e, index) : undefined}
                    onClick={(e) => openPreview(e, imgUrl)}
                    title={disabled ? "Click to preview" : "Click to preview, hold to drag"}
                    style={{ cursor: disabled ? 'pointer' : undefined }}
                >
                    <img src={imgUrl.startsWith('/') ? `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}${imgUrl}` : imgUrl} alt={`img${index + 1}`} />
                    <span className="img-label">img{index + 1}</span>
                    {!disabled && <button className="remove-img-btn" onClick={(e) => handleRemove(index, e)}>×</button>}
                </div>
            ))}

            {/* Empty Slots */}
            {!disabled && Array.from({ length: totalSlots - images.length }).map((_, i) => {
                const globalIndex = images.length + i;
                return (
                    <div 
                        key={`empty-${globalIndex}`}
                        className={`img-box empty ${uploading && i === 0 ? 'uploading' : ''}`} 
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        title="Click to upload"
                    >
                        {uploading && i === 0 ? '...' : '+'}
                        <span className="img-label">img{globalIndex + 1}</span>
                    </div>
                );
            })}

            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleFileSelect}
            />

            {/* Small Fixed Preview Popup */}
            {previewState.url && createPortal(
                <div 
                    className="fixed-small-preview"
                    style={{ left: previewState.x, top: previewState.y }}
                    onClick={(e) => { e.stopPropagation(); setPreviewState({ url: null, x: 0, y: 0 }); }}
                >
                    <img 
                        src={previewState.url} 
                        alt="Preview" 
                        onLoad={(e) => {
                            const { naturalWidth, naturalHeight } = e.target;
                            if (naturalWidth > naturalHeight) setPreviewImgAspect('landscape');
                            else if (naturalHeight > naturalWidth) setPreviewImgAspect('portrait');
                            else setPreviewImgAspect('square');
                            
                            // Center the scroll position so user can scroll both ways
                            const container = e.target.parentElement;
                            if (container) {
                                setTimeout(() => {
                                    container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
                                    container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
                                }, 50); // wait for CSS to apply auto dimensions
                            }
                        }}
                        style={{
                            width: previewImgAspect === 'landscape' ? 'auto' : '100%',
                            height: previewImgAspect === 'portrait' ? 'auto' : '100%',
                            opacity: previewImgAspect ? 1 : 0,
                            transition: 'opacity 0.2s'
                        }}
                    />
                </div>,
                document.body
            )}
        </div>
    );
};

export default ImageUploaderCell;
