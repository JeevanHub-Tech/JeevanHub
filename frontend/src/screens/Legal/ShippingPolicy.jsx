import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Truck, Package, Clock, ShieldCheck, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const ShippingPolicy = () => {
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
            <Truck className="size-3.5" />
            Logistics &amp; Delivery
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Shipping &amp; Delivery Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last Updated: September 16, 2026 | Effective Date: January 22, 2025
          </p>
        </div>

        {/* Corporate Entity Notice */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed text-foreground">
                <p className="font-semibold">Logistics Operations</p>
                <p className="mt-1 text-muted-foreground">
                  This Shipping &amp; Delivery Policy governs the dispatch, tracking, and fulfillment of all physical orders placed on{" "}
                  <strong>JeevanHub</strong>, operated by{" "}
                  <strong>MYSTERY DOMES PRIVATE LIMITED</strong> (CIN:{" "}
                  <span className="font-mono text-xs font-bold text-foreground">U85499DL2025PTC441545</span>), registered at{" "}
                  <strong>KG-3/66 S/F, Near Karala School, Vikas Puri, New Delhi, West Delhi - 110018, Delhi, India</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Highlights */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <Clock className="size-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Dispatch Window</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">24 – 48 Hours</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <Truck className="size-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Estimated Delivery</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">3 – 7 Business Days</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <Package className="size-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">National Logistics Partner</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">Delhivery Supply Chain</p>
            </CardContent>
          </Card>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Order Processing &amp; Dispatch Timeline
            </h2>
            <p>
              All orders for Ayurvedic medicines placed on JeevanHub are routed directly to licensed, accredited pharmacy retailers in our fulfillment network. Orders are verified (including prescription review where mandated by law), carefully packaged, and manifested within <strong>24 to 48 business hours</strong> of successful payment confirmation (or COD order placement).
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. Delivery Timelines by Zone
            </h2>
            <p className="mb-3">
              We ship across India to over 18,000+ pin codes in partnership with <strong className="text-foreground">Delhivery</strong> and leading courier networks. Typical transit durations:
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-muted/50 text-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">Destination Zone</th>
                    <th className="p-3">Coverage</th>
                    <th className="p-3">Estimated Transit Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted-foreground">
                  <tr>
                    <td className="p-3 font-medium text-foreground">Zone A (Local / Intra-City)</td>
                    <td className="p-3">Within same city or district</td>
                    <td className="p-3">1 to 3 Business Days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-foreground">Zone B (Regional / Intra-State)</td>
                    <td className="p-3">Within the same state or adjoining cities</td>
                    <td className="p-3">2 to 5 Business Days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-foreground">Zone C &amp; D (National / Metros)</td>
                    <td className="p-3">Major metro corridors &amp; interstate transit</td>
                    <td className="p-3">3 to 7 Business Days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-foreground">Special Zones</td>
                    <td className="p-3">North-East, J&amp;K, and remote island regions</td>
                    <td className="p-3">6 to 10 Business Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              <em>Note: Delivery times are estimates and may vary slightly during state holidays, regional bandhs, severe weather conditions, or festive peak volumes.</em>
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. Shipping Charges &amp; COD Fees
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Real-Time Freight Calculation:</strong> Shipping rates are calculated live during checkout via API based on parcel weight (grams), pickup origin, and delivery destination pincode.
              </li>
              <li>
                <strong className="text-foreground">Transparent Billing:</strong> The exact shipping fee is presented on the checkout screen prior to payment authorization. No surprise delivery fees will be requested upon arrival.
              </li>
              <li>
                <strong className="text-foreground">Cash on Delivery (COD) Handling:</strong> Orders placed via Cash on Delivery may incur standard courier collection fees, which are clearly shown in the payment option comparison before placing the order.
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. Shipment Tracking
            </h2>
            <p>
              As soon as your shipment is manifested, an Air Waybill (AWB) tracking number is generated. You will receive an SMS and email notification with your tracking link. You can also view live status scans, transit milestones, and courier details anytime in the <Link to="/order-history" className="text-primary underline">Order History</Link> section of your account.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. Undelivered Shipments &amp; Reattempts
            </h2>
            <p>
              Our courier partners attempt delivery up to three (3) times before returning a package to origin (RTO). Please ensure that your delivery address and contact telephone number are accurate and accessible. In the event a package is returned due to incorrect address or customer unavailability, customer support will reach out to arrange re-dispatch or a refund as per our Cancellation &amp; Refund Policy.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Contact Logistics Support
            </h2>
            <div className="rounded-lg border border-border bg-card p-4 text-xs sm:text-sm space-y-1">
              <p className="font-semibold text-foreground">JeevanHub Logistics &amp; Dispatch Desk</p>
              <p className="text-muted-foreground">MYSTERY DOMES PRIVATE LIMITED</p>
              <p className="text-muted-foreground">Support Email: <a href="mailto:jeevanhub0@gmail.com" className="text-primary underline">jeevanhub0@gmail.com</a></p>
              <p className="text-muted-foreground">Support Phone: <a href="tel:+918688324518" className="text-primary underline">+91 86883 24518</a></p>
              <p className="text-muted-foreground">Hours: Monday to Saturday (9:00 AM – 6:00 PM IST)</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
