import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, FileText, AlertCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const TermsAndConditions = () => {
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
            <FileText className="size-3.5" />
            Legal Agreement
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Terms & Conditions
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
                <p className="font-semibold">Corporate Identity & Ownership</p>
                <p className="mt-1 text-muted-foreground">
                  The website and platform <strong>JeevanHub</strong> (accessible at <Link to="/" className="text-primary underline">jeevanhub.com</Link>) is owned and operated by{" "}
                  <strong className="text-foreground">MYSTERY DOMES PRIVATE LIMITED</strong>, a company incorporated under the Companies Act, 2013 (CIN:{" "}
                  <span className="font-mono text-xs font-bold text-foreground">U85499DL2025PTC441545</span>), with its registered office at{" "}
                  <strong>KG-3/66 S/F, Near Karala School, Vikas Puri, New Delhi, West Delhi - 110018, Delhi, India</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, registering, or transacting on JeevanHub (&ldquo;Platform&rdquo;), you (&ldquo;User&rdquo;, &ldquo;Patient&rdquo;, &ldquo;Doctor&rdquo;, or &ldquo;Retailer&rdquo;) agree to be legally bound by these Terms and Conditions, our Privacy Policy, Cancellation &amp; Refund Policy, and any other guidelines posted on the Platform. If you do not agree with any part of these Terms, please discontinue use of the Platform immediately.
            </p>
          </section>

          <Separator />

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. Description of Services
            </h2>
            <p>JeevanHub is a technology-enabled digital healthcare and wellness marketplace providing:</p>
            <ul className="mt-2 list-disc list-inside space-y-1.5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Ayurvedic E-Commerce Marketplace:</strong> Enabling registered patients to browse and purchase authentic Ayurvedic, herbal, and wellness medicines supplied by licensed third-party retailers.
              </li>
              <li>
                <strong className="text-foreground">Teleconsultation Services:</strong> Facilitating scheduled remote consultations between patients and certified, verified Ayurvedic medical practitioners.
              </li>
              <li>
                <strong className="text-foreground">Digital Wellness Tools:</strong> Interactive Prakriti (body constitution) assessments, diet &amp; yoga lifestyle guidance, and personalized wellness plans.
              </li>
            </ul>
          </section>

          <Separator />

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. Critical Medical &amp; Telehealth Disclaimer
            </h2>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
              <div className="flex gap-3">
                <AlertCircle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
                  <p className="font-semibold text-amber-950 dark:text-amber-100">
                    NOT FOR EMERGENCY MEDICAL USE
                  </p>
                  <p>
                    JeevanHub is not an emergency medical service. If you are experiencing a medical emergency, acute pain, or severe allergic reaction, please immediately contact your nearest hospital emergency room or local emergency services.
                  </p>
                  <p>
                    Teleconsultations conducted through JeevanHub are intended for non-emergency Ayurvedic health guidance. Online consultations are governed by the Telemedicine Practice Guidelines issued under the National Medical Commission Act. The practitioner reserves the right to advise in-person clinical examination whenever deemed necessary.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. User Account &amp; Eligibility
            </h2>
            <p>
              To access consultations, order history, or purchase medicines, you must be at least 18 years of age and legally competent to enter into binding contracts under the Indian Contract Act, 1872. You are responsible for maintaining the confidentiality of your account credentials and for all activities occurring under your account.
            </p>
          </section>

          <Separator />

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. Prescription Policy
            </h2>
            <p>
              Certain medicines listed on the Platform are classified as prescription-required products under the Drugs and Cosmetics Act, 1940 and applicable Ayurvedic/AYUSH drug regulations. For such medicines, you must upload a legible, valid prescription issued by a registered medical practitioner. Orders for prescription medicines will only be verified and dispatched once verified by the fulfilling licensed pharmacy retailer.
            </p>
          </section>

          <Separator />

          {/* Section 6 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Pricing, Payments &amp; Invoicing
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Currency:</strong> All prices displayed on JeevanHub are in Indian Rupees (INR ₹) and are inclusive of applicable Goods and Services Tax (GST) unless explicitly noted.
              </li>
              <li>
                <strong className="text-foreground">Payment Processing:</strong> Online digital payments are processed through secure, PCI-DSS compliant payment aggregators including <strong className="text-foreground">Razorpay</strong>. We accept Credit Cards, Debit Cards, Net Banking, UPI, and authorized digital wallets.
              </li>
              <li>
                <strong className="text-foreground">Cash on Delivery (COD):</strong> Where available for serviceable pincodes, COD is supported. Payment must be tendered in full in cash to the courier representative upon delivery.
              </li>
              <li>
                <strong className="text-foreground">Shipping Charges:</strong> Shipping fees are dynamically calculated during checkout based on volumetric package weight, destination pincode, and logistics partner rates (via Delhivery).
              </li>
            </ul>
          </section>

          <Separator />

          {/* Section 7 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              7. Intellectual Property
            </h2>
            <p>
              All content on JeevanHub, including trademarks, logos, brand names, algorithms, software code, images, audio, video, and texts, is the exclusive intellectual property of MYSTERY DOMES PRIVATE LIMITED or its licensors and is protected by Indian and international copyright and trademark laws.
            </p>
          </section>

          <Separator />

          {/* Section 8 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              8. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, MYSTERY DOMES PRIVATE LIMITED and its directors, officers, employees, or affiliates shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from the use or inability to use the Platform, third-party retailer fulfillment delays, or clinical advice rendered by independent consulting practitioners.
            </p>
          </section>

          <Separator />

          {/* Section 9 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              9. Governing Law &amp; Dispute Resolution
            </h2>
            <p>
              These Terms and any contractual relationship shall be governed by and construed in accordance with the laws of the Republic of India. In the event of any dispute or claim arising out of or in connection with these Terms, the courts situated in <strong>New Delhi, India</strong> shall have exclusive territorial jurisdiction.
            </p>
          </section>

          <Separator />

          {/* Section 10 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              10. Contact &amp; Grievances
            </h2>
            <p>
              For questions regarding these Terms or any legal notice, please contact:
            </p>
            <div className="mt-3 rounded-lg border border-border bg-card p-4 text-xs sm:text-sm space-y-1">
              <p className="font-semibold text-foreground">MYSTERY DOMES PRIVATE LIMITED</p>
              <p className="text-muted-foreground">Attention: Legal &amp; Compliance Team</p>
              <p className="text-muted-foreground">KG-3/66 S/F, Near Karala School, Vikas Puri, New Delhi, West Delhi - 110018, Delhi, India</p>
              <p className="text-muted-foreground">Email: <a href="mailto:jeevanhub0@gmail.com" className="text-primary underline">jeevanhub0@gmail.com</a></p>
              <p className="text-muted-foreground">Phone: <a href="tel:+918688324518" className="text-primary underline">+91 86883 24518</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
