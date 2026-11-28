import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Contact } from "./components/Contact";
import type { StoreContact } from "./components/Contact";
import { Experience } from "./components/Experience";
import type { ExperienceApi } from "./components/Experience";
export { experienceList, experienceDetail, experienceResult, object, string } from "./types/public-api";

function queryClient() {
  return new QueryClient({ defaultOptions: {
    queries: { retry: false, staleTime: 0, refetchOnWindowFocus: false, gcTime: 0 },
    mutations: { retry: false, gcTime: 0 }
  } });
}

export function mountContact(live: boolean, load: (signal: AbortSignal) => Promise<StoreContact>) {
  const host = document.getElementById("contact-links");
  const status = document.getElementById("contact-status");
  const details = document.getElementById("contact-info");
  if (!host || !status || !details) return;
  status.replaceChildren();
  details.replaceChildren();
  const client = queryClient();
  createRoot(host).render(<QueryClientProvider client={client}><Contact live={live} load={load} status={status} details={details} /></QueryClientProvider>);
}

export function mountExperience(live: boolean, api: ExperienceApi) {
  const status = document.getElementById("experience-status");
  const selection = document.getElementById("experience-selection");
  const form = document.getElementById("experience-form");
  const result = document.getElementById("experience-result");
  if (!status || !selection || !form || !result) return;
  const host = document.createElement("div");
  host.id = "experience-app";
  status.before(host);
  status.remove();
  selection.remove();
  form.remove();
  result.remove();
  const client = queryClient();
  createRoot(host).render(<QueryClientProvider client={client}><Experience live={live} api={api} /></QueryClientProvider>);
}
