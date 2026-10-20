export interface ModelPricing {
  id: string;
  name: string;
  provider: "Anthropic" | "OpenAI" | "Google" | "DeepSeek";
  inputPerMillion: number;
  outputPerMillion: number;
  contextWindow: number; // in tokens
}

export interface ModelCostEstimate {
  model: ModelPricing;
  inputCost: number;
  outputCostEst: number; // assuming 1:1 or typical response
  percentOfContext: number;
}

export interface TokenCalculation {
  tokenCount: number;
  charCount: number;
  wordCount: number;
  costs: ModelCostEstimate[];
}
