import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const MAX_IMAGES = 10;

const ImageUploaderCell = ({ images, onImagesChange, disabled = false }) => {
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [previewState, setPreviewState] = useState({ url: null, x: 0, y: 0, openedAt: 0 });
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
            // Ignore scrolls that happen immediately after opening (e.g. auto-scrolls)
            if (Date.now() - previewState.openedAt < 100) return;

            // Ignore scrolls that happen inside the preview popup itself
            if (e.target.classList && e.target.classList.contains('fixed-small-preview')) {
                return;
            }
            if (previewState.url) {
                setPreviewState({ url: null, x: 0, y: 0, openedAt: 0 });
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
            const res = await axios.post(`${BACKEND_URL || 'http://localhost:8080'}/api/medicines/upload-image`, formData, {
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
                await axios.post(`${BACKEND_URL || 'http://localhost:8080'}/api/medicines/delete-images`, {
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
        let rect = e.currentTarget.getBoundingClientRect();
        setPreviewImgAspect(null); // Reset before opening
        
        const isBelow = rect.top < 470; // 450px height + 20px padding

        if (isBelow) {
            const overflowBottom = (rect.bottom + 10 + 450) - window.innerHeight;
            if (overflowBottom > 0) {
                // Auto-scroll the PAGE to bring the bottom of the modal into view
                window.scrollBy({ top: overflowBottom + 20, behavior: 'auto' });
                // Re-measure after scroll
                rect = e.currentTarget.getBoundingClientRect();
            }
        }

        setPreviewState({
            url: imgUrl.startsWith('/') ? `${BACKEND_URL || 'http://localhost:8080'}${imgUrl}` : imgUrl,
            x: rect.left + rect.width / 2,
            y: isBelow ? rect.bottom + 10 : rect.top - 10,
            isBelow,
            openedAt: Date.now()
        });
    };

    return (
        <div
            className={`relative flex items-center gap-2 p-2 max-w-44 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded ${isScrollable ? 'overflow-x-auto overflow-y-hidden whitespace-nowrap' : ''}`}
            ref={containerRef}
        >
            {/* Filled Slots */}
            {images.map((imgUrl, index) => (
                <div
                    key={`filled-${index}`}
                    className="group relative box-border flex h-12 w-12 shrink-0 select-none flex-col items-center justify-center rounded-md border border-border bg-card transition-all duration-200 cursor-grab active:cursor-grabbing"
                    draggable={!disabled}
                    onDragStart={!disabled ? (e) => handleDragStart(e, index) : undefined}
                    onDragEnd={!disabled ? handleDragEnd : undefined}
                    onDragOver={!disabled ? (e) => handleDragOver(e, index) : undefined}
                    onDrop={!disabled ? (e) => handleDrop(e, index) : undefined}
                    onClick={(e) => openPreview(e, imgUrl)}
                    title={disabled ? "Click to preview" : "Click to preview, hold to drag"}
                    style={{ cursor: disabled ? 'pointer' : undefined }}
                >
                    <img
                        src={imgUrl.startsWith('/') ? `${BACKEND_URL || 'http://localhost:8080'}${imgUrl}` : imgUrl}
                        alt={`img${index + 1}`}
                        className="h-full w-full rounded-md object-cover pointer-events-none"
                    />
                    <span className="pointer-events-none absolute bottom-0 w-full whitespace-nowrap rounded-b-md bg-black/50 py-0.5 text-center text-[9px] text-white">img{index + 1}</span>
                    {!disabled && (
                        <button
                            className="absolute -top-3.5 -right-2 z-2 hidden h-4.5 w-4.5 items-center justify-center rounded-full border-none bg-destructive p-0 text-xs leading-3 text-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200 ease-in-out cursor-pointer group-hover:flex hover:scale-110 hover:brightness-90"
                            onClick={(e) => handleRemove(index, e)}
                        >×</button>
                    )}
                </div>
            ))}

            {/* Empty Slots */}
            {!disabled && Array.from({ length: totalSlots - images.length }).map((_, i) => {
                const globalIndex = images.length + i;
                return (
                    <div
                        key={`empty-${globalIndex}`}
                        className={`relative box-border flex h-12 w-12 shrink-0 select-none flex-col items-center justify-center rounded-md border-2 border-dashed border-border bg-muted text-base font-light text-muted-foreground transition-all duration-200 cursor-pointer hover:border-primary hover:bg-accent hover:text-primary ${uploading && i === 0 ? 'pointer-events-none opacity-50' : ''}`}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        title="Click to upload"
                    >
                        {uploading && i === 0 ? '...' : '+'}
                        <span className="pointer-events-none absolute -bottom-4 whitespace-nowrap text-[10px] text-muted-foreground">img{globalIndex + 1}</span>
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
                    className="fixed-small-preview fixed z-999999 block h-112.5 w-112.5 cursor-pointer overflow-auto rounded-lg border border-border bg-card p-0 shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
                    style={{
                        left: previewState.x,
                        top: previewState.y,
                        transform: previewState.isBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
                    }}
                    onClick={(e) => { e.stopPropagation(); setPreviewState({ url: null, x: 0, y: 0 }); }}
                >
                    <img
                        src={previewState.url}
                        alt="Preview"
                        className="m-0 block max-w-none max-h-none"
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
