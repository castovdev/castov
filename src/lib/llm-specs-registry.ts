export interface LlmModelSpec {
  slug: string;
  name: string;
  creator: string;
  parameters: string;
  contextWindow: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  minVramGb: number;
  recommendedGpu: string;
  ollamaCommand: string;
  bestFor: string;
  description: string;
}

export const LLM_MODELS: LlmModelSpec[] = [
  {
    slug: "gpt-4o",
    name: "GPT-4o (Omni)",
    creator: "OpenAI",
    parameters: "Proprietary",
    contextWindow: 128000,
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    minVramGb: 0,
    recommendedGpu: "API Only (Cloud Hosted)",
    ollamaCommand: "None (Proprietary)",
    bestFor: "Complex reasoning, multimodal vision, function calling",
    description: "Flagship multimodal foundation model with high speed and competitive intelligence."
  },
  {
    slug: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    creator: "Anthropic",
    parameters: "Proprietary",
    contextWindow: 200000,
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    minVramGb: 0,
    recommendedGpu: "API Only (Cloud Hosted)",
    ollamaCommand: "None (Proprietary)",
    bestFor: "Coding benchmarks, Cursor AI integration, technical architecture",
    description: "Industry-standard coding assistant model recognized for exceptional software engineering ability."
  },
  {
    slug: "deepseek-r1",
    name: "DeepSeek R1 (Reasoning)",
    creator: "DeepSeek",
    parameters: "671B MoE (37B active)",
    contextWindow: 128000,
    inputCostPer1M: 0.55,
    outputCostPer1M: 2.19,
    minVramGb: 40,
    recommendedGpu: "2x RTX 3090 (Quantized) or 8x H100",
    ollamaCommand: "ollama run deepseek-r1",
    bestFor: "Deep mathematical reasoning, algorithmic logic, open-weights self-hosting",
    description: "Breakthrough open-weights reinforcement-learning reasoning model rivaling OpenAI o1."
  },
  {
    slug: "llama-3-3-70b",
    name: "Llama 3.3 70B Instruct",
    creator: "Meta AI",
    parameters: "70 Billion",
    contextWindow: 128000,
    inputCostPer1M: 0.70,
    outputCostPer1M: 0.90,
    minVramGb: 48,
    recommendedGpu: "2x RTX 4090 (Q4_K_M) or A100 80GB",
    ollamaCommand: "ollama run llama3.3",
    bestFor: "Enterprise self-hosted LLM, open-source pipeline backbone",
    description: "Meta's flagship open-weights model delivering near 405B-class performance at 70B efficiency."
  },
  {
    slug: "qwen-2-5-coder-32b",
    name: "Qwen 2.5 Coder 32B",
    creator: "Alibaba Cloud",
    parameters: "32.5 Billion",
    contextWindow: 128000,
    inputCostPer1M: 0.30,
    outputCostPer1M: 0.60,
    minVramGb: 24,
    recommendedGpu: "Single RTX 3090 / RTX 4090 (24GB VRAM)",
    ollamaCommand: "ollama run qwen2.5-coder:32b",
    bestFor: "Local offline coding, full-repository comprehension, code generation",
    description: "Best-in-class local coding model capable of running entirely on a single 24GB consumer GPU."
  },
  {
    slug: "mistral-small-3",
    name: "Mistral Small 3 (24B)",
    creator: "Mistral AI",
    parameters: "24 Billion",
    contextWindow: 32000,
    inputCostPer1M: 0.20,
    outputCostPer1M: 0.60,
    minVramGb: 16,
    recommendedGpu: "RTX 4080 (16GB) or Apple Silicon M2/M3",
    ollamaCommand: "ollama run mistral-small",
    bestFor: "Fast local responses, agent tool use, low-memory laptops",
    description: "High-efficiency open-weights model fine-tuned for reasoning and multi-lingual tasks."
  }
];

export function getLlmModel(slug: string): LlmModelSpec | undefined {
  return LLM_MODELS.find(m => m.slug === slug.toLowerCase().trim());
}
