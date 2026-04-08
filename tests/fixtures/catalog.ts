import type { EnrichedProduct } from '@/schemas'

function product(overrides: Partial<EnrichedProduct> & Pick<EnrichedProduct, 'product_id' | 'variation_id' | 'title' | 'category' | 'retrieval_text'>): EnrichedProduct {
  return {
    description: '',
    subtype: undefined,
    capacity_min: 0,
    capacity_max: 9999,
    unit: 'flat',
    price_model: undefined,
    price_cents: undefined,
    currency: 'EUR',
    tags: [],
    amenities: [],
    dietary_options: [],
    indoor_outdoor: 'n/a',
    embedding: undefined,
    ...overrides,
  } as EnrichedProduct
}

export const boardroomAlpha = product({
  product_id: 1,
  variation_id: 1,
  title: 'Boardroom Alpha',
  description: 'Intimate boardroom with built-in projector and whiteboard, seats up to 16.',
  category: 'venue',
  subtype: 'boardroom',
  capacity_min: 4,
  capacity_max: 16,
  unit: 'per_day',
  price_cents: 60000,
  indoor_outdoor: 'indoor',
  amenities: ['projector', 'whiteboard', 'wifi'],
  tags: ['meeting', 'board', 'small'],
  retrieval_text: 'Boardroom Alpha | venue boardroom | capacity 4-16 | per_day | meeting, board, small | projector, whiteboard, wifi | indoor | Intimate boardroom with built-in projector and whiteboard, seats up to 16.',
})

export const ballroomMeridian = product({
  product_id: 2,
  variation_id: 2,
  title: 'Grand Ballroom Meridian',
  description: 'Grand ballroom with stage, ceiling-mounted screens, and capacity for 180 guests.',
  category: 'venue',
  subtype: 'ballroom',
  capacity_min: 50,
  capacity_max: 180,
  unit: 'per_day',
  price_cents: 180000,
  indoor_outdoor: 'indoor',
  amenities: ['stage', 'screen', 'sound_system'],
  tags: ['event', 'gala', 'conference', 'large'],
  retrieval_text: 'Grand Ballroom Meridian | venue ballroom | capacity 50-180 | per_day | event, gala, conference, large | stage, screen, sound_system | indoor | Grand ballroom with stage, ceiling-mounted screens, and capacity for 180 guests.',
})

export const gardenTerrace = product({
  product_id: 3,
  variation_id: 3,
  title: 'Garden Terrace',
  description: 'Open-air terrace with garden views, suitable for receptions and ceremonies up to 80 guests.',
  category: 'venue',
  subtype: 'garden_terrace',
  capacity_min: 20,
  capacity_max: 80,
  unit: 'per_day',
  price_cents: 90000,
  indoor_outdoor: 'outdoor',
  amenities: ['garden_view', 'lighting'],
  tags: ['outdoor', 'ceremony', 'reception'],
  retrieval_text: 'Garden Terrace | venue garden_terrace | capacity 20-80 | per_day | outdoor, ceremony, reception | garden_view, lighting | outdoor | Open-air terrace with garden views, suitable for receptions and ceremonies up to 80 guests.',
})

export const workshopRoomEast = product({
  product_id: 4,
  variation_id: 4,
  title: 'Workshop Room East',
  description: 'Flexible workshop space for up to 30 participants with movable furniture.',
  category: 'venue',
  subtype: 'workshop_room',
  capacity_min: 5,
  capacity_max: 30,
  unit: 'per_day',
  price_cents: 30000,
  indoor_outdoor: 'indoor',
  amenities: ['whiteboard', 'wifi'],
  tags: ['workshop', 'breakout', 'training'],
  retrieval_text: 'Workshop Room East | venue workshop_room | capacity 5-30 | per_day | workshop, breakout, training | whiteboard, wifi | indoor | Flexible workshop space for up to 30 participants with movable furniture.',
})

export const workshopRoomWest = product({
  product_id: 5,
  variation_id: 5,
  title: 'Workshop Room West',
  description: 'Flexible workshop space for up to 30 participants, adjacent to East wing.',
  category: 'venue',
  subtype: 'workshop_room',
  capacity_min: 5,
  capacity_max: 30,
  unit: 'per_day',
  price_cents: 30000,
  indoor_outdoor: 'indoor',
  amenities: ['whiteboard', 'wifi'],
  tags: ['workshop', 'breakout', 'training'],
  retrieval_text: 'Workshop Room West | venue workshop_room | capacity 5-30 | per_day | workshop, breakout, training | whiteboard, wifi | indoor | Flexible workshop space for up to 30 participants, adjacent to East wing.',
})

export const executiveLunchBuffet = product({
  product_id: 6,
  variation_id: 6,
  title: 'Executive Lunch Buffet',
  description: 'Three-course buffet lunch with seasonal menu, serves up to 150 guests.',
  category: 'catering',
  subtype: 'executive_lunch',
  capacity_min: 10,
  capacity_max: 150,
  unit: 'per_person',
  price_cents: 3500,
  dietary_options: ['vegetarian', 'gluten_free'],
  tags: ['lunch', 'buffet', 'corporate'],
  retrieval_text: 'Executive Lunch Buffet | catering executive_lunch | capacity 10-150 | per_person | lunch, buffet, corporate | | n/a | Three-course buffet lunch with seasonal menu, serves up to 150 guests.',
})

export const coffeeServiceDeluxe = product({
  product_id: 7,
  variation_id: 7,
  title: 'Coffee & Refreshments Service',
  description: 'Continuous coffee, tea, and pastries throughout the event, up to 200 guests.',
  category: 'catering',
  subtype: 'coffee_service',
  capacity_min: 5,
  capacity_max: 200,
  unit: 'per_person',
  price_cents: 900,
  tags: ['coffee', 'tea', 'refreshments', 'break'],
  retrieval_text: 'Coffee & Refreshments Service | catering coffee_service | capacity 5-200 | per_person | coffee, tea, refreshments, break | | n/a | Continuous coffee, tea, and pastries throughout the event, up to 200 guests.',
})

export const basicProjectorKit = product({
  product_id: 8,
  variation_id: 8,
  title: 'Basic Projector & Screen Kit',
  description: 'HD projector with screen, HDMI adapter, and laser pointer.',
  category: 'av_equipment',
  subtype: 'basic_projector',
  unit: 'per_day',
  price_cents: 15000,
  amenities: ['projector', 'screen', 'hdmi'],
  tags: ['projector', 'presentation', 'av'],
  retrieval_text: 'Basic Projector & Screen Kit | av_equipment basic_projector | capacity 0-9999 | per_day | projector, presentation, av | projector, screen, hdmi | n/a | HD projector with screen, HDMI adapter, and laser pointer.',
})

export const premiumAvSuite = product({
  product_id: 9,
  variation_id: 9,
  title: 'Premium AV Suite',
  description: 'Full audio-visual package with live streaming, sound engineer, and multi-screen setup.',
  category: 'av_equipment',
  subtype: 'full_av_package',
  unit: 'per_day',
  price_cents: 75000,
  amenities: ['live_streaming', 'sound_engineer', 'multi_screen'],
  tags: ['av', 'streaming', 'professional', 'production'],
  retrieval_text: 'Premium AV Suite | av_equipment full_av_package | capacity 0-9999 | per_day | av, streaming, professional, production | live_streaming, sound_engineer, multi_screen | n/a | Full audio-visual package with live streaming, sound engineer, and multi-screen setup.',
})

export const wifiEventPackage = product({
  product_id: 10,
  variation_id: 10,
  title: 'High-Speed Event WiFi',
  description: 'Dedicated high-speed WiFi network for events, supports up to 500 concurrent devices.',
  category: 'service',
  subtype: 'high_speed_wifi',
  unit: 'per_day',
  price_cents: 25000,
  tags: ['wifi', 'internet', 'connectivity'],
  retrieval_text: 'High-Speed Event WiFi | service high_speed_wifi | capacity 0-9999 | per_day | wifi, internet, connectivity | | n/a | Dedicated high-speed WiFi network for events, supports up to 500 concurrent devices.',
})

export const registrationDeskTeam = product({
  product_id: 11,
  variation_id: 11,
  title: 'Registration Desk & Staff',
  description: 'Professional registration team with badges, check-in system, and welcome desk.',
  category: 'service',
  subtype: 'registration_desk',
  unit: 'per_day',
  price_cents: 40000,
  tags: ['registration', 'check-in', 'welcome'],
  retrieval_text: 'Registration Desk & Staff | service registration_desk | capacity 0-9999 | per_day | registration, check-in, welcome | | n/a | Professional registration team with badges, check-in system, and welcome desk.',
})

export const standardRoomBlock = product({
  product_id: 12,
  variation_id: 12,
  title: 'Standard Room Block',
  description: 'Block of standard hotel rooms, available up to 20 rooms per booking.',
  category: 'accommodation',
  subtype: 'standard_room',
  capacity_min: 1,
  capacity_max: 20,
  unit: 'per_room',
  price_cents: 12000,
  tags: ['room', 'accommodation', 'standard', 'hotel'],
  retrieval_text: 'Standard Room Block | accommodation standard_room | capacity 1-20 | per_room | room, accommodation, standard, hotel | | n/a | Block of standard hotel rooms, available up to 20 rooms per booking.',
})

/** Full test catalog — 12 products across 5 categories. No entertainment, decoration, activity, or dietary products (intentional gaps). */
export const testCatalog: EnrichedProduct[] = [
  boardroomAlpha,
  ballroomMeridian,
  gardenTerrace,
  workshopRoomEast,
  workshopRoomWest,
  executiveLunchBuffet,
  coffeeServiceDeluxe,
  basicProjectorKit,
  premiumAvSuite,
  wifiEventPackage,
  registrationDeskTeam,
  standardRoomBlock,
]
