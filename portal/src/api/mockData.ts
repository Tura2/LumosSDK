export const MOCK_APP_ID = 'mock-app-1';

export const mockApps = [{ id: MOCK_APP_ID, name: 'Demo App' }];

export const mockStats = {
  traces: 1247, ok: 1175, errors: 72,
  tokensIn: 1_200_000, tokensOut: 200_000,
  latencySum: 426_674,
  thumbsUp: 972, thumbsDown: 275,
};

export const mockTraces = [
  { traceId: 'trace-001', feature: 'chat_feature',    status: 'OK',    latencyMs: 312,  tokensIn: 84,  tokensOut: 210, startedAt: new Date(Date.now() - 8  * 60000).toISOString() },
  { traceId: 'trace-002', feature: 'onboarding_ai',   status: 'OK',    latencyMs: 489,  tokensIn: 120, tokensOut: 340, startedAt: new Date(Date.now() - 12 * 60000).toISOString() },
  { traceId: 'trace-003', feature: 'support_bot',     status: 'ERROR', latencyMs: null, tokensIn: null,tokensOut: null,startedAt: new Date(Date.now() - 19 * 60000).toISOString() },
  { traceId: 'trace-004', feature: 'chat_feature',    status: 'OK',    latencyMs: 278,  tokensIn: 66,  tokensOut: 182, startedAt: new Date(Date.now() - 35 * 60000).toISOString() },
  { traceId: 'trace-005', feature: 'language_tutor',  status: 'OK',    latencyMs: 521,  tokensIn: 200, tokensOut: 480, startedAt: new Date(Date.now() - 62 * 60000).toISOString() },
  { traceId: 'trace-006', feature: 'code_assistant',  status: 'OK',    latencyMs: 395,  tokensIn: 310, tokensOut: 620, startedAt: new Date(Date.now() - 90 * 60000).toISOString() },
];

export const mockTraceDetails: Record<string, object> = {
  'trace-001': {
    traceId: 'trace-001', feature: 'chat_feature', status: 'OK',
    input: 'What is Kotlin and why should I use it for Android development?',
    output: 'Kotlin is a modern, statically-typed programming language developed by JetBrains. It runs on the JVM and is fully interoperable with Java. Google officially supports Kotlin for Android development since 2017. Key advantages include null safety, concise syntax, coroutines for async code, and extension functions.',
    model: 'gpt-4o', tokensIn: 84, tokensOut: 210, latencyMs: 312,
    startedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    spans: [
      { name: 'context_lookup', durationMs: 45 },
      { name: 'llm_call',       durationMs: 251 },
    ],
    feedback: ['THUMBS_UP'],
  },
  'trace-002': {
    traceId: 'trace-002', feature: 'onboarding_ai', status: 'OK',
    input: 'Help me set up my first Android project with Jetpack Compose.',
    output: 'To set up your first Android project with Jetpack Compose: 1. Open Android Studio and select "New Project". 2. Choose "Empty Activity" (Compose template). 3. Set your package name and minimum SDK to API 21+. 4. Click Finish. Android Studio will scaffold a Compose-ready project with a MainActivity and a preview-enabled composable.',
    model: 'claude-3-5-sonnet', tokensIn: 120, tokensOut: 340, latencyMs: 489,
    startedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    spans: [
      { name: 'rag_lookup',  durationMs: 88 },
      { name: 'llm_call',    durationMs: 390 },
    ],
    feedback: [],
  },
  'trace-003': {
    traceId: 'trace-003', feature: 'support_bot', status: 'ERROR',
    input: 'My app keeps crashing on startup, can you help?',
    output: null, model: 'gpt-4o-mini', tokensIn: null, tokensOut: null, latencyMs: null,
    startedAt: new Date(Date.now() - 19 * 60000).toISOString(),
    spans: [],
    feedback: ['THUMBS_DOWN'],
  },
  'trace-004': {
    traceId: 'trace-004', feature: 'chat_feature', status: 'OK',
    input: 'Explain coroutines in simple terms.',
    output: 'Coroutines are a way to write asynchronous code that looks sequential. Instead of callbacks or threads, you write code top to bottom and use "suspend" to pause without blocking. Think of it like pausing a recipe mid-step, letting someone else use the kitchen, then resuming exactly where you left off.',
    model: 'gpt-4o', tokensIn: 66, tokensOut: 182, latencyMs: 278,
    startedAt: new Date(Date.now() - 35 * 60000).toISOString(),
    spans: [{ name: 'llm_call', durationMs: 265 }],
    feedback: ['THUMBS_UP'],
  },
  'trace-005': {
    traceId: 'trace-005', feature: 'language_tutor', status: 'OK',
    input: 'How do you say "Where is the train station?" in French?',
    output: '"Où est la gare ?" is the standard phrase. Breakdown: Où = Where, est = is, la = the (feminine), gare = train station. Pronunciation: "oo eh lah gar". You can also say "Pouvez-vous m\'indiquer la gare ?" for a more polite version.',
    model: 'gpt-4o', tokensIn: 200, tokensOut: 480, latencyMs: 521,
    startedAt: new Date(Date.now() - 62 * 60000).toISOString(),
    spans: [
      { name: 'translation_lookup', durationMs: 110 },
      { name: 'llm_call',           durationMs: 399 },
    ],
    feedback: ['THUMBS_UP'],
  },
  'trace-006': {
    traceId: 'trace-006', feature: 'code_assistant', status: 'OK',
    input: 'Write a Kotlin function that debounces a search input.',
    output: 'fun <T> debounce(delayMs: Long = 300L, scope: CoroutineScope, action: suspend (T) -> Unit): (T) -> Unit {\n  var job: Job? = null\n  return { param ->\n    job?.cancel()\n    job = scope.launch {\n      delay(delayMs)\n      action(param)\n    }\n  }\n}',
    model: 'gpt-4o', tokensIn: 310, tokensOut: 620, latencyMs: 395,
    startedAt: new Date(Date.now() - 90 * 60000).toISOString(),
    spans: [
      { name: 'code_context_fetch', durationMs: 72 },
      { name: 'llm_call',           durationMs: 311 },
    ],
    feedback: [],
  },
};

export const mockKeys = [
  { id: 'key-001', name: 'Production App',  createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), lastUsedAt: new Date(Date.now() - 5 * 60000).toISOString(),  revoked: false },
  { id: 'key-002', name: 'Beta Testers',    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(), lastUsedAt: new Date(Date.now() - 2 * 3600000).toISOString(), revoked: false },
  { id: 'key-003', name: 'Old Integration', createdAt: new Date(Date.now() - 60 * 86400000).toISOString(), lastUsedAt: new Date(Date.now() - 20 * 86400000).toISOString(), revoked: true },
];

export function getMockResponse(url: string): object | null {
  if (url.includes('/auth/login') || url.includes('/auth/register')) return { token: 'mock-token-demo' };
  if (url.match(/\/apps\/[^/]+\/stats/))   return mockStats;
  if (url.match(/\/apps\/[^/]+\/traces/))  return mockTraces;
  if (url.match(/\/apps\/[^/]+\/keys/))    return mockKeys;
  if (url.match(/\/traces\/([^/]+)/)) {
    const id = url.split('/traces/')[1];
    return mockTraceDetails[id] ?? mockTraceDetails['trace-001'];
  }
  if (url.includes('/apps'))               return mockApps;
  if (url.includes('/keys'))               return mockKeys;
  return null;
}
