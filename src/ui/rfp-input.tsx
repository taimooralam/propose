'use client'

const PRESETS = {
  simple: {
    label: 'Simple Meeting',
    text: `We need a boardroom for 12 people for a full-day board meeting on May 15th. Please include lunch for all attendees, continuous coffee and refreshments, and a projector with screen. Budget around EUR 2,000.`,
  },
  medium: {
    label: 'Product Launch',
    text: `We are planning a product launch event for 80 guests. We need a main venue that can seat all 80 attendees theater-style, plus two breakout rooms for 25 people each for afternoon workshops. Catering should include a full lunch buffet and a continuous coffee service. We need a full AV package with sound and screens for the main venue. The event also requires high-speed WiFi and a registration desk with check-in staff at the entrance. The event is in June.`,
  },
  complex: {
    label: 'Wedding',
    text: `We are organising a three-day destination wedding from June 20 to 22 for 120 guests. Day 1: welcome dinner for 50 guests in an intimate setting. Day 2: outdoor ceremony for 120 guests (with indoor backup in case of rain), followed by a cocktail reception for 120, and a seated dinner for 120 with a live band and open bar. Day 3: farewell brunch for 80 guests. We need 40 hotel rooms for 2 nights — a mix of standard rooms, a few suites, and a bridal suite. We also need a spa package for the bridal party of 6, floral arrangements for the ceremony and dinner, and dietary accommodations for 8 vegetarians, 3 gluten-free, and 2 vegan guests. Budget is EUR 45,000-60,000 excluding accommodation.`,
  },
} as const

interface RfpInputProps {
  onSubmit: (rfp: string) => void
  loading: boolean
}

export function RfpInput({ onSubmit, loading }: RfpInputProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {Object.entries(PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => {
              const textarea = document.getElementById('rfp-text') as HTMLTextAreaElement
              if (textarea) {
                textarea.value = preset.text
              }
            }}
            className="px-3 py-1.5 text-sm bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors dark:bg-zinc-800 dark:hover:bg-zinc-700"
            disabled={loading}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <textarea
        id="rfp-text"
        placeholder="Paste your RFP here or select a preset above..."
        rows={6}
        className="w-full p-3 border border-zinc-300 rounded-lg text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-700"
        disabled={loading}
      />

      <button
        onClick={() => {
          const textarea = document.getElementById('rfp-text') as HTMLTextAreaElement
          if (textarea?.value.trim()) {
            onSubmit(textarea.value.trim())
          }
        }}
        disabled={loading}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Running pipeline...' : 'Analyse RFP'}
      </button>
    </div>
  )
}
