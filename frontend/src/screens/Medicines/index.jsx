import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Search, X, RefreshCw, AlertCircle, Loader2, ShoppingCart, Frown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
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

const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 400;

// Builds the compact page-number sequence with ellipses, e.g. [1, "...", 4, 5, 6, "...", 20]
const buildPageList = (current, total) => {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
	const pages = new Set([1, total, current, current - 1, current + 1]);
	const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
	const result = [];
	sorted.forEach((p, i) => {
		if (i > 0 && p - sorted[i - 1] > 1) result.push("ellipsis-" + p);
		result.push(p);
	});
	return result;
};

const Medicines = () => {
	const { auth } = useContext(AuthContext);
	const patientId = auth?.user?.id;
	const token = localStorage.getItem("token");
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const [medicines, setMedicines] = useState([]);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [cart, setCart] = useState([]);
	const [cartLoaded, setCartLoaded] = useState(false);

	// GlobalSearchBox navigates here with ?q=<term> when there's no direct
	// match to jump straight to — prefill the search from it.
	const [searchInput, setSearchInput] = useState(() => searchParams.get("q") || "");
	const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") || "");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [priceRange, setPriceRange] = useState("all");
	const [sortBy, setSortBy] = useState("name");
	const [categories, setCategories] = useState([]);

	// Base UI's Select needs an `items` list to resolve the trigger's display
	// label before the popup (where the matching SelectItem lives) has ever
	// been mounted — without it the trigger shows the raw value instead.
	const categoryItems = useMemo(
		() => [{ value: "all", label: "All Categories" }, ...categories.map((cat) => ({ value: cat, label: cat }))],
		[categories],
	);

	// Debounce free-text search so we don't re-fetch on every keystroke.
	useEffect(() => {
		const id = setTimeout(() => setSearchTerm(searchInput), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(id);
	}, [searchInput]);

	// Reset to page 1 whenever a filter changes.
	useEffect(() => {
		setPage(1);
	}, [searchTerm, selectedCategory, priceRange, sortBy]);

	// Categories are fetched once, independent of pagination.
	useEffect(() => {
		axios
			.get(`${BACKEND_URL}/api/medicines/categories`)
			.then((res) => setCategories(res.data || []))
			.catch((err) => console.error("Failed to fetch categories:", err));
	}, []);

	// Cart is fetched once (independent of the medicine page/filters).
	useEffect(() => {
		const fetchCart = async () => {
			try {
				const cartResponse = patientId
					? await axios.get(`${BACKEND_URL}/api/cart/${patientId}`, {
							headers: { Authorization: `Bearer ${token}` },
						})
					: { data: { defaultCart: { items: [] } } };

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
			} catch (err) {
				console.error("Failed to fetch cart:", err);
			} finally {
				setCartLoaded(true);
			}
		};

		fetchCart();
	}, [patientId, token]);

	// Medicines are fetched per page/filter combo from the server.
	useEffect(() => {
		const fetchMedicines = async () => {
			setLoading(true);
			try {
				const response = await axios.get(`${BACKEND_URL}/api/medicines`, {
					params: {
						page,
						limit: PAGE_SIZE,
						search: searchTerm || undefined,
						category: selectedCategory !== "all" ? selectedCategory : undefined,
						priceRange: priceRange !== "all" ? priceRange : undefined,
						sortBy,
					},
				});

				setMedicines(response.data.medicines || []);
				setTotal(response.data.total || 0);
				setTotalPages(response.data.totalPages || 1);
				setError(null);
			} catch (err) {
				console.error("Failed to fetch medicines:", err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchMedicines();
	}, [page, searchTerm, selectedCategory, priceRange, sortBy]);

	const cartQuantityById = useMemo(() => {
		const map = new Map();
		cart.forEach((item) => map.set(item._id, item.quantity));
		return map;
	}, [cart]);

	const updateLocalCartFromBackend = useCallback((backendCartData) => {
		const backendItems = backendCartData.items || [];
		const formattedCart = backendItems.map((item) => ({
			...item.medicineId,
			quantity: item.quantity,
			_id: item.medicineId._id,
		}));
		setCart(formattedCart);
	}, []);

	// Both handlers update `cart` synchronously first (optimistic) so the +/- buttons
	// feel instant, then reconcile with the server response or roll back on failure --
	// without this the UI sat frozen for the full round-trip on every click.
	const addToCart = useCallback(
		async (medicine) => {
			if (!patientId) {
				alert("Please login to add items to cart");
				return;
			}

			const existingQuantity = cartQuantityById.get(medicine._id);
			const previousCart = cart;

			if (existingQuantity) {
				setCart((prev) => prev.map((item) => (item._id === medicine._id ? { ...item, quantity: item.quantity + 1 } : item)));
			} else {
				setCart((prev) => [...prev, { ...medicine, quantity: 1 }]);
			}

			try {
				if (existingQuantity) {
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
				setCart(previousCart);
				alert("Failed to add item to cart");
			}
		},
		[patientId, token, cart, cartQuantityById, updateLocalCartFromBackend],
	);

	const handleQuantityChange = useCallback(
		async (id, delta) => {
			if (!patientId) return;

			const currentQuantity = cartQuantityById.get(id);
			if (currentQuantity === undefined) return;

			const newQuantity = currentQuantity + delta;
			const previousCart = cart;

			if (newQuantity <= 0) {
				setCart((prev) => prev.filter((item) => item._id !== id));
			} else {
				setCart((prev) => prev.map((item) => (item._id === id ? { ...item, quantity: newQuantity } : item)));
			}

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
				setCart(previousCart);
			}
		},
		[patientId, token, cart, cartQuantityById, updateLocalCartFromBackend],
	);

	const resetFilters = () => {
		setSearchInput("");
		setSearchTerm("");
		setSelectedCategory("all");
		setPriceRange("all");
		setSortBy("name");
	};

	const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
	const pageList = useMemo(() => buildPageList(page, totalPages), [page, totalPages]);

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
							placeholder="Search medicines by name, ingredients, or description..."
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							className="h-11 pl-10 pr-10"
						/>
						{searchInput && (
							<button
								type="button"
								className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								onClick={() => setSearchInput("")}
								aria-label="Clear search"
							>
								<X className="size-5" />
							</button>
						)}
					</div>

					<div className="flex flex-wrap items-end gap-3">
						<Field className="w-44">
							<FieldLabel htmlFor="category">Category</FieldLabel>
							<Select value={selectedCategory} onValueChange={setSelectedCategory} items={categoryItems}>
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
							<Select value={priceRange} onValueChange={setPriceRange} items={PRICE_RANGE_OPTIONS}>
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
							<Select value={sortBy} onValueChange={setSortBy} items={SORT_OPTIONS}>
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
						{loading ? (
							"Updating results…"
						) : (
							<>
								Showing <strong className="text-foreground">{medicines.length}</strong> of{" "}
								<strong className="text-foreground">{total}</strong> medicines
							</>
						)}
					</p>
					{cartLoaded && cartCount > 0 && (
						<Button type="button" variant="secondary" onClick={() => navigate("/cart")}>
							<ShoppingCart className="size-4" />
							{cartCount} items in cart
						</Button>
					)}
				</div>

				{/* Only this results container reacts to loading/error/empty — the
				    header, search box, and filters above stay mounted and focused
				    the whole time so typing a search term doesn't feel like a
				    page reload. */}
				<div className={`relative transition-opacity duration-150 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
					{loading && medicines.length === 0 ? (
						<div className="flex min-h-72 flex-col items-center justify-center gap-3 text-muted-foreground">
							<Loader2 className="size-8 animate-spin text-primary" />
							<p>Loading medicines...</p>
						</div>
					) : error ? (
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
					) : medicines.length > 0 ? (
						<>
							<div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
								{medicines.map((medicine) => (
									<MedicineCard
										key={medicine._id}
										medicine={medicine}
										cartQuantity={cartQuantityById.get(medicine._id) || 0}
										addToCart={addToCart}
										handleQuantityChange={handleQuantityChange}
									/>
								))}
							</div>

							{totalPages > 1 && (
								<Pagination className="mt-10">
									<PaginationContent>
										<PaginationItem>
											<PaginationPrevious
												href="#"
												aria-disabled={page === 1}
												className={page === 1 ? "pointer-events-none opacity-50" : ""}
												onClick={(e) => {
													e.preventDefault();
													if (page > 1) setPage(page - 1);
												}}
											/>
										</PaginationItem>

										{pageList.map((p) =>
											typeof p === "number" ? (
												<PaginationItem key={p}>
													<PaginationLink
														href="#"
														isActive={p === page}
														onClick={(e) => {
															e.preventDefault();
															setPage(p);
														}}
													>
														{p}
													</PaginationLink>
												</PaginationItem>
											) : (
												<PaginationItem key={p}>
													<PaginationEllipsis />
												</PaginationItem>
											),
										)}

										<PaginationItem>
											<PaginationNext
												href="#"
												aria-disabled={page === totalPages}
												className={page === totalPages ? "pointer-events-none opacity-50" : ""}
												onClick={(e) => {
													e.preventDefault();
													if (page < totalPages) setPage(page + 1);
												}}
											/>
										</PaginationItem>
									</PaginationContent>
								</Pagination>
							)}
						</>
					) : (
						<EmptyState
							icon={Frown}
							title="No medicines found"
							description="Try adjusting your filters or search terms"
							action={
								<Button onClick={resetFilters} className="w-full">
									Clear All Filters
								</Button>
							}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default Medicines;
