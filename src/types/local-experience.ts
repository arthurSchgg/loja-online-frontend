export const profiles = ["Floral", "Cítrico", "Amadeirado", "Oriental"] as const;
export type Profile = typeof profiles[number];

export const profileDescriptions: Record<Profile, string> = {
  Floral: "Notas delicadas de flores, como rosa e jasmim, para uma sensação suave e acolhedora.",
  Cítrico: "Notas frescas de frutas cítricas, como limão e bergamota, para uma sensação leve e luminosa.",
  Amadeirado: "Notas de madeiras, como cedro e sândalo, para uma sensação tranquila e envolvente.",
  Oriental: "Notas quentes, como âmbar, baunilha e especiarias, para uma sensação aconchegante."
};

export const localQuestions: ReadonlyArray<{ title: string; options: readonly string[] }> = [
  { title: "Que sensação você quer encontrar?", options: ["Um abraço de flores", "A leveza de um dia ensolarado", "O aconchego da natureza", "O mistério de uma noite especial"] },
  { title: "Qual cenário mais combina com você?", options: ["Um jardim florido", "Uma manhã à beira-mar", "Uma caminhada na floresta", "Um ambiente iluminado por velas"] },
  { title: "Qual estilo de fragrância desperta sua curiosidade?", options: ["Suave e delicado", "Fresco e vibrante", "Natural e elegante", "Quente e marcante"] }
];

/** Local preferences only; never produce product IDs, prices, or API answers. */
export function localProfile(answers: readonly Profile[]): Profile | null {
  if (answers.length !== localQuestions.length || answers.some(answer => !profiles.includes(answer))) return null;
  const counts = Object.fromEntries(profiles.map(profile => [profile, 0])) as Record<Profile, number>;
  for (const answer of answers) counts[answer]++;
  const max = Math.max(...Object.values(counts));
  return answers.find(answer => counts[answer] === max) ?? null;
}
