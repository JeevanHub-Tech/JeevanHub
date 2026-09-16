import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Mail, Phone, Clock, Building2, Send, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate support submission feedback
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Back navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>

        {/* Page Header */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-3">
            <Building2 className="size-3.5" />
            Official Support &amp; Registered Office
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Contact Us
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Have questions about your order, consultations, or Ayurvedic treatments? Our customer care team and licensed practitioners are here to help.
          </p>
        </div>

        {/* Grid layout */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left Column: Official Contact & Corporate Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Corporate Entity Card */}
            <Card className="border-primary/20 bg-primary/5 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                  <Building2 className="size-4" />
                  Corporate Identity Information
                </div>
                <CardTitle className="text-xl font-bold text-foreground">
                  MYSTERY DOMES PRIVATE LIMITED
                </CardTitle>
                <CardDescription className="text-xs">
                  Operating Brand: <strong className="text-foreground font-semibold">JeevanHub</strong> | CIN:{" "}
                  <span className="font-mono font-medium text-foreground">U85499DL2025PTC441545</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-1 text-sm text-foreground">
                <div className="flex items-start gap-3">
                  <MapPin className="size-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Registered Office Address</p>
                    <p className="text-muted-foreground leading-relaxed">
                      KG-3/66 S/F, NEAR KARALA SCHOOL, Vikas Puri, New Delhi, West Delhi - 110018, Delhi, India
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-primary/10">
                  <div className="flex items-start gap-3">
                    <Mail className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Email Support</p>
                      <a href="mailto:jeevanhub0@gmail.com" className="text-primary hover:underline">
                        jeevanhub0@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Helpline / WhatsApp</p>
                      <a href="tel:+918688324518" className="text-primary hover:underline">
                        +91 86883 24518
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-primary/10">
                  <Clock className="size-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Support Hours</p>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Monday to Saturday: 9:00 AM – 6:00 PM IST (Closed on National Holidays)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Resolution Channels */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-sm">
                  <p className="font-semibold text-foreground mb-1">Order &amp; Delivery Tracking</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Need live AWB status or delivery rescheduling for a dispatched parcel?
                  </p>
                  <Link to="/order-history" className="text-xs font-semibold text-primary hover:underline">
                    Go to Order History &rarr;
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-sm">
                  <p className="font-semibold text-foreground mb-1">Doctor Consultations</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Need to reschedule or inquire about your upcoming telehealth appointment?
                  </p>
                  <Link to="/appointed-doctor" className="text-xs font-semibold text-primary hover:underline">
                    View My Appointments &rarr;
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Grievance Redressal Card */}
            <Card className="border-border">
              <CardContent className="p-5 text-xs sm:text-sm leading-relaxed text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Grievance &amp; Compliance Officer</p>
                <p>Consumer Grievance Desk, MYSTERY DOMES PRIVATE LIMITED</p>
                <p>KG-3/66 S/F, Near Karala School, Vikas Puri, New Delhi - 110018, Delhi</p>
                <p>Direct Grievance Contact: <a href="mailto:jeevanhub0@gmail.com" className="text-primary underline">jeevanhub0@gmail.com</a></p>
                <p className="text-xs pt-1">
                  Complaints are acknowledged within 48 business hours as per Consumer Protection (E-Commerce) Rules, 2020.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Contact & Inquiry Form (5 cols) */}
          <div className="lg:col-span-5">
            <Card className="border-border shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">
                  Send Us a Message
                </CardTitle>
                <CardDescription className="text-xs">
                  Fill out the form below and our team will get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <AlertDescription className="text-sm">
                      <strong>Thank you!</strong> Your message has been received. Our support team will contact you shortly.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Field>
                      <FieldLabel htmlFor="name">Full Name *</FieldLabel>
                      <Input
                        id="name"
                        name="name"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="email">Email Address *</FieldLabel>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="phone">Phone Number *</FieldLabel>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="subject">Subject *</FieldLabel>
                      <Input
                        id="subject"
                        name="subject"
                        required
                        placeholder="e.g. Order Inquiry #12345"
                        value={formData.subject}
                        onChange={handleChange}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="message">Message *</FieldLabel>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={4}
                        placeholder="Please describe how we can help you..."
                        value={formData.message}
                        onChange={handleChange}
                      />
                    </Field>

                    <Button type="submit" className="w-full gap-2" disabled={loading}>
                      <Send className="size-4" />
                      {loading ? "Sending..." : "Submit Inquiry"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
