const Doctor = require("../models/Doctor");

// Helper to convert "HH:mm" to minutes since midnight for easy overlap checking
const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
};

// Helper to check for overlaps
const checkOverlap = (slots, newSlot, excludeSlotId = null) => {
    const newStart = timeToMinutes(newSlot.startTime);
    const newEnd = newStart + Number(newSlot.duration || 0);

    for (let slot of slots) {
        if (excludeSlotId && slot._id && slot._id.toString() === excludeSlotId.toString()) continue;
        
        const existingStart = timeToMinutes(slot.startTime);
        const existingEnd = existingStart + Number(slot.duration || 0);

        // Check for overlap: New slot starts before existing ends AND new slot ends after existing starts
        if (newStart < existingEnd && newEnd > existingStart) {
            return true; // Overlap detected
        }
    }
    return false;
};

exports.addSlotTemplate = async (req, res) => {
    try {
        const { day, startTime, duration, fee, consultationType, sessionType, maxCapacity } = req.body;
        const doctorId = req.user._id;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: "Doctor not found" });

        if (!doctor.availableSlots[day]) {
            return res.status(400).json({ message: "Invalid day" });
        }

        const newSlot = {
            startTime, duration, fee, consultationType, sessionType, maxCapacity
        };

        if (checkOverlap(doctor.availableSlots[day], newSlot)) {
            return res.status(400).json({ message: "Slot overlaps with an existing slot on this day." });
        }

        doctor.availableSlots[day].push(newSlot);
        // Sort slots by start time
        doctor.availableSlots[day].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        await doctor.save();
        res.status(200).json({ message: "Slot added successfully", availableSlots: doctor.availableSlots });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.editSlotTemplate = async (req, res) => {
    try {
        const { day, slotId } = req.params;
        const updates = req.body;
        const doctorId = req.user._id;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: "Doctor not found" });

        const slotIndex = doctor.availableSlots[day].findIndex(s => s._id.toString() === slotId);
        if (slotIndex === -1) return res.status(404).json({ message: "Slot not found" });

        const currentSlot = doctor.availableSlots[day][slotIndex].toObject();
        const updatedSlot = { ...currentSlot, ...updates };

        if (checkOverlap(doctor.availableSlots[day], updatedSlot, slotId)) {
            return res.status(400).json({ message: "Updated slot overlaps with an existing slot." });
        }

        doctor.availableSlots[day][slotIndex] = updatedSlot;
        doctor.availableSlots[day].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        await doctor.save();
        res.status(200).json({ message: "Slot updated successfully", availableSlots: doctor.availableSlots });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.toggleDisableDay = async (req, res) => {
    try {
        const { day } = req.params;
        const { disable } = req.body; // true to disable all, false to enable all
        const doctorId = req.user._id;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: "Doctor not found" });

        if (doctor.availableSlots[day]) {
            doctor.availableSlots[day].forEach(slot => {
                slot.isDisabled = disable;
            });
            await doctor.save();
        }

        res.status(200).json({ message: `All slots for ${day} ${disable ? 'disabled' : 'enabled'} successfully`, availableSlots: doctor.availableSlots });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.deleteSlotTemplate = async (req, res) => {
    try {
        const { day, slotId } = req.params;
        const doctorId = req.user._id;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: "Doctor not found" });

        doctor.availableSlots[day] = doctor.availableSlots[day].filter(s => s._id.toString() !== slotId);
        
        await doctor.save();
        res.status(200).json({ message: "Slot deleted successfully", availableSlots: doctor.availableSlots });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.addScheduleOverride = async (req, res) => {
    try {
        const { date, type, originalStartTime, newStartTime, newDuration, newFee, newConsultationType, newSessionType, newMaxCapacity, newBufferTime } = req.body;
        const doctorId = req.user._id;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: "Doctor not found" });

        const override = {
            date: new Date(date),
            type,
            originalStartTime,
            newStartTime, newDuration, newFee, newConsultationType, newSessionType, newMaxCapacity, newBufferTime
        };

        const existingIndex = doctor.scheduleOverrides.findIndex(o => {
            const isSameDate = new Date(o.date).toDateString() === new Date(date).toDateString();
            if (!isSameDate) return false;
            if (type === 'added') return o.type === 'added' && o.newStartTime === newStartTime;
            return o.originalStartTime === originalStartTime;
        });

        if (existingIndex !== -1) {
            doctor.scheduleOverrides[existingIndex] = override;
        } else {
            doctor.scheduleOverrides.push(override);
        }

        // Clean up old overrides while we're saving
        doctor.scheduleOverrides = doctor.scheduleOverrides.filter(o => {
            const overrideDate = new Date(o.date);
            overrideDate.setHours(0,0,0,0);
            const today = new Date();
            today.setHours(0,0,0,0);
            return overrideDate >= today;
        });

        await doctor.save();

        res.status(200).json({ message: "Schedule override applied successfully", scheduleOverrides: doctor.scheduleOverrides });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.cancelDateSlots = async (req, res) => {
    try {
        const { date } = req.body;
        const doctorId = req.user._id;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: "Doctor not found" });

        // Check if there's already a full date cancellation
        const existingCancel = doctor.scheduleOverrides.find(
            o => new Date(o.date).toDateString() === new Date(date).toDateString() && o.type === 'cancelled' && !o.originalStartTime
        );

        if (!existingCancel) {
            doctor.scheduleOverrides.push({
                date: new Date(date),
                type: 'cancelled'
                // leaving originalStartTime blank means the WHOLE DATE is cancelled
            });
        }

        // Clean up old overrides while we're saving
        doctor.scheduleOverrides = doctor.scheduleOverrides.filter(o => {
            const overrideDate = new Date(o.date);
            overrideDate.setHours(0,0,0,0);
            const today = new Date();
            today.setHours(0,0,0,0);
            return overrideDate >= today;
        });

        await doctor.save();

        res.status(200).json({ message: "All slots for date cancelled successfully", scheduleOverrides: doctor.scheduleOverrides });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.removeScheduleOverride = async (req, res) => {
    try {
        const { date, originalStartTime } = req.body;
        const doctorId = req.user._id;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: "Doctor not found" });

        doctor.scheduleOverrides = doctor.scheduleOverrides.filter(o => {
            const isSameDate = new Date(o.date).toDateString() === new Date(date).toDateString();
            if (!isSameDate) return true;
            if (o.type === 'added') return o.newStartTime !== originalStartTime;
            return o.originalStartTime !== originalStartTime;
        });

        // Clean up old overrides while we're saving
        doctor.scheduleOverrides = doctor.scheduleOverrides.filter(o => {
            const overrideDate = new Date(o.date);
            overrideDate.setHours(0,0,0,0);
            const today = new Date();
            today.setHours(0,0,0,0);
            return overrideDate >= today;
        });

        await doctor.save();
        res.status(200).json({ message: "Override removed successfully", scheduleOverrides: doctor.scheduleOverrides });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getProcessedSlotsForDate = async (req, res) => {
    try {
        const { doctorId, date } = req.params;
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: "Doctor not found" });

        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];

        let baseSlots = [...(doctor.availableSlots[dayName] || [])];
        
        // 1. Check for whole day cancel
        const wholeDayCancel = doctor.scheduleOverrides.find(o => 
            new Date(o.date).toDateString() === dateObj.toDateString() && o.type === 'cancelled' && !o.originalStartTime
        );
        
        if (wholeDayCancel) {
            return res.status(200).json({ slots: [] }); 
        }

        // 2. Apply specific overrides
        const dateOverrides = doctor.scheduleOverrides.filter(o => new Date(o.date).toDateString() === dateObj.toDateString());
        
        for (const override of dateOverrides) {
            if (override.type === 'cancelled' && override.originalStartTime) {
                baseSlots = baseSlots.filter(s => s.startTime !== override.originalStartTime);
            } else if (override.type === 'rescheduled' && override.originalStartTime) {
                const idx = baseSlots.findIndex(s => s.startTime === override.originalStartTime);
                if (idx !== -1) {
                    baseSlots[idx] = {
                        ...(baseSlots[idx].toObject ? baseSlots[idx].toObject() : baseSlots[idx]),
                        startTime: override.newStartTime || baseSlots[idx].startTime,
                        duration: override.newDuration || baseSlots[idx].duration,
                        fee: override.newFee !== undefined ? override.newFee : baseSlots[idx].fee,
                        consultationType: override.newConsultationType || baseSlots[idx].consultationType,
                        sessionType: override.newSessionType || baseSlots[idx].sessionType,
                        maxCapacity: override.newMaxCapacity || baseSlots[idx].maxCapacity
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

        // 3. Remove disabled slots
        baseSlots = baseSlots.filter(s => !s.isDisabled);

        // 4. Sort by time
        const timeToMinutes = (time) => {
            if (!time) return 0;
            const [timeStr, modifier] = time.split(' ');
            let [hours, minutes] = timeStr.split(':').map(Number);
            if (hours === 12) hours = 0;
            if (modifier === 'PM') hours += 12;
            return hours * 60 + minutes;
        };
        baseSlots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        // 5. Query Bookings to calculate capacity
        const startOfDay = new Date(dateObj);
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(dateObj);
        endOfDay.setHours(23,59,59,999);

        const Booking = require('../models/Booking');
        const bookings = await Booking.find({
            doctorId,
            dateOfAppointment: { $gte: startOfDay, $lte: endOfDay },
            requestAccept: { $in: ['pending', 'accepted'] }
        });

        // 6. Map slots with capacity
        const finalSlots = baseSlots.map(slot => {
            const slotObj = slot.toObject ? slot.toObject() : slot;
            const slotBookings = bookings.filter(b => b.timeSlot === slotObj.startTime);
            const maxCap = slotObj.maxCapacity || 1;
            const remainingCapacity = maxCap - slotBookings.length;

            return {
                ...slotObj,
                remainingCapacity: Math.max(0, remainingCapacity)
            };
        });

        res.status(200).json({ slots: finalSlots });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
