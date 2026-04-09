import type { RequirementSlot } from '@/schemas'

const TYPE_COLORS: Record<string, string> = {
  venue: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  catering: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  accommodation: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  av_equipment: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  activity: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  decoration: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  entertainment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  service: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  dietary: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
}

interface SlotCardsProps {
  slots: RequirementSlot[]
}

export function SlotCards({ slots }: SlotCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {slots.map((slot, i) => (
        <div
          key={i}
          className="p-3 border border-zinc-200 rounded-lg dark:border-zinc-700"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${TYPE_COLORS[slot.type] ?? 'bg-zinc-100'}`}>
              {slot.type}
            </span>
            {!slot.required && (
              <span className="text-xs text-zinc-400">optional</span>
            )}
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">{slot.context}</p>
          {(slot.capacity ?? slot.guests ?? slot.rooms) && (
            <p className="text-xs text-zinc-500 mt-1">
              {slot.type === 'accommodation'
                ? `${slot.rooms ?? slot.guests} rooms`
                : `${slot.capacity ?? slot.guests} guests`}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
