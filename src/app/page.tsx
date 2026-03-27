"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Sun, Moon, Check, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Provider = "gemini" | "claude" | "gpt" | "perplexity"
type ResponseLength = "short" | "medium" | "long"
type Locale = "en" | "ko"

interface QuorumConfig {
  prompt: string
  models: Provider[]
  responseLength: ResponseLength
  rounds: number
  locale: Locale
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDERS: {
  id: Provider
  label: string
  color: string
  badge: string
}[] = [
  { id: "gemini", label: "Gemini", color: "#4285F4", badge: "GM" },
  { id: "perplexity", label: "Perplexity", color: "#20B2AA", badge: "PX" },
  { id: "claude", label: "Claude", color: "#D97706", badge: "CL" },
  { id: "gpt", label: "GPT", color: "#10B981", badge: "GT" },
]

const RESPONSE_LENGTHS: { value: ResponseLength; en: string; ko: string; desc_en: string; desc_ko: string }[] = [
  { value: "short", en: "Short", ko: "짧게", desc_en: "50–100 words", desc_ko: "50–100 단어" },
  { value: "medium", en: "Medium", ko: "보통", desc_en: "150–250 words", desc_ko: "150–250 단어" },
  { value: "long", en: "Long", ko: "길게", desc_en: "300–500 words", desc_ko: "300–500 단어" },
]

const ROUND_OPTIONS: { value: number; en: string; ko: string }[] = [
  { value: 3, en: "3 rounds", ko: "3 라운드" },
  { value: 5, en: "5 rounds", ko: "5 라운드" },
  { value: 7, en: "7 rounds", ko: "7 라운드" },
]

const ROUND_DESCRIPTIONS: Record<number, { en: string; ko: string }> = {
  3: { en: "Quick take", ko: "빠른 토론" },
  5: { en: "Standard", ko: "기본" },
  7: { en: "Deep dive", ko: "심층 토론" },
}

const t = {
  en: {
    placeholder: "What do you need consensus on?",
    start: "Start Discussion",
    responseLength: "Response Length",
    rounds: "Rounds",
    minModels: "Select at least 2 models",
    participants: "Discussion Circle",
    tagline: "consensus through debate",
    hint: "Choose 2–4 models to debate your question.",
    modelsCount: "models",
  },
  ko: {
    placeholder: "어떤 주제에 대해 합의가 필요하신가요?",
    start: "토론 시작",
    responseLength: "응답 길이",
    rounds: "라운드 수",
    minModels: "최소 2개의 모델을 선택하세요",
    participants: "토론 참여자",
    tagline: "토론을 통한 합의",
    hint: "질문을 토론할 2–4개 모델을 선택하세요.",
    modelsCount: "모델",
  },
}

// ---------------------------------------------------------------------------
// Provider icon — abstract geometric marks
// ---------------------------------------------------------------------------

function ProviderIcon({ id, size = 20 }: { id: Provider; size?: number }) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  }

  switch (id) {
    case "gemini":
      return (
        <svg {...shared}>
          <path
            d="M12 2C12 2 17 7 17 12C17 17 12 22 12 22C12 22 7 17 7 12C7 7 12 2 12 2Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M2 12C2 12 7 7 12 7C17 7 22 12 22 12C22 12 17 17 12 17C7 17 2 12 2 12Z"
            fill="currentColor"
            opacity="0.4"
          />
        </svg>
      )
    case "claude":
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.85" />
          <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3" />
        </svg>
      )
    case "gpt":
      return (
        <svg {...shared}>
          <rect x="4" y="4" width="16" height="16" rx="4" fill="currentColor" opacity="0.8" />
          <rect x="8" y="8" width="8" height="8" rx="2" fill="currentColor" opacity="0.25" />
        </svg>
      )
    case "perplexity":
      return (
        <svg {...shared}>
          <polygon points="12,3 21,18 3,18" fill="currentColor" opacity="0.8" />
          <polygon points="12,9 17,18 7,18" fill="currentColor" opacity="0.25" />
        </svg>
      )
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Home() {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [mounted, setMounted] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [models, setModels] = useState<Provider[]>(["gemini", "perplexity", "claude", "gpt"])
  const [responseLength, setResponseLength] = useState<ResponseLength>("medium")
  const [rounds, setRounds] = useState(5)
  const [locale, setLocale] = useState<Locale>("en")
  const [dark, setDark] = useState(false)
  const [isMac, setIsMac] = useState(false)
  const [hoveringSubmit, setHoveringSubmit] = useState(false)

  // Mount + theme restore + platform detection
  useEffect(() => {
    const saved = localStorage.getItem("quorum_theme")
    if (saved === "dark") {
      setDark(true)
      document.documentElement.classList.add("dark")
    }
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0)
    requestAnimationFrame(() => setMounted(true))
  }, [])

  // Auto-grow textarea
  const autoGrow = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.max(el.scrollHeight, 140) + "px"
  }, [])

  useEffect(() => {
    autoGrow()
  }, [prompt, autoGrow])

  // Theme toggle
  const toggleTheme = useCallback(() => {
    setDark((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add("dark")
        localStorage.setItem("quorum_theme", "dark")
      } else {
        document.documentElement.classList.remove("dark")
        localStorage.setItem("quorum_theme", "light")
      }
      return next
    })
  }, [])

  // Model toggle
  const toggleModel = useCallback((id: Provider) => {
    setModels((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 2) return prev
        return prev.filter((m) => m !== id)
      }
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }, [])

  // Submit
  const submit = useCallback(() => {
    if (!prompt.trim() || models.length < 2) return
    const config: QuorumConfig = {
      prompt: prompt.trim(),
      models,
      responseLength,
      rounds,
      locale,
    }
    sessionStorage.setItem("quorum_config", JSON.stringify(config))
    router.push("/chat")
  }, [prompt, models, responseLength, rounds, locale, router])

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        submit()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [submit])

  const l = t[locale]
  const canSubmit = prompt.trim().length > 0 && models.length >= 2

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fafaf9] dark:bg-[#09090b]">
        <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-500 dark:border-neutral-800 dark:border-t-neutral-400 animate-spin" />
      </main>
    )
  }

  return (
    <main className="noise relative flex min-h-screen flex-col bg-[#fafaf9] text-zinc-950 dark:bg-[#09090b] dark:text-zinc-50 transition-colors duration-500">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-[40%] left-1/2 -translate-x-1/2 w-[140%] aspect-square rounded-full opacity-[0.03] dark:opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, currentColor 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ---- Header ---- */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-8 sm:pt-8 lg:px-10">
        <div className="flex items-center gap-3 animate-fade-up delay-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-[11px] font-semibold tracking-[0.25em] text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
            Q
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-[-0.03em]">Quorum</p>
            <p
              className="text-[11px] tracking-[0.12em] text-zinc-400 dark:text-zinc-500"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {l.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 animate-fade-up delay-1">
          <button
            onClick={() => setLocale((p) => (p === "en" ? "ko" : "en"))}
            className="
              flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium tracking-wide
              border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:border-zinc-300
              dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:border-zinc-700
              transition-all duration-200 cursor-pointer select-none shadow-sm
              active:scale-95
            "
          >
            <Globe size={13} className="opacity-50" />
            <span style={{ fontFamily: "var(--font-geist-mono)" }}>
              {locale === "en" ? "EN" : "한"}
            </span>
          </button>

          <button
            onClick={toggleTheme}
            className="
              flex h-9 w-9 items-center justify-center rounded-full border
              border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:border-zinc-300
              dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:border-zinc-700
              transition-all duration-200 cursor-pointer shadow-sm
              active:scale-95
            "
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      {/* ---- Main content ---- */}
      <div className="relative z-10 flex flex-1 items-start justify-center px-6 pt-12 pb-20 sm:px-8 sm:pt-16 lg:pt-20">
        <div className="w-full max-w-[680px] flex flex-col gap-10">

          {/* ---- Prompt card ---- */}
          <div
            className="
              animate-scale-in delay-2
              rounded-[28px] border border-zinc-200/80 bg-white/80
              p-6 sm:p-8
              shadow-[0_24px_80px_-20px_rgba(0,0,0,0.06)]
              backdrop-blur-sm
              dark:border-zinc-800/80 dark:bg-zinc-950/60
              dark:shadow-[0_24px_80px_-20px_rgba(0,0,0,0.5)]
              transition-shadow duration-500
            "
          >
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={l.placeholder}
              spellCheck={false}
              rows={3}
              className="
                w-full resize-none bg-transparent
                text-[clamp(1.25rem,3vw,1.75rem)] font-medium leading-[1.35] tracking-[-0.03em]
                text-zinc-900 dark:text-zinc-50
                placeholder:text-zinc-300 dark:placeholder:text-zinc-600
                focus:outline-none
                transition-colors duration-200
              "
              style={{
                fontFamily: "var(--font-geist-sans)",
                minHeight: "140px",
                maxHeight: "320px",
              }}
            />

            <div className="mt-4 flex items-center justify-between">
              <div
                className="flex items-center gap-1.5 text-zinc-300 dark:text-zinc-600 select-none"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                <kbd className="inline-flex h-5 items-center rounded-md border border-zinc-200 dark:border-zinc-700 px-1.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                  {isMac ? "⌘" : "Ctrl"}
                </kbd>
                <span className="text-[10px]">+</span>
                <kbd className="inline-flex h-5 items-center rounded-md border border-zinc-200 dark:border-zinc-700 px-1.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                  Enter
                </kbd>
              </div>

              <span
                className="text-[11px] text-zinc-300 dark:text-zinc-600"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {models.length}/4 {l.modelsCount}
              </span>
            </div>
          </div>

          {/* ---- Model selector ---- */}
          <div className="flex flex-col gap-3 animate-fade-up delay-3">
            <div className="flex items-baseline justify-between px-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                {l.participants}
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                {l.hint}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PROVIDERS.map((p) => {
                const active = models.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleModel(p.id)}
                    className={`
                      group relative flex flex-col items-center gap-3 rounded-2xl border p-5
                      transition-all duration-250 cursor-pointer select-none
                      hover:scale-[1.02] active:scale-[0.97]
                      ${
                        active
                          ? "border-transparent shadow-md"
                          : "border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm"
                      }
                    `}
                    style={
                      active
                        ? {
                            backgroundColor: `${p.color}0C`,
                            borderColor: `${p.color}22`,
                            boxShadow: `0 4px 24px -6px ${p.color}18, 0 1px 3px ${p.color}10`,
                          }
                        : undefined
                    }
                  >
                    {/* Accent bar at top */}
                    <div
                      className={`
                        absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-b-full
                        transition-all duration-300
                        ${active ? "w-8 opacity-100" : "w-0 opacity-0"}
                      `}
                      style={{ backgroundColor: p.color }}
                    />

                    {/* Badge circle */}
                    <div
                      className="flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-250"
                      style={active ? { color: p.color } : undefined}
                    >
                      <div
                        className={
                          active
                            ? "transition-transform duration-200 group-hover:scale-110"
                            : "text-zinc-300 dark:text-zinc-600 transition-colors duration-200 group-hover:text-zinc-400 dark:group-hover:text-zinc-500"
                        }
                      >
                        <ProviderIcon id={p.id} size={30} />
                      </div>
                    </div>

                    {/* Label */}
                    <span
                      className={`
                        text-xs font-medium tracking-wide transition-colors duration-200
                        ${
                          active
                            ? "text-zinc-800 dark:text-zinc-200"
                            : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-500 dark:group-hover:text-zinc-400"
                        }
                      `}
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {p.label}
                    </span>

                    {/* Active checkmark */}
                    <div
                      className={`
                        absolute -top-1 -right-1 w-5 h-5 rounded-full
                        flex items-center justify-center
                        border-2 border-[#fafaf9] dark:border-[#09090b]
                        transition-all duration-250
                        ${active ? "scale-100 opacity-100" : "scale-0 opacity-0"}
                      `}
                      style={{ backgroundColor: p.color }}
                    >
                      <Check size={10} strokeWidth={3} className="text-white" />
                    </div>
                  </button>
                )
              })}
            </div>

            {models.length < 2 && (
              <p className="text-xs text-red-500/80 dark:text-red-400/70 px-1 animate-fade-up">
                {l.minModels}
              </p>
            )}
          </div>

          {/* ---- Secondary controls ---- */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-fade-up delay-4">
            {/* Response length */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 px-1">
                {l.responseLength}
              </span>
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 p-1.5">
                {RESPONSE_LENGTHS.map((rl) => {
                  const active = responseLength === rl.value
                  return (
                    <button
                      key={rl.value}
                      onClick={() => setResponseLength(rl.value)}
                      className={`
                        flex flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-center
                        transition-all duration-200 cursor-pointer select-none
                        ${
                          active
                            ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                        }
                      `}
                    >
                      <span className="text-xs font-medium">
                        {locale === "en" ? rl.en : rl.ko}
                      </span>
                      <span
                        className={`text-[10px] ${active ? "opacity-60" : "opacity-40"}`}
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {locale === "en" ? rl.desc_en : rl.desc_ko}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Rounds */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 px-1">
                {l.rounds}
              </span>
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 p-1.5">
                {ROUND_OPTIONS.map((ro) => {
                  const active = rounds === ro.value
                  const desc = ROUND_DESCRIPTIONS[ro.value]
                  return (
                    <button
                      key={ro.value}
                      onClick={() => setRounds(ro.value)}
                      className={`
                        flex flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-center
                        transition-all duration-200 cursor-pointer select-none
                        ${
                          active
                            ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                        }
                      `}
                    >
                      <span className="text-xs font-medium">
                        {locale === "en" ? ro.en : ro.ko}
                      </span>
                      <span
                        className={`text-[10px] ${active ? "opacity-60" : "opacity-40"}`}
                      >
                        {locale === "en" ? desc.en : desc.ko}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ---- Submit ---- */}
          <div className="animate-fade-up delay-5">
            <Button
              onClick={submit}
              disabled={!canSubmit}
              onMouseEnter={() => setHoveringSubmit(true)}
              onMouseLeave={() => setHoveringSubmit(false)}
              className={`
                w-full h-13 rounded-2xl text-[14px] font-medium tracking-wide
                bg-zinc-900 text-white hover:bg-zinc-800
                dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white
                disabled:opacity-25 disabled:cursor-not-allowed
                transition-all duration-250 cursor-pointer
                shadow-[0_2px_12px_-3px_rgba(0,0,0,0.15)]
                hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)]
                dark:shadow-[0_2px_12px_-3px_rgba(255,255,255,0.08)]
                dark:hover:shadow-[0_4px_20px_-4px_rgba(255,255,255,0.12)]
                active:scale-[0.995]
              `}
            >
              <span>{l.start}</span>
              <ArrowRight
                size={16}
                className="ml-2 transition-transform duration-300 ease-out"
                style={{
                  transform: canSubmit && hoveringSubmit ? "translateX(4px)" : "translateX(0)",
                }}
              />
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
