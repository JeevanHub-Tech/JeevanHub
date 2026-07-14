import React, { useState, useEffect } from 'react';
import { Salad, Sprout, Leaf, Plus, X, Send, Loader2, Copy, ListChecks } from 'lucide-react';
import './DietPlanForm.css';
import { authFetch } from '../../../utils/authFetch';

// --- Constants ---
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEAL_FIELDS = ['breakfast', 'lunch', 'dinner', 'juices'];
const BLANK_DAY = { breakfast: "", lunch: "", dinner: "", juices: "" };

const MEAL_PLACEHOLDERS = {
	breakfast: "e.g., Warm oats with stewed apple and a pinch of cinnamon",
	lunch: "e.g., Steamed rice, moong dal, and seasonal cooked vegetables",
	dinner: "e.g., Light khichdi with ghee; avoid heavy or fried foods",
	juices: "e.g., Warm water with lemon and honey"
};

const blankWeekly = () => DAYS_OF_WEEK.reduce((acc, day) => {
	acc[day] = { ...BLANK_DAY };
	return acc;
}, {});

// Are all 7 days identical? Used to detect whether an existing plan can be shown
// collapsed in "same every day" mode, or needs the full per-day editor.
const daysAreIdentical = (weekly) => {
	const first = JSON.stringify(weekly[DAYS_OF_WEEK[0]]);
	return DAYS_OF_WEEK.every(day => JSON.stringify(weekly[day]) === first);
};

// --- Main Form Component ---
export function DietPlanForm({ bookingId, patientId, doctorId, onPrescribed }) {
	const [activeTab, setActiveTab] = useState('weekly');
	const [entryMode, setEntryMode] = useState('same'); // 'same' | 'custom'
	const [activeDayTab, setActiveDayTab] = useState('monday');
	const [herbInput, setHerbInput] = useState("");

	const [loading, setLoading] = useState(false);
	const [loadingExisting, setLoadingExisting] = useState(true);
	const [error, setError] = useState(null);

	const [templateDay, setTemplateDay] = useState({ ...BLANK_DAY });
	const [weeklyPlan, setWeeklyPlan] = useState(blankWeekly);
	const [herbs, setHerbs] = useState([]);

	// Pre-fill from an existing plan for this booking, if one has already been prescribed.
	useEffect(() => {
		const fetchExisting = async () => {
			if (!bookingId) {
				setLoadingExisting(false);
				return;
			}
			try {
				const response = await authFetch(
					`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/diet-yoga/booking/${bookingId}`
				);
				if (response.ok) {
					const data = await response.json();
					const existingWeekly = data?.dietYoga?.diet?.weekly;
					if (existingWeekly) {
						const filledWeekly = DAYS_OF_WEEK.reduce((acc, day) => {
							acc[day] = { ...BLANK_DAY, ...existingWeekly[day] };
							return acc;
						}, {});
						setWeeklyPlan(filledWeekly);
						if (daysAreIdentical(filledWeekly)) {
							setEntryMode('same');
							setTemplateDay(filledWeekly.monday);
						} else {
							setEntryMode('custom');
						}
					}
					if (data?.dietYoga?.diet?.herbs) {
						setHerbs(data.dietYoga.diet.herbs);
					}
				}
				// A 404 here just means no plan exists yet — start blank, which is already the default state.
			} catch (err) {
				console.error("Error fetching existing diet plan:", err);
			} finally {
				setLoadingExisting(false);
			}
		};

		fetchExisting();
	}, [bookingId]);

	// --- Event Handlers ---
	const updateTemplateField = (field, value) => {
		setTemplateDay(prev => ({ ...prev, [field]: value }));
	};

	const updateWeeklyDiet = (day, field, value) => {
		setWeeklyPlan(prev => ({
			...prev,
			[day]: { ...prev[day], [field]: value }
		}));
	};

	// Switching modes carries over whatever's already been typed, so nothing is lost.
	const switchToCustom = () => {
		setWeeklyPlan(DAYS_OF_WEEK.reduce((acc, day) => {
			acc[day] = { ...templateDay };
			return acc;
		}, {}));
		setEntryMode('custom');
	};

	const switchToSame = () => {
		setTemplateDay({ ...weeklyPlan.monday });
		setEntryMode('same');
	};

	const addHerb = () => {
		const trimmedHerb = herbInput.trim();
		if (trimmedHerb && !herbs.includes(trimmedHerb)) {
			setHerbs(prev => [...prev, trimmedHerb]);
			setHerbInput("");
		}
	};

	const removeHerb = (herbToRemove) => {
		setHerbs(prev => prev.filter(herb => herb !== herbToRemove));
	};

	const handleHerbInputKeyPress = (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			addHerb();
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		setLoading(true);
		setError(null);

		const finalWeekly = entryMode === 'same'
			? DAYS_OF_WEEK.reduce((acc, day) => { acc[day] = { ...templateDay }; return acc; }, {})
			: weeklyPlan;

		try {
			const response = await authFetch(
				`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/diet-yoga/`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						bookingId: bookingId,
						patientId: patientId,
						doctorId: doctorId,
						dietPlan: { weekly: finalWeekly, herbs }
					})
				}
			);

			if (!response.ok) {
				const errData = await response.json().catch(() => ({}));
				throw new Error(errData.message || "Failed to submit diet plan");
			}

			await response.json();
			alert("The diet plan has been successfully prescribed.");
			onPrescribed?.();

		} catch (err) {
			console.error("Submission Error:", err);
			setError(err.message);
			alert(`Error: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	if (loadingExisting) {
		return (
			<div className="form-card">
				<div className="form-header">
					<h3 className="form-title">
						<Salad className="form-icon" size={24} />
						Prescribe Diet Plan
					</h3>
				</div>
				<div className="form-content">
					<p className="diet-loading">Checking for an existing plan...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="form-card">
			<div className="form-header">
				<h3 className="form-title">
					<Salad className="form-icon" size={24} />
					Prescribe Diet Plan
				</h3>
			</div>
			<div className="form-content">
				<form onSubmit={handleSubmit} className="diet-form">
					{/* Tab Navigation */}
					<div className="diet-subtabs">
						<button type="button" className={`diet-subtab ${activeTab === 'weekly' ? 'active' : ''}`} onClick={() => setActiveTab('weekly')}>Weekly Plan</button>
						<button type="button" className={`diet-subtab ${activeTab === 'herbs' ? 'active' : ''}`} onClick={() => setActiveTab('herbs')}>Herbs & Supplements</button>
					</div>

					{/* Tab Content */}
					<div className="diet-subtab-content">
						{/* Weekly Plan View */}
						{activeTab === 'weekly' && (
							<div className="weekly-entry-mode">
								<div className="entry-mode-toggle">
									<button type="button" className={`mode-btn ${entryMode === 'same' ? 'active' : ''}`} onClick={switchToSame}>
										<Copy size={16} /> Same plan every day
									</button>
									<button type="button" className={`mode-btn ${entryMode === 'custom' ? 'active' : ''}`} onClick={switchToCustom}>
										<ListChecks size={16} /> Customize per day
									</button>
								</div>

								{entryMode === 'same' ? (
									<div className="weekly-day-card">
										<h4 className="weekly-day-title">Applies every day this week</h4>
										<div className="weekly-day-grid">
											{MEAL_FIELDS.map(meal => (
												<div key={meal} className="weekly-meal-section">
													<label className="weekly-meal-label">{meal.charAt(0).toUpperCase() + meal.slice(1)}</label>
													<textarea
														className="diet-textarea"
														value={templateDay[meal]}
														onChange={(e) => updateTemplateField(meal, e.target.value)}
														placeholder={MEAL_PLACEHOLDERS[meal]}
														rows="2"
													/>
												</div>
											))}
										</div>
									</div>
								) : (
									<>
										<div className="day-tabs">
											{DAYS_OF_WEEK.map(day => (
												<button
													key={day}
													type="button"
													className={`day-tab ${activeDayTab === day ? 'active' : ''}`}
													onClick={() => setActiveDayTab(day)}
												>
													{day.slice(0, 3).toUpperCase()}
												</button>
											))}
										</div>
										<div className="weekly-day-card">
											<h4 className="weekly-day-title">{activeDayTab.charAt(0).toUpperCase() + activeDayTab.slice(1)}</h4>
											<div className="weekly-day-grid">
												{MEAL_FIELDS.map(meal => (
													<div key={meal} className="weekly-meal-section">
														<label className="weekly-meal-label">{meal.charAt(0).toUpperCase() + meal.slice(1)}</label>
														<textarea
															className="diet-textarea"
															value={weeklyPlan[activeDayTab][meal]}
															onChange={(e) => updateWeeklyDiet(activeDayTab, meal, e.target.value)}
															placeholder={MEAL_PLACEHOLDERS[meal]}
															rows="2"
														/>
													</div>
												))}
											</div>
										</div>
									</>
								)}
							</div>
						)}

						{/* Herbs & Supplements View */}
						{activeTab === 'herbs' && (
							<div className="herbs-section">
								<h4 className="herbs-title"><Sprout size={18} />Herbs & Supplements</h4>
								<div className="herb-input-group">
									<input type="text" className="herb-input" value={herbInput} onChange={(e) => setHerbInput(e.target.value)} placeholder="Enter herb name and press Enter" onKeyPress={handleHerbInputKeyPress} />
									<button type="button" onClick={addHerb} className="add-herb-btn"><Plus size={20} /></button>
								</div>
								<div className="herb-tags">
									{herbs.length > 0 ? (
										herbs.map((herb, index) => (
											<div key={index} className="herb-tag">
												<Leaf size={14} />{herb}
												<button type="button" onClick={() => removeHerb(herb)} className="remove-herb-btn"><X size={14} /></button>
											</div>
										))
									) : (
										<p className="empty-state">No herbs added yet.</p>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Error Message Display (Optional) */}
					{error && <div style={{ color: 'red', marginTop: '10px' }}>Error: {error}</div>}

					<button type="submit" className="submit-button" disabled={loading}>
						{loading ? (
							<>
								<Loader2 className="animate-spin" size={18} style={{ marginRight: '8px' }} />
								Prescribing...
							</>
						) : (
							<>
								<Send size={18} style={{ marginRight: '8px' }} />
								Prescribe Diet Plan
							</>
						)}
					</button>
				</form>
			</div>
		</div>
	);
}
