# Dataset Exploration — Proposales API

## API Shape Summary

**Base URL:** `https://api.proposales.com/v3`
**Auth:** `Authorization: Bearer <TOKEN>`
**Company ID:** `5265` (required for create/update operations)

### Content (Products)

Content items are the product library. Each item has:

| Native Field | Type | Notes |
|---|---|---|
| `product_id` | number | Auto-assigned on create |
| `variation_id` | number | 1:1 with product_id in current system |
| `title` | string | Per-language |
| `description` | string | Per-language, optional |
| `images` | array | Uploadcare UUIDs or public URLs |
| `language` | string | ISO 3166-1 alpha-2 |
| `created_at` | number | Unix timestamp |
| `is_archived` | boolean | Only with `include_archived=true` |
| `sources` | object | Integration metadata (Opera, Mews, etc.) |

**That's it.** No category, capacity, price, unit, amenities, tags, or availability fields.

### What's Missing for Retrieval

| Needed Field | Why | Source |
|---|---|---|
| `category` | Hard-filter per slot type | Must infer from title + description |
| `subtype` | Distinguish ballroom vs boardroom | Must infer |
| `capacity_min` / `capacity_max` | Filter by guest count | Must extract from description |
| `unit` | per_person, per_room, flat, per_day, per_hour | Must infer from pricing language |
| `price_cents` / `currency` | Budget filtering, proposal assembly | Not in content API; set during proposal block creation |
| `price_model` | Understand pricing structure | Must infer |
| `tags` | Semantic search enrichment | Must generate |
| `amenities` | Feature matching (WiFi, projector, etc.) | Must extract from description |

**Implication:** Enrichment is mandatory. The content API is a title+description store. All structured metadata must be created via LLM extraction during ingestion.

### Proposals

Create proposal with `blocks` array where each block references content via `content_id` (which is `variation_id`).

Key proposal block fields:
- `content_id`: links to library product (variation_id)
- `type`: `'product-block'` or `'video-block'`
- `title`, `description`, `comment`: can override content library values
- `quantity`, `quantity_min`, `quantity_max`, `quantity_editable`
- `unit_value_*`: 4 pre-calculated price values (cents, with/without tax/discount)
- `currency`: 3-letter code
- `optional`, `optional_picked`: recipient can select/deselect
- `recurring`: time-based charging
- `relative`: unit-based pricing
- `multi_product_enabled`: daily breakdowns via subrows
- `package_split`: VAT configuration per block
- `fixed_discount` / `percent_discount`: mutually exclusive

### Content → Proposal Block Flow

1. Create content in library (title + description + images)
2. Content gets `product_id` and `variation_id`
3. When creating proposal, reference `variation_id` as `content_id` in blocks
4. Set pricing, quantity, unit, discounts at the block level (not in content)
5. Pricing is in cents across all 4 unit value fields

### Unit Values

All prices in **cents**. Four pre-calculated values per block:
- `unit_value_without_discount_without_tax`
- `unit_value_with_discount_without_tax`
- `unit_value_without_discount_with_tax`
- `unit_value_with_discount_with_tax`

### Package Split Types

Used for VAT categorization and business insights:
- `accommodation`
- `meetingRoom`
- `food`
- `other`

### Content Library Status

Current library is **empty**. All products must be seeded.

## Enrichment Schema Proposal

Each product in the local sidecar should have:

```typescript
{
  // From API
  product_id: number
  variation_id: number
  title: string
  description: string

  // Enriched via LLM
  category: SlotType          // venue | catering | accommodation | av_equipment | activity | decoration | entertainment | service | dietary
  subtype: string             // e.g. "ballroom", "boardroom", "brunch_buffet", "standard_room"
  capacity_min: number
  capacity_max: number
  unit: Unit                  // per_person | per_room | per_day | flat | per_hour
  price_model: string         // e.g. "per person per day", "flat rate", "per room per night"
  price_cents: number         // seed price for budget estimation
  currency: string            // EUR
  tags: string[]              // searchable keywords
  amenities: string[]         // specific features (WiFi, projector, live band, etc.)
  dietary_options: string[]   // vegetarian, gluten-free, vegan, etc.
  indoor_outdoor: string      // indoor | outdoor | both | n/a

  // Computed
  retrieval_text: string      // concatenation for embedding
  embedding: number[]         // text-embedding-3-small vector
}
```

## Category Taxonomy

| Category | Subtypes | Unit |
|---|---|---|
| `venue` | ballroom, conference_room, garden_terrace, private_dining, workshop_room | flat / per_day |
| `catering` | executive_lunch, coffee_service, gala_dinner, brunch_buffet, cocktail_reception | per_person |
| `accommodation` | standard_room, superior_room, junior_suite, bridal_suite | per_room |
| `av_equipment` | basic_projector, full_av_package, live_streaming | flat / per_day |
| `activity` | spa_package, city_tour, wine_tasting | per_person |
| `decoration` | floral_standard, floral_premium, candle_linen | flat |
| `entertainment` | dj_package, live_band, string_quartet | flat |
| `service` | registration_desk, high_speed_wifi, valet_parking | flat / per_day |
| `dietary` | vegetarian_upgrade, special_dietary | per_person |

## Retrieval Text Composition

For each product, compose `retrieval_text` from:

```
{title} | {category} {subtype} | capacity {capacity_min}-{capacity_max} |
{unit} | {tags.join(', ')} | {amenities.join(', ')} |
{indoor_outdoor} | {description}
```

This gives the embedding model structured + natural language context.

## Normalization Rules

### Capacity
- Extract numbers from descriptions: "up to 200 guests" → `capacity_max: 200`
- "10-50 people" → `capacity_min: 10, capacity_max: 50`
- Accommodation: capacity = number of rooms, not guests
- No capacity mentioned → `capacity_min: 0, capacity_max: 9999`

### Pricing
- All prices in EUR cents
- Extract from description or assign realistic seed values
- Unit determines how price scales: per_person × guest count, per_room × room count, flat = fixed

### Aliases
- "meeting room" / "conference room" / "boardroom" → venue
- "projector" / "screen" / "AV" → av_equipment
- "lunch" / "dinner" / "buffet" / "catering" → catering
- "room" / "suite" / "accommodation" → accommodation

## Hard Constraints for Filtering

These can reject candidates deterministically:
1. `category` must match slot type
2. `capacity_max >= required_capacity`
3. `indoor_outdoor` matches if specified in slot

Soft constraints (relax on retry):
1. `subtype` preference
2. `budget` range
3. `amenities` match
