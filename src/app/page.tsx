'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clapperboard,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  Wand2,
  Clock,
  Ratio,
  Video,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  ATTRIBUTES,
  DEFAULT_SELECTIONS,
  DEFAULT_DURATION,
  DEFAULT_FORMAT,
  DEFAULT_CAMERA_INTENSITY,
  DURATIONS,
  FORMATS,
  type Selections,
  type Duration,
  type Format,
  type AttributeId,
  randomSelections,
  randomDuration,
  randomFormat,
  randomCameraIntensity,
  composePrompt,
  describeCamera,
} from '@/lib/prompt-data'
import { checkConsistency, type Inconsistency } from '@/lib/consistency'

const SAMPLE_SUBJECTS = [
  'Una ragazza che corre sulla spiaggia all’alba',
  'Un samurai che cammina nella foresta di notte',
  'Una metropoli futuristica sotto la pioggia al tramonto',
  'Un bambino che gioca con una candela in una stanza vuota',
  'Un astronauta che fluttua nello spazio di pieno giorno',
]

export default function Home() {
  const { toast } = useToast()

  // Stato dell'app
  const [subject, setSubject] = React.useState<string>(SAMPLE_SUBJECTS[0])
  const [selections, setSelections] = React.useState<Selections>(DEFAULT_SELECTIONS)
  const [duration, setDuration] = React.useState<Duration>(DEFAULT_DURATION)
  const [format, setFormat] = React.useState<Format>(DEFAULT_FORMAT)
  const [camera, setCamera] = React.useState<number>(DEFAULT_CAMERA_INTENSITY)

  // Prompt generato (stringa vuota finché l'utente non preme "Genera Prompt")
  const [generatedPrompt, setGeneratedPrompt] = React.useState<string>('')
  const [copied, setCopied] = React.useState<boolean>(false)

  // Ricalcola le inconsistenze ogni volta che cambiano soggetto o scelte
  const issues: Inconsistency[] = React.useMemo(
    () => checkConsistency(subject, selections),
    [subject, selections],
  )

  const handleSelect = (id: AttributeId, value: string) => {
    setSelections((prev) => ({ ...prev, [id]: value }))
  }

  const applySuggestion = (issue: Inconsistency) => {
    setSelections((prev) => ({ ...prev, [issue.attributeId]: issue.suggestedId }))
    toast({
      title: 'Coerenza ripristinata',
      description: `${issue.attributeLabel}: "${issue.suggestedLabel}" applicata.`,
    })
  }

  const handleGenerate = () => {
    const prompt = composePrompt(subject, selections, duration, format, camera)
    setGeneratedPrompt(prompt)
    setCopied(false)
    toast({
      title: 'Prompt generato',
      description: 'Il prompt è pronto in basso. Puoi copiarlo.',
    })
  }

  const handleSurprise = () => {
    setSubject(SAMPLE_SUBJECTS[Math.floor(Math.random() * SAMPLE_SUBJECTS.length)])
    setSelections(randomSelections())
    setDuration(randomDuration())
    setFormat(randomFormat())
    setCamera(randomCameraIntensity())
    setGeneratedPrompt('')
    setCopied(false)
    toast({
      title: 'Sorprendimi!',
      description: 'Nuova combinazione casuale pronta.',
    })
  }

  const handleCopy = async () => {
    let text = generatedPrompt
    if (!text) {
      text = composePrompt(subject, selections, duration, format, camera)
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: 'Prompt copiato',
        description: 'Incolla dove vuoi.',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: 'Copia non riuscita',
        description: 'Il browser ha bloccato la clipboard.',
        variant: 'destructive',
      })
    }
  }

  const livePreview = React.useMemo(
    () => composePrompt(subject, selections, duration, format, camera),
    [subject, selections, duration, format, camera],
  )

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* Glow decorativo in alto */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-amber-500/10 via-amber-500/0 to-transparent"
      />

      <main className="relative mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Header */}
        <header className="mb-10 flex flex-col items-start gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-amber-500/20">
              <Clapperboard className="h-6 w-6 text-zinc-950" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Prompt Video Builder
              </h1>
              <p className="text-sm text-zinc-400">
                Componi prompt coerenti per generatori video AI
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-zinc-900 text-zinc-300">
              Coerenza automatica
            </Badge>
            <Badge variant="secondary" className="bg-zinc-900 text-zinc-300">
              Durata · Formato · Camera
            </Badge>
          </div>
        </header>

        {/* Soggetto */}
        <Card className="mb-6 border-zinc-800 bg-zinc-900/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wand2 className="h-4 w-4 text-amber-400" />
              Descrizione del soggetto
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Descrivi la scena. Il sistema rileverà parole chiave come «all’alba», «di notte»,
              «pioggia», ecc. e le controllerà rispetto alle 5 scelte qui sotto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Es. Una ragazza che corre sulla spiaggia all’alba"
              className="min-h-24 resize-y border-zinc-800 bg-zinc-950/60 text-base text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-amber-500/40"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SAMPLE_SUBJECTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-400 transition hover:border-amber-500/50 hover:text-amber-300"
                >
                  {s.length > 42 ? s.slice(0, 42) + '…' : s}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alert di coerenza */}
        <AnimatePresence>
          {issues.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              <Alert
                variant="default"
                className="border-amber-500/40 bg-amber-500/10 text-amber-100"
              >
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <AlertTitle className="text-amber-200">
                  Attenzione: {issues.length} {issues.length === 1 ? 'incongruenza' : 'incongruenze'} rilevata
                </AlertTitle>
                <AlertDescription className="text-amber-100/80">
                  <ul className="mt-2 space-y-2">
                    {issues.map((issue, i) => (
                      <li
                        key={`${issue.attributeId}-${i}`}
                        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="text-sm">
                          <span className="font-medium text-amber-200">
                            {issue.attributeLabel}:
                          </span>{' '}
                          {issue.reason}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => applySuggestion(issue)}
                          className="shrink-0 border-amber-400/40 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 hover:text-amber-50"
                        >
                          Applica «{issue.suggestedLabel}»
                        </Button>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5 scelte */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ATTRIBUTES.map((attr) => (
            <Card key={attr.id} className="border-zinc-800 bg-zinc-900/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-200">
                  {attr.label}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  {attr.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selections[attr.id]}
                  onValueChange={(v) => handleSelect(attr.id, v)}
                >
                  <SelectTrigger className="w-full border-zinc-800 bg-zinc-950/60 text-zinc-100 focus:ring-amber-500/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                    {attr.choices.map((c) => (
                      <SelectItem
                        key={c.id}
                        value={c.id}
                        className="focus:bg-amber-500/20 focus:text-amber-100"
                      >
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}

          {/* Durata video */}
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <Clock className="h-4 w-4 text-amber-400" />
                Durata video
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Lunghezza del clip in secondi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={duration}
                onValueChange={(v) => setDuration(v as Duration)}
                className="grid grid-cols-5 gap-1"
              >
                {DURATIONS.map((d) => (
                  <div key={d} className="flex items-center justify-center">
                    <RadioGroupItem
                      value={d}
                      id={`dur-${d}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`dur-${d}`}
                      className="cursor-pointer rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-xs text-zinc-300 transition peer-data-[state=checked]:border-amber-500 peer-data-[state=checked]:bg-amber-500/20 peer-data-[state=checked]:text-amber-100"
                    >
                      {d}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Formato */}
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <Ratio className="h-4 w-4 text-amber-400" />
                Formato
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Proporzioni del frame
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ToggleGroup
                type="single"
                value={format}
                onValueChange={(v) => {
                  if (v) setFormat(v as Format)
                }}
                className="grid grid-cols-3 gap-1"
              >
                {FORMATS.map((f) => (
                  <ToggleGroupItem
                    key={f}
                    value={f}
                    className="border border-zinc-800 bg-zinc-950/60 text-xs text-zinc-300 data-[state=on]:border-amber-500 data-[state=on]:bg-amber-500/20 data-[state=on]:text-amber-100"
                  >
                    {f}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </CardContent>
          </Card>

          {/* Intensità movimento camera */}
          <Card className="border-zinc-800 bg-zinc-900/60 lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <Video className="h-4 w-4 text-amber-400" />
                Movimento camera
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Intensità del movimento ({camera}/100)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Slider
                value={[camera]}
                onValueChange={(v) => setCamera(v[0])}
                max={100}
                step={1}
                className="py-2"
              />
              <p className="mt-2 text-xs text-zinc-400">{describeCamera(camera)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Prompt preview */}
        <Card className="mb-6 border-zinc-800 bg-zinc-900/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-zinc-200">
              <span>Prompt generato</span>
              {generatedPrompt ? (
                <Badge className="bg-amber-500/20 text-amber-100">Aggiornato</Badge>
              ) : (
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
                  Anteprima live
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap break-words rounded-md border border-zinc-800 bg-zinc-950/60 p-4 font-mono text-sm text-zinc-200">
              {generatedPrompt || livePreview}
            </pre>
          </CardContent>
        </Card>

        {/* Pulsanti azione */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            onClick={handleSurprise}
            variant="outline"
            className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-amber-300"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Sorprendimi
          </Button>
          <Button
            onClick={handleCopy}
            variant="outline"
            className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-amber-300"
          >
            {copied ? (
              <Check className="mr-2 h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Copia Prompt
          </Button>
          <Button
            onClick={handleGenerate}
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-zinc-950 hover:from-amber-400 hover:to-orange-500"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Genera Prompt
          </Button>
        </div>

        {/* Footer informativo */}
        <footer className="mt-12 border-t border-zinc-900 pt-6 text-center text-xs text-zinc-600">
          Prompt Video Builder · Coerenza automatica + Durata · Formato · Camera
        </footer>
      </main>
    </div>
  )
}
