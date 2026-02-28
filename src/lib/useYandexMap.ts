import { useState, useEffect } from "react";

const SCRIPT_ID = "yandex-maps-script";

let loadPromise: Promise<void> | null = null;

function loadYandexMaps(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    // Agar allaqachon yuklangan bo'lsa
    if ((window as any).ymaps) {
      (window as any).ymaps.ready(() => resolve());
      return;
    }

    const oldScript = document.getElementById(SCRIPT_ID);
    if (oldScript) oldScript.remove();

    const apiKey = import.meta.env.VITE_YANDEX_MAPS_KEY || "";

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      (window as any).ymaps.ready(() => resolve());
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Yandex Maps"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useYandexMap() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadYandexMaps()
      .then(() => setIsLoaded(true))
      .catch((err) => setError(err.message));
  }, []);

  return { isLoaded, error, ymaps: isLoaded ? (window as any).ymaps : null };
}
