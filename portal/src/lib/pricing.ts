// Prices in USD per 1M tokens. Source: OpenRouter model pages.
// Update when providers change rates.
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'openai/gpt-4o-mini':                   { input: 0.15,   output: 0.60   },
  'openai/gpt-4o':                        { input: 2.50,   output: 10.00  },
  'openai/gpt-4-turbo':                   { input: 10.00,  output: 30.00  },
  'openai/gpt-3.5-turbo':                 { input: 0.50,   output: 1.50   },
  'anthropic/claude-3-5-sonnet':          { input: 3.00,   output: 15.00  },
  'anthropic/claude-3-5-haiku':           { input: 0.80,   output: 4.00   },
  'anthropic/claude-3-opus':              { input: 15.00,  output: 75.00  },
  'anthropic/claude-3-sonnet':            { input: 3.00,   output: 15.00  },
  'anthropic/claude-3-haiku':             { input: 0.25,   output: 1.25   },
  'google/gemini-flash-1.5':              { input: 0.075,  output: 0.30   },
  'google/gemini-pro-1.5':               { input: 1.25,   output: 5.00   },
  'meta-llama/llama-3.1-8b-instruct':    { input: 0.055,  output: 0.055  },
  'meta-llama/llama-3.1-70b-instruct':   { input: 0.52,   output: 0.75   },
  'mistralai/mistral-7b-instruct':        { input: 0.055,  output: 0.055  },
  'mistralai/mixtral-8x7b-instruct':      { input: 0.24,   output: 0.24   },
};

export function calcCost(
  model: string | null,
  tokensIn: number | null,
  tokensOut: number | null,
): number | null {
  if (!model || tokensIn == null || tokensOut == null) return null;
  const p = MODEL_PRICING[model];
  if (!p) return null;
  return (tokensIn * p.input + tokensOut * p.output) / 1_000_000;
}

export function formatCost(cost: number | null): string {
  if (cost == null) return '—';
  if (cost === 0) return '$0.00';
  if (cost < 0.0001) return `$${cost.toExponential(2)}`;
  if (cost < 0.01)   return `$${cost.toFixed(5)}`;
  return `$${cost.toFixed(4)}`;
}
