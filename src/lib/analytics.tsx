"use client";

import Script from "next/script";

export default function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const apiHost = process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST || "https://plausible.io";

  if (!domain) {
    return null;
  }

  return (
    <>
      <Script
        defer
        data-domain={domain}
        src={`${apiHost}/js/script.tagged-events.js`}
        strategy="lazyOnload"
      />
      <Script
        dangerouslySetInnerHTML={{
          __html: `
            window.plausible = window.plausible || function() {
              (window.plausible.q = window.plausible.q || []).push(arguments)
            };
          `,
        }}
        strategy="lazyOnload"
      />
    </>
  );
}

export function trackEvent(eventName: string, props?: Record<string, string | number | boolean>) {
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(eventName, { props });
  }
}

export function trackPageView(url: string) {
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible("pageview", { props: { url } });
  }
}

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> }
    ) => void;
  }
}