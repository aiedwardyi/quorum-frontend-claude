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
  const s = size

  switch (id) {
    // Google Gemini — sparkle/star
    case "gemini":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12Z"
            fill="currentColor"
          />
        </svg>
      )
    // Anthropic Claude — sunburst
    case "claude":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.31 3.414 9.06 20.586h-2.37L12.94 3.414h2.37Z" fill="currentColor" />
          <path d="M17.31 3.414 24 20.586h-2.37L15.27 3.414h2.04Z" fill="currentColor" />
          <path d="M6.69 3.414h2.04L2.37 20.586H0l6.69-17.172Z" fill="currentColor" />
        </svg>
      )
    // OpenAI GPT — hexagonal flower
    case "gpt":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.98 4.413a6.04 6.04 0 0 0-4.03 2.92 6.043 6.043 0 0 0 .742 7.093 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.516 2.9 5.985 5.985 0 0 0 4.497 2.013 6.052 6.052 0 0 0 5.78-4.153 6.02 6.02 0 0 0 4.028-2.92 6.044 6.044 0 0 0-.74-7.356ZM14.217 21.3a4.505 4.505 0 0 1-2.895-1.053l.144-.08 4.81-2.778a.783.783 0 0 0 .395-.678v-6.789l2.033 1.174a.072.072 0 0 1 .039.055v5.614a4.524 4.524 0 0 1-4.526 4.535Zm-9.722-4.157a4.488 4.488 0 0 1-.54-3.032l.144.086 4.81 2.778a.782.782 0 0 0 .787 0l5.874-3.392v2.346a.073.073 0 0 1-.029.062l-4.866 2.81a4.524 4.524 0 0 1-6.18-1.658ZM3.076 7.922a4.502 4.502 0 0 1 2.355-1.98V11.6a.78.78 0 0 0 .392.676l5.874 3.39-2.033 1.174a.073.073 0 0 1-.069.006l-4.866-2.812A4.525 4.525 0 0 1 3.076 7.92Zm16.688 3.882-5.874-3.393 2.033-1.174a.073.073 0 0 1 .069-.006l4.865 2.811a4.517 4.517 0 0 1-.7 8.142V12.48a.78.78 0 0 0-.393-.677Zm2.024-3.041-.144-.087-4.81-2.779a.782.782 0 0 0-.787 0L10.173 9.29V6.944a.073.073 0 0 1 .029-.061l4.866-2.808a4.523 4.523 0 0 1 6.72 4.688Zm-12.72 4.184-2.034-1.175a.072.072 0 0 1-.039-.054V6.103a4.522 4.522 0 0 1 7.42-3.48l-.144.081-4.81 2.778a.783.783 0 0 0-.395.678l-.002 6.788Zm1.105-2.384 2.616-1.51 2.616 1.51v3.018l-2.616 1.51-2.616-1.51v-3.018Z"
            fill="currentColor"
          />
        </svg>
      )
    // Perplexity — stylized P / abstract mark
    case "perplexity":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 1.5 4.5 6.75v10.5L12 22.5l7.5-5.25V6.75L12 1.5Zm0 2.1 5.4 3.78V12L12 15.78 6.6 12V7.38L12 3.6Z"
            fill="currentColor"
          />
          <path d="M12 1.5v4.08M4.5 6.75l2.1 1.47M19.5 6.75l-2.1 1.47M12 15.78V22.5M4.5 17.25l2.1-1.47M19.5 17.25l-2.1-1.47"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
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
    el.style.height = Math.max(el.scrollHeight, 120) + "px"
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
      <div className="relative z-10 flex flex-1 items-start justify-center px-6 pt-8 pb-16 sm:px-8 sm:pt-10 lg:pt-12">
        <div className="w-full max-w-[680px] flex flex-col gap-8">

          {/* ---- Prompt card ---- */}
          <div
            className="
              animate-scale-in delay-2
              rounded-[28px] border border-zinc-200/80 bg-white/80
              p-6 sm:p-8
              shadow-[0_24px_80px_-20px_rgba(0,0,0,0.06)]
              backdrop-blur-sm
              dark:border-zinc-700/50 dark:bg-zinc-900/80
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
                minHeight: "120px",
                maxHeight: "280px",
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
                          : "border-zinc-200 dark:border-zinc-700/50 bg-white/60 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-sm"
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
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 bg-white/60 dark:bg-zinc-900/50 p-1.5">
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
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 bg-white/60 dark:bg-zinc-900/50 p-1.5">
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
                dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-white
                disabled:opacity-35 disabled:cursor-not-allowed
                transition-all duration-250 cursor-pointer
                shadow-[0_2px_12px_-3px_rgba(0,0,0,0.15)]
                hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)]
                dark:shadow-[0_2px_16px_-4px_rgba(255,255,255,0.1)]
                dark:hover:shadow-[0_4px_24px_-4px_rgba(255,255,255,0.15)]
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
