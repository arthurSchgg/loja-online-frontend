import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export interface StoreContact {
  channels: Array<{ label: string; href: string; external: boolean }>;
  details: Array<{ label: string; value: string }>;
}

interface ContactProps {
  live: boolean;
  load: (signal: AbortSignal) => Promise<StoreContact>;
  status: HTMLElement;
  details: HTMLElement;
}

export function Contact({ live, load, status, details }: ContactProps) {
  const query = useQuery({ queryKey: ["store-contact"], queryFn: ({ signal }) => load(signal), enabled: live });
  const reduced = useReducedMotion() || document.documentElement.dataset.motion === "off";
  const channels = query.data?.channels ?? [];
  const rows = query.data?.details ?? [];
  const statusText = !live ? "Esta é uma prévia. Os contatos reais estarão disponíveis após publicação pela loja."
    : query.isPending ? "Consultando os canais oficiais..." : "";
  return <>
    {createPortal(statusText, status)}
    {createPortal(rows.length ? rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)
      : <div><dt>Informações adicionais</dt><dd>Horários e localização ainda não informados.</dd></div>, details)}
    {!live ? <p>Nenhum contato demonstrativo é exibido.</p> : query.isPending ? null :
      channels.length ? channels.map(channel =>
        <motion.a key={channel.href} className="contact-channel" href={channel.href}
          target={channel.external ? "_blank" : undefined} rel={channel.external ? "noopener noreferrer" : undefined}
          whileTap={reduced ? undefined : { scale: 0.98 }}>
          {channel.label}<ArrowUpRight aria-hidden="true" strokeWidth={1.6} />
        </motion.a>) :
        <div className="contact-empty">
          <h3>{query.isError ? "Canais temporariamente indisponíveis" : "Canais em atualização"}</h3>
          <p>{query.isError ? "Não foi possível consultar os canais oficiais agora. Nenhum contato não confirmado será exibido."
            : "Os contatos oficiais aparecerão aqui assim que forem confirmados pela loja."}</p>
          {query.isError && <button className="btn btn--secondary" type="button" onClick={() => void query.refetch()}>Tentar novamente</button>}
          <a className="text-link" href="catalogo.html">Explorar o catálogo</a>
        </div>}
  </>;
}
