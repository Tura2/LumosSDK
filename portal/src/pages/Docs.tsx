import { useEffect, useRef, useState } from 'react';

const SECTIONS = [
  { id: 'overview',         label: 'Overview' },
  { id: 'installation',     label: 'Installation' },
  { id: 'get-started',      label: 'Get Started' },
  { id: 'configuration',    label: 'Configuration' },
  { id: 'api-reference',    label: 'API Reference' },
  { id: 'server-endpoints', label: 'Server Endpoints' },
  { id: 'error-codes',      label: 'Error Codes' },
  { id: 'examples',         label: 'Examples' },
  { id: 'changelog',        label: 'Changelog' },
];

function CodeBlock({ code }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{ position: 'relative', marginBottom: 20 }}>
      <pre style={{
        background: '#040810', color: '#E8F2FF',
        borderRadius: 10, padding: '16px 20px',
        fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
        overflowX: 'auto', lineHeight: 1.7,
        border: '1px solid #2E3D54',
      }}>
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(255,255,255,0.07)', border: '1px solid #2E3D54',
          color: copied ? '#00E887' : '#6A7D9A', borderRadius: 6,
          padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

function Callout({ type, children }: { type: 'tip' | 'warning' | 'danger'; children: React.ReactNode }) {
  const colors = { tip: '#00D4FF', warning: '#FFB800', danger: '#FF4563' };
  const labels = { tip: 'TIP', warning: 'WARNING', danger: 'DANGER' };
  const color = colors[type];
  return (
    <div style={{
      borderLeft: `3px solid ${color}`,
      background: `rgba(${type === 'tip' ? '0,212,255' : type === 'warning' ? '255,184,0' : '255,69,99'},0.06)`,
      borderRadius: '0 8px 8px 0', padding: '12px 16px', marginBottom: 20,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>
        {labels[type]}
      </span>
      <div style={{ fontSize: 13, color: '#E8F2FF', lineHeight: 1.6, marginTop: 4 }}>{children}</div>
    </div>
  );
}

function ParamTable({ rows }: { rows: { name: string; type: string; required: boolean; description: string }[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 13 }}>
      <thead>
        <tr>
          {['Parameter', 'Type', 'Required', 'Description'].map(h => (
            <th key={h} style={{
              textAlign: 'left', padding: '8px 12px',
              borderBottom: '1px solid #2E3D54',
              fontSize: 10, fontWeight: 700, color: '#6A7D9A',
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.name} style={{ borderBottom: '1px solid rgba(46,61,84,0.4)' }}>
            <td style={{ padding: '10px 12px' }}><code style={{ color: '#00D4FF', fontFamily: "'JetBrains Mono', monospace" }}>{r.name}</code></td>
            <td style={{ padding: '10px 12px' }}><code style={{ color: '#7B5FFF', fontFamily: "'JetBrains Mono', monospace" }}>{r.type}</code></td>
            <td style={{ padding: '10px 12px', color: r.required ? '#00E887' : '#6A7D9A' }}>{r.required ? 'Yes' : 'No'}</td>
            <td style={{ padding: '10px 12px', color: '#E8F2FF', lineHeight: 1.5 }}>{r.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EndpointBadge({ method }: { method: string }) {
  const colors: Record<string, string> = { GET: '#00D4FF', POST: '#00E887', PATCH: '#FFB800', DELETE: '#FF4563' };
  return (
    <span style={{
      background: `${colors[method] ?? '#6A7D9A'}20`,
      border: `1px solid ${colors[method] ?? '#6A7D9A'}50`,
      color: colors[method] ?? '#6A7D9A',
      borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace", marginRight: 10,
    }}>{method}</span>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} style={{ fontSize: 22, fontWeight: 700, color: '#E8F2FF', marginBottom: 16, marginTop: 0, letterSpacing: '-0.02em', fontFamily: "'Clash Display', sans-serif" }}>
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#E8F2FF', marginBottom: 10, marginTop: 24 }}>
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, color: '#B8C8DE', lineHeight: 1.7, marginBottom: 16 }}>{children}</p>;
}

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#040810', color: '#E8F2FF' }}>
      {/* Sidebar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, width: 240, height: '100vh',
        background: '#070D1C', borderRight: '1px solid #2E3D54',
        padding: '28px 16px', display: 'flex', flexDirection: 'column',
        overflowY: 'auto', zIndex: 10,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 36, padding: '0 8px' }}>
          <img src="/lumos-icon.png" width={32} height={32} alt="Lumos" style={{ borderRadius: 8 }} />
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Clash Display', sans-serif", background: 'linear-gradient(135deg, #00D4FF, #7B5FFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            LumosSDK
          </span>
        </a>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6A7D9A', padding: '0 8px', marginBottom: 8 }}>
          Documentation
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={e => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{
                display: 'block', padding: '8px 12px', borderRadius: 8,
                fontSize: 14, fontWeight: activeSection === s.id ? 600 : 400,
                color: activeSection === s.id ? '#00D4FF' : '#6A7D9A',
                background: activeSection === s.id ? 'rgba(0,212,255,0.08)' : 'transparent',
                borderLeft: `2px solid ${activeSection === s.id ? '#00D4FF' : 'transparent'}`,
                textDecoration: 'none', transition: 'all 200ms ease-out',
                paddingLeft: activeSection === s.id ? 10 : 12,
              }}
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main ref={contentRef} style={{ marginLeft: 240, flex: 1, maxWidth: 800, padding: '48px 56px', margin: '0 auto 0 240px' }}>

        {/* Overview */}
        <section id="overview" style={{ marginBottom: 64 }}>
          <H2 id="overview">Overview</H2>
          <P>LumosSDK is an Android observability SDK for AI-powered apps. It automatically traces every AI conversation — capturing inputs, outputs, tokens, latency, and user feedback — and ships the data to a self-hosted Lumos server. The web portal visualizes trends, errors, and user satisfaction over time.</P>

          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20, overflow: 'hidden', borderRadius: 12, border: '1px solid #2E3D54' }}>
            {['Your App', 'Room Queue', 'WorkManager', 'Lumos Server', 'Portal'].map((step, i, arr) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ flex: 1, padding: '14px 12px', background: i % 2 === 0 ? '#0B1628' : '#0F1E38', textAlign: 'center' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#00D4FF', fontFamily: "'JetBrains Mono', monospace" }}>{step}</p>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ color: '#6A7D9A', fontSize: 16, padding: '0 2px', background: i % 2 === 0 ? '#0B1628' : '#0F1E38' }}>→</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Installation */}
        <section id="installation" style={{ marginBottom: 64 }}>
          <H2 id="installation">Installation</H2>
          <P>Add the SDK to your app's Gradle dependencies:</P>
          <CodeBlock language="kotlin" code={`// build.gradle.kts (app module)
dependencies {
    implementation("com.lumos:lumos-android:0.1.0")
}`} />
          <P>Add the required permission to your <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00D4FF' }}>AndroidManifest.xml</code>:</P>
          <CodeBlock language="xml" code={`<uses-permission android:name="android.permission.INTERNET" />`} />
          <Callout type="tip">The SDK uses WorkManager for background uploads. WorkManager is included transitively — no additional dependency required.</Callout>
        </section>

        {/* Get Started */}
        <section id="get-started" style={{ marginBottom: 64 }}>
          <H2 id="get-started">Get Started</H2>
          <P>Initialise the SDK in your <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00D4FF' }}>Application.onCreate()</code>:</P>
          <CodeBlock code={`class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Lumos.init(this) {
            apiKey    = "lk_your_api_key_here"
            serverUrl = "https://your-lumos-server.com"
            debug     = BuildConfig.DEBUG
        }
    }
}`} />
          <P>Then trace an AI call:</P>
          <CodeBlock code={`val trace = Lumos.startTrace("chat")
trace.input    = userMessage
trace.output   = aiResponse
trace.model    = "gpt-4o"
trace.tokensIn = promptTokens
trace.tokensOut = completionTokens
Lumos.endTrace(trace)`} />
          <Callout type="warning">Call <code>Lumos.init()</code> before any other Lumos method. Calling <code>startTrace</code> before <code>init</code> will throw an <code>UninitializedPropertyAccessException</code>.</Callout>
        </section>

        {/* Configuration */}
        <section id="configuration" style={{ marginBottom: 64 }}>
          <H2 id="configuration">Configuration</H2>
          <P>All configuration is done via the DSL block passed to <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00D4FF' }}>Lumos.init</code>:</P>
          <ParamTable rows={[
            { name: 'apiKey', type: 'String', required: true, description: 'API key from the portal (Apps → API Keys). Must start with lk_.' },
            { name: 'serverUrl', type: 'String', required: true, description: 'Base URL of your Lumos server, e.g. https://lumos.acme.com. No trailing slash.' },
            { name: 'debug', type: 'Boolean', required: false, description: 'When true, logs trace events to Logcat. Set to BuildConfig.DEBUG in production.' },
          ]} />
        </section>

        {/* API Reference */}
        <section id="api-reference" style={{ marginBottom: 64 }}>
          <H2 id="api-reference">API Reference</H2>

          <H3>Lumos.init(context, block)</H3>
          <P>Initialises the SDK. Must be called once in <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00D4FF' }}>Application.onCreate()</code> before any other Lumos call.</P>
          <ParamTable rows={[
            { name: 'context', type: 'Context', required: true, description: 'Application context.' },
            { name: 'block', type: 'LumosConfig.() -> Unit', required: true, description: 'Configuration DSL — set apiKey, serverUrl, debug.' },
          ]} />

          <H3>Lumos.startTrace(feature): Trace</H3>
          <P>Creates and returns a new <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00D4FF' }}>Trace</code> for one AI interaction.</P>
          <ParamTable rows={[
            { name: 'feature', type: 'String', required: true, description: 'Name of the AI feature, e.g. "chat", "summarizer". Shown in the portal.' },
          ]} />
          <CodeBlock code={`val trace = Lumos.startTrace("chat")`} />

          <H3>Trace properties</H3>
          <P>Set these on the returned Trace before calling <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00D4FF' }}>endTrace</code>:</P>
          <ParamTable rows={[
            { name: 'trace.input', type: 'String?', required: false, description: "The user's input text." },
            { name: 'trace.output', type: 'String?', required: false, description: "The AI's response text." },
            { name: 'trace.model', type: 'String?', required: false, description: 'Model identifier, e.g. "gpt-4o", "claude-3-5-sonnet".' },
            { name: 'trace.tokensIn', type: 'Int?', required: false, description: 'Prompt token count.' },
            { name: 'trace.tokensOut', type: 'Int?', required: false, description: 'Completion token count.' },
            { name: 'trace.status', type: 'TraceStatus', required: false, description: 'OK or ERROR. Defaults to OK.' },
          ]} />

          <H3>Trace.addSpan(name, block): Span</H3>
          <P>Times a sub-operation within a trace. The block is executed synchronously and the duration is recorded.</P>
          <CodeBlock code={`val span = trace.addSpan("llm-call") {
    // timed block
    callYourLLM(input)
}`} />

          <H3>Lumos.endTrace(trace)</H3>
          <P>Finalises the trace, queues it in Room, and schedules a background upload via WorkManager. Returns immediately — upload is asynchronous.</P>

          <H3>Lumos.feedback(traceId, feedback)</H3>
          <P>Records user feedback for a trace.</P>
          <CodeBlock code={`Lumos.feedback(trace.id, Feedback.ThumbsUp)
Lumos.feedback(trace.id, Feedback.ThumbsDown)`} />

          <H3>Lumos.flush()</H3>
          <P>Suspend function. Forces an immediate upload attempt of all queued events. Useful in tests or before the app exits.</P>
          <CodeBlock code={`lifecycleScope.launch {
    Lumos.flush()
}`} />

          <H3>Lumos.setListener(listener)</H3>
          <P>Attaches a <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00D4FF' }}>LumosListener</code> to receive upload success/failure callbacks.</P>
          <CodeBlock code={`Lumos.setListener(object : LumosListener {
    override fun onUploadSuccess(count: Int) { /* ... */ }
    override fun onUploadFailure(error: Throwable) { /* ... */ }
})`} />
        </section>

        {/* Server Endpoints */}
        <section id="server-endpoints" style={{ marginBottom: 64 }}>
          <H2 id="server-endpoints">Server Endpoints</H2>

          <H3>SDK Endpoints</H3>
          <P>These require the <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00D4FF' }}>X-Lumos-Key</code> header with a valid API key.</P>

          {[
            { method: 'POST', path: '/v0/events', description: 'Ingest a batch of trace/span/feedback events from the SDK.' },
            { method: 'GET',  path: '/v0/config',  description: 'Fetch remote SDK configuration for the app.' },
            { method: 'POST', path: '/v0/demo/chat', description: 'Chat proxy for the demo app via OpenRouter.' },
          ].map(e => (
            <div key={e.path} style={{ padding: '12px 16px', background: '#0B1628', borderRadius: 10, border: '1px solid #2E3D54', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <EndpointBadge method={e.method} />
              <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#E8F2FF', fontSize: 13, flex: 1 }}>{e.path}</code>
              <span style={{ fontSize: 12, color: '#6A7D9A' }}>{e.description}</span>
            </div>
          ))}

          <H3>Portal Endpoints</H3>
          <P>These require <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00D4FF' }}>Authorization: Bearer &lt;jwt&gt;</code>.</P>
          {[
            { method: 'POST',   path: '/api/auth/register',                        description: 'Create a new account.' },
            { method: 'POST',   path: '/api/auth/login',                           description: 'Authenticate and receive a JWT.' },
            { method: 'GET',    path: '/api/apps',                                 description: 'List all apps for the account.' },
            { method: 'POST',   path: '/api/apps',                                 description: 'Create a new app.' },
            { method: 'PATCH',  path: '/api/apps/:appId',                          description: 'Update app name, packageName, or debug flag.' },
            { method: 'DELETE', path: '/api/apps/:appId',                          description: 'Delete app and all its data.' },
            { method: 'GET',    path: '/api/apps/:appId/keys',                     description: 'List API keys for the app.' },
            { method: 'POST',   path: '/api/apps/:appId/keys',                     description: 'Create a new API key.' },
            { method: 'DELETE', path: '/api/apps/:appId/keys/:keyId',              description: 'Revoke an API key.' },
            { method: 'GET',    path: '/api/apps/:appId/traces',                   description: 'List traces with optional filters.' },
            { method: 'GET',    path: '/api/apps/:appId/traces/:traceId',          description: 'Get full trace detail including spans.' },
            { method: 'GET',    path: '/api/apps/:appId/stats',                    description: 'Aggregate KPI stats.' },
            { method: 'GET',    path: '/api/apps/:appId/stats/hourly',             description: 'Hourly call volume for the last 24h.' },
            { method: 'GET',    path: '/api/apps/:appId/sessions',                 description: 'List sessions grouped by sessionId.' },
            { method: 'GET',    path: '/api/apps/:appId/sessions/:sessionId/traces', description: 'Get traces for a single session in order.' },
            { method: 'GET',    path: '/api/account',                              description: 'Get current account info.' },
            { method: 'PATCH',  path: '/api/account',                              description: 'Update account name or email.' },
            { method: 'DELETE', path: '/api/account',                              description: 'Delete account and all its data.' },
          ].map(e => (
            <div key={e.path} style={{ padding: '10px 16px', background: '#0B1628', borderRadius: 10, border: '1px solid #2E3D54', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <EndpointBadge method={e.method} />
              <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#E8F2FF', fontSize: 12, flex: 1, minWidth: 220 }}>{e.path}</code>
              <span style={{ fontSize: 12, color: '#6A7D9A' }}>{e.description}</span>
            </div>
          ))}

          <H3>Example curl</H3>
          <CodeBlock code={`# Login
curl -X POST https://your-lumos-server.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"yourpassword"}'

# List sessions
curl https://your-lumos-server.com/api/apps/APP_ID/sessions \\
  -H "Authorization: Bearer YOUR_JWT"`} />
        </section>

        {/* Error Codes */}
        <section id="error-codes" style={{ marginBottom: 64 }}>
          <H2 id="error-codes">Error Codes</H2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Status', 'Meaning', 'Common cause', 'Fix'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #2E3D54', fontSize: 10, fontWeight: 700, color: '#6A7D9A', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { status: '400', meaning: 'Bad Request', cause: 'Missing required field in request body', fix: 'Check the request body matches the documented schema.' },
                { status: '401', meaning: 'Unauthorized', cause: 'Missing or invalid API key / JWT', fix: 'Verify the X-Lumos-Key or Authorization header is correct and not expired.' },
                { status: '403', meaning: 'Forbidden', cause: 'App does not belong to the authenticated account', fix: 'Ensure you are using the correct account JWT for this app.' },
                { status: '404', meaning: 'Not Found', cause: 'Resource ID does not exist', fix: 'Check that the appId, traceId, or keyId exists in the portal.' },
                { status: '409', meaning: 'Conflict', cause: 'Duplicate event ID on ingestion', fix: 'The event was already ingested. No action needed — this is handled idempotently.' },
                { status: '500', meaning: 'Server Error', cause: 'Unexpected failure in the server', fix: 'Check server logs. Ensure JWT_SECRET and OPENROUTER_API_KEY env vars are set.' },
              ].map(r => (
                <tr key={r.status} style={{ borderBottom: '1px solid rgba(46,61,84,0.4)' }}>
                  <td style={{ padding: '10px 12px' }}><code style={{ color: r.status.startsWith('4') || r.status.startsWith('5') ? '#FF4563' : '#00E887', fontFamily: "'JetBrains Mono', monospace" }}>{r.status}</code></td>
                  <td style={{ padding: '10px 12px', color: '#E8F2FF', fontWeight: 600 }}>{r.meaning}</td>
                  <td style={{ padding: '10px 12px', color: '#6A7D9A' }}>{r.cause}</td>
                  <td style={{ padding: '10px 12px', color: '#B8C8DE', lineHeight: 1.5 }}>{r.fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Examples */}
        <section id="examples" style={{ marginBottom: 64 }}>
          <H2 id="examples">Examples</H2>
          <H3>Full instrumented chat screen</H3>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {['Coroutines', 'Callback'].map((tab, i) => (
              <button key={tab} style={{
                padding: '6px 14px', borderRadius: '8px 8px 0 0', fontSize: 12, fontWeight: 600,
                background: i === 0 ? '#0B1628' : 'transparent',
                border: '1px solid #2E3D54', borderBottom: i === 0 ? '1px solid #0B1628' : '1px solid #2E3D54',
                color: i === 0 ? '#00D4FF' : '#6A7D9A', cursor: 'pointer',
              }}>
                {tab}
              </button>
            ))}
          </div>
          <CodeBlock code={`class ChatViewModel : ViewModel() {
    private var lastTrace: Trace? = null

    fun sendMessage(userInput: String, onResult: (String) -> Unit) {
        viewModelScope.launch {
            val trace = Lumos.startTrace("chat")
            trace.input = userInput

            val response = try {
                val span = trace.addSpan("llm-call") { callYourLLM(userInput) }
                trace.output    = span.result
                trace.model     = "gpt-4o-mini"
                trace.tokensIn  = span.promptTokens
                trace.tokensOut = span.completionTokens
                span.result
            } catch (e: Exception) {
                trace.status = TraceStatus.ERROR
                "Something went wrong"
            }

            Lumos.endTrace(trace)
            lastTrace = trace
            onResult(response)
        }
    }

    fun thumbsUp()   { lastTrace?.let { Lumos.feedback(it.id, Feedback.ThumbsUp) } }
    fun thumbsDown() { lastTrace?.let { Lumos.feedback(it.id, Feedback.ThumbsDown) } }
}`} />
          <Callout type="tip">Store the trace returned by <code>startTrace</code> so you can call <code>Lumos.feedback()</code> after the user reacts.</Callout>
        </section>

        {/* Changelog */}
        <section id="changelog" style={{ marginBottom: 64 }}>
          <H2 id="changelog">Changelog</H2>
          {[{
            version: 'v0.1.0',
            date: '2026-06-01',
            changes: [
              'Initial release',
              'Trace ingestion with nested span support',
              'Token and latency tracking',
              'User feedback (ThumbsUp / ThumbsDown)',
              'WorkManager-based offline-resilient upload queue',
              'Session tracking via auto-generated sessionId',
              'Device metadata capture (model, Android version, SDK/app version)',
            ],
          }].map(release => (
            <div key={release.version} style={{ ...{ background: '#0B1628', border: '1px solid #2E3D54', borderRadius: 12 }, padding: '20px 24px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#00D4FF', fontFamily: "'Clash Display', sans-serif" }}>{release.version}</span>
                <span style={{ fontSize: 12, color: '#6A7D9A', fontFamily: "'JetBrains Mono', monospace" }}>{release.date}</span>
              </div>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {release.changes.map(c => (
                  <li key={c} style={{ fontSize: 13, color: '#B8C8DE', lineHeight: 1.8 }}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

      </main>
    </div>
  );
}
