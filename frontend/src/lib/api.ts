import { cache } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type HomeResponse = {
  message: string;
};

const FALLBACK_HOME: HomeResponse = {
  message: "Backend is unavailable. Start backend server to see live data.",
};

export const getHome = cache(async () => {
  if (!BASE_URL) {
    return FALLBACK_HOME;
  }

  try {
    const res = await fetch(`${BASE_URL}/`);

    if (!res.ok) {
      return FALLBACK_HOME;
    }

    const data = (await res.json()) as Partial<HomeResponse>;
    return {
      message: data.message ?? FALLBACK_HOME.message,
    };
  } catch {
    return FALLBACK_HOME;
  }
});
