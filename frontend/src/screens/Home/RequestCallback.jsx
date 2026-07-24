import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BACKEND_URL } from '../../config';
import call from '../../media/call.png';

const RequestCallback = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setForm({ name: '', phone: '', message: '' });
      setStatus('idle');
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/callback-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit request.');
      setStatus('success');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section className="flex items-center justify-center bg-(--jh-cream-tint) px-2.5 py-7.5 sm:px-2.5 sm:py-4">
      <div className="relative flex w-full max-w-275 flex-col items-center justify-between gap-4 rounded-2xl bg-(--jh-surface) p-6.25 shadow-[0_12px_24px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out hover:-translate-y-1.25 sm:flex-row sm:p-10 sm:text-left">
        <div className="flex max-w-full flex-col justify-center sm:max-w-[55%]">
          <h3 className="m-0 text-[22px] leading-tight font-bold text-foreground sm:text-[28px]">Request a callback</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-base">
            Know more about our plans or Smart Ring
          </p>
          <div className="mt-7.5 hidden items-center justify-start sm:flex">
            <ArrowRight className="size-6.5 text-(--jh-olive-leaf)" aria-hidden="true" />
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <Button
              type="button"
              className="mt-3.75 h-auto rounded-[10px] px-6 py-3 text-base font-semibold sm:mt-6.25 sm:px-7 sm:text-lg"
              onClick={() => setOpen(true)}
            >
              Request Callback
            </Button>
            <DialogContent>
              {status === 'success' ? (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CheckCircle2 className="size-5 text-(--jh-olive-leaf)" aria-hidden="true" />
                      Request received
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Thanks, {form.name}! Our team will call you back on {form.phone} shortly.
                  </p>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button">Done</Button>
                    </DialogClose>
                  </DialogFooter>
                </>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <DialogHeader>
                    <DialogTitle>Request a callback</DialogTitle>
                  </DialogHeader>

                  <Field>
                    <FieldLabel htmlFor="callback-name">Your name</FieldLabel>
                    <Input id="callback-name" name="name" value={form.name} onChange={handleChange} required />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="callback-phone">Phone number</FieldLabel>
                    <Input id="callback-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="callback-message">What would you like to know? (optional)</FieldLabel>
                    <Textarea id="callback-message" name="message" value={form.message} onChange={handleChange} rows={3} />
                  </Field>

                  {status === 'error' && <p className="text-sm font-medium text-destructive">{error}</p>}

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={status === 'submitting'}>
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Submitting…
                        </>
                      ) : (
                        'Submit'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
          <a href="tel:+918688324518" className="mt-2 block text-sm text-(--jh-olive-leaf) hover:text-(--jh-olive-light) hover:underline">
            Or call us on +91 8688324518
          </a>
        </div>
        <div className="relative mt-3.75 flex h-auto max-w-full items-center justify-center overflow-visible rounded-xl sm:mt-0 sm:h-62.5 sm:max-w-[45%] sm:overflow-hidden">
          <img
            alt="callback-person-illustration"
            className="static w-full max-w-60 rounded-xl object-cover sm:absolute sm:top-0 sm:left-5 sm:h-full sm:max-w-none"
            loading="lazy"
            decoding="async"
            src={call}
          />
        </div>
      </div>
    </section>
  );
};

export default RequestCallback;
