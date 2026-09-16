import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, Lock, Eye, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const PrivacyPolicy = () => {
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
            <Lock className="size-3.5" />
            Data Protection &amp; Privacy
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last Updated: September 16, 2026 | Effective Date: January 22, 2025
          </p>
        </div>

        {/* Corporate Disclosure */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Shield className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed text-foreground">
                <p className="font-semibold">Privacy Commitment &amp; Legal Entity</p>
                <p className="mt-1 text-muted-foreground">
                  <strong>JeevanHub</strong> is committed to protecting your privacy and safeguarding your personal and health information. This Privacy Policy applies to the JeevanHub web platform, mobile applications, and telehealth tools operated by{" "}
                  <strong>MYSTERY DOMES PRIVATE LIMITED</strong> (CIN:{" "}
                  <span className="font-mono text-xs font-bold text-foreground">U85499DL2025PTC441545</span>), registered at{" "}
                  <strong>KG-3/66 S/F, Near Karala School, Vikas Puri, New Delhi, West Delhi - 110018, Delhi, India</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policy Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Information We Collect
            </h2>
            <p>We collect the minimum necessary data required to deliver healthcare, telemedicine, and medicine delivery services:</p>
            <ul className="mt-2 list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Identity &amp; Contact Data:</strong> Full name, email address, mobile number, date of birth, gender, and shipping/billing postal address.
              </li>
              <li>
                <strong className="text-foreground">Health &amp; Clinical Data:</strong> Prescriptions uploaded for medicine verification, Prakriti assessment responses, consultation history, and dietary/lifestyle notes entered during appointments.
              </li>
              <li>
                <strong className="text-foreground">Payment Information:</strong> Transaction ID, payment status, and order totals. 
                <span className="text-foreground font-medium"> Note: All online payment processing is executed via RBI-licensed payment aggregator Razorpay. JeevanHub never collects, stores, or processes raw credit/debit card numbers, CVVs, or Net Banking credentials on its servers.</span>
              </li>
              <li>
                <strong className="text-foreground">Technical &amp; Log Data:</strong> IP address, device type, browser specifications, and usage telemetry collected to secure and enhance system performance.
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. How We Use Your Information
            </h2>
            <p>Your data is processed strictly for legitimate operational purposes:</p>
            <ul className="mt-2 list-disc list-inside space-y-1.5 text-muted-foreground">
              <li>Facilitating doctor appointment scheduling, teleconsultations, and electronic prescriptions.</li>
              <li>Validating, packaging, manifesting, and delivering medicine orders to your doorstep.</li>
              <li>Processing online transactions, dispute handling, and automated refund disbursements via Razorpay.</li>
              <li>Generating personalized Ayurvedic lifestyle recommendations, Dosha balancing guides, and reminders.</li>
              <li>Complying with statutory reporting requirements under the Drugs and Cosmetics Act and Telemedicine Guidelines.</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. Data Sharing &amp; Third-Party Disclosures
            </h2>
            <p>We do not sell, rent, or trade your personal or health data. Data is shared solely with trusted service providers essential for platform operations:</p>
            <ul className="mt-2 list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Consulting Doctors:</strong> Appointed registered practitioners receive relevant medical history and consultation notes necessary to provide medical care.
              </li>
              <li>
                <strong className="text-foreground">Licensed Retail Pharmacies:</strong> Fulfilling retailers access your shipping details and uploaded prescriptions solely for order dispensing.
              </li>
              <li>
                <strong className="text-foreground">Payment Gateway (Razorpay):</strong> Transaction tokens and amounts are exchanged over encrypted SSL connections to process payments and refunds securely.
              </li>
              <li>
                <strong className="text-foreground">Logistics Partners (Delhivery):</strong> Consignee name, destination address, and phone number are shared to facilitate parcel tracking, dispatch, and delivery.
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. Data Security &amp; Encryption
            </h2>
            <p>
              We implement industry-standard administrative, physical, and technical safeguards. All communications on JeevanHub are encrypted using Transport Layer Security (TLS 1.3 / SSL). Sensitive API credentials and medical attachments are encrypted at rest using AES-256-GCM algorithms.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. User Rights
            </h2>
            <p>Under applicable Indian data protection laws, including the Information Technology Act, 2000 and Digital Personal Data Protection Act (DPDPA), you have the right to:</p>
            <ul className="mt-2 list-disc list-inside space-y-1.5 text-muted-foreground">
              <li>Access and review your stored profile information and order history.</li>
              <li>Request correction or rectification of inaccurate details.</li>
              <li>Request deletion of your non-statutory account data by emailing our grievance team.</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Grievance Officer &amp; Redressal Mechanism
            </h2>
            <p>
              In accordance with the Information Technology Act, 2000 and rules made thereunder, the details of the designated Grievance Officer for JeevanHub are provided below:
            </p>
            <div className="mt-3 rounded-lg border border-border bg-card p-4 text-xs sm:text-sm space-y-1">
              <p className="font-semibold text-foreground">Grievance Redressal Officer</p>
              <p className="text-muted-foreground">MYSTERY DOMES PRIVATE LIMITED</p>
              <p className="text-muted-foreground">KG-3/66 S/F, Near Karala School, Vikas Puri, New Delhi, West Delhi - 110018, Delhi, India</p>
              <p className="text-muted-foreground">Email: <a href="mailto:jeevanhub0@gmail.com" className="text-primary underline">jeevanhub0@gmail.com</a></p>
              <p className="text-muted-foreground">Phone: <a href="tel:+918688324518" className="text-primary underline">+91 86883 24518</a></p>
              <p className="text-xs text-muted-foreground pt-1">
                We will acknowledge grievances within 48 hours and strive to resolve issues within 15 working days.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
