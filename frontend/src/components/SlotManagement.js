import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Helper to convert "HH:mm" to minutes for math
const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
};

// Helper to convert minutes back to "HH:mm"
const minutesToTime = (mins) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Generate 5-minute intervals for the day
const generateAllDayTimes = () => {
    const times = [];
    for (let i = 0; i < 24 * 60; i += 5) {
        times.push(minutesToTime(i));
    }
    return times;
};

const ALL_DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120];

const CustomSelect = ({ value, onChange, options, style, placeholder = "Select...", disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef(null);
    const listRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && listRef.current) {
            const listEl = listRef.current;
            let targetIndex = options.findIndex(o => o.value === value);
            
            if (targetIndex === -1 && options.length > 0) {
                targetIndex = Math.floor(options.length / 2);
            }
            
            if (targetIndex !== -1) {
                // Ensure DOM is fully rendered before calculating scroll offsets
                setTimeout(() => {
                    const targetEl = listEl.children[targetIndex];
                    if (targetEl) {
                        const offsetTop = targetEl.offsetTop;
                        const listHeight = listEl.clientHeight;
                        const itemHeight = targetEl.clientHeight;
                        listEl.scrollTop = offsetTop - (listHeight / 2) + (itemHeight / 2);
                    }
                }, 0);
            }
        }
    }, [isOpen, value, options]);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', opacity: disabled ? 0.6 : 1 }}>
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{ ...style, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <span style={{ color: selectedOption ? 'inherit' : '#94a3b8' }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </div>
            {isOpen && (
                <div 
                    ref={listRef}
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: '400px',
                        overflowY: 'auto',
                        background: 'white',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        zIndex: 10001,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        marginTop: '4px'
                    }}
                >
                    {options.map((opt, i) => (
                        <div
                            key={i}
                            onClick={() => {
                                if (!opt.disabled) {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }
                            }}
                            onMouseEnter={(e) => {
                                if (!opt.disabled) {
                                    e.currentTarget.style.background = opt.value === value ? '#3b82f6' : '#f1f5f9';
                                    e.currentTarget.style.color = opt.value === value ? 'white' : 'black';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!opt.disabled) {
                                    e.currentTarget.style.background = opt.value === value ? '#3b82f6' : 'white';
                                    e.currentTarget.style.color = opt.value === value ? 'white' : 'black';
                                }
                            }}
                            style={{
                                padding: '10px',
                                cursor: opt.disabled ? 'not-allowed' : 'pointer',
                                background: opt.value === value ? '#3b82f6' : 'white',
                                color: opt.disabled ? '#94a3b8' : (opt.value === value ? 'white' : 'black'),
                                transition: 'background 0.1s',
                                fontSize: '14px'
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div style={{ padding: '10px', color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>
                            No options available
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const SlotManagement = ({ doctorId, token, defaultPrice }) => {
    const [selectedDay, setSelectedDay] = useState('Monday');
    const [viewMode, setViewMode] = useState('template'); // 'template' or 'exceptions'
    const [selectedExceptionDate, setSelectedExceptionDate] = useState(new Date().toISOString().split('T')[0]);
    const [scheduleOverrides, setScheduleOverrides] = useState([]);

    const [availableSlots, setAvailableSlots] = useState({
        Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
    });
    
    // Form state
    const [startTime, setStartTime] = useState('');
    const [duration, setDuration] = useState(30);
    const [fee, setFee] = useState(0); // Default fee to 0
    const [consultationType, setConsultationType] = useState('Online');
    const [sessionType, setSessionType] = useState('1-to-1');
    const [maxCapacity, setMaxCapacity] = useState(1);
    const addSlotFormRef = React.useRef(null);
    
    const [loading, setLoading] = useState(false);
    const scrollRef = React.useRef(null);
    const rootRef = React.useRef(null);
    
    // Popover and Edit Modal State
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showAddSlotForm, setShowAddSlotForm] = useState(false);
    const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
    const [editModalSlot, setEditModalSlot] = useState(null);
    const [isEditingSlot, setIsEditingSlot] = useState(false);
    const [editSlotData, setEditSlotData] = useState({});
    const popoverRef = React.useRef(null);
    const modalRef = React.useRef(null);

    // Auto-scroll the timeline to the densest cluster of slots (average time)
    useEffect(() => {
        const slots = viewMode === 'template' ? (availableSlots[selectedDay] || []) : getActiveSlotsForDate(selectedExceptionDate);
        if (scrollRef.current && slots.length > 0) {
            let sumMins = 0;
            slots.forEach(s => {
                sumMins += timeToMinutes(s.startTime);
            });
            const avgMins = sumMins / slots.length;
            const avgPercent = avgMins / (24 * 60);
            
            const innerWidth = 2400; // Total width of the timeline
            const targetScrollX = (avgPercent * innerWidth) - (scrollRef.current.clientWidth / 2);
            
            scrollRef.current.scrollTo({ left: Math.max(0, targetScrollX), behavior: 'smooth' });
        }
    }, [selectedDay, selectedExceptionDate, viewMode, availableSlots]);

    // Click/scroll outside to close popover and modal
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setSelectedSlot(null);
            }
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setEditModalSlot(null);
            }
            if (addSlotFormRef.current && !addSlotFormRef.current.contains(event.target)) {
                setShowAddSlotForm(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Sync popover position smoothly on scroll
    useEffect(() => {
        const updatePopoverPosition = () => {
            if (selectedSlot && popoverRef.current && scrollRef.current && rootRef.current) {
                const scrollRect = scrollRef.current.getBoundingClientRect();
                const rootRect = rootRef.current.getBoundingClientRect();
                
                // Calculate position relative to the root component (absolute, not fixed)
                const relativeLeft = (scrollRect.left - rootRect.left) + popoverPos.leftPx - scrollRef.current.scrollLeft;
                const relativeTop = (scrollRect.bottom - rootRect.top) + 10;
                
                popoverRef.current.style.left = `${relativeLeft}px`;
                popoverRef.current.style.top = `${relativeTop}px`;
            }
        };

        // Run immediately to set initial position
        updatePopoverPosition();

        const scrollEl = scrollRef.current;
        if (scrollEl) {
            scrollEl.addEventListener('scroll', updatePopoverPosition);
        }
        window.addEventListener('resize', updatePopoverPosition);

        return () => {
            if (scrollEl) {
                scrollEl.removeEventListener('scroll', updatePopoverPosition);
            }
            window.removeEventListener('resize', updatePopoverPosition);
        };
    }, [selectedSlot, popoverPos]);

    const handleToggleDisable = async (slot) => {
        setLoading(true);
        try {
            const res = await axios.put(
                `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:5000'}/api/doctors/slots/template/${selectedDay}/${slot._id}`,
                { isDisabled: !slot.isDisabled },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAvailableSlots(res.data.availableSlots);
            setSelectedSlot({ ...slot, isDisabled: !slot.isDisabled });
        } catch (error) {
            alert("Error toggling slot status");
        } finally {
            setLoading(false);
        }
    };

    const handleSlotClick = (e, slot, leftPercent, widthPercent) => {
        e.stopPropagation();
        
        // If clicking the already-selected slot, deselect it
        if (selectedSlot && selectedSlot._id === slot._id && selectedSlot.startTime === slot.startTime) {
            setSelectedSlot(null);
            setIsEditingSlot(false);
            return;
        }
        
        // Calculate center of slot in pixels relative to the 2400px container
        let centerPx = ((leftPercent + widthPercent / 2) / 100) * 2400;
        let popoverLeftPx = centerPx - 300; // roughly half of popover width
        
        // Clamp to 2400px bounds
        if (popoverLeftPx < 0) popoverLeftPx = 0;
        if (popoverLeftPx + 600 > 2400) popoverLeftPx = 2400 - 600;
        
        setPopoverPos({
            leftPx: popoverLeftPx
        });
        setSelectedSlot(slot);
        setIsEditingSlot(false);
        setEditSlotData(slot);
    };

    // Fetch initial schedule
    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const res = await axios.get(
                    `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:5000'}/api/doctors/getDoctorById/${doctorId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (res.data.availableSlots) {
                    // Ensure the slots are arrays of objects
                    const slots = res.data.availableSlots;
                    // If they are legacy string arrays, convert them temporarily or ignore
                    const sanitizedSlots = {};
                    for (const day in slots) {
                        sanitizedSlots[day] = slots[day].map(s => typeof s === 'string' ? { startTime: s, duration: 30, fee: defaultPrice } : s);
                    }
                    setAvailableSlots(sanitizedSlots);
                }
                if (res.data.scheduleOverrides) {
                    setScheduleOverrides(res.data.scheduleOverrides);
                }
            } catch (error) {
                console.error("Error fetching schedule", error);
            }
        };
        fetchSchedule();
    }, [doctorId, token, defaultPrice]);

    const getActiveSlotsForDate = (dateStr) => {
        if (!dateStr) return [];
        const dateObj = new Date(dateStr);
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
        
        let baseSlots = [...(availableSlots[dayName] || [])];
        
        const wholeDayCancel = scheduleOverrides.find(o => 
            new Date(o.date).toDateString() === dateObj.toDateString() && o.type === 'cancelled' && !o.targetSlotId
        );
        if (wholeDayCancel) {
            return baseSlots.map(s => ({ ...s, isCancelledOverride: true, targetSlotId: s._id }));
        }
        
        const dateOverrides = scheduleOverrides.filter(o => new Date(o.date).toDateString() === dateObj.toDateString());
        
        for (const override of dateOverrides) {
            if (override.type === 'cancelled' && override.targetSlotId) {
                const idx = baseSlots.findIndex(s => !s.isOverride && s._id.toString() === override.targetSlotId.toString());
                if (idx !== -1) {
                    baseSlots[idx] = { ...baseSlots[idx], isCancelledOverride: true, targetSlotId: override.targetSlotId };
                }
            } else if (override.type === 'rescheduled' && override.targetSlotId) {
                const idx = baseSlots.findIndex(s => !s.isOverride && s._id.toString() === override.targetSlotId.toString());
                if (idx !== -1) {
                    baseSlots[idx] = {
                        ...baseSlots[idx],
                        startTime: override.newStartTime || baseSlots[idx].startTime,
                        duration: override.newDuration || baseSlots[idx].duration,
                        fee: override.newFee !== undefined ? override.newFee : baseSlots[idx].fee,
                        consultationType: override.newConsultationType || baseSlots[idx].consultationType,
                        sessionType: override.newSessionType || baseSlots[idx].sessionType,
                        maxCapacity: override.newMaxCapacity || baseSlots[idx].maxCapacity,
                        isOverride: true,
                        targetSlotId: override.targetSlotId
                    };
                }
            } else if (override.type === 'added') {
                baseSlots.push({
                    _id: override._id,
                    startTime: override.newStartTime,
                    duration: override.newDuration,
                    fee: override.newFee,
                    consultationType: override.newConsultationType,
                    sessionType: override.newSessionType,
                    maxCapacity: override.newMaxCapacity,
                    isDisabled: false,
                    isOverride: true,
                    isAddedOverride: true
                });
            }
        }
        return baseSlots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    };

    const getActiveSlots = () => {
        if (viewMode === 'exceptions') return getActiveSlotsForDate(selectedExceptionDate);
        return availableSlots[selectedDay] || [];
    };

    // Check if placing a slot of minDuration at timeStr overlaps with existing slots
    const isTimeDisabled = (timeStr, minDuration = 15) => {
        const checkMins = timeToMinutes(timeStr);
        const checkEndMins = checkMins + minDuration;
        const daySlots = getActiveSlots().filter(s => !s.isCancelledOverride);
        for (const slot of daySlots) {
            const startMins = timeToMinutes(slot.startTime);
            const endMins = startMins + slot.duration;
            if (checkMins < endMins && checkEndMins > startMins) return true;
        }
        if (checkEndMins > 24 * 60) return true;
        return false;
    };

    const getMaxDuration = () => {
        if (!startTime) return 24 * 60;
        const startMins = timeToMinutes(startTime);
        const daySlots = getActiveSlots().filter(s => !s.isCancelledOverride);
        let nextBlockStart = 24 * 60;
        for (const slot of daySlots) {
            const slotStartMins = timeToMinutes(slot.startTime);
            if (slotStartMins > startMins && slotStartMins < nextBlockStart) nextBlockStart = slotStartMins;
        }
        return nextBlockStart - startMins;
    };

    const handleAddSlot = async () => {
        if (!startTime) return alert("Please select a start time");
        
        setLoading(true);
        try {
            if (viewMode === 'exceptions') {
                // Add as a date-specific override
                const res = await axios.post(
                    `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:5000'}/api/doctors/slots/overrides`,
                    {
                        date: selectedExceptionDate,
                        type: 'added',
                        newStartTime: startTime,
                        newDuration: duration,
                        newFee: fee === '' ? 0 : Number(fee),
                        newConsultationType: consultationType,
                        newSessionType: sessionType,
                        newMaxCapacity: maxCapacity === '' ? 2 : Number(maxCapacity)
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setScheduleOverrides(res.data.scheduleOverrides);
            } else {
                const payload = {
                    day: selectedDay,
                    startTime,
                    duration,
                    fee: fee === '' ? 0 : Number(fee),
                    consultationType,
                    sessionType,
                    maxCapacity: maxCapacity === '' ? 2 : Number(maxCapacity)
                };
                
                const res = await axios.post(
                    `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:5000'}/api/doctors/slots/template`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                setAvailableSlots(res.data.availableSlots);
            }
            
            // Reset form
            setStartTime('');
            setDuration(30);
            setShowAddSlotForm(false);
            alert("Slot added successfully!");
        } catch (error) {
            alert(error.response?.data?.message || "Error adding slot");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm("Deleting this template will cancel all existing bookings for this time on future dates. Proceed anyway?")) return;
        setLoading(true);
        try {
            const res = await axios.delete(
                `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:5000'}/api/doctors/slots/template/${selectedDay}/${slotId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAvailableSlots(res.data.availableSlots);
        } catch (error) {
            alert("Error deleting slot");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSlot = async () => {
        setLoading(true);
        try {
            if (viewMode === 'template') {
                const res = await axios.put(
                    `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:5000'}/api/doctors/slots/template/${selectedDay}/${editSlotData._id}`,
                    editSlotData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setAvailableSlots(res.data.availableSlots);
            } else if (editSlotData.isAddedOverride) {
                // Delete the old added override
                await axios.delete(
                    `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:5000'}/api/doctors/slots/overrides`,
                    { 
                        headers: { Authorization: `Bearer ${token}` },
                        data: { date: selectedExceptionDate, targetSlotId: editSlotData.targetSlotId }
                    }
                );
                // Create the updated added override
                const res = await axios.post(
                    `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:5000'}/api/doctors/slots/overrides`,
                    { 
                        date: selectedExceptionDate, 
                        type: 'added',
                        newStartTime: editSlotData.startTime,
                        newDuration: editSlotData.duration,
                        newFee: editSlotData.fee,
                        newConsultationType: editSlotData.consultationType,
                        newSessionType: editSlotData.sessionType,
                        newMaxCapacity: editSlotData.maxCapacity
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setScheduleOverrides(res.data.scheduleOverrides);
            } else {
                const res = await axios.post(
                    `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:5000'}/api/doctors/slots/overrides`,
                    { 
                        date: selectedExceptionDate, 
                        type: 'rescheduled',
                        targetSlotId: editSlotData.targetSlotId,
                        newStartTime: editSlotData.startTime,
                        newDuration: editSlotData.duration,
                        newFee: editSlotData.fee,
                        newConsultationType: editSlotData.consultationType,
                        newSessionType: editSlotData.sessionType,
                        newMaxCapacity: editSlotData.maxCapacity
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setScheduleOverrides(res.data.scheduleOverrides);
            }
            setIsEditingSlot(false);
            setSelectedSlot(null);
        } catch (error) {
            alert("Error updating slot");
        } finally {
            setLoading(false);
        }
    };

    const allTimes = generateAllDayTimes();
    const maxDur = getMaxDuration();
    const durationOptions = ALL_DURATIONS.filter(d => d <= maxDur);

    // Ensure the selected duration doesn't exceed the max allowed duration when options shrink
    useEffect(() => {
        if (startTime && duration > maxDur) {
            const validDurs = ALL_DURATIONS.filter(d => d <= maxDur);
            setDuration(validDurs.length > 0 ? validDurs[validDurs.length - 1] : 5);
        }
    }, [startTime, maxDur, duration]);

    const isEditTimeDisabled = (timeStr, editSlot, minDuration = 15) => {
        const checkMins = timeToMinutes(timeStr);
        const checkEndMins = checkMins + minDuration;
        const daySlots = getActiveSlots().filter(s => !s.isCancelledOverride);
        for (const slot of daySlots) {
            if (viewMode === 'template' && slot._id === editSlot?._id) continue;
            if (viewMode === 'exceptions' && (slot._id === editSlot?._id || slot.targetSlotId === editSlot?.targetSlotId)) continue;
            const startMins = timeToMinutes(slot.startTime);
            const endMins = startMins + slot.duration;
            if (checkMins < endMins && checkEndMins > startMins) return true;
        }
        if (checkEndMins > 24 * 60) return true;
        return false;
    };

    const getEditMaxDuration = (editSlot) => {
        if (!editSlot || !editSlot.startTime) return 24 * 60;
        const startMins = timeToMinutes(editSlot.startTime);
        const daySlots = getActiveSlots().filter(s => !s.isCancelledOverride);
        let nextBlockStart = 24 * 60;
        for (const slot of daySlots) {
            if (viewMode === 'template' && slot._id === editSlot._id) continue;
            if (viewMode === 'exceptions' && (slot._id === editSlot?._id || slot.targetSlotId === editSlot?.targetSlotId)) continue;
            const slotStartMins = timeToMinutes(slot.startTime);
            if (slotStartMins > startMins && slotStartMins < nextBlockStart) nextBlockStart = slotStartMins;
        }
        return nextBlockStart - startMins;
    };

    const smartlyUpdateSlotData = (newH24, currentMm, currentDuration, defaultTargetDuration, editSlot = null) => {
        let bestMm = currentMm;
        
        const isMinValid = (m) => {
            const timeStr = `${String(newH24).padStart(2, '0')}:${m}`;
            return !(editSlot ? isEditTimeDisabled(timeStr, editSlot, 15) : isTimeDisabled(timeStr, 15));
        };

        if (!isMinValid(currentMm)) {
            const possibleMins = ['00', '15', '30', '45'];
            const validMin = possibleMins.find(m => isMinValid(m));
            if (validMin) {
                bestMm = validMin;
            }
        }
        
        const newTimeStr = `${String(newH24).padStart(2, '0')}:${bestMm}`;
        
        const getMaxDur = (timeStr) => {
            const startMins = timeToMinutes(timeStr);
            const daySlots = getActiveSlots().filter(s => !s.isCancelledOverride);
            let nextBlockStart = 24 * 60;
            for (const slot of daySlots) {
                if (editSlot) {
                    if (viewMode === 'template' && slot._id === editSlot._id) continue;
                    if (viewMode === 'exceptions' && (slot._id === editSlot._id || slot.targetSlotId === editSlot.targetSlotId)) continue;
                }
                const slotStartMins = timeToMinutes(slot.startTime);
                if (slotStartMins > startMins && slotStartMins < nextBlockStart) nextBlockStart = slotStartMins;
            }
            return nextBlockStart - startMins;
        };
        
        const availableMaxDur = getMaxDur(newTimeStr);
        let target = defaultTargetDuration;
        if (target > availableMaxDur) {
            const validDurs = ALL_DURATIONS.filter(d => d <= availableMaxDur);
            target = validDurs.length > 0 ? validDurs[validDurs.length - 1] : 15;
        }
        
        return { newTimeStr, newDuration: target };
    };

    const isHourDisabled = (h24_check, editSlot = null) => {
        for (let m = 0; m < 60; m += 15) {
            const timeStr = `${String(h24_check).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            if (editSlot) {
                if (!isEditTimeDisabled(timeStr, editSlot, 15)) return false;
            } else {
                if (!isTimeDisabled(timeStr, 15)) return false;
            }
        }
        return true;
    };

    const findBestAvailableTimeAndSet = () => {
        // Try 30 min first
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 15) {
                const c = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                if (!isTimeDisabled(c, 30)) { setStartTime(c); setDuration(30); return; }
            }
        }
        // Fallback to 15 min
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 15) {
                const c = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                if (!isTimeDisabled(c, 15)) { setStartTime(c); setDuration(15); return; }
            }
        }
    };

    // Ensure edit modal duration doesn't exceed its max
    useEffect(() => {
        if (editModalSlot && editModalSlot.startTime) {
            const maxD = getEditMaxDuration(editModalSlot);
            if (editModalSlot.duration > maxD) {
                const validDurs = ALL_DURATIONS.filter(d => d <= maxD);
                setEditModalSlot(prev => ({
                    ...prev,
                    duration: validDurs.length > 0 ? validDurs[validDurs.length - 1] : 5
                }));
            }
        }
    }, [editModalSlot?.startTime]); // eslint-disable-line react-hooks/exhaustive-deps

    // Timeline Rendering
    const renderTimeline = () => {
        const daySlots = getActiveSlots();
        const TOTAL_MINS = 24 * 60;
        
        return (
            <>
            <div 
                ref={scrollRef}
                style={{ width: '100%', overflowX: 'auto', marginTop: '10px', paddingBottom: '10px' }}
            >
                {/* 2400px wide scrolling wrapper - Transparent */}
                <div style={{ position: 'relative', height: '85px', width: '2400px' }}>
                    
                    {/* Timeline hour markers at the TOP (Outside the gray bar) */}
                    {Array.from({ length: 25 }).map((_, h) => {
                        const h12 = h === 0 ? 12 : (h > 12 ? h - 12 : h);
                        const ampm = h < 12 ? 'AM' : 'PM';
                        const label = h === 24 ? '12 AM' : `${h12} ${ampm}`;
                        return (
                            <div key={h} style={{ position: 'absolute', top: 0, left: `${(h / 24) * 100}%`, height: '100%', borderLeft: '1px dashed #64748b', pointerEvents: 'none' }}>
                                <span style={{ position: 'absolute', top: '0', left: '4px', fontSize: '11px', color: '#475569', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{label}</span>
                            </div>
                        );
                    })}

                    {/* The Gray Track (The "Bar") */}
                    <div style={{ position: 'absolute', top: '20px', left: 0, width: '100%', height: '60px', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #cbd5e1' }} />

                    {/* Slot Blocks */}
                    {daySlots.map((slot, idx) => {
                        const startMins = timeToMinutes(slot.startTime);
                        const leftPercent = (startMins / TOTAL_MINS) * 100;
                        const widthPercent = (slot.duration / TOTAL_MINS) * 100;
                        const bgColor = slot.consultationType === 'Online' ? '#3b82f6' : (slot.consultationType === 'In-Person' ? '#10b981' : '#8b5cf6');
                        const isActive = selectedSlot && (selectedSlot._id === slot._id || selectedSlot.startTime === slot.startTime);
                        let slotBg = bgColor;
                        if (slot.isCancelledOverride) slotBg = `repeating-linear-gradient(45deg, #ef4444, #ef4444 3px, ${bgColor} 3px, ${bgColor} 6px)`;
                        else if (slot.isDisabled) slotBg = `repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 3px, ${bgColor} 3px, ${bgColor} 6px)`;
                        else if (slot.isOverride) slotBg = `repeating-linear-gradient(45deg, ${bgColor}, ${bgColor} 3px, #eab308 3px, #eab308 6px)`;
                        return (
                            <React.Fragment key={slot._id || idx}>
                                <div className="slot-element" style={{ position: 'absolute', top: '20px', left: `${leftPercent}%`, width: `${widthPercent}%`, height: '60px', background: slotBg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', opacity: slot.isDisabled ? 0.7 : 1, transform: isActive ? 'scale(1.05)' : 'none', filter: isActive ? 'brightness(1.15)' : 'none', boxShadow: isActive ? '0 10px 20px rgba(0,0,0,0.4)' : 'none', zIndex: isActive ? 10 : 1 }} title={`Time: ${slot.startTime}, Duration: ${slot.duration}m, Fee: ${slot.fee}${slot.isDisabled ? ' (Disabled)' : ''}${slot.isCancelledOverride ? ' (Cancelled)' : ''}`} onMouseDown={(e) => handleSlotClick(e, slot, leftPercent, widthPercent)}>
                                    {slot.sessionType === 'Group' && <span style={{ fontSize: '18px' }}>👥</span>}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
            
            {/* Popover UI (Now OUTSIDE the scrolling container but visually synced to it) */}
            {selectedSlot && (
                <div 
                    ref={popoverRef}
                    style={{
                        position: 'absolute',
                        background: 'white',
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        zIndex: 50,
                    }}
                >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Start Time</label>
                            {(() => {
                                const st = (typeof isEditingSlot !== 'undefined' && isEditingSlot && typeof editSlotData !== 'undefined') ? editSlotData.startTime : selectedSlot.startTime;
                                const h24 = parseInt(st.split(':')[0] || '10');
                                const mStr = st.split(':')[1] || '00';
                                const isPM = h24 >= 12;
                                const h12Str = String(h24 % 12 || 12).padStart(2, '0');
                                const ampmStr = isPM ? 'PM' : 'AM';
                                
                                const updateTime = (newH12, newMm, newAmpm) => {
                                    if (typeof isEditingSlot === 'undefined' || !isEditingSlot) return;
                                    let newH24 = parseInt(newH12);
                                    if (newAmpm === 'PM' && newH24 < 12) newH24 += 12;
                                    if (newAmpm === 'AM' && newH24 === 12) newH24 = 0;
                                    
                                    const { newTimeStr, newDuration } = smartlyUpdateSlotData(newH24, newMm, editSlotData.duration, selectedSlot.duration, editSlotData);
                                    setEditSlotData({ ...editSlotData, startTime: newTimeStr, duration: newDuration });
                                };
                                
                                return (
                                    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                                        <select disabled={typeof isEditingSlot === 'undefined' || !isEditingSlot} value={h12Str} onChange={(e) => updateTime(e.target.value, mStr, ampmStr)} style={{ padding: '4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'pointer' : 'default', outline: 'none', background: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'white' : '#f8fafc', color: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'black' : '#475569', appearance: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'auto' : 'none' }}>
                                            {Array.from({length: 12}, (_, i) => {
                                                const hVal = i + 1;
                                                let h24_check = hVal;
                                                if (ampmStr === 'PM' && h24_check < 12) h24_check += 12;
                                                if (ampmStr === 'AM' && h24_check === 12) h24_check = 0;
                                                const isDisabled = (typeof isEditingSlot !== 'undefined' && isEditingSlot && typeof isHourDisabled !== 'undefined') ? isHourDisabled(h24_check, editSlotData) : false;
                                                return <option key={hVal} value={String(hVal).padStart(2, '0')} disabled={isDisabled} style={{ background: isDisabled ? '#f1f5f9' : 'white', color: isDisabled ? '#94a3b8' : 'black' }}>{String(hVal).padStart(2, '0')}</option>
                                            })}
                                        </select>
                                        <span style={{ fontWeight: 'bold', fontSize: '12px', paddingBottom: '2px', color: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'black' : '#475569' }}>:</span>
                                        <select disabled={typeof isEditingSlot === 'undefined' || !isEditingSlot} value={mStr} onChange={(e) => updateTime(h12Str, e.target.value, ampmStr)} style={{ padding: '4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'pointer' : 'default', outline: 'none', background: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'white' : '#f8fafc', color: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'black' : '#475569', appearance: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'auto' : 'none' }}>
                                            {Array.from({length: 4}, (_, i) => {
                                                const mVal = String(i * 15).padStart(2, '0');
                                                const timeStr = `${String(h24).padStart(2, '0')}:${mVal}`;
                                                const isDisabled = isEditingSlot ? isEditTimeDisabled(timeStr, editSlotData, 15) : false;
                                                return <option key={mVal} value={mVal} disabled={isDisabled} style={{ background: isDisabled ? '#f1f5f9' : 'white', color: isDisabled ? '#94a3b8' : 'black' }}>{mVal}</option>
                                            })}
                                        </select>
                                        <select disabled={typeof isEditingSlot === 'undefined' || !isEditingSlot} value={ampmStr} onChange={(e) => updateTime(h12Str, mStr, e.target.value)} style={{ padding: '4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'pointer' : 'default', marginLeft: '2px', outline: 'none', background: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'white' : '#f8fafc', color: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'black' : '#475569', appearance: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'auto' : 'none' }}>
                                            {(() => {
                                                const amDisabled = (typeof isEditingSlot !== 'undefined' && isEditingSlot && typeof isHourDisabled !== 'undefined') ? Array.from({length: 12}).every((_,i) => isHourDisabled(i===11?0:i+1, editSlotData)) : false;
                                                const pmDisabled = (typeof isEditingSlot !== 'undefined' && isEditingSlot && typeof isHourDisabled !== 'undefined') ? Array.from({length: 12}).every((_,i) => isHourDisabled(i===11?12:i+13, editSlotData)) : false;
                                                return (
                                                    <>
                                                        <option value="AM" disabled={amDisabled} style={{ background: amDisabled ? '#f1f5f9' : 'white', color: amDisabled ? '#94a3b8' : 'black' }}>AM</option>
                                                        <option value="PM" disabled={pmDisabled} style={{ background: pmDisabled ? '#f1f5f9' : 'white', color: pmDisabled ? '#94a3b8' : 'black' }}>PM</option>
                                                    </>
                                                );
                                            })()}
                                        </select>
                                    </div>
                                );
                            })()}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Duration</label>
                            {(() => {
                                const dur = isEditingSlot ? editSlotData.duration : selectedSlot.duration;
                                const editMax = isEditingSlot ? getEditMaxDuration(editSlotData) : 999;
                                return (
                                    <select title="Duration" disabled={!isEditingSlot} value={dur} onChange={(e) => setEditSlotData({ ...editSlotData, duration: Number(e.target.value) })} style={{ padding: '4px', fontSize: '12px', width: '75px', borderRadius: '4px', border: '1px solid #cbd5e1', appearance: isEditingSlot ? 'auto' : 'none', background: isEditingSlot ? 'white' : '#f8fafc', color: isEditingSlot ? 'black' : '#475569' }}>
                                        {ALL_DURATIONS.filter(d => d <= 120).map(d => { const dis = d > editMax; return <option key={d} value={d} disabled={dis} style={{ background: dis ? '#f1f5f9' : 'white', color: dis ? '#94a3b8' : 'black' }}>{d} min</option> })}
                                    </select>
                                )
                            })()}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Mode</label>
                            {(() => {
                                const mode = (typeof isEditingSlot !== 'undefined' && isEditingSlot && typeof editSlotData !== 'undefined') ? editSlotData.consultationType : selectedSlot.consultationType;
                                return (
                                    <select title="Consultation Mode" disabled={typeof isEditingSlot === 'undefined' || !isEditingSlot} value={mode} onChange={(e) => setEditSlotData({ ...editSlotData, consultationType: e.target.value })} style={{ padding: '4px', fontSize: '12px', width: '80px', borderRadius: '4px', border: '1px solid #cbd5e1', appearance: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'auto' : 'none', background: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'white' : '#f8fafc', color: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'black' : '#475569' }}>
                                        <option value="Online">Online</option>
                                        <option value="In-Person">In-Person</option>
                                        <option value="Both">Both</option>
                                    </select>
                                )
                            })()}
                        </div>

                        {(() => {
                            const stype = (typeof isEditingSlot !== 'undefined' && isEditingSlot && typeof editSlotData !== 'undefined') ? editSlotData.sessionType : selectedSlot.sessionType;
                            const cap = (typeof isEditingSlot !== 'undefined' && isEditingSlot && typeof editSlotData !== 'undefined') ? editSlotData.maxCapacity : selectedSlot.maxCapacity;
                            return (
                                <div style={{ display: 'flex', gap: '8px', background: stype === 'Group' ? '#e2e8f0' : 'transparent', padding: '4px 6px', borderRadius: '6px', margin: '-4px -6px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Session</label>
                                        <select title="Session Type" disabled={typeof isEditingSlot === 'undefined' || !isEditingSlot} value={stype} onChange={(e) => setEditSlotData({ ...editSlotData, sessionType: e.target.value, maxCapacity: e.target.value === '1-to-1' ? 1 : 2 })} style={{ padding: '4px', fontSize: '12px', width: '80px', borderRadius: '4px', border: '1px solid #cbd5e1', appearance: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'auto' : 'none', background: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'white' : '#f8fafc', color: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'black' : '#475569' }}>
                                            <option value="1-to-1">1-to-1</option>
                                            <option value="Group">Group</option>
                                        </select>
                                    </div>
                                    {stype === 'Group' && (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Cap</label>
                                            <input type="number" min="2" disabled={typeof isEditingSlot === 'undefined' || !isEditingSlot} title="Capacity" value={cap} onChange={(e) => setEditSlotData({ ...editSlotData, maxCapacity: e.target.value === '' ? '' : Number(e.target.value) })} style={{ padding: '4px', fontSize: '12px', width: '40px', borderRadius: '4px', border: '1px solid #cbd5e1', background: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'white' : '#f8fafc', color: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'black' : '#475569' }} />
                                        </div>
                                    )}
                                </div>
                            )
                        })()}

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Fee (₹)</label>
                            {(() => {
                                const feeVal = (typeof isEditingSlot !== 'undefined' && isEditingSlot && typeof editSlotData !== 'undefined') ? editSlotData.fee : selectedSlot.fee;
                                return <input type="number" min="0" disabled={typeof isEditingSlot === 'undefined' || !isEditingSlot} title="Fee" value={feeVal} onChange={(e) => setEditSlotData({ ...editSlotData, fee: e.target.value === '' ? '' : Number(e.target.value) })} style={{ padding: '4px', fontSize: '12px', width: '60px', borderRadius: '4px', border: '1px solid #cbd5e1', background: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'white' : '#f8fafc', color: (typeof isEditingSlot !== 'undefined' && isEditingSlot) ? 'black' : '#475569' }} />
                            })()}
                        </div>

                        <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
                            {(typeof isEditingSlot !== 'undefined' && isEditingSlot) ? (
                                <>
                                    <button onClick={() => typeof handleUpdateSlot === 'function' ? handleUpdateSlot() : null} disabled={loading} style={{ background: '#10b981', color: 'white', padding: '5px 12px', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Save</button>
                                    <button onClick={() => { setIsEditingSlot(false); setEditSlotData(selectedSlot); }} style={{ background: '#ef4444', color: 'white', padding: '5px 12px', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                                </>
                            ) : (
                                <>
                                    {viewMode === 'template' ? (
                                        <>
                                            <button onClick={() => { if(typeof setIsEditingSlot !== 'undefined') { setIsEditingSlot(true); setEditSlotData(selectedSlot); } }} style={{ background: '#3b82f6', color: 'white', padding: '5px 12px', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Edit</button>
                                            <button onClick={() => { handleToggleDisable(selectedSlot); setSelectedSlot(null); }} style={{ background: '#f59e0b', color: 'white', padding: '5px 12px', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>{selectedSlot.isDisabled ? 'Enable' : 'Disable'}</button>
                                            <button onClick={() => { handleDeleteSlot(selectedSlot._id); setSelectedSlot(null); }} style={{ background: '#ef4444', color: 'white', padding: '5px 12px', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                                        </>
                                    ) : selectedSlot.isCancelledOverride ? (
                                        <button 
                                            onClick={async () => {
                                                if(!window.confirm("Restore this slot on this date?")) return;
                                                setLoading(true);
                                                try {
                                                    const res = await axios.delete(
                                                        `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:5000'}/api/doctors/slots/overrides`,
                                                        { 
                                                            headers: { Authorization: `Bearer ${token}` },
                                                            data: { date: selectedExceptionDate, targetSlotId: selectedSlot.targetSlotId || selectedSlot._id }
                                                        }
                                                    );
                                                    setScheduleOverrides(res.data.scheduleOverrides);
                                                } catch (e) {
                                                    alert("Error restoring slot");
                                                } finally {
                                                    setLoading(false);
                                                    setSelectedSlot(null);
                                                }
                                            }}
                                            style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', flex: 1, fontSize: '12px' }}
                                        >Restore Slot</button>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => { if(typeof setIsEditingSlot !== 'undefined') { setIsEditingSlot(true); setEditSlotData({...selectedSlot, targetSlotId: selectedSlot.targetSlotId || selectedSlot._id}); } }}
                                                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', flex: 1, fontSize: '12px' }}
                                            >Reschedule</button>
                                            
                                            {selectedSlot.isAddedOverride ? (
                                                <button 
                                                    onClick={async () => {
                                                        if(!window.confirm("Delete this added slot?")) return;
                                                        setLoading(true);
                                                        try {
                                                            const res = await axios.delete(
                                                                `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:5000'}/api/doctors/slots/overrides`,
                                                                { 
                                                                    headers: { Authorization: `Bearer ${token}` },
                                                                    data: { date: selectedExceptionDate, targetSlotId: selectedSlot.targetSlotId || selectedSlot._id }
                                                                }
                                                            );
                                                            setScheduleOverrides(res.data.scheduleOverrides);
                                                        } catch (e) {
                                                            alert("Error deleting slot");
                                                        } finally {
                                                            setLoading(false);
                                                            setSelectedSlot(null);
                                                        }
                                                    }}
                                                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', flex: 1, fontSize: '12px' }}
                                                >Delete Slot</button>
                                            ) : (
                                                <button 
                                                    onClick={async () => {
                                                        if(!window.confirm("Cancel this slot on this date?")) return;
                                                        setLoading(true);
                                                        try {
                                                            const res = await axios.post(
                                                                `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:5000'}/api/doctors/slots/overrides`,
                                                                { date: selectedExceptionDate, type: 'cancelled', targetSlotId: selectedSlot.targetSlotId || selectedSlot._id },
                                                                { headers: { Authorization: `Bearer ${token}` } }
                                                            );
                                                            setScheduleOverrides(res.data.scheduleOverrides);
                                                        } catch (e) {
                                                            alert("Error canceling slot");
                                                        } finally {
                                                            setLoading(false);
                                                            setSelectedSlot(null);
                                                        }
                                                    }}
                                                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', flex: 1, fontSize: '12px' }}
                                                >Cancel Slot</button>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
        );
    };

    return (
        <div ref={rootRef} style={{ position: 'relative', background: 'white', padding: '30px', paddingBottom: selectedSlot ? '60px' : '30px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button 
                    onClick={() => { setViewMode('template'); setShowAddSlotForm(false); setSelectedSlot(null); }}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: viewMode === 'template' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: viewMode === 'template' ? '#eff6ff' : 'white', fontWeight: 'bold', color: viewMode === 'template' ? '#1d4ed8' : '#64748b', cursor: 'pointer' }}
                >
                    Template Schedule (Weekly)
                </button>
                <button 
                    onClick={() => { setViewMode('exceptions'); setShowAddSlotForm(false); setSelectedSlot(null); }}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: viewMode === 'exceptions' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: viewMode === 'exceptions' ? '#eff6ff' : 'white', fontWeight: 'bold', color: viewMode === 'exceptions' ? '#1d4ed8' : '#64748b', cursor: 'pointer' }}
                >
                    Date-Specific Exceptions (Overrides)
                </button>
            </div>
            
            {viewMode === 'template' ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', minHeight: '70px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <CustomSelect 
                            value={selectedDay} 
                            onChange={(val) => { setSelectedDay(val); setStartTime(''); }}
                            options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => ({ label: d, value: d }))}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', fontWeight: 'bold', width: '200px' }}
                        />
                        <span style={{ color: '#64748b', whiteSpace: 'nowrap', fontSize: '14px' }}>Select a day to view and edit its template schedule.</span>
                    </div>

                    {showAddSlotForm ? (
                        <div ref={addSlotFormRef} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Start Time</label>
                                {(() => {
                                    const h24 = parseInt(startTime.split(':')[0] || '10');
                                    const mStr = startTime.split(':')[1] || '00';
                                    const isPM = h24 >= 12;
                                    const h12Str = String(h24 % 12 || 12).padStart(2, '0');
                                    const ampmStr = isPM ? 'PM' : 'AM';
                                    const updateTime = (newH12, newMm, newAmpm) => {
                                        let newH24 = parseInt(newH12);
                                        if (newAmpm === 'PM' && newH24 < 12) newH24 += 12;
                                        if (newAmpm === 'AM' && newH24 === 12) newH24 = 0;
                                        
                                        const { newTimeStr, newDuration } = smartlyUpdateSlotData(newH24, newMm, duration, 30, null);
                                        setStartTime(newTimeStr);
                                        setDuration(newDuration);
                                    };
                                    return (
                                        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                                            <select value={h12Str} onChange={(e) => updateTime(e.target.value, mStr, ampmStr)} style={{ padding: '4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', outline: 'none' }}>
                                                {Array.from({length: 12}, (_, i) => {
                                                    const hVal = i + 1; let h24_c = hVal;
                                                    if (ampmStr === 'PM' && h24_c < 12) h24_c += 12;
                                                    if (ampmStr === 'AM' && h24_c === 12) h24_c = 0;
                                                    const dis = isHourDisabled(h24_c);
                                                    return <option key={hVal} value={String(hVal).padStart(2, '0')} disabled={dis} style={{ background: dis ? '#f1f5f9' : 'white', color: dis ? '#94a3b8' : 'black' }}>{String(hVal).padStart(2, '0')}</option>
                                                })}
                                            </select>
                                            <span style={{ fontWeight: 'bold', fontSize: '12px', paddingBottom: '2px' }}>:</span>
                                            <select value={mStr} onChange={(e) => updateTime(h12Str, e.target.value, ampmStr)} style={{ padding: '4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', outline: 'none' }}>
                                                {Array.from({length: 4}, (_, i) => {
                                                    const mVal = String(i * 15).padStart(2, '0');
                                                    const ts = `${String(h24).padStart(2, '0')}:${mVal}`;
                                                    const dis = isTimeDisabled(ts, 15);
                                                    return <option key={mVal} value={mVal} disabled={dis} style={{ background: dis ? '#f1f5f9' : 'white', color: dis ? '#94a3b8' : 'black' }}>{mVal}</option>
                                                })}
                                            </select>
                                            <select value={ampmStr} onChange={(e) => updateTime(h12Str, mStr, e.target.value)} style={{ padding: '4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', marginLeft: '2px', outline: 'none' }}>
                                                {(() => { const amD = Array.from({length:12}).every((_,i) => isHourDisabled(i===11?0:i+1)); const pmD = Array.from({length:12}).every((_,i) => isHourDisabled(i===11?12:i+13)); return <><option value="AM" disabled={amD} style={{ background: amD?'#f1f5f9':'white', color: amD?'#94a3b8':'black' }}>AM</option><option value="PM" disabled={pmD} style={{ background: pmD?'#f1f5f9':'white', color: pmD?'#94a3b8':'black' }}>PM</option></>; })()}
                                            </select>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Duration</label>
                                <select title="Duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))} disabled={!startTime} style={{ padding: '4px', fontSize: '12px', width: '75px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                    {ALL_DURATIONS.filter(d => d <= 120).map(d => { const dis = d > maxDur; return <option key={d} value={d} disabled={dis} style={{ background: dis ? '#f1f5f9' : 'white', color: dis ? '#94a3b8' : 'black' }}>{d} min</option> })}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Mode</label>
                                <select title="Consultation Mode" value={consultationType} onChange={(e) => setConsultationType(e.target.value)} style={{ padding: '4px', fontSize: '12px', width: '80px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                    <option value="Online">Online</option>
                                    <option value="In-Person">In-Person</option>
                                    <option value="Both">Both</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', background: sessionType === 'Group' ? '#eef2ff' : 'transparent', padding: sessionType === 'Group' ? '4px 6px' : '0', borderRadius: '6px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Session</label>
                                    <select title="Session Type" value={sessionType} onChange={(e) => { setSessionType(e.target.value); if (e.target.value === '1-to-1') setMaxCapacity(1); else setMaxCapacity(2); }} style={{ padding: '4px', fontSize: '12px', width: '70px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                        <option value="1-to-1">1-to-1</option>
                                        <option value="Group">Group</option>
                                    </select>
                                </div>
                                {sessionType === 'Group' && (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Cap</label>
                                        <input type="number" min="2" title="Capacity" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value === '' ? '' : Number(e.target.value))} style={{ padding: '4px', fontSize: '12px', width: '40px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Fee (₹)</label>
                                <input type="number" min="0" title="Fee" value={fee} onChange={(e) => setFee(e.target.value === '' ? '' : Number(e.target.value))} style={{ padding: '4px', fontSize: '12px', width: '60px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '14px' }}>
                                <button onClick={() => handleAddSlot()} disabled={loading || !startTime} style={{ background: '#10b981', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: (loading || !startTime) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Save</button>
                                <button onClick={() => setShowAddSlotForm(false)} style={{ background: '#ef4444', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => {
                                if (typeof findBestAvailableTimeAndSet === 'function') findBestAvailableTimeAndSet();
                                setShowAddSlotForm(true);
                            }} style={{ background: '#3b82f6', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add New Slot</button>
                            {(() => {
                                const daySlots = availableSlots[selectedDay] || [];
                                const hasSlots = daySlots.length > 0;
                                if (!hasSlots) return null;
                                const allDisabled = daySlots.every(s => s.isDisabled);
                                return (
                                    <button 
                                        onClick={async () => {
                                            if (!window.confirm(`${allDisabled ? 'Restore' : 'Disable'} ALL slots for ${selectedDay}?`)) return;
                                            setLoading(true);
                                            try {
                                                const res = await axios.put(
                                                    `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:5000'}/api/doctors/slots/template/${selectedDay}/toggle-disable-all`,
                                                    { disable: !allDisabled },
                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                );
                                                setAvailableSlots(res.data.availableSlots);
                                            } catch (e) {
                                                alert(`Error ${allDisabled ? 'restoring' : 'disabling'} day`);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        style={{ background: allDisabled ? '#10b981' : '#e2e8f0', color: allDisabled ? 'white' : '#334155', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        {allDisabled ? 'Restore Entire Day' : 'Disable Entire Day'}
                                    </button>
                                );
                            })()}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', minHeight: '70px' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <input 
                            type="date" 
                            value={selectedExceptionDate} 
                            onChange={(e) => setSelectedExceptionDate(e.target.value)}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', fontWeight: 'bold', width: '200px' }}
                        />
                        <p style={{ margin: 0, alignSelf: 'center', color: '#64748b' }}>Select a specific date to cancel or reschedule slots.</p>
                    </div>

                    {showAddSlotForm ? (
                        <div ref={addSlotFormRef} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Start Time</label>
                                {(() => {
                                    const h24 = parseInt(startTime.split(':')[0] || '10');
                                    const mStr = startTime.split(':')[1] || '00';
                                    const isPM = h24 >= 12;
                                    const h12Str = String(h24 % 12 || 12).padStart(2, '0');
                                    const ampmStr = isPM ? 'PM' : 'AM';
                                    const updateTime = (newH12, newMm, newAmpm) => {
                                        let newH24 = parseInt(newH12);
                                        if (newAmpm === 'PM' && newH24 < 12) newH24 += 12;
                                        if (newAmpm === 'AM' && newH24 === 12) newH24 = 0;
                                        
                                        const { newTimeStr, newDuration } = smartlyUpdateSlotData(newH24, newMm, duration, 30, null);
                                        setStartTime(newTimeStr);
                                        setDuration(newDuration);
                                    };
                                    return (
                                        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                                            <select value={h12Str} onChange={(e) => updateTime(e.target.value, mStr, ampmStr)} style={{ padding: '4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', outline: 'none' }}>
                                                {Array.from({length: 12}, (_, i) => {
                                                    const hVal = i + 1; let h24_c = hVal;
                                                    if (ampmStr === 'PM' && h24_c < 12) h24_c += 12;
                                                    if (ampmStr === 'AM' && h24_c === 12) h24_c = 0;
                                                    const dis = isHourDisabled(h24_c);
                                                    return <option key={hVal} value={String(hVal).padStart(2, '0')} disabled={dis} style={{ background: dis ? '#f1f5f9' : 'white', color: dis ? '#94a3b8' : 'black' }}>{String(hVal).padStart(2, '0')}</option>
                                                })}
                                            </select>
                                            <span style={{ fontWeight: 'bold', fontSize: '12px', paddingBottom: '2px' }}>:</span>
                                            <select value={mStr} onChange={(e) => updateTime(h12Str, e.target.value, ampmStr)} style={{ padding: '4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', outline: 'none' }}>
                                                {Array.from({length: 4}, (_, i) => {
                                                    const mVal = String(i * 15).padStart(2, '0');
                                                    const ts = `${String(h24).padStart(2, '0')}:${mVal}`;
                                                    const dis = isTimeDisabled(ts, 15);
                                                    return <option key={mVal} value={mVal} disabled={dis} style={{ background: dis ? '#f1f5f9' : 'white', color: dis ? '#94a3b8' : 'black' }}>{mVal}</option>
                                                })}
                                            </select>
                                            <select value={ampmStr} onChange={(e) => updateTime(h12Str, mStr, e.target.value)} style={{ padding: '4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', marginLeft: '2px', outline: 'none' }}>
                                                {(() => { const amD = Array.from({length:12}).every((_,i) => isHourDisabled(i===11?0:i+1)); const pmD = Array.from({length:12}).every((_,i) => isHourDisabled(i===11?12:i+13)); return <><option value="AM" disabled={amD} style={{ background: amD?'#f1f5f9':'white', color: amD?'#94a3b8':'black' }}>AM</option><option value="PM" disabled={pmD} style={{ background: pmD?'#f1f5f9':'white', color: pmD?'#94a3b8':'black' }}>PM</option></>; })()}
                                            </select>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Duration</label>
                                <select title="Duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))} disabled={!startTime} style={{ padding: '4px', fontSize: '12px', width: '75px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                    {ALL_DURATIONS.filter(d => d <= 120).map(d => { const dis = d > maxDur; return <option key={d} value={d} disabled={dis} style={{ background: dis ? '#f1f5f9' : 'white', color: dis ? '#94a3b8' : 'black' }}>{d} min</option> })}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Mode</label>
                                <select title="Consultation Mode" value={consultationType} onChange={(e) => setConsultationType(e.target.value)} style={{ padding: '4px', fontSize: '12px', width: '80px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                    <option value="Online">Online</option>
                                    <option value="In-Person">In-Person</option>
                                    <option value="Both">Both</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', background: sessionType === 'Group' ? '#e2e8f0' : 'transparent', padding: '4px 6px', borderRadius: '6px', margin: '-4px -6px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Session</label>
                                    <select title="Session Type" value={sessionType} onChange={(e) => { setSessionType(e.target.value); if(e.target.value === '1-to-1') setMaxCapacity(1); else setMaxCapacity(2); }} style={{ padding: '4px', fontSize: '12px', width: '80px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                        <option value="1-to-1">1-to-1</option>
                                        <option value="Group">Group</option>
                                    </select>
                                </div>
                                {sessionType === 'Group' && (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Cap</label>
                                        <input type="number" min="2" title="Capacity" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value === '' ? '' : Number(e.target.value))} style={{ padding: '4px', fontSize: '12px', width: '40px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Fee (₹)</label>
                                <input type="number" min="0" title="Fee" value={fee} onChange={(e) => setFee(e.target.value === '' ? '' : Number(e.target.value))} style={{ padding: '4px', fontSize: '12px', width: '60px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '14px' }}>
                                <button onClick={() => handleAddSlot()} disabled={loading || !startTime} style={{ background: '#10b981', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: (loading || !startTime) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Save</button>
                                <button onClick={() => setShowAddSlotForm(false)} style={{ background: '#ef4444', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => {
                                findBestAvailableTimeAndSet();
                                setShowAddSlotForm(true);
                            }} style={{ background: '#3b82f6', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add Slot</button>
                            <button 
                                onClick={async () => {
                                    if (!window.confirm('Cancel ALL slots for this date?')) return;
                                    setLoading(true);
                                    try {
                                        const res = await axios.post(
                                            `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:5000'}/api/doctors/slots/cancel-date`,
                                            { date: selectedExceptionDate },
                                            { headers: { Authorization: `Bearer ${token}` } }
                                        );
                                        setScheduleOverrides(res.data.scheduleOverrides);
                                        alert('All slots for date cancelled.');
                                    } catch (e) {
                                        alert('Error canceling date');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                style={{ background: '#ef4444', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Cancel Entire Day
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Visual Timeline */}
            <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Daily Timeline</h4>
                <div style={{ margin: 0, fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                        <span>Click a block to view details or edit.</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '2px', display: 'inline-block' }}></span> Online</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px', display: 'inline-block' }}></span> In-Person</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '12px', background: '#8b5cf6', borderRadius: '2px', display: 'inline-block' }}></span> Both</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ fontSize: '14px' }}>👥</span> Group Session</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '12px', background: 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 3px, #3b82f6 3px, #3b82f6 6px)', borderRadius: '2px', display: 'inline-block' }}></span> Disabled</span>
                    </div>
                    {viewMode === 'exceptions' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '12px', background: 'repeating-linear-gradient(45deg, #3b82f6, #3b82f6 3px, #eab308 3px, #eab308 6px)', borderRadius: '2px', display: 'inline-block' }}></span> Rescheduled</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '12px', background: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 3px, #3b82f6 3px, #3b82f6 6px)', borderRadius: '2px', display: 'inline-block' }}></span> Cancelled</span>
                        </div>
                    )}
                </div>
                {renderTimeline()}
            </div>

        </div>
    );
};

export default SlotManagement;
