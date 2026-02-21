/** Tarifs Claude Sonnet 4.5/4.6 : $3/MTok input, $15/MTok output */
const PRICE_INPUT_PER_M = 3;
const PRICE_OUTPUT_PER_M = 15;

export function computeGenerationCost(inputTokens: number, outputTokens: number): {
  inputTokens: number;
  outputTokens: number;
  estimatedUsd: number;
} {
  const estimatedUsd = (inputTokens * PRICE_INPUT_PER_M + outputTokens * PRICE_OUTPUT_PER_M) / 1_000_000;
  return { inputTokens, outputTokens, estimatedUsd };
}

export type GenerationCost = ReturnType<typeof computeGenerationCost>;
