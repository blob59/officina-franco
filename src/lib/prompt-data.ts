// Tipologie di scelta per il builder di prompt video.

export type ChoiceId = string;

export interface Choice {
  id: ChoiceId;
  label: string;
  // Metadati usati dal checker di coerenza.
  timeOfDay?: 'dawn' | 'day' | 'sunset' | 'night' | 'soft';
  weather?: 'rain' | 'snow' | 'fog' | 'sun' | 'storm' | 'clear';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  setting?: 'urban' | 'nature' | 'interior' | 'fantasy' | 'historical' | 'coastal' | 'snowscape';
}

export interface Attribute {
  id: 'light' | 'mood' | 'style' | 'shot' | 'env';
  label: string;
  description: string;
  choices: Choice[];
}

export const ATTRIBUTES: Attribute[] = [
  {
    id: 'light',
    label: 'Luce',
    description: 'Illuminazione principale della scena',
    choices: [
      { id: 'dawn', label: 'Alba', timeOfDay: 'dawn' },
      { id: 'day', label: 'Pieno giorno', timeOfDay: 'day' },
      { id: 'sunset', label: 'Tramonto', timeOfDay: 'sunset' },
      { id: 'night', label: 'Notte', timeOfDay: 'night' },
      { id: 'soft', label: 'Luce soffusa', timeOfDay: 'soft' },
    ],
  },
  {
    id: 'mood',
    label: 'Atmosfera',
    description: 'Tono emotivo del video',
    choices: [
      { id: 'dreamy', label: 'Sognante' },
      { id: 'dramatic', label: 'Drammatica' },
      { id: 'noir', label: 'Noir' },
      { id: 'romantic', label: 'Romantica' },
      { id: 'energetic', label: 'Energetica' },
    ],
  },
  {
    id: 'style',
    label: 'Stile',
    description: 'Trattamento visivo ed estetica',
    choices: [
      { id: 'cinematic', label: 'Cinematografico' },
      { id: 'documentary', label: 'Documentaristico' },
      { id: 'anime', label: 'Anime' },
      { id: 'vintage', label: 'Vintage' },
      { id: 'realistic', label: 'Realistico' },
    ],
  },
  {
    id: 'shot',
    label: 'Inquadratura',
    description: 'Tipo di piano e distanza della camera',
    choices: [
      { id: 'ecu', label: 'Primissimo piano' },
      { id: 'cu', label: 'Primo piano' },
      { id: 'medium', label: 'Media' },
      { id: 'wide', label: 'Panoramica' },
      { id: 'detail', label: 'Dettaglio' },
    ],
  },
  {
    id: 'env',
    label: 'Ambientazione',
    description: 'Contesto spaziale della scena',
    choices: [
      { id: 'urban', label: 'Urbano', setting: 'urban' },
      { id: 'nature', label: 'Natura', setting: 'nature' },
      { id: 'interior', label: 'Interno', setting: 'interior' },
      { id: 'fantasy', label: 'Fantasia', setting: 'fantasy' },
      { id: 'historical', label: 'Storico', setting: 'historical' },
    ],
  },
];

export type AttributeId = Attribute['id'];
export type Selections = Record<AttributeId, ChoiceId>;

export const DEFAULT_SELECTIONS: Selections = {
  light: 'dawn',
  mood: 'dreamy',
  style: 'cinematic',
  shot: 'medium',
  env: 'urban',
};

// --- Durata video ---
export const DURATIONS = ['5s', '10s', '15s', '30s', '60s'] as const;
export type Duration = (typeof DURATIONS)[number];
export const DEFAULT_DURATION: Duration = '10s';

// --- Formato ---
export const FORMATS = ['16:9', '9:16', '1:1'] as const;
export type Format = (typeof FORMATS)[number];
export const DEFAULT_FORMAT: Format = '16:9';

// --- Intensità movimento camera ---
export const DEFAULT_CAMERA_INTENSITY = 35; // 0-100

// --- Utilità ---
export function getChoiceLabel(attrId: AttributeId, choiceId: ChoiceId | undefined): string {
  if (!choiceId) return '';
  const attr = ATTRIBUTES.find((a) => a.id === attrId);
  const c = attr?.choices.find((x) => x.id === choiceId);
  return c?.label ?? '';
}

export function getChoice(attrId: AttributeId, choiceId: ChoiceId | undefined): Choice | undefined {
  const attr = ATTRIBUTES.find((a) => a.id === attrId);
  return attr?.choices.find((x) => x.id === choiceId);
}

export function randomSelections(): Selections {
  const out = {} as Selections;
  for (const a of ATTRIBUTES) {
    const idx = Math.floor(Math.random() * a.choices.length);
    out[a.id] = a.choices[idx].id;
  }
  return out;
}

export function randomDuration(): Duration {
  return DURATIONS[Math.floor(Math.random() * DURATIONS.length)];
}

export function randomFormat(): Format {
  return FORMATS[Math.floor(Math.random() * FORMATS.length)];
}

export function randomCameraIntensity(): number {
  // Evitiamo i valori bassi: lo "Sorprendimi" deve produrre movimento percepibile.
  return 25 + Math.floor(Math.random() * 70);
}

export function describeCamera(intensity: number): string {
  if (intensity < 15) return 'camera prevalentemente statica, leggero micro-movimento';
  if (intensity < 40) return 'movimento camera moderato, dolly lento';
  if (intensity < 65) return 'movimento camera deciso, panoramica fluida';
  if (intensity < 85) return 'movimento camera dinamico, tracking continuo';
  return 'movimento camera intenso e nervoso, hand-held';
}

// --- Composer del prompt finale ---
export function composePrompt(
  subject: string,
  sel: Selections,
  duration: Duration,
  format: Format,
  camera: number,
): string {
  const subj = subject.trim() || 'un soggetto non specificato';
  const shot = getChoiceLabel('shot', sel.shot).toLowerCase();
  const style = getChoiceLabel('style', sel.style).toLowerCase();
  const mood = getChoiceLabel('mood', sel.mood).toLowerCase();
  const light = getChoiceLabel('light', sel.light).toLowerCase();
  const env = getChoiceLabel('env', sel.env).toLowerCase();
  const cam = describeCamera(camera);

  return (
    `Video ${format}, durata ${duration}. ` +
    `Soggetto: ${subj}. ` +
    `Inquadratura: ${shot}. ` +
    `Stile: ${style}; atmosfera: ${mood}; luce: ${light}; ambientazione: ${env}. ` +
    `Camera: ${cam}.`
  );
}
