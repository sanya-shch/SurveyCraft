import { useEffect, useRef } from "react";
import { createApp, type App } from "vue";
import { useAuthStore } from "../../../store/useAuthStore";

interface VueAnalyticsHostProps {
  formId: string;
}

export default function VueAnalyticsHost({ formId }: VueAnalyticsHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<App | null>(null);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const mod = await import("vue_analytics/AnalyticsApp");
      if (cancelled || !containerRef.current) return;

      const app = createApp(mod.default, {
        formId,
        apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
      });
      app.mount(containerRef.current);
      appRef.current = app;
    })().catch((err) => {
      console.error("Не вдалося завантажити vue-analytics remote:", err);
    });

    return () => {
      cancelled = true;
      appRef.current?.unmount();
      appRef.current = null;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  if (!token) return null;

  return <div ref={containerRef} />;
}
