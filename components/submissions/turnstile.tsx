"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
  const size = useRef<"compact" | "flexible">(undefined);
  const scriptCallback = useRef<string>(undefined);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const [scriptRetry, setScriptRetry] = useState(0);
  const render = useCallback(() => {
    if (!node.current || !window.turnstile || id.current) return;
    const width = node.current.getBoundingClientRect().width;
    size.current = width < 300 ? "compact" : "flexible";
    try {
      id.current = window.turnstile.render(node.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        action: "submission",
        theme: "light",
        size: size.current,
        callback: (token: string) => {
          onToken(token);
          setReady(true);
          setError(false);
        },
        "expired-callback": () => {
          onToken("");
          setReady(false);
        },
        "timeout-callback": () => {
          onToken("");
          setReady(false);
          setError(true);
        },
        "error-callback": () => {
          onToken("");
          setReady(false);
          setError(true);
        },
      });
    } catch {
      setError(true);
      onToken("");
    }
  }, [onToken]);
  useEffect(() => {
    const element = node.current;
    if (!element) return;
    render();
    const observer = new ResizeObserver(() => {
      const nextSize =
        element.getBoundingClientRect().width < 300 ? "compact" : "flexible";
      if (id.current && nextSize !== size.current) {
        window.turnstile?.remove(id.current);
        id.current = undefined;
        onToken("");
        setReady(false);
        render();
      }
    });
    observer.observe(element);
    const timeout = setTimeout(() => {
      if (!id.current) setError(true);
    }, 15000);
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      if (id.current) window.turnstile?.remove(id.current);
      id.current = undefined;
    };
  }, [render, reset, retry, onToken]);
  useEffect(
    () => () => {
      if (scriptCallback.current)
        Reflect.deleteProperty(window, scriptCallback.current);
    },
    [],
  );
  return (
    <div className="space-y-3">
      <Script
        key={scriptRetry}
        src={`https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit${scriptRetry ? `&onload=taskwaveTurnstileRetry${scriptRetry}` : ""}`}
        onReady={render}
        onError={() => {
          setError(true);
          onToken("");
        }}
      />
      <div ref={node} className="min-w-0" aria-label="Security check" />
      <p role="status" className="text-xs text-muted-foreground">
        {error
          ? "The security check couldn't load. Check your connection or browser settings, then retry."
          : ready
            ? "Security check complete."
            : "Complete the security check before submitting."}
      </p>
      {error && (
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => {
            setError(false);
            setReady(false);
            onToken("");
            if (!window.turnstile) {
              if (scriptCallback.current)
                Reflect.deleteProperty(window, scriptCallback.current);
              const callback = `taskwaveTurnstileRetry${scriptRetry + 1}`;
              Reflect.set(window, callback, render);
              scriptCallback.current = callback;
              setScriptRetry((value) => value + 1);
            }
            setRetry((value) => value + 1);
          }}
        >
          Retry Security Check
        </Button>
      )}
    </div>
  );
}
