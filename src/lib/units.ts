export type WeightUnit = 'kg' | 'lb'
export type DistanceUnit = 'km' | 'mi'

const LB_PER_KG = 2.20462262185
const MI_PER_KM = 0.621371192

export const kgTo = (kg: number, u: WeightUnit) => (u === 'kg' ? kg : kg * LB_PER_KG)
export const toKg = (v: number, u: WeightUnit) => (u === 'kg' ? v : v / LB_PER_KG)
export const kmTo = (km: number, u: DistanceUnit) => (u === 'km' ? km : km * MI_PER_KM)
export const toKm = (v: number, u: DistanceUnit) => (u === 'km' ? v : v / MI_PER_KM)

/** Round for display: up to 2 decimals, trailing zeros removed. */
export function num(n: number, decimals = 2): string {
  const f = 10 ** decimals
  const r = Math.round(n * f) / f
  return String(r)
}

export const weightLabel = (u: WeightUnit) => (u === 'kg' ? 'kg' : 'lbs')
export const weightShort = (u: WeightUnit) => (u === 'kg' ? 'kg' : 'lb')

export function fmtWeight(kg: number, u: WeightUnit): string {
  return `${num(kgTo(kg, u), 1)} ${weightShort(u)}`
}

/** Plate-friendly rounding step in the display unit. */
export const weightStep = (u: WeightUnit) => (u === 'kg' ? 2.5 : 5)
