import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { RotateCcw, Clock, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const CancellationRefundPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Back navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-3">
            <RotateCcw className="size-3.5" />
            Customer Protection
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Cancellation &amp; Refund Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last Updated: September 16, 2026 | Effective Date: January 22, 2025
          </p>
        </div>

        {/* Corporate Entity Notice */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <p className="text-sm leading-relaxed text-foreground">
              This Cancellation &amp; Refund Policy applies to all digital transactions, teleconsultations, and medicine orders processed on{" "}
              <strong>JeevanHub</strong>, owned and operated by{" "}
              <strong>MYSTERY DOMES PRIVATE LIMITED</strong> (CIN:{" "}
              <span className="font-mono text-xs font-bold text-foreground">U85499DL2025PTC441545</span>), registered at{" "}
              <strong>KG-3/66 S/F, Near Karala School, Vikas Puri, New Delhi, West Delhi - 110018, Delhi, India</strong>.
            </p>
          </CardContent>
        </Card>

        {/* Key Summary Highlights */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <Card className="border-border">
            <CardContent className="p-5 flex items-start gap-3">
              <Clock className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Refund Processing Timeline</p>
                <p className="text-muted-foreground mt-1">
                  Approved refunds are credited back to the original payment source within <strong className="text-foreground">5 to 7 working days</strong>.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-5 flex items-start gap-3">
              <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Pre-Dispatch Cancellations</p>
                <p className="text-muted-foreground mt-1">
                  100% full refund if you cancel your medicine order prior to shipping/manifestation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Policy Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Medicine Order Cancellation
            </h2>
            <div className="space-y-2">
              <p>
                <strong className="text-foreground">Before Dispatch:</strong> You may cancel an order for medicines free of charge at any time before the order has been marked as shipped or an Air Waybill (AWB) has been generated with our logistics partner (Delhivery). You can initiate cancellation directly from the <Link to="/order-history" className="text-primary underline">Order History</Link> tab in your profile or by emailing <a href="mailto:jeevanhub0@gmail.com" className="text-primary underline">jeevanhub0@gmail.com</a>. Upon cancellation before dispatch, a 100% refund of the product cost and shipping fee will be issued immediately.
              </p>
              <p>
                <strong className="text-foreground">After Dispatch:</strong> Once an order is manifested, dispatched, or in transit with the courier, it cannot be cancelled or intercepted.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. Return &amp; Replacement Policy for Medicines
            </h2>
            <p>
              Due to regulatory guidelines, hygiene standards, and temperature sensitivity governing pharmaceutical and Ayurvedic preparations, medicines delivered to customers are <strong>non-returnable</strong> for general change of mind.
            </p>
            <div className="mt-3 rounded-lg border border-border bg-card p-4">
              <p className="font-medium text-foreground mb-2">Exceptions for Damaged, Defective, or Incorrect Items:</p>
              <p className="text-muted-foreground mb-3">
                A replacement or full refund will be granted if:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>The package arrives visibly damaged, broken, or tampered with.</li>
                <li>The product received differs from what was ordered (wrong item or dosage).</li>
                <li>The medicine has passed its expiry date at the time of delivery.</li>
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                <strong>Reporting Requirement:</strong> You must notify us within <strong>48 hours of delivery</strong> by emailing <a href="mailto:jeevanhub0@gmail.com" className="text-primary underline">jeevanhub0@gmail.com</a> or messaging <a href="tel:+918688324518" className="text-primary underline">+91 86883 24518</a> with your Order ID and clear photographic or video evidence of the outer package and damaged contents.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. Doctor Teleconsultation Cancellation &amp; Rescheduling
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Cancellation &gt; 2 Hours Before Slot:</strong> Patients may cancel scheduled online appointments up to 2 hours prior to the appointment time and receive a <strong className="text-foreground">100% full refund</strong>.
              </li>
              <li>
                <strong className="text-foreground">Cancellation &lt; 2 Hours Before Slot / No-Show:</strong> Cancellations made within 2 hours of the scheduled time or patient failure to join the consultation call are non-refundable. However, patients may request a one-time reschedule subject to doctor availability.
              </li>
              <li>
                <strong className="text-foreground">Doctor Cancellation or Technical Outage:</strong> If a practitioner fails to attend or cancels an appointment due to clinical emergencies or technical failure on the Platform, the patient is entitled to an immediate 100% full refund or free priority rescheduling.
              </li>
            </ul>
          </section>

          <Separator />

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. Refund Timelines &amp; Disbursement Method
            </h2>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <p className="font-semibold text-foreground">
                Mandatory Statutory Refund Timelines (Razorpay Integration):
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Online Prepaid Payments (Cards, UPI, Net Banking, Wallets):</strong> All approved refunds are automatically initiated back to the original source instrument through our payment gateway partner <strong className="text-foreground">Razorpay</strong>. The amount typically reflects in the customer&apos;s bank account or card statement within <strong className="text-foreground">5 to 7 working days</strong>, depending on the issuing bank&apos;s settlement cycle.
                </li>
                <li>
                  <strong className="text-foreground">Cash on Delivery (COD) Orders:</strong> In case of an approved refund for a delivered and returned COD order, our customer support team will contact you to obtain verified bank details (Account Number, IFSC, Account Holder Name). The refund will be transferred via NEFT/IMPS or UPI within <strong className="text-foreground">5 to 7 working days</strong> of receiving complete details.
                </li>
                <li>
                  <strong className="text-foreground">No Hidden Fees:</strong> JeevanHub does not charge any administrative or restocking fees for legitimate returns or verified order cancellations.
                </li>
              </ul>
            </div>
          </section>

          <Separator />

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. How to Request a Refund or Cancellation
            </h2>
            <p className="mb-3">
              To request an order cancellation, return, or consultation refund, please reach out with your Order ID / Booking ID:
            </p>
            <div className="rounded-lg border border-border bg-card p-4 text-xs sm:text-sm space-y-1">
              <p className="font-semibold text-foreground">JeevanHub Customer Support Desk</p>
              <p className="text-muted-foreground">MYSTERY DOMES PRIVATE LIMITED</p>
              <p className="text-muted-foreground">Support Email: <a href="mailto:jeevanhub0@gmail.com" className="text-primary underline">jeevanhub0@gmail.com</a></p>
              <p className="text-muted-foreground">Support Phone: <a href="tel:+918688324518" className="text-primary underline">+91 86883 24518</a></p>
              <p className="text-muted-foreground">Operating Hours: Monday – Saturday (9:00 AM – 6:00 PM IST)</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CancellationRefundPolicy;
