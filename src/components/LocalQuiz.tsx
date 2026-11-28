import { useState } from "react";
import type { FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowLeft, RefreshCw } from "lucide-react";
import { localQuestions, profiles, localProfile, profileDescriptions } from "../types/local-experience";
import type { Profile } from "../types/local-experience";

export function LocalQuiz({ home = false, back }: { home?: boolean; back?: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Array<Profile | undefined>>([]);
  const [result, setResult] = useState<Profile | null>(null);
  const reduced = useReducedMotion() || document.documentElement.dataset.motion === "off";
  const question = localQuestions[step];
  const count = answers.filter(Boolean).length;
  const reset = () => { setAnswers([]); setStep(0); setResult(null); };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!answers[step]) return;
    if (step < localQuestions.length - 1) { setStep(step + 1); return; }
    setResult(localProfile(answers.filter((value): value is Profile => value !== undefined)));
  };
  return <form id={home ? "quiz-form" : "local-experience-form"} className={home ? "quiz-box local-quiz" : "experience-form local-quiz"} onSubmit={submit}>
    <span className="eyebrow">Experiência ilustrativa · sem cadastro</span>
    <h3>Qual é o seu estilo olfativo?</h3>
    <div className="experience-progress local-quiz-progress">
      <label htmlFor="local-quiz-progress">{count} de {localQuestions.length} respondidas</label>
      <progress id="local-quiz-progress" max={localQuestions.length} value={count} />
    </div>
    {result ? <motion.div id={home ? "quiz-result" : "local-quiz-result"} className="quiz-answer local-quiz-result" aria-live="polite"
      initial={reduced ? false : { opacity: .5, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <span className="eyebrow">Seu universo</span><h3>{result}</h3><p>{profileDescriptions[result]}</p>
      <p className="muted">Resultado de inspiração baseado nas suas respostas, não uma indicação de estoque ou de produtos específicos.</p>
      <a className="btn btn--primary" href="catalogo.html">Explorar o catálogo <ArrowRight size={16} aria-hidden="true" /></a>
      <button className="btn btn--secondary" type="button" onClick={reset}><RefreshCw size={16} aria-hidden="true" /> Refazer quiz</button>
    </motion.div> : <>
      <motion.fieldset key={step} initial={reduced ? false : { opacity: .5, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{duration: reduced ? 0 : .2}}>
        <legend>{question.title}</legend>
        {question.options.map((label, index) => <label className="quiz-choice" key={profiles[index]}>
          <input type="radio" name={`local-question-${step}`} value={profiles[index]} required checked={answers[step] === profiles[index]}
            onChange={() => setAnswers(previous => { const next = [...previous]; next[step] = profiles[index]; return next; })} />
          {label}
        </label>)}
      </motion.fieldset>
      <div className="local-quiz-actions">
        {step > 0 && <button className="btn btn--secondary" type="button" onClick={() => setStep(step - 1)}><ArrowLeft size={16} aria-hidden="true" /> Voltar</button>}
        <button className="btn btn--primary" type="submit" disabled={!answers[step]}>{step === localQuestions.length - 1 ? "Ver meu resultado" : "Próxima pergunta"} <ArrowRight size={16} aria-hidden="true" /></button>
      </div>
    </>}
    {back && <button className="text-link local-quiz-back" type="button" onClick={back}>Escolher outra experiência</button>}
  </form>;
}
