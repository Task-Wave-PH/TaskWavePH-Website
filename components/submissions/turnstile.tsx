"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";
type Turnstile = {
  render: (node: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}
export function TurnstileChallenge({
  onToken,
  reset,
}: {
  onToken: (token: string) => void;
  reset: number;
}) {
  const node = useRef<HTMLDivElement>(null);
  const id = useRef<string>(undefined);
  const render = useCallback(() => {
    if (!node.current || !window.turnstile || id.current) return;
    id.current = window.turnstile.render(node.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      action: "submission",
      theme: "light",
      callback: onToken,
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
  }, [onToken]);
  useEffect(() => {
    render();
    return () => {
      if (id.current) window.turnstile?.remove(id.current);
      id.current = undefined;
    };
  }, [render, reset]);
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={render}
      />
      <div ref={node} />
      <p className="text-xs text-muted-foreground">
        Complete the security check before submitting.
      </p>
    </>
  );
}
