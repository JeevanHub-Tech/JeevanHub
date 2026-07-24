import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BACKEND_URL } from "../config";

// Fallback image (real generic pharmacy photo)
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=80";

function MedicineIdDetails({ addToCart }) {
  const { id, medicineId } = useParams();
  const paramId = decodeURIComponent(medicineId ?? id ?? "");
  const navigate = useNavigate();

  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  // --- Image Swipe & Modal Logic ---
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const incrementQty = () => setQuantity((q) => q + 1);
  const decrementQty = () => setQuantity((q) => Math.max(1, q - 1));

  useEffect(() => {
    // Scroll to top when opening a new detail page
    window.scrollTo(0, 0);

    const fetchMedicine = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL || "http://localhost:8080"}/api/medicines/${paramId}`);
        const data = response.data;

        // Map backend data to frontend expected format
        const formattedMedicine = {
          id: data._id,
          name: data.name,
          pharmacy: data.retailerId ? `${data.retailerId.firstName || ""} ${data.retailerId.lastName || ""}`.trim() : "Unknown Pharmacy",
          price: data.price,
          images:
            data.images && data.images.length > 0
              ? data.images.map((img) => (img.startsWith("http") ? img : `${BACKEND_URL || "http://localhost:8080"}/${img}`))
              : [FALLBACK_IMAGE],
          imageSrc:
            data.images && data.images.length > 0
              ? data.images[0].startsWith("http")
                ? data.images[0]
                : `${BACKEND_URL || "http://localhost:8080"}/${data.images[0]}`
              : FALLBACK_IMAGE,
          description: data.description || "No description provided.",
          prescription: data.prescription || false,
          diseasesTreated: data.diseasesTreated || [],
          // Fill placeholders for fields not in backend schema yet
          ingredients: ["Information not provided"],
          usesBenefits: ["Information not provided"],
          dosage: "Please consult your doctor.",
          storageSafety: "Store in a cool, dry place.",
        };

        setMedicine(formattedMedicine);
      } catch (err) {
        console.error("Error fetching medicine details:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (paramId) {
      fetchMedicine();
    }
  }, [paramId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background pb-16">
        <h2 className="mx-auto max-w-6xl px-4 text-lg text-muted-foreground">Loading...</h2>
      </main>
    );
  }

  if (error || !medicine) {
    return (
      <main className="min-h-screen bg-background pb-16" aria-labelledby="medicine-title">
        <div className="mx-auto mb-4 max-w-6xl px-4">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)} aria-label="Go back">
            <ChevronLeft className="size-4" />
            Back
          </Button>
        </div>
        <section className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4">
          <h2 className="font-display text-2xl text-foreground">Medicine not found</h2>
          <p className="text-muted-foreground">We couldn't find a medicine for ID: {paramId}</p>
          <Button asChild>
            <Link to="/medicines">Browse medicines</Link>
          </Button>
        </section>
      </main>
    );
  }

  const priceNumber = Number.parseFloat(medicine.price);
  const formattedPrice = isNaN(priceNumber) ? `₹${medicine.price}` : `₹${priceNumber.toFixed(2)}`;

  const handleAddToCart = async () => {
    const patientId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!patientId) {
      alert("Please login to add items to cart");
      return;
    }

    try {
      await axios.post(
        `${BACKEND_URL || "http://localhost:8080"}/api/cart/add`,
        { patientId, medicineId: medicine.id, quantity: quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`${medicine.name} added to cart!`);
    } catch (error) {
      console.error("Failed to add to cart", error);
      alert("Failed to add item to cart. Please try again.");
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  // --- Image Swipe Logic ---
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentImageIndex < medicine.images.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
    if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  const showPrevImage = () => setCurrentImageIndex((prev) => (prev === 0 ? medicine.images.length - 1 : prev - 1));
  const showNextImage = () => setCurrentImageIndex((prev) => (prev === medicine.images.length - 1 ? 0 : prev + 1));

  const carouselDots = (extraClassName = "") =>
    medicine.images.length > 1 && (
      <div className={`flex items-center justify-center gap-2 ${extraClassName}`}>
        {medicine.images.map((_, idx) => (
          <span
            key={idx}
            onClick={() => setCurrentImageIndex(idx)}
            className={`size-2 cursor-pointer rounded-full transition-all duration-200 ${
              idx === currentImageIndex ? "scale-120 bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>
    );

  return (
    <main className="min-h-screen bg-background pb-16" aria-labelledby="medicine-title">
      <div className="mx-auto mb-4 max-w-6xl px-4">
        <Button type="button" variant="ghost" onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeft className="size-4" />
          Back
        </Button>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4">
        {/* TOP SECTION: Image + Core Info (Responsive grid) */}
        <Card className="flex-row overflow-hidden p-0 max-md:flex-col">
          <div
            className="flex w-2/5 flex-col items-center justify-center gap-4 border-r border-border bg-card p-8 max-md:w-full max-md:border-r-0 max-md:border-b max-md:p-6"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="flex w-full items-center justify-center">
              <div className="relative inline-block max-w-full">
                {medicine.images.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={showPrevImage}
                    aria-label="Previous Image"
                    className="absolute top-1/2 left-[-18px] z-10 -translate-y-1/2 rounded-full bg-card/90 shadow-(--jh-shadow-rest)"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                )}

                <img
                  src={medicine.images[currentImageIndex]}
                  alt={`${medicine.name} - image ${currentImageIndex + 1}`}
                  className="block max-h-88 max-w-full cursor-zoom-in object-contain transition-opacity duration-300 ease-out max-md:max-h-63"
                  loading="lazy"
                  onClick={() => setIsEnlarged(true)}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />

                {medicine.images.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={showNextImage}
                    aria-label="Next Image"
                    className="absolute top-1/2 right-[-18px] z-10 -translate-y-1/2 rounded-full bg-card/90 shadow-(--jh-shadow-rest)"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            {carouselDots()}
          </div>

          <div className="flex flex-1 flex-col p-8 max-md:p-6">
            <h1 id="medicine-title" className="font-display mb-1 text-2xl leading-tight font-bold text-foreground max-md:text-xl">
              {medicine.name}
            </h1>

            {medicine.prescription && (
              <Badge variant="destructive" className="mb-3 self-start uppercase">
                Rx Prescription Required
              </Badge>
            )}

            {medicine.diseasesTreated.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {medicine.diseasesTreated.map((disease) => (
                  <Badge key={disease} variant="secondary" className="font-normal">
                    {disease}
                  </Badge>
                ))}
              </div>
            )}

            <div className="mb-6 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground max-md:text-2xl">{formattedPrice}</span>
              <span className="text-sm text-muted-foreground">Inclusive of all taxes</span>
            </div>

            <div className="mb-8 border-b border-dashed border-border pb-8">
              <div className="mb-4 inline-flex items-center overflow-hidden rounded-md border border-border bg-card">
                <button
                  type="button"
                  onClick={decrementQty}
                  aria-label="Decrease quantity"
                  className="flex size-9 items-center justify-center bg-muted text-lg text-foreground transition-colors hover:bg-secondary"
                >
                  −
                </button>
                <span className="w-10 text-center text-base font-semibold text-foreground">{quantity}</span>
                <button
                  type="button"
                  onClick={incrementQty}
                  aria-label="Increase quantity"
                  className="flex size-9 items-center justify-center bg-muted text-lg text-foreground transition-colors hover:bg-secondary"
                >
                  +
                </button>
              </div>

              <div className="flex max-w-100 gap-4 max-md:max-w-full max-md:flex-col">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddToCart}
                  aria-label={`Add ${medicine.name} to cart`}
                  className="flex-1"
                >
                  Add to Cart
                </Button>
                <Button type="button" onClick={handleBuyNow} aria-label={`Buy ${medicine.name} now`} className="flex-1">
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* BOTTOM SECTION: Detailed Info */}
        <section className="flex flex-col gap-6">
          <Card className="p-8 max-md:p-6">
            <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold text-foreground">Product Description</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{medicine.description}</p>
          </Card>

          <Card className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8 p-8 max-md:p-6">
            <div>
              <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold text-foreground">Ingredients</h2>
              <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
                {medicine.ingredients.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold text-foreground">Uses & Benefits</h2>
              <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
                {medicine.usesBenefits.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold text-foreground">Dosage</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{medicine.dosage}</p>
            </div>

            <div>
              <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold text-foreground">Storage & Safety</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{medicine.storageSafety}</p>
            </div>
          </Card>
        </section>
      </div>

      {/* ENLARGED IMAGE MODAL */}
      <Dialog open={isEnlarged} onOpenChange={setIsEnlarged}>
        <DialogContent
          showClose={false}
          className="flex h-[90vh] w-[90vw] max-w-none flex-col items-center justify-center gap-4 bg-transparent p-0 shadow-none ring-0"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsEnlarged(false)}
            aria-label="Close"
            className="absolute top-6 right-6 z-10 size-11 rounded-full bg-card/90"
          >
            <X className="size-5" />
          </Button>

          <div className="relative flex w-full flex-1 items-center justify-center">
            {medicine.images.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={showPrevImage}
                aria-label="Previous Image"
                className="absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full bg-card/90"
              >
                <ChevronLeft className="size-4" />
              </Button>
            )}

            <img
              src={medicine.images[currentImageIndex]}
              alt={`${medicine.name} - enlarged image ${currentImageIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain select-none"
            />

            {medicine.images.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={showNextImage}
                aria-label="Next Image"
                className="absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full bg-card/90"
              >
                <ChevronRight className="size-4" />
              </Button>
            )}
          </div>

          {carouselDots()}
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default MedicineIdDetails;
