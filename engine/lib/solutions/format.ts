import type { GivenValue } from "@/lib/solutions/types";

/** TeX for a value with its unit: degrees use a degree sign, others upright units. */
export function valueTex(value: number, unit: string): string {
  if (unit === "deg") return `${value}\\degree`;
  return unit ? `${value}\\,\\mathrm{${unit}}` : `${value}`;
}

export function givenTex(given: GivenValue): string {
  return `${given.labelTex} = ${valueTex(given.value, given.unit)}`;
}
