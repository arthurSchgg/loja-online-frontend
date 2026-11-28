import { useState } from "react";
import type { FormEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

export interface ExperienceSummary { id: number; title: string; description: string }
export interface Option { id: number; label: string }
export interface Question { id: number; title: string; options: Option[] }
export interface ExperienceDetail extends ExperienceSummary { questions: Question[] }
export interface Answer { questionId: number; optionId: number }
export interface Result { title: string; description: string; recommendations: Array<{ id: number | null; name: string }> }
export interface ExperienceApi {
  list: (signal: AbortSignal) => Promise<ExperienceSummary[]>;
  detail: (id: number, signal: AbortSignal) => Promise<ExperienceDetail>;
  evaluate: (id: number, answers: Answer[]) => Promise<Result>;
}

function Questionnaire({ experience, api, back }: { experience: ExperienceDetail; api: ExperienceApi; back: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const reduce = useReducedMotion() || document.documentElement.dataset.motion === "off";
  const mutation = useMutation({ mutationFn: (selection: Answer[]) => api.evaluate(experience.id, selection) });
  const count = experience.questions.filter(question => answers[question.id] !== undefined).length;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (count !== experience.questions.length || mutation.isPending) return;
    mutation.mutate(experience.questions.map(question => ({ questionId: question.id, optionId: answers[question.id] })));
  };
  return <>
    <form id="experience-form" className="experience-form" onSubmit={submit}>
      <h3 id="experience-title">{experience.title}</h3>
      <p id="experience-description" className="muted">{experience.description}</p>
      <div className="experience-progress">
        <label htmlFor="quiz-progress">{count} de {experience.questions.length} respondidas</label>
        <progress id="quiz-progress" max={experience.questions.length} value={count} />
      </div>
      <div id="experience-questions">
        {experience.questions.map(question => <fieldset key={question.id}>
          <legend>{question.title}</legend>
          {question.options.map(option => <label className="quiz-choice" key={option.id}>
            <input type="radio" name={`q-${question.id}`} value={option.id} required
              checked={answers[question.id] === option.id} disabled={mutation.isPending}
              onChange={() => { mutation.reset(); setAnswers(previous => ({ ...previous, [question.id]: option.id })); }} /> {option.label}
          </label>)}
        </fieldset>)}
      </div>
      <button className="btn btn--primary" type="submit" disabled={mutation.isPending}>Ver meu resultado</button>
      <button className="btn btn--secondary" id="experience-back" type="button" onClick={back}>Escolher outra experiência</button>
      <p role="status" aria-live="polite">{mutation.isPending ? "Consultando o resultado..." : mutation.isError ? "Não foi possível avaliar suas respostas. Tente novamente." : ""}</p>
    </form>
    <motion.section id="experience-result" className="experience-result" aria-live="polite" aria-label="Resultado da experiência"
      hidden={!mutation.data} initial={false} animate={{ opacity: mutation.data ? 1 : 0, y: reduce || mutation.data ? 0 : 12 }}
      transition={{ duration: reduce ? 0 : 0.32 }}>
      {mutation.data && <>
        <span className="eyebrow">SEU RESULTADO</span><h3>{mutation.data.title}</h3>
        {mutation.data.description && <p>{mutation.data.description}</p>}
        {!!mutation.data.recommendations.length && <><h4>Sugestões da loja</h4><ul>
          {mutation.data.recommendations.map((product, index) => <li key={index}>
            {product.id ? <a href={`produto.html?productId=${product.id}`}>{product.name}</a> : product.name}
          </li>)}
        </ul></>}
      </>}
    </motion.section>
  </>;
}

export function Experience({ live, api }: { live: boolean; api: ExperienceApi }) {
  const [selected, setSelected] = useState<number | null>(null);
  const list = useQuery({ queryKey: ["experience-list"], queryFn: ({ signal }) => api.list(signal), enabled: live });
  const detail = useQuery({ queryKey: ["experience", selected], queryFn: ({ signal }) => api.detail(selected!, signal), enabled: live && selected !== null });
  const status = !live ? "Prévia demonstrativa: experiências oficiais aparecerão quando a loja publicar os dados."
    : list.isPending ? "Buscando experiências publicadas..."
    : list.isError ? "Experiências indisponíveis no momento."
    : selected !== null && detail.isPending ? "Carregando perguntas..."
    : selected !== null && detail.isError ? "Não foi possível carregar esta experiência. Escolha outra ou tente novamente."
    : selected === null ? (list.data?.length ? "Selecione uma experiência para começar." : "Nenhuma experiência publicada no momento.") : "";
  return <>
    <div id="experience-status" role="status" aria-live="polite">{status}</div>
    <div id="experience-selection" className="experience-selection" aria-label="Experiências disponíveis" hidden={selected !== null && !detail.isError}>
      {list.data?.map(item => <article className="experience-card" data-reveal key={item.id}>
        <span className="eyebrow">EXPERIÊNCIA</span><h3>{item.title}</h3><p>{item.description}</p>
        <button className="btn btn--secondary" type="button" onClick={() => setSelected(item.id)}>Começar <ArrowUpRight className="cta-icon" size={16} aria-hidden="true" /></button>
      </article>)}
      {list.isError && <button className="btn btn--secondary" type="button" onClick={() => void list.refetch()}>Tentar novamente</button>}
      {detail.isError && <button className="btn btn--secondary" type="button" onClick={() => void detail.refetch()}>Recarregar experiência</button>}
    </div>
    {selected !== null && detail.isPending && <button className="btn btn--secondary" type="button" onClick={() => setSelected(null)}>Escolher outra experiência</button>}
    {selected !== null && detail.data && <Questionnaire key={selected} experience={detail.data} api={api} back={() => setSelected(null)} />}
  </>;
}
