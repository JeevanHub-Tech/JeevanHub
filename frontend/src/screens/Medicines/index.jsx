import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Fuse from "fuse.js";
import { Search, X, RefreshCw, AlertCircle, Loader2, ShoppingCart, Frown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthContext } from "../../context/AuthContext";
import { BACKEND_URL } from "../../config";
import MedicineCard from "./MedicineCard";

const PRICE_RANGE_OPTIONS = [
	{ value: "all", label: "All Prices" },
	{ value: "under-500", label: "Under ₹500" },
	{ value: "500-1000", label: "₹500 - ₹1,000" },
	{ value: "1000-2000", label: "₹1,000 - ₹2,000" },
	{ value: "above-2000", label: "Above ₹2,000" },
];
const SORT_OPTIONS = [
	{ value: "name", label: "Name (A-Z)" },
	{ value: "price-low", label: "Price: Low to High" },
	{ value: "price-high", label: "Price: High to Low" },
	{ value: "popularity", label: "Popularity" },
];

const Medicines = () => {
	const { auth } = useContext(AuthContext);
	const patientId = auth?.user?.id;
	const token = localStorage.getItem("token");
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const [medicines, setMedicines] = useState([]);
	const [filteredMedicines, setFilteredMedicines] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [cart, setCart] = useState([]);

	const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [priceRange, setPriceRange] = useState("all");
	const [sortBy, setSortBy] = useState("name");
	const [categories, setCategories] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const medPromise = axios.get(`${BACKEND_URL}/api/medicines`);

				const cartPromise = patientId
					? axios.get(`${BACKEND_URL}/api/cart/${patientId}`, {
							headers: { Authorization: `Bearer ${token}` },
						})
					: Promise.resolve({ data: { cartItems: { items: [] } } });

				const [medResponse, cartResponse] = await Promise.all([medPromise, cartPromise]);

				setMedicines(medResponse.data);
				setFilteredMedicines(medResponse.data);
				const uniqueCategories = [...new Set(medResponse.data.map((med) => med.category).filter(Boolean))];
				setCategories(uniqueCategories);

				// GET /api/cart/:patientId returns { defaultCart, doctorCarts } (see Cart.js),
				// NOT { cartItems } -- that shape is only returned by the add/update/remove
				// mutation endpoints. Backend item shape: [{ medicineId: {...}, quantity }]
				const backendItems = cartResponse.data.defaultCart?.items || [];
				const formattedCart = backendItems.reduce((acc, item) => {
					if (item.medicineId) {
						acc.push({
							...item.medicineId,
							quantity: item.quantity,
							_id: item.medicineId._id,
						});
					}
					return acc;
				}, []);

				setCart(formattedCart);
				setLoading(false);
			} catch (err) {
				console.error("Initialization Error:", err);
				setError(err.message);
				setLoading(false);
			}
		};

		fetchData();
	}, [patientId, token]);

	const fuse = useMemo(
		() =>
			new Fuse(medicines, {
				keys: [
					{ name: "name", weight: 0.5 },
					{ name: "diseasesTreated", weight: 0.3 },
					{ name: "description", weight: 0.15 },
					{ name: "category", weight: 0.05 },
				],
				threshold: 0.35,
				ignoreLocation: true,
				minMatchCharLength: 2,
			}),
		[medicines],
	);

	useEffect(() => {
		let result = searchTerm.trim() ? fuse.search(searchTerm.trim()).map((match) => match.item) : [...medicines];

		if (selectedCategory !== "all") {
			result = result.filter((medicine) => medicine.category === selectedCategory);
		}

		if (priceRange !== "all") {
			result = result.filter((medicine) => {
				const price = medicine.price;
				switch (priceRange) {
					case "under-500":
						return price < 500;
					case "500-1000":
						return price >= 500 && price <= 1000;
					case "1000-2000":
						return price > 1000 && price <= 2000;
					case "above-2000":
						return price > 2000;
					default:
						return true;
				}
			});
		}

		result.sort((a, b) => {
			switch (sortBy) {
				case "name":
					return a.name?.localeCompare(b.name);
				case "price-low":
					return a.price - b.price;
				case "price-high":
					return b.price - a.price;
				case "popularity":
					return (b.rating || 0) - (a.rating || 0);
				default:
					return 0;
			}
		});

		setFilteredMedicines(result);
	}, [searchTerm, selectedCategory, priceRange, sortBy, medicines, fuse]);

	const updateLocalCartFromBackend = (backendCartData) => {
		const backendItems = backendCartData.items || [];
		const formattedCart = backendItems.map((item) => ({
			...item.medicineId,
			quantity: item.quantity,
			_id: item.medicineId._id,
		}));
		setCart(formattedCart);
	};

	const addToCart = async (medicine) => {
		if (!patientId) {
			alert("Please login to add items to cart");
			return;
		}

		try {
			const existingItem = cart.find((item) => item._id === medicine._id);

			if (existingItem) {
				const response = await axios.put(
					`${BACKEND_URL}/api/cart/update-quantity`,
					{ patientId, medicineId: medicine._id, action: "increment" },
					{ headers: { Authorization: `Bearer ${token}` } },
				);
				if (response.data.cartItems) {
					updateLocalCartFromBackend(response.data.cartItems);
				}
			} else {
				const response = await axios.post(
					`${BACKEND_URL}/api/cart/add`,
					{ patientId, medicineId: medicine._id, quantity: 1 },
					{ headers: { Authorization: `Bearer ${token}` } },
				);
				if (response.data.cartItems) {
					updateLocalCartFromBackend(response.data.cartItems);
				}
			}
		} catch (err) {
			console.error("Add to cart failed:", err);
			alert("Failed to add item to cart");
		}
	};

	const handleQuantityChange = async (id, delta) => {
		if (!patientId) return;

		const currentItem = cart.find((item) => item._id === id);
		if (!currentItem) return;

		const newQuantity = currentItem.quantity + delta;

		try {
			if (newQuantity <= 0) {
				const response = await axios.delete(`${BACKEND_URL}/api/cart/remove`, {
					headers: { Authorization: `Bearer ${token}` },
					data: { patientId, medicineId: id },
				});
				if (response.data.cartItems) {
					updateLocalCartFromBackend(response.data.cartItems);
				} else {
					setCart([]);
				}
			} else {
				const action = delta > 0 ? "increment" : "decrement";
				const response = await axios.put(
					`${BACKEND_URL}/api/cart/update-quantity`,
					{ patientId, medicineId: id, action },
					{ headers: { Authorization: `Bearer ${token}` } },
				);
				if (response.data.cartItems) {
					updateLocalCartFromBackend(response.data.cartItems);
				}
			}
		} catch (err) {
			console.error("Update quantity failed:", err);
		}
	};

	const resetFilters = () => {
		setSearchTerm("");
		setSelectedCategory("all");
		setPriceRange("all");
		setSortBy("name");
	};

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-3 text-muted-foreground">
					<Loader2 className="size-8 animate-spin text-primary" />
					<p>Loading medicines...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<EmptyState
					icon={AlertCircle}
					title="Oops! Something went wrong"
					description={error}
					action={
						<Button variant="outline" onClick={() => window.location.reload()}>
							Try Again
						</Button>
					}
				/>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background pb-16">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="mb-8 text-center">
					<h1 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">Ayurvedic Medicines</h1>
					<p className="mt-2 text-base text-muted-foreground">Natural healing solutions for your wellbeing</p>
				</div>

				<div className="mb-6 flex flex-col gap-4">
					<div className="relative">
						<Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search medicines by name, condition/disease, or description..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="h-11 pl-10 pr-10"
						/>
						{searchTerm && (
							<button
								type="button"
								className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								onClick={() => setSearchTerm("")}
								aria-label="Clear search"
							>
								<X className="size-5" />
							</button>
						)}
					</div>

					<div className="flex flex-wrap items-end gap-3">
						<Field className="w-44">
							<FieldLabel htmlFor="category">Category</FieldLabel>
							<Select value={selectedCategory} onValueChange={setSelectedCategory}>
								<SelectTrigger id="category">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Categories</SelectItem>
									{categories.map((cat) => (
										<SelectItem key={cat} value={cat}>
											{cat}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>

						<Field className="w-44">
							<FieldLabel htmlFor="price">Price Range</FieldLabel>
							<Select value={priceRange} onValueChange={setPriceRange}>
								<SelectTrigger id="price">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{PRICE_RANGE_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>

						<Field className="w-44">
							<FieldLabel htmlFor="sort">Sort By</FieldLabel>
							<Select value={sortBy} onValueChange={setSortBy}>
								<SelectTrigger id="sort">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{SORT_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>

						<Button type="button" variant="outline" onClick={resetFilters}>
							<RefreshCw className="size-4" />
							Reset
						</Button>
					</div>
				</div>

				<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
					<p className="text-sm text-muted-foreground">
						Showing <strong className="text-foreground">{filteredMedicines.length}</strong> of{" "}
						<strong className="text-foreground">{medicines.length}</strong> medicines
					</p>
					{cart.length > 0 && (
						<Button type="button" variant="secondary" onClick={() => navigate("/cart")}>
							<ShoppingCart className="size-4" />
							{cart.reduce((acc, item) => acc + item.quantity, 0)} items in cart
						</Button>
					)}
				</div>

				{filteredMedicines.length > 0 ? (
					<div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
						{filteredMedicines.map((medicine) => (
							<MedicineCard
								key={medicine._id}
								medicine={medicine}
								cart={cart}
								addToCart={addToCart}
								handleQuantityChange={handleQuantityChange}
							/>
						))}
					</div>
				) : (
					<EmptyState
						icon={Frown}
						title="No medicines found"
						description="Try adjusting your filters, or search by the condition/disease it treats"
						action={
							<Button onClick={resetFilters} className="w-full">
								Clear All Filters
							</Button>
						}
					/>
				)}
			</div>
		</div>
	);
};

export default Medicines;
