import { ModelPricing, TokenCalculation, ModelCostEstimate } from "../types/token";

export const SUPPORTED_MODELS: ModelPricing[] = [
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
    contextWindow: 200000,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    inputPerMillion: 2.5,
    outputPerMillion: 10.0,
    contextWindow: 128000,
  },
  {
    id: "gemini-2-5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    inputPerMillion: 0.075,
    outputPerMillion: 0.3,
    contextWindow: 1000000,
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek-R1",
    provider: "DeepSeek",
    inputPerMillion: 0.55,
    outputPerMillion: 2.19,
    contextWindow: 128000,
  },
  {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    inputPerMillion: 0.8,
    outputPerMillion: 4.0,
    contextWindow: 200000,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    provider: "OpenAI",
    inputPerMillion: 0.15,
    outputPerMillion: 0.6,
    contextWindow: 128000,
  },
];

export class TokenEngine {
  /**
   * Fast, zero-dependency BPE token estimator calibrated across OpenAI cl100k/o200k and Claude tokenizers.
   */
  public static countTokens(text: string): number {
    if (!text || text.length === 0) return 0;

    // Pattern matches words, contractions, numbers, whitespace runs, and individual symbols
    const tokenRegex = /[A-Za-z]+|\d+|[^\s\w]|\s+/g;
    let tokens = 0;
    let match;

    while ((match = tokenRegex.exec(text)) !== null) {
      const segment = match[0];
      const len = segment.length;

      if (/^\s+$/.test(segment)) {
        // Whitespace runs: 1 token per 3-4 spaces or newlines
        tokens += Math.ceil(len / 4);
      } else if (/^\d+$/.test(segment)) {
        // Numbers: 1 token per 2-3 digits
        tokens += Math.ceil(len / 2.5);
      } else if (/^[A-Za-z]+$/.test(segment)) {
        // English words: 1 token for short words (< 5 chars), +1 for each extra 3-4 chars
        if (len <= 4) {
          tokens += 1;
        } else {
          tokens += Math.ceil(len / 3.8);
        }
      } else {
        // Punctuation / symbols / Unicode
        tokens += Math.ceil(len / 1.5);
      }
    }

    return Math.max(1, tokens);
  }

  public static analyzeText(text: string): TokenCalculation {
    const tokenCount = this.countTokens(text);
    const charCount = text.length;
    const wordCount = text.trim().length > 0 ? text.trim().split(/\s+/).length : 0;

    const costs: ModelCostEstimate[] = SUPPORTED_MODELS.map((model) => {
      const inputCost = (tokenCount / 1000000) * model.inputPerMillion;
      const outputCostEst = (tokenCount / 1000000) * model.outputPerMillion;
      const percentOfContext = Math.min(100, (tokenCount / model.contextWindow) * 100);

      return {
        model,
        inputCost,
        outputCostEst,
        percentOfContext,
      };
    });

    return {
      tokenCount,
      charCount,
      wordCount,
      costs,
    };
  }

  public static formatCost(num: number): string {
    if (num < 0.00001) return "< $0.00001";
    if (num < 0.01) return `$${num.toFixed(5)}`;
    return `$${num.toFixed(4)}`;
  }

  public static formatTokens(count: number): string {
    if (count >= 1000000) return `${(count / 1000000).toFixed(2)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  }
}
