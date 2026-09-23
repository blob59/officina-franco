---
Task ID: 1
Agent: main (super-z)
Task: Migliorare l'app video-prompt-builder mantenendo la grafica attuale; aggiungere controllo di coerenza tra descrizione del soggetto e 5 scelte; aggiungere Durata video, Formato 16:9/9:16/1:1 e Intensità movimento camera; mantenere Genera Prompt, Sorprendimi, Copia Prompt; testare tutto.

Work Log:
- Inizializzato ambiente fullstack-dev (Next.js 16 + TS + Tailwind 4 + shadcn/ui) — progetto vuoto, nessuna app preesistente trovata, costruita da zero con palette ambra/scuro coerente.
- Creato `src/lib/prompt-data.ts`: 5 attributi (Luce, Atmosfera, Stile, Inquadratura, Ambientazione) ciascuno con 5 scelte + metadati (timeOfDay, setting); durate 5/10/15/30/60s; formati 16:9/9:16/1:1; slider camera 0–100 con describeCamera() a 5 soglie; composePrompt() deterministico; randomSelections/randomDuration/randomFormat/randomCameraIntensity per Sorprendimi.
- Creato `src/lib/consistency.ts`: parser regex italiano che estrae dalla descrizione del soggetto: time-of-day (all'alba/tramonto/notte/pieno giorno), weather, season, setting (urbano/costiero/natura/interno/fantasia/storico/innevato). Confronta con i metadati delle scelte e restituisce array di Inconsistency con scelta suggerita.
- Matrix di incompatibilità TIME_COMPAT: ogni time-of-day è in conflitto con 3 altre luci; Luce soffusa tollerata. SETTING_TO_ENV: coastal/snowscape → Natura (più vicina), ecc. Rilevato anche caso stagione+setting improbabile (estate+neve).
- Scritta `src/app/page.tsx`: UI dark con Card ambra/zinc, Textarea soggetto con 5 chip di esempio, 5 Select, RadioGroup durata, ToggleGroup formato, Slider intensità, Alert animato (framer-motion AnimatePresence) con pulsante «Applica <suggerimento>», preview live del prompt, badge "Aggiornato"/"Anteprima live", 3 pulsanti Genera Prompt / Sorprendimi / Copia Prompt, toasts via useToast.
- Lint pulito (eslint 0 errori).
- Test end-to-end con agent-browser:
  1) Caricamento: soggetto default "spiaggia all'alba" → alert "Applica «Natura»" (costiero vs Urbano). Luce "Alba" coerente con "all'alba". ✓
  2) Cambiato Luce → "Pieno giorno" → alert "Applica «Alba»" (esempio esatto del brief). ✓
  3) Click "Applica «Alba»" → Luce ripristinata, toast "Coerenza ripristinata". ✓
  4) Click "Genera Prompt" → prompt preview aggiornato con testo completo italiano + badge "Aggiornato". ✓
  5) Click "Copia Prompt" → clipboard hook verificato: contiene il prompt completo; toast "Prompt copiato / Incolla dove vuoi". ✓
  6) Click "Sorprendimi" → subject/5 scelte/durata/formato/slider tutti randomizzati; nuovo alert per "foresta" vs Urbano. ✓
  7) Slider da 30 → 80 (ArrowRight) → descrizione camera cambia "moderato, dolly lento" → "dinamico, tracking continuo". ✓
  8) Durata → 60s, Formato → 9:16 → prompt preview riflette "Video 9:16, durata 60s". ✓
  9) Soggetto "Ballo in discoteca a mezzanotte" + Luce "Alba" → alert "Applica «Notte»" (conflitto inverso notte/dawn). ✓
  10) Click "Applica «Notte»" → Luce="Notte", nessun alert residuo, toast "Coerenza ripristinata". ✓
- VLM verifica su 2 screenshot: layout pulito, contrasto buono, alert ambra ben visibile, tema scuro coerente.
- Nessun errore runtime (console pulita tranne React DevTools/HMR info benigni).

Stage Summary:
- File prodotti: src/lib/prompt-data.ts, src/lib/consistency.ts, src/app/page.tsx (sovrascritta).
- Screenshot di test in /home/z/my-project/download/: 01-initial, 02-after-apply, 03-after-copy, 04-after-surprise, 05-night-conflict-resolved.
- Tutti i requisiti utente soddisfatti: controllo coerenza (tempo/giorno + ambientazione + stagione), Durata, Formato, Intensità movimento camera; pulsanti Genera/Sorprendimi/Copia mantenuti; grafica shadcn/ui ambra-scuro coerente con lo stile del progetto.
