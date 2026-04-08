import type { SlotType } from '@/schemas'

/** Expected slot types for the simple RFP (board meeting) */
export const simpleExpectedSlotTypes: SlotType[] = [
  'venue',       // boardroom
  'catering',    // lunch
  'catering',    // coffee
  'av_equipment', // projector
]

/** Expected slot types for the medium RFP (product launch) — minimum set */
export const mediumExpectedSlotTypes: SlotType[] = [
  'venue',        // main venue
  'venue',        // breakout 1
  'venue',        // breakout 2
  'catering',     // lunch
  'catering',     // coffee
  'av_equipment', // AV package
  'service',      // WiFi
  'service',      // registration
]

/** Expected slot types for the complex RFP (wedding) — minimum set */
export const complexExpectedSlotTypes: SlotType[] = [
  'venue',           // welcome dinner venue
  'venue',           // ceremony outdoor
  'venue',           // ceremony indoor backup
  'venue',           // cocktail reception
  'venue',           // seated dinner
  'venue',           // farewell brunch
  'accommodation',   // standard rooms
  'accommodation',   // suites
  'accommodation',   // bridal suite
  'activity',        // spa bridal party
  'decoration',      // floral ceremony
  'decoration',      // floral dinner
  'entertainment',   // live band
  'catering',        // open bar / bar service
  'dietary',         // dietary accommodations
]
