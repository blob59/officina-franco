// Controllo di coerenza tra la descrizione del soggetto (testo libero) e le 5 scelte.
//
// La strategia:
// - Estraiamo dalla descrizione del soggetto una serie di "segnali" (time-of-day, weather, season, setting).
// - Per ogni scelta attiva, confrontiamo i segnali con i metadati della scelta.
// - Se c'è un'incongruenza (per es. "all'alba" nel soggetto + luce "Pieno giorno"),
//   restituiamo un oggetto Inconsistency con la scelta suggerita.

import {
  ATTRIBUTES,
  getChoice,
  type AttributeId,
  type ChoiceId,
  type Selections,
} from './prompt-data';

export interface Inconsistency {
  attributeId: AttributeId;
  attributeLabel: string;
  detectedLabel: string; // cosa abbiamo rilevato nel soggetto
  currentLabel: string; // scelta attualmente selezionata
  suggestedLabel: string; // scelta coerente suggerita
  suggestedId: ChoiceId;
  reason: string;
}

interface DetectedSignals {
  timeOfDay?: 'dawn' | 'day' | 'sunset' | 'night';
  weather?: 'rain' | 'snow' | 'fog' | 'sun' | 'storm' | 'clear';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  setting?: 'urban' | 'nature' | 'interior' | 'fantasy' | 'historical' | 'coastal' | 'snowscape';
  rawMatches: string[]; // parole chiave trovate, per il messaggio
}

// Pattern in italiano. Usiamo \b per i confini parola quando possibile;
// per le parole con apostrofo usiamo versioni con e senza apice.
const TIME_PATTERNS: { re: RegExp; value: DetectedSignals['timeOfDay']; word: string }[] = [
  { re: /\b(all['’]alba|alba)\b/i, value: 'dawn', word: 'all’alba' },
  { re: /\b(al tramonto|al calar del sole|tramonto|crepuscolo)\b/i, value: 'sunset', word: 'al tramonto' },
  { re: /\b(di notte|notturno|notturna|notte|mezzanotte|a mezzanotte)\b/i, value: 'night', word: 'di notte' },
  { re: /\b(di pieno giorno|pieno giorno|diurno|diurna|a mezzogiorno|mezzogiorno|in pieno giorno|giorno|sotto il sole)\b/i, value: 'day', word: 'di pieno giorno' },
];

const TIME_WORD: Record<NonNullable<DetectedSignals['timeOfDay']>, string> = {
  dawn: 'all’alba',
  day: 'di pieno giorno',
  sunset: 'al tramonto',
  night: 'di notte',
};

const WEATHER_PATTERNS: { re: RegExp; value: DetectedSignals['weather']; word: string }[] = [
  { re: /\b(pioggia|piove|piovoso|pioggia battente|temporale|diluvio|acquazzone)\b/i, value: 'rain', word: 'pioggia' },
  { re: /\b(neve|nevica|nevoso|innevato|bufera di neve|nevicata)\b/i, value: 'snow', word: 'neve' },
  { re: /\b(nebbia|nebbioso|foschia|annuvolato)\b/i, value: 'fog', word: 'nebbia' },
  { re: /\b(sole|soleggiato|sereno|cielo sereno)\b/i, value: 'sun', word: 'sole' },
  { re: /\b(temporale|tempesta|bufera|burrasca)\b/i, value: 'storm', word: 'tempesta' },
];

const SEASON_PATTERNS: { re: RegExp; value: DetectedSignals['season']; word: string }[] = [
  { re: /\b(primavera|primaverile)\b/i, value: 'spring', word: 'primavera' },
  { re: /\b(estate|estivo|estiva)\b/i, value: 'summer', word: 'estate' },
  { re: /\b(autunno|autunnale)\b/i, value: 'autumn', word: 'autunno' },
  { re: /\b(inverno|invernale|invernali)\b/i, value: 'winter', word: 'inverno' },
];

const SETTING_PATTERNS: { re: RegExp; value: DetectedSignals['setting']; word: string }[] = [
  { re: /\b(città|cittadina|strada|via|metropolitana|metro|quartiere|grattacielo|periferia|urbano|asfalto|marciapiede)\b/i, value: 'urban', word: 'cittadino' },
  { re: /\b(spiaggia|mare|oceano|scogliera|costa|litorale|riva|marino|balneare)\b/i, value: 'coastal', word: 'costiero' },
  { re: /\b(foresta|bosco|prato|montagna|collina|fiume|lago|campagna|valle|natura|pascolo|prateria)\b/i, value: 'nature', word: 'naturalistico' },
  { re: /\b(stanza|soggiorno|cucina|sala|ufficio|interno|indoor|camera|salotto|corridoio)\b/i, value: 'interior', word: 'interno' },
  { re: /\b(magico|magica|fantasia|fatato|incantato|irreale|surreale|mitologico)\b/i, value: 'fantasy', word: 'fantasy' },
  { re: /\b(storico|medievale|antico|rinascimentale|vittoriano|romano|egizio|gotico|vintage)\b/i, value: 'historical', word: 'storico' },
  { re: /\b(neve|innevato|ghiacciaio|montagna innevata|pista da sci|inverno polare)\b/i, value: 'snowscape', word: 'innevato' },
];

function detectSignals(subject: string): DetectedSignals {
  const out: DetectedSignals = { rawMatches: [] };
  if (!subject.trim()) return out;

  for (const p of TIME_PATTERNS) {
    if (p.re.test(subject)) {
      out.timeOfDay = p.value;
      out.rawMatches.push(p.word);
      break;
    }
  }
  for (const p of WEATHER_PATTERNS) {
    if (p.re.test(subject)) {
      out.weather = p.value;
      out.rawMatches.push(p.word);
      break;
    }
  }
  for (const p of SEASON_PATTERNS) {
    if (p.re.test(subject)) {
      out.season = p.value;
      out.rawMatches.push(p.word);
      break;
    }
  }
  // Per lo setting prendiamo il primo match (l'ordine è rilevante: snowscape dopo nature).
  for (const p of SETTING_PATTERNS) {
    if (p.re.test(subject)) {
      out.setting = p.value;
      out.rawMatches.push(p.word);
      break;
    }
  }
  return out;
}

// Mappa di incompatibilità fra "timeOfDay rilevato" e "timeOfDay della luce scelta".
// 'soft' (Luce soffusa) è compatibile con tutto: non genera mai conflitto.
const TIME_COMPAT: Record<NonNullable<DetectedSignals['timeOfDay']>, Set<string>> = {
  dawn: new Set(['day', 'sunset', 'night']),
  day: new Set(['dawn', 'sunset', 'night']),
  sunset: new Set(['day', 'dawn', 'night']),
  night: new Set(['day', 'dawn', 'sunset']),
};

// Mappa: dato un timeOfDay rilevato, qual è la scelta Luce coerente?
const TIME_TO_LIGHT: Record<NonNullable<DetectedSignals['timeOfDay']>, ChoiceId> = {
  dawn: 'dawn',
  day: 'day',
  sunset: 'sunset',
  night: 'night',
};

const SETTING_TO_ENV: Partial<Record<NonNullable<DetectedSignals['setting']>, ChoiceId>> = {
  urban: 'urban',
  coastal: 'nature', // non c'è una scelta "costa": la più vicina è Natura
  nature: 'nature',
  interior: 'interior',
  fantasy: 'fantasy',
  historical: 'historical',
  snowscape: 'nature', // paesaggio innevato → Natura
};

const SETTING_LABEL: Record<NonNullable<DetectedSignals['setting']>, string> = {
  urban: 'urbano',
  coastal: 'costiero',
  nature: 'naturalistico',
  interior: 'interiore',
  fantasy: 'di fantasia',
  historical: 'storico',
  snowscape: 'innevato',
};

// Mappa di compatibilità stagione ↔ setting (per cogliere "estate" + "neve" come conflitto).
function seasonSettingConflict(
  season: NonNullable<DetectedSignals['season']>,
  setting: NonNullable<DetectedSignals['setting']>,
): boolean {
  if (season === 'summer' && setting === 'snowscape') return true;
  if (season === 'winter' && setting === 'coastal') return false; // costa d'inverno è ok
  return false;
}

export function checkConsistency(
  subject: string,
  sel: Selections,
): Inconsistency[] {
  const signals = detectSignals(subject);
  const issues: Inconsistency[] = [];
  if (signals.rawMatches.length === 0) return issues;

  // --- Controllo LUCE ---
  if (signals.timeOfDay) {
    const lightChoice = getChoice('light', sel.light);
    if (lightChoice && lightChoice.timeOfDay && lightChoice.timeOfDay !== 'soft') {
      const conflictSet = TIME_COMPAT[signals.timeOfDay];
      if (conflictSet.has(lightChoice.timeOfDay)) {
        const attr = ATTRIBUTES.find((a) => a.id === 'light')!;
        const suggestedId = TIME_TO_LIGHT[signals.timeOfDay];
        const suggested = attr.choices.find((c) => c.id === suggestedId)!;
        issues.push({
          attributeId: 'light',
          attributeLabel: attr.label,
          detectedLabel: TIME_WORD[signals.timeOfDay],
          currentLabel: lightChoice.label,
          suggestedLabel: suggested.label,
          suggestedId,
          reason:
            `Hai descritto una scena "${TIME_WORD[signals.timeOfDay]}", ma la luce selezionata è "${lightChoice.label}". ` +
            `La luce coerente è "${suggested.label}".`,
        });
      }
    }
  }

  // --- Controllo AMBIENTAZIONE ---
  if (signals.setting) {
    const envChoice = getChoice('env', sel.env);
    if (envChoice && envChoice.setting) {
      const suggestedEnvId = SETTING_TO_ENV[signals.setting];
      // Per "coastal" e "snowscape" non c'è una scelta diretta: segnaliamo comunque la vicinanza
      // solo se la scelta attuale è in forte contrasto (per es. "spiaggia" + "Interno").
      if (suggestedEnvId && suggestedEnvId !== envChoice.id) {
        // Per snowscape accettiamo "nature" come compatibile, non segnaliamo.
        if (signals.setting === 'snowscape' && envChoice.id === 'nature') {
          // ok, compatibile
        } else if (signals.setting === 'coastal' && envChoice.id === 'nature') {
          // tollerabile
        } else {
          const attr = ATTRIBUTES.find((a) => a.id === 'env')!;
          const suggested = attr.choices.find((c) => c.id === suggestedEnvId);
          if (suggested) {
            issues.push({
              attributeId: 'env',
              attributeLabel: attr.label,
              detectedLabel: SETTING_LABEL[signals.setting],
              currentLabel: envChoice.label,
              suggestedLabel: suggested.label,
              suggestedId: suggestedEnvId,
              reason:
                `Hai descritto un contesto "${SETTING_LABEL[signals.setting]}", ma l'ambientazione è "${envChoice.label}". ` +
                `Una scelta più coerente è "${suggested.label}".`,
            });
          }
        }
      }
    }

    // Conflitto stagione + setting (es. "estate" + "neve")
    if (signals.season && seasonSettingConflict(signals.season, signals.setting)) {
      const attr = ATTRIBUTES.find((a) => a.id === 'env')!;
      issues.push({
        attributeId: 'env',
        attributeLabel: attr.label,
        detectedLabel: `${signals.season} + ${SETTING_LABEL[signals.setting]}`,
        currentLabel: getChoice('env', sel.env)?.label ?? '',
        suggestedLabel: 'Natura',
        suggestedId: 'nature',
        reason:
          `Hai descritto "${signals.season}" insieme a un contesto "${SETTING_LABEL[signals.setting]}": combinazione improbabile. ` +
          `Verifica la stagione o scegli un'ambientazione più adatta.`,
      });
    }
  }

  return issues;
}
