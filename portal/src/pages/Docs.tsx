import { useEffect, useState } from 'react';
import { Copy as CopyIcon, Check as CheckIcon, ArrowLeft } from 'lucide-react';

// ─── Nav structure ────────────────────────────────────────────────────────────

type NavChild = { id: string; label: string };
type NavItem  = { id: string; label: string; children?: NavChild[] };

const NAV: NavItem[] = [
  { id: 'overview',     label: 'Overview' },
  { id: 'installation', label: 'Installation' },
  { id: 'get-started',  label: 'Get Started' },
  { id: 'configuration',label: 'Configuration' },
  {
    id: 'api-reference', label: 'API Reference',
    children: [
      { id: 'api-init',        label: 'init()' },
      { id: 'api-start-trace', label: 'startTrace()' },
      { id: 'api-trace-props', label: 'Trace Properties' },
      { id: 'api-add-span',    label: 'addSpan()' },
      { id: 'api-end-trace',   label: 'endTrace()' },
      { id: 'api-feedback',    label: 'feedback()' },
      { id: 'api-flush',       label: 'flush()' },
      { id: 'api-listener',    label: 'setListener()' },
    ],
  },
  {
    id: 'server-endpoints', label: 'Server Endpoints',
    children: [
      { id: 'sdk-endpoints',    label: 'SDK Endpoints' },
      { id: 'portal-endpoints', label: 'Portal Endpoints' },
      { id: 'curl-examples',    label: 'cURL Examples' },
    ],
  },
  { id: 'error-codes', label: 'Error Codes' },
  { id: 'examples',    label: 'Examples' },
  { id: 'changelog',   label: 'Changelog' },
];

const ALL_IDS = NAV.flatMap(item =>
  item.children ? [item.id, ...item.children.map(c => c.id)] : [item.id]
);

// ─── Shared primitives ────────────────────────────────────────────────────────

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement('textarea');
      el.value = code;
      el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      try { document.execCommand('copy'); } catch { /* silent */ }
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ position: 'relative', marginBottom: 20 }}>
      <pre style={{
        background: '#070D1C', color: '#E8F2FF',
        borderRadius: 10, padding: '16px 20px', paddingRight: 90,
        fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
        overflowX: 'auto', lineHeight: 1.7,
        border: '1px solid #1A2C44', margin: 0,
      }}>
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        style={{
          position: 'absolute', top: 8, right: 8,
          background: copied ? 'rgba(0,232,135,0.12)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${copied ? 'rgba(0,232,135,0.4)' : '#2E3D54'}`,
          color: copied ? '#00E887' : '#8A9AB8',
          borderRadius: 6, padding: '4px 10px', fontSize: 11,
          cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
          transition: 'all 200ms ease', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function Callout({ type, children }: { type: 'tip' | 'warning' | 'danger'; children: React.ReactNode }) {
  const p = {
    tip:     { color: 'var(--color-cyan)',  bg: 'rgba(var(--color-cyan-rgb),0.06)',  label: 'TIP' },
    warning: { color: 'var(--color-amber)', bg: 'rgba(var(--color-amber-rgb),0.06)', label: 'WARNING' },
    danger:  { color: 'var(--color-red)',   bg: 'rgba(var(--color-red-rgb),0.06)',   label: 'DANGER' },
  }[type];
  return (
    <div style={{
      borderLeft: `3px solid ${p.color}`,
      background: p.bg,
      borderRadius: '0 8px 8px 0', padding: '12px 16px', marginBottom: 20,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: p.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>
        {p.label}
      </span>
      <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.65, marginTop: 4 }}>{children}</div>
    </div>
  );
}

function ParamTable({ rows }: { rows: { name: string; type: string; required: boolean; description: string }[] }) {
  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 20 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--color-card2)' }}>
            {['Parameter', 'Type', 'Required', 'Description'].map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '10px 14px',
                borderBottom: '1px solid var(--color-border)',
                fontSize: 10, fontWeight: 700, color: 'var(--color-muted)',
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name} style={{
              background: i % 2 === 0 ? 'transparent' : 'var(--color-card2)',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <td style={{ padding: '10px 14px' }}>
                <code style={{ color: 'var(--color-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>{r.name}</code>
              </td>
              <td style={{ padding: '10px 14px' }}>
                <code style={{ color: 'var(--color-purple)', fontFamily: "'JetBrains Mono', monospace" }}>{r.type}</code>
              </td>
              <td style={{ padding: '10px 14px' }}>
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 20,
                  background: r.required ? 'rgba(var(--color-green-rgb),0.1)' : 'rgba(var(--color-border-rgb),0.15)',
                  color: r.required ? 'var(--color-green)' : 'var(--color-muted)',
                  border: `1px solid ${r.required ? 'rgba(var(--color-green-rgb),0.3)' : 'var(--color-border)'}`,
                }}>
                  {r.required ? 'Required' : 'Optional'}
                </span>
              </td>
              <td style={{ padding: '10px 14px', color: 'var(--color-text)', lineHeight: 1.55, opacity: 0.8 }}>{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EndpointBadge({ method }: { method: string }) {
  const themes: Record<string, { color: string; bg: string; border: string }> = {
    GET:    { color: 'var(--color-cyan)',   bg: 'rgba(var(--color-cyan-rgb),0.1)',   border: 'rgba(var(--color-cyan-rgb),0.3)'   },
    POST:   { color: 'var(--color-green)',  bg: 'rgba(var(--color-green-rgb),0.1)',  border: 'rgba(var(--color-green-rgb),0.3)'  },
    PATCH:  { color: 'var(--color-amber)',  bg: 'rgba(var(--color-amber-rgb),0.1)',  border: 'rgba(var(--color-amber-rgb),0.3)'  },
    DELETE: { color: 'var(--color-red)',    bg: 'rgba(var(--color-red-rgb),0.1)',    border: 'rgba(var(--color-red-rgb),0.3)'    },
  };
  const t = themes[method] ?? { color: 'var(--color-muted)', bg: 'transparent', border: 'var(--color-border)' };
  return (
    <span style={{
      background: t.bg, border: `1px solid ${t.border}`,
      color: t.color, borderRadius: 6, padding: '2px 8px',
      fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
      flexShrink: 0,
    }}>{method}</span>
  );
}

function EndpointRow({ method, path, description }: { method: string; path: string; description: string }) {
  return (
    <div style={{
      padding: '10px 14px',
      background: 'var(--color-card)', borderRadius: 9,
      border: '1px solid var(--color-border)', marginBottom: 7,
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    }}>
      <EndpointBadge method={method} />
      <code style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-text)', fontSize: 12, flex: 1, minWidth: 200 }}>
        {path}
      </code>
      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{description}</span>
    </div>
  );
}

function SectionH2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} style={{
      fontSize: 24, fontWeight: 700, color: 'var(--color-text)',
      marginBottom: 16, marginTop: 0,
      letterSpacing: '-0.02em',
      fontFamily: "'Clash Display', sans-serif",
      paddingTop: 40,
      borderTop: '1px solid var(--color-border)',
    }}>
      {children}
    </h2>
  );
}

function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 10, marginTop: 28, scrollMarginTop: 24 }}>
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.75, marginBottom: 16 }}>{children}</p>;
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-cyan)', fontSize: '0.88em', background: 'rgba(var(--color-cyan-rgb),0.08)', padding: '1px 5px', borderRadius: 4 }}>
      {children}
    </code>
  );
}

// ─── Pipeline diagram ─────────────────────────────────────────────────────────

function Pipeline() {
  const steps = [
    { label: 'Your App',      sub: 'Kotlin / Compose', color: '#7B5FFF' },
    { label: 'Room Queue',    sub: 'SQLite buffer',     color: '#00D4FF' },
    { label: 'WorkManager',   sub: 'Background jobs',  color: '#00E887' },
    { label: 'Lumos Server',  sub: 'Ktor + SQLite',    color: '#FFB800' },
    { label: 'Portal',        sub: 'React dashboard',  color: '#FF6B6B' },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      borderRadius: 14, overflow: 'hidden',
      border: '1px solid var(--color-border)',
      background: 'var(--color-card)',
    }}>
      {steps.map((step, i) => (
        <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div style={{
            flex: 1, padding: '20px 8px', textAlign: 'center',
            background: `${step.color}09`,
            borderRight: i < steps.length - 1 ? '1px solid var(--color-border)' : 'none',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: step.color,
              margin: '0 auto 8px',
              boxShadow: `0 0 8px ${step.color}80`,
            }} />
            <div style={{
              fontSize: 12, fontWeight: 700, color: step.color,
              fontFamily: "'JetBrains Mono', monospace", marginBottom: 4,
            }}>
              {step.label}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>
              {step.sub}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: 0, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none"
                style={{ position: 'absolute', left: -8, zIndex: 1, background: 'var(--color-card)', padding: '0 2px' }}>
                <path d="M0 5 H10 M6 1 L12 5 L6 9" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'api-reference':    true,
    'server-endpoints': true,
  });

  // Scroll-spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    );
    ALL_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Auto-expand parent when child becomes active
  useEffect(() => {
    NAV.forEach(item => {
      if (item.children?.some(c => c.id === activeSection)) {
        setExpanded(prev => ({ ...prev, [item.id]: true }));
      }
    });
  }, [activeSection]);

  function toggleSection(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function isParentActive(item: NavItem) {
    return activeSection === item.id || (item.children?.some(c => c.id === activeSection) ?? false);
  }

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 24;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, width: 248, height: '100vh',
        background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/lumos-icon.png" width={30} height={30} alt="Lumos" style={{ borderRadius: 7 }} />
            <span style={{
              fontSize: 17, fontWeight: 700, fontFamily: "'Clash Display', sans-serif",
              background: 'linear-gradient(135deg, var(--color-cyan), var(--color-purple))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              LumosSDK
            </span>
          </a>
        </div>

        {/* Nav items */}
        <div style={{ padding: '14px 12px', flex: 1 }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-muted)', padding: '0 8px', marginBottom: 10, opacity: 0.6 }}>
            Documentation
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {NAV.map(item => {
              const isActive   = activeSection === item.id;
              const parentHit  = isParentActive(item);
              const isOpen     = expanded[item.id] ?? false;

              return (
                <div key={item.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <a
                      href={`#${item.id}`}
                      onClick={e => { e.preventDefault(); scrollTo(item.id); if (item.children) toggleSection(item.id); }}
                      style={{
                        flex: 1, display: 'block',
                        padding: '7px 10px',
                        paddingLeft: isActive ? 8 : 10,
                        borderRadius: 7,
                        fontSize: 13, fontWeight: parentHit ? 600 : 400,
                        color: parentHit ? 'var(--color-cyan)' : 'var(--color-muted)',
                        background: isActive ? 'rgba(var(--color-cyan-rgb),0.07)' : 'transparent',
                        borderLeft: `2px solid ${isActive ? 'var(--color-cyan)' : 'transparent'}`,
                        textDecoration: 'none', transition: 'all 180ms ease',
                      }}
                    >
                      {item.label}
                    </a>
                    {item.children && (
                      <button
                        onClick={() => toggleSection(item.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: parentHit ? 'var(--color-cyan)' : 'var(--color-muted)',
                          padding: '4px 6px', fontSize: 9, lineHeight: 1,
                          transition: 'transform 200ms ease',
                          transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                          flexShrink: 0, opacity: 0.7,
                        }}
                      >
                        ▾
                      </button>
                    )}
                  </div>

                  {/* Sub-items */}
                  {item.children && isOpen && (
                    <div style={{
                      marginLeft: 18, marginBottom: 4,
                      borderLeft: '1px solid var(--color-border)', paddingLeft: 12,
                    }}>
                      {item.children.map(child => {
                        const childActive = activeSection === child.id;
                        return (
                          <a
                            key={child.id}
                            href={`#${child.id}`}
                            onClick={e => { e.preventDefault(); scrollTo(child.id); }}
                            style={{
                              display: 'block', padding: '5px 8px', borderRadius: 6,
                              fontSize: 12, fontWeight: childActive ? 600 : 400,
                              color: childActive ? 'var(--color-cyan)' : 'var(--color-muted)',
                              background: childActive ? 'rgba(var(--color-cyan-rgb),0.06)' : 'transparent',
                              textDecoration: 'none', transition: 'all 150ms ease',
                            }}
                          >
                            {child.label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Nav footer */}
        <div style={{ borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
          <a
            href="/"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 20px',
              fontSize: 13, color: 'var(--color-muted)',
              textDecoration: 'none', transition: 'color 180ms ease',
              borderBottom: '1px solid var(--color-border)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-cyan)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
          >
            <ArrowLeft size={14} />
            Back to Portal
          </a>
          <div style={{ padding: '10px 20px' }}>
            <span style={{
              display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 8px',
              borderRadius: 20, background: 'rgba(var(--color-cyan-rgb),0.08)',
              color: 'var(--color-muted)', border: '1px solid rgba(var(--color-cyan-rgb),0.2)',
            }}>v0.1.0</span>
          </div>
        </div>
      </nav>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main style={{ marginLeft: 248, flex: 1, display: 'flex', justifyContent: 'center', padding: '0 32px' }}>
        <div style={{ maxWidth: 760, width: '100%', padding: '56px 0 100px' }}>

          {/* ── OVERVIEW ──────────────────────────────────────────────── */}
          <section id="overview" style={{ marginBottom: 72 }}>
            <div style={{ textAlign: 'center', paddingBottom: 44 }}>
              <div style={{
                display: 'inline-block',
                background: 'rgba(var(--color-cyan-rgb),0.07)', border: '1px solid rgba(var(--color-cyan-rgb),0.2)',
                borderRadius: 20, padding: '4px 14px', fontSize: 11, color: 'var(--color-cyan)',
                fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace", marginBottom: 22,
              }}>
                Android Observability SDK
              </div>
              <h1 style={{
                fontSize: 48, fontWeight: 800, color: 'var(--color-text)',
                margin: '0 0 22px', letterSpacing: '-0.03em', lineHeight: 1.1,
                fontFamily: "'Clash Display', sans-serif",
              }}>
                Overview
              </h1>
              <p style={{
                fontSize: 17, color: 'var(--color-muted)', lineHeight: 1.8,
                maxWidth: 580, margin: '0 auto',
              }}>
                LumosSDK is an Android observability SDK for AI-powered apps. It automatically traces every
                AI conversation — capturing inputs, outputs, tokens, latency, and user feedback — and ships
                the data to a self-hosted Lumos server. The web portal visualizes trends, errors, and user
                satisfaction over time.
              </p>
            </div>
            <Pipeline />
          </section>

          {/* ── INSTALLATION ──────────────────────────────────────────── */}
          <section id="installation" style={{ marginBottom: 64 }}>
            <SectionH2 id="installation">Installation</SectionH2>
            <P>Add the SDK to your app's Gradle dependencies:</P>
            <CodeBlock code={`// build.gradle.kts (app module)
dependencies {
    implementation("com.lumos:lumos-android:0.1.0")
}`} />
            <P>Add the required permission to your <Mono>AndroidManifest.xml</Mono>:</P>
            <CodeBlock code={`<uses-permission android:name="android.permission.INTERNET" />`} />
            <Callout type="tip">
              The SDK uses WorkManager for background uploads. WorkManager is included transitively — no additional dependency required.
            </Callout>
          </section>

          {/* ── GET STARTED ───────────────────────────────────────────── */}
          <section id="get-started" style={{ marginBottom: 64 }}>
            <SectionH2 id="get-started">Get Started</SectionH2>
            <P>Initialise the SDK in your <Mono>Application.onCreate()</Mono>:</P>
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
trace.input     = userMessage
trace.output    = aiResponse
trace.model     = "gpt-4o"
trace.tokensIn  = promptTokens
trace.tokensOut = completionTokens
Lumos.endTrace(trace)`} />
            <Callout type="warning">
              Call <Mono>Lumos.init()</Mono> before any other Lumos method. Calling <Mono>startTrace</Mono> before <Mono>init</Mono> will throw an <Mono>UninitializedPropertyAccessException</Mono>.
            </Callout>
          </section>

          {/* ── CONFIGURATION ─────────────────────────────────────────── */}
          <section id="configuration" style={{ marginBottom: 64 }}>
            <SectionH2 id="configuration">Configuration</SectionH2>
            <P>All configuration is done via the DSL block passed to <Mono>Lumos.init</Mono>:</P>
            <ParamTable rows={[
              { name: 'apiKey',     type: 'String',  required: true,  description: 'API key from the portal (Apps → API Keys). Must start with lk_.' },
              { name: 'serverUrl',  type: 'String',  required: true,  description: 'Base URL of your Lumos server, e.g. https://lumos.acme.com. No trailing slash.' },
              { name: 'debug',      type: 'Boolean', required: false, description: 'When true, logs trace events to Logcat. Set to BuildConfig.DEBUG in production.' },
            ]} />
          </section>

          {/* ── API REFERENCE ─────────────────────────────────────────── */}
          <section id="api-reference" style={{ marginBottom: 64 }}>
            <SectionH2 id="api-reference">API Reference</SectionH2>
            <P>Complete reference for all public Lumos SDK methods.</P>

            <H3 id="api-init">Lumos.init(context, block)</H3>
            <P>Initialises the SDK. Must be called once in <Mono>Application.onCreate()</Mono> before any other Lumos call.</P>
            <ParamTable rows={[
              { name: 'context', type: 'Context',              required: true, description: 'Application context.' },
              { name: 'block',   type: 'LumosConfig.() -> Unit', required: true, description: 'Configuration DSL — set apiKey, serverUrl, debug.' },
            ]} />

            <H3 id="api-start-trace">Lumos.startTrace(feature): Trace</H3>
            <P>Creates and returns a new <Mono>Trace</Mono> for one AI interaction.</P>
            <ParamTable rows={[
              { name: 'feature', type: 'String', required: true, description: 'Name of the AI feature, e.g. "chat", "summarizer". Shown in the portal.' },
            ]} />
            <CodeBlock code={`val trace = Lumos.startTrace("chat")`} />

            <H3 id="api-trace-props">Trace Properties</H3>
            <P>Set these on the returned <Mono>Trace</Mono> before calling <Mono>endTrace</Mono>:</P>
            <ParamTable rows={[
              { name: 'trace.input',     type: 'String?',     required: false, description: "The user's input text." },
              { name: 'trace.output',    type: 'String?',     required: false, description: "The AI's response text." },
              { name: 'trace.model',     type: 'String?',     required: false, description: 'Model identifier, e.g. "gpt-4o", "claude-3-5-sonnet".' },
              { name: 'trace.tokensIn',  type: 'Int?',        required: false, description: 'Prompt token count.' },
              { name: 'trace.tokensOut', type: 'Int?',        required: false, description: 'Completion token count.' },
              { name: 'trace.status',    type: 'TraceStatus', required: false, description: 'OK or ERROR. Defaults to OK.' },
            ]} />

            <H3 id="api-add-span">Trace.addSpan(name, block): Span</H3>
            <P>Times a sub-operation within a trace. The block is executed synchronously and the duration is recorded.</P>
            <CodeBlock code={`val span = trace.addSpan("llm-call") {
    // timed block — return value becomes span.result
    callYourLLM(input)
}`} />

            <H3 id="api-end-trace">Lumos.endTrace(trace)</H3>
            <P>Finalises the trace, queues it in Room, and schedules a background upload via WorkManager. Returns immediately — upload is asynchronous.</P>

            <H3 id="api-feedback">Lumos.feedback(traceId, feedback)</H3>
            <P>Records user feedback for a trace. Call after <Mono>endTrace</Mono>.</P>
            <CodeBlock code={`Lumos.feedback(trace.id, Feedback.ThumbsUp)
Lumos.feedback(trace.id, Feedback.ThumbsDown)`} />

            <H3 id="api-flush">Lumos.flush()</H3>
            <P>Suspend function. Forces an immediate upload attempt of all queued events. Useful in tests or before the app exits.</P>
            <CodeBlock code={`lifecycleScope.launch {
    Lumos.flush()
}`} />

            <H3 id="api-listener">Lumos.setListener(listener)</H3>
            <P>Attaches a <Mono>LumosListener</Mono> to receive upload success/failure callbacks.</P>
            <CodeBlock code={`Lumos.setListener(object : LumosListener {
    override fun onUploadSuccess(count: Int) { /* ... */ }
    override fun onUploadFailure(error: Throwable) { /* ... */ }
})`} />
          </section>

          {/* ── SERVER ENDPOINTS ──────────────────────────────────────── */}
          <section id="server-endpoints" style={{ marginBottom: 64 }}>
            <SectionH2 id="server-endpoints">Server Endpoints</SectionH2>

            <H3 id="sdk-endpoints">SDK Endpoints</H3>
            <P>These require the <Mono>X-Lumos-Key</Mono> header with a valid API key.</P>
            {[
              { method: 'POST', path: '/v0/events',    description: 'Ingest a batch of trace/span/feedback events from the SDK.' },
              { method: 'GET',  path: '/v0/config',    description: 'Fetch remote SDK configuration for the app.' },
              { method: 'POST', path: '/v0/demo/chat', description: 'Chat proxy for the demo app via OpenRouter.' },
            ].map(e => <EndpointRow key={`${e.method}-${e.path}`} {...e} />)}

            <H3 id="portal-endpoints">Portal Endpoints</H3>
            <P>These require <Mono>Authorization: Bearer &lt;jwt&gt;</Mono>.</P>
            {[
              { method: 'POST',   path: '/api/auth/register',                          description: 'Create a new account.' },
              { method: 'POST',   path: '/api/auth/login',                             description: 'Authenticate and receive a JWT.' },
              { method: 'GET',    path: '/api/apps',                                   description: 'List all apps for the account.' },
              { method: 'POST',   path: '/api/apps',                                   description: 'Create a new app.' },
              { method: 'PATCH',  path: '/api/apps/:appId',                            description: 'Update app name, packageName, or debug flag.' },
              { method: 'DELETE', path: '/api/apps/:appId',                            description: 'Delete app and all its data.' },
              { method: 'GET',    path: '/api/apps/:appId/keys',                       description: 'List API keys for the app.' },
              { method: 'POST',   path: '/api/apps/:appId/keys',                       description: 'Create a new API key.' },
              { method: 'DELETE', path: '/api/apps/:appId/keys/:keyId',                description: 'Revoke an API key.' },
              { method: 'GET',    path: '/api/apps/:appId/traces',                     description: 'List traces with optional filters.' },
              { method: 'GET',    path: '/api/apps/:appId/traces/:traceId',            description: 'Get full trace detail including spans.' },
              { method: 'GET',    path: '/api/apps/:appId/stats',                      description: 'Aggregate KPI stats.' },
              { method: 'GET',    path: '/api/apps/:appId/stats/hourly',               description: 'Hourly call volume for the last 24h.' },
              { method: 'GET',    path: '/api/apps/:appId/sessions',                   description: 'List sessions grouped by sessionId.' },
              { method: 'GET',    path: '/api/apps/:appId/sessions/:sessionId/traces', description: 'Get traces for a single session in order.' },
              { method: 'GET',    path: '/api/account',                                description: 'Get current account info.' },
              { method: 'PATCH',  path: '/api/account',                                description: 'Update account name or email.' },
              { method: 'DELETE', path: '/api/account',                                description: 'Delete account and all its data.' },
            ].map(e => <EndpointRow key={`${e.method}-${e.path}`} {...e} />)}

            <H3 id="curl-examples">cURL Examples</H3>
            <CodeBlock code={`# Login
curl -X POST https://your-lumos-server.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"yourpassword"}'

# List sessions
curl https://your-lumos-server.com/api/apps/APP_ID/sessions \\
  -H "Authorization: Bearer YOUR_JWT"`} />
          </section>

          {/* ── ERROR CODES ───────────────────────────────────────────── */}
          <section id="error-codes" style={{ marginBottom: 64 }}>
            <SectionH2 id="error-codes">Error Codes</SectionH2>
            <div style={{ borderRadius: 10, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--color-card2)' }}>
                    {['Status', 'Meaning', 'Common Cause', 'Fix'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '10px 14px',
                        borderBottom: '1px solid var(--color-border)',
                        fontSize: 10, fontWeight: 700, color: 'var(--color-muted)',
                        fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { status: '400', meaning: 'Bad Request',   cause: 'Missing or malformed request field',        fix: 'Check the request body matches the documented schema.' },
                    { status: '401', meaning: 'Unauthorized',  cause: 'Missing or invalid API key / JWT',          fix: 'Verify the X-Lumos-Key or Authorization header is correct and not expired.' },
                    { status: '403', meaning: 'Forbidden',     cause: 'App does not belong to the account',        fix: 'Ensure you are using the correct account JWT for this app.' },
                    { status: '404', meaning: 'Not Found',     cause: 'Resource ID does not exist',                fix: 'Check that the appId, traceId, or keyId exists in the portal.' },
                    { status: '409', meaning: 'Conflict',      cause: 'Duplicate event ID on ingestion',           fix: 'The event was already ingested — handled idempotently, no action needed.' },
                    { status: '500', meaning: 'Server Error',  cause: 'Unexpected failure',                        fix: 'Check server logs. Ensure JWT_SECRET and OPENROUTER_API_KEY env vars are set.' },
                  ].map((r, i) => (
                    <tr key={r.status} style={{
                      background: i % 2 === 0 ? 'transparent' : 'var(--color-card2)',
                      borderBottom: '1px solid var(--color-border)',
                    }}>
                      <td style={{ padding: '10px 14px' }}>
                        <code style={{ color: 'var(--color-red)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{r.status}</code>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-text)', fontWeight: 600 }}>{r.meaning}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-muted)' }}>{r.cause}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-text)', lineHeight: 1.55, opacity: 0.8 }}>{r.fix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── EXAMPLES ──────────────────────────────────────────────── */}
          <section id="examples" style={{ marginBottom: 64 }}>
            <SectionH2 id="examples">Examples</SectionH2>

            <H3>Full instrumented chat screen</H3>
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
            <Callout type="tip">
              Store the trace returned by <Mono>startTrace</Mono> so you can call <Mono>Lumos.feedback()</Mono> after the user reacts.
            </Callout>

            <H3>Testing with flush()</H3>
            <P>Use <Mono>flush()</Mono> in instrumentation tests to block until the SDK has uploaded all queued events before asserting server state.</P>
            <CodeBlock code={`@Test
fun tracesAreSentToServer() = runTest {
    Lumos.init(context) {
        apiKey    = "lk_test_key"
        serverUrl = "http://localhost:8080"
    }

    val trace = Lumos.startTrace("test-feature")
    trace.input  = "Hello"
    trace.output = "World"
    Lumos.endTrace(trace)

    Lumos.flush() // blocks until upload completes

    // now assert your server received the event
}`} />
          </section>

          {/* ── CHANGELOG ─────────────────────────────────────────────── */}
          <section id="changelog" style={{ marginBottom: 64 }}>
            <SectionH2 id="changelog">Changelog</SectionH2>
            {[{
              version: 'v0.1.0',
              date:    '2026-06-01',
              tag:     'Initial Release',
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
              <div key={release.version} style={{
                background: 'var(--color-card)', border: '1px solid var(--color-border)',
                borderRadius: 12, padding: '20px 24px', marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-cyan)', fontFamily: "'Clash Display', sans-serif" }}>
                    {release.version}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {release.date}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
                    background: 'rgba(var(--color-green-rgb),0.1)', color: 'var(--color-green)',
                    border: '1px solid rgba(var(--color-green-rgb),0.25)',
                  }}>
                    {release.tag}
                  </span>
                </div>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {release.changes.map(c => (
                    <li key={c} style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.9 }}>{c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

        </div>
      </main>
    </div>
  );
}
