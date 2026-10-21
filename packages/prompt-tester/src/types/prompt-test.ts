export interface PromptAssertion {
  contains?: string[];
  notContains?: string[];
  isValidJson?: boolean;
  jsonKeys?: string[];
  regex?: string;
  maxTokens?: number;
  maxLatencyMs?: number;
}

export interface PromptTestCase {
  name: string;
  model?: string;
  systemPrompt?: string;
  userPrompt: string;
  variables?: Record<string, string>;
  expect: PromptAssertion;
}

export interface PromptTestSuite {
  name: string;
  version?: string;
  defaultModel?: string;
  tests: PromptTestCase[];
}

export interface AssertionResult {
  type: string;
  passed: boolean;
  expected: any;
  actual: any;
  message: string;
}

export interface SingleTestExecution {
  testName: string;
  file: string;
  model: string;
  renderedPrompt: string;
  responseOutput: string;
  passed: boolean;
  latencyMs: number;
  tokensUsed: number;
  assertions: AssertionResult[];
  timestamp: string;
}

export interface SuiteRunSummary {
  timestamp: string;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  durationMs: number;
  results: SingleTestExecution[];
}
