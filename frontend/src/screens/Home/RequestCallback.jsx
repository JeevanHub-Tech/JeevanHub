import React from 'react';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import call from '../../media/call.png';

const RequestCallback = () => {
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
          <Button className="mt-3.75 h-auto rounded-[10px] px-6 py-3 text-base font-semibold sm:mt-6.25 sm:px-7 sm:text-lg">
            Request Callback
          </Button>
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
