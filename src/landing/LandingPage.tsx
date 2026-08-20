import { useEffect, useState } from 'react';
import {
  Menu,
  X,
  Layers,
  Radio,
  Bell,
  ShieldAlert,
  MapPin,
  Users,
  Sliders,
  Mail,
  Check,
  QrCode,
  Globe
} from 'lucide-react';

interface LandingPageProps {
  onLaunchDashboard: (role?: 'authority' | 'citizen', tab?: string) => void;
}

type Severity = 'critical' | 'advisory' | 'info' | 'ok';

interface MapPinData {
  id: string;
  name: string;
  type: Severity;
  left: string;
  top: string;
  details: string;
  sentAgo: string;
  audience: string;
}

const SEV_MARK: Record<Severity, string> = {
  critical: 'sev-mark--critical',
  advisory: 'sev-mark--advisory',
  info: 'sev-mark--info',
  ok: 'sev-mark--ok'
};

const SEV_BADGE: Record<Severity, string> = {
  critical: 'badge--critical',
  advisory: 'badge--advisory',
  info: 'badge--info',
  ok: 'badge--safe'
};

const MAP_PINS: MapPinData[] = [
  {
    id: 'pin-1',
    name: 'Velachery Vijaya Nagar — Flood Watch',
    type: 'critical',
    left: '22%',
    top: '36%',
    details: 'Water depth 2.8ft near bus stand. Velachery Lake sluice overflow active.',
    sentAgo: '38s ago',
    audience: '42,000 at-risk population'
  },
  {
    id: 'pin-2',
    name: 'Guindy Railway Subway — Submerged',
    type: 'critical',
    left: '58%',
    top: '24%',
    details: 'Subway water depth 1.9m. 2 stalled vehicles. GST road detour in effect.',
    sentAgo: '5m ago',
    audience: '18,500 commuters'
  },
  {
    id: 'pin-3',
    name: 'Kotturpuram Riverbank — River Stage Warning',
    type: 'advisory',
    left: '76%',
    top: '44%',
    details: 'Adyar River discharge 1,450 m³/s. Estuarine backwater overlap detected.',
    sentAgo: '12m ago',
    audience: '24,600 residents'
  },
  {
    id: 'pin-4',
    name: 'Taramani 100ft Canal — Dewatering Operational',
    type: 'ok',
    left: '41%',
    top: '60%',
    details: '500HP high-capacity dewatering pump #1 deployed & discharging 120L/s.',
    sentAgo: '14m ago',
    audience: '10,000 residents'
  },
  {
    id: 'pin-5',
    name: 'NDRF Motorboat Fleet A — Rescue Active',
    type: 'critical',
    left: '16%',
    top: '68%',
    details: '4 motorboat units deployed to Vijaya Nagar. 480 citizens evacuated.',
    sentAgo: '22m ago',
    audience: 'Sector 4 rescue'
  },
  {
    id: 'pin-6',
    name: 'Velachery Relief Camp — Open',
    type: 'ok',
    left: '64%',
    top: '72%',
    details: 'Capacity 1,200 beds. 480 occupied. Medical unit & food supply active.',
    sentAgo: '31m ago',
    audience: 'Relief camp #1'
  }
];

interface TickerItem {
  code: string;
  type: Severity;
  title: string;
  detail: string;
  ago: string;
}

const TICKER_ITEMS: TickerItem[] = [
  {
    code: 'FLD-2015',
    type: 'critical',
    title: 'Chembarambakkam Discharge',
    detail: 'Adyar Basin 1,450 m³/s · 4 critical zones',
    ago: '2m ago'
  },
  {
    code: 'INC-0012',
    type: 'critical',
    title: 'Guindy Subway Submerged',
    detail: '1.9m depth · GST Road traffic detour',
    ago: '5m ago'
  },
  {
    code: 'EMG-0108',
    type: 'info',
    title: 'NDRF Boat Dispatch',
    detail: 'Velachery Vijaya Nagar · 480 rescued',
    ago: '12m ago'
  },
  {
    code: 'SAT-SAR1',
    type: 'info',
    title: 'Sentinel-1 Radar Ingest',
    detail: 'Copernicus SAR backscatter flood polygon updated',
    ago: '18m ago'
  },
  {
    code: 'PMP-0500',
    type: 'advisory',
    title: '500HP Dewatering Active',
    detail: 'Taramani 100ft Canal · 120L/s flow',
    ago: '24m ago'
  }
];

interface StatItem {
  index: string;
  value: string;
  label: string;
  note: string;
}

const STATS: StatItem[] = [
  {
    index: '01',
    value: '12,500+',
    label: 'residents reached per alert',
    note: 'median across active deployments'
  },
  {
    index: '02',
    value: '30s',
    label: 'incident to public alert',
    note: 'median publishing latency'
  },
  {
    index: '03',
    value: '0%',
    label: 'public signup required',
    note: 'anonymous by design, no tracking'
  },
  {
    index: '04',
    value: '94%',
    label: 'engagement rate',
    note: 'browser + push notification channel'
  }
];

const HERO_HIGHLIGHTS = [
  '100% anonymous public access',
  'Embeds in any website or social',
  'GIS plugin — no GIS team needed',
  'Unlimited mobile push alerts'
];

const DEMO_POINTS: Array<[string, string]> = [
  ['01', 'A jurisdiction mapped with real geographic geometry and boundaries.'],
  ['02', 'AI-assisted common alerting alerts generated and translated in seconds.'],
  ['03', 'A live geofenced alert broadcast pushed to a test mobile audience.'],
  ['04', 'An incident report validated, geolocated, and escalated under one command canvas.']
];

const ENGAGEMENT_BARS = ['42%', '51%', '38%', '62%', '54%', '71%', '64%', '78%', '94%'];

export default function LandingPage({ onLaunchDashboard }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredPin, setHoveredPin] = useState<MapPinData>(MAP_PINS[0]);
  const [activeStep, setActiveStep] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-paper font-sans text-ink selection:bg-ink selection:text-paper">

      {/* ═══ STICKY HEADER — transparent over the black hero, solid once scrolled ═══ */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled || mobileMenuOpen ? 'bg-ink' : 'bg-transparent'
        }`}
      >
        <div className="relative mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-12">

          {/* Wordmark */}
          <a href="#" className="text--subtitle3 select-none uppercase tracking-[-0.01em] text-paper">
            ResponSync
          </a>

          {/* Centre nav */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 lg:flex">
            <a href="#features" className="text--eyebrow text-paper/70 transition-colors hover:text-paper">
              Features
            </a>
            <a href="#whoweserve" className="text--eyebrow text-paper/70 transition-colors hover:text-paper">
              Who we serve
            </a>
            <a href="#demo" className="text--eyebrow text-paper/70 transition-colors hover:text-paper">
              Try for free
            </a>
          </nav>

          {/* Right cluster — portal text links plus one white pill */}
          <div className="flex items-center gap-5 sm:gap-7">
            <button
              onClick={() => onLaunchDashboard('authority', 'twin_map')}
              className="text--eyebrow hidden text-paper/70 transition-colors hover:text-paper sm:inline-block"
            >
              Govt Mode
            </button>

            <button
              onClick={() => onLaunchDashboard('citizen', 'twin_map')}
              className="text--eyebrow hidden text-paper/70 transition-colors hover:text-paper sm:inline-block"
            >
              Citizen Mode
            </button>

            <span className="hidden sm:block">
              <a href="#demo" className="cta cta--primary cta--light cta--compact">
                Book demo
              </a>
            </span>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-9 w-9 items-center justify-center text-paper lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <div
        className={`fixed inset-x-0 top-[72px] z-40 border-y border-shade-light-100 bg-ink px-5 py-6 transition-all duration-300 lg:hidden ${
          mobileMenuOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
      >
        <nav className="flex flex-col">
          <p className="text--eyebrow text-muted">Select portal mode</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => { setMobileMenuOpen(false); onLaunchDashboard('authority', 'twin_map'); }}
              className="cta cta--secondary cta--light cta--compact"
            >
              Govt Mode
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onLaunchDashboard('citizen', 'twin_map'); }}
              className="cta cta--secondary cta--light cta--compact"
            >
              Citizen Mode
            </button>
          </div>

          <a
            onClick={() => setMobileMenuOpen(false)}
            className="text--eyebrow mt-6 block border-t border-shade-light-100 py-4 text-paper"
            href="#features"
          >
            Features
          </a>
          <a
            onClick={() => setMobileMenuOpen(false)}
            className="text--eyebrow block border-t border-shade-light-100 py-4 text-paper"
            href="#whoweserve"
          >
            Who we serve
          </a>
          <a
            onClick={() => setMobileMenuOpen(false)}
            className="text--eyebrow block border-t border-shade-light-100 py-4 text-paper"
            href="#demo"
          >
            Try for free
          </a>
        </nav>
      </div>

      <main>

        {/* ═══ HERO — black band ═══════════════════════════════════════════ */}
        <section className="relative z-0 bg-ink text-paper">
          <div className="mx-auto grid max-w-[1320px] items-center gap-16 px-5 pb-24 pt-[136px] sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-20 lg:px-12 lg:pb-32 lg:pt-[168px]">

            {/* Left copy */}
            <div className="animate-reveal flex flex-col items-start text-left">

              <p className="text--eyebrow text-muted">
                AI Digital Twin · Predictive Response
              </p>

              <h1 className="text--title3 mt-7 text-paper">
                Predictive disaster intelligence for command teams.
              </h1>

              <p className="text--body mt-8 max-w-xl text-paper/70">
                ResponSync combines real-time weather radar, Open-Meteo flood discharge telemetry,
                Sentinel-1 SAR satellite feeds, and citizen SOS calls into an explainable 3-Agent AI
                decision engine for South Chennai disaster command.
              </p>

              {/* Portal launchers */}
              <div className="mt-12 w-full max-w-xl">
                <p className="text--eyebrow text-muted">Select operational portal to launch</p>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Government portal */}
                  <button
                    onClick={() => onLaunchDashboard('authority', 'twin_map')}
                    className="panel lift flex h-full cursor-pointer flex-col justify-between p-6 text-left"
                  >
                    <span className="block">
                      <span className="badge badge--advisory">Govt Mode</span>
                      <span className="text--subtitle3 mt-5 block text-ink">Government Command HQ</span>
                      <span className="text--footnote mt-2 block text-subtle">
                        Full access: AI Agent orchestrator, dispatch engine, flood simulations &amp; analytics.
                      </span>
                    </span>
                    <span className="mt-7 flex items-center justify-between border-t border-line pt-4">
                      <span className="text--eyebrow text-muted">Command OS</span>
                      <span className="cta cta--tertiary text-ink">
                        Launch<span className="cta__arrow">→</span>
                      </span>
                    </span>
                  </button>

                  {/* Citizen portal */}
                  <button
                    onClick={() => onLaunchDashboard('citizen', 'twin_map')}
                    className="panel lift flex h-full cursor-pointer flex-col justify-between p-6 text-left"
                  >
                    <span className="block">
                      <span className="badge badge--quiet">Citizen Mode</span>
                      <span className="text--subtitle3 mt-5 block text-ink">Citizen Public Portal</span>
                      <span className="text--footnote mt-2 block text-subtle">
                        Public view: Interactive flood map, shelter availability &amp; community SOS reports.
                      </span>
                    </span>
                    <span className="mt-7 flex items-center justify-between border-t border-line pt-4">
                      <span className="text--eyebrow text-muted">Public map</span>
                      <span className="cta cta--tertiary text-ink">
                        Launch<span className="cta__arrow">→</span>
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Highlights */}
              <ul className="mt-14 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
                {HERO_HIGHLIGHTS.map((item) => (
                  <li key={item} className="text--body flex items-center gap-3 text-paper/75">
                    <Check className="h-4 w-4 shrink-0 text-paper" strokeWidth={1.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — map preview */}
            <div className="relative">
              <div className="relative w-full overflow-hidden rounded-[4px] border border-shade-light-100 bg-near">

                {/* Chrome bar */}
                <div className="flex items-center justify-between border-b border-shade-light-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full border border-paper/25"></span>
                    <span className="h-2 w-2 rounded-full border border-paper/25"></span>
                    <span className="h-2 w-2 rounded-full border border-paper/25"></span>
                  </div>
                  <div className="text--footnote text-muted">
                    responsync.ai / command / chennai-corridor
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="animate-pulse-mono h-1.5 w-1.5 rounded-full bg-paper"></span>
                    <span className="text--eyebrow text-paper/70">Live</span>
                  </div>
                </div>

                {/* Canvas */}
                <div className="relative h-[340px] overflow-hidden bg-ink sm:h-[440px]">

                  {/* Hairline grid */}
                  <div
                    className="absolute inset-0 opacity-40"
                    aria-hidden="true"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
                      backgroundSize: '48px 48px'
                    }}
                  ></div>

                  {/* Landmass, river and risk-zone geometry */}
                  <svg viewBox="0 0 600 700" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <pattern id="risk-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="8" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="2.5"></line>
                      </pattern>
                    </defs>
                    <path
                      d="M 40 220 C 90 180, 160 170, 220 200 S 360 230, 460 180 S 580 220, 590 320 S 540 480, 460 510 S 290 580, 230 560 S 80 540, 50 460 Z"
                      fill="#ffffff"
                      fillOpacity="0.03"
                      stroke="#ffffff"
                      strokeOpacity="0.14"
                      strokeWidth="1"
                    ></path>
                    <path
                      d="M 80 280 C 180 320, 280 290, 360 350 S 520 370, 580 420"
                      fill="none"
                      stroke="#ffffff"
                      strokeOpacity="0.22"
                      strokeWidth="6"
                      strokeLinecap="round"
                    ></path>
                    <path
                      d="M 70 510 C 150 460, 240 470, 320 430 S 460 410, 540 360"
                      fill="none"
                      stroke="#ffffff"
                      strokeOpacity="0.18"
                      strokeWidth="2"
                      strokeDasharray="3 6"
                      strokeLinecap="round"
                    ></path>
                    <path
                      d="M 110 320 C 180 300, 240 320, 280 360 S 320 460, 240 470 S 130 440, 110 380 Z"
                      fill="url(#risk-hatch)"
                      stroke="#ffffff"
                      strokeOpacity="0.35"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    ></path>
                  </svg>

                  {/* Pins — white chip, black ring, sev-mark inside */}
                  {MAP_PINS.map((pin) => {
                    const isHovered = hoveredPin.id === pin.id;
                    return (
                      <span
                        key={pin.id}
                        className="map-micro-pin absolute z-20 select-none"
                        style={{ left: pin.left, top: pin.top, transform: 'translate(-50%, -50%)' }}
                        onMouseEnter={() => setHoveredPin(pin)}
                      >
                        <span
                          className={`grid h-5 w-5 place-items-center rounded-full bg-paper ring-1 ring-ink transition-transform duration-300 ${
                            isHovered ? 'scale-125' : ''
                          }`}
                        >
                          <span className={`sev-mark sev-mark--round ${SEV_MARK[pin.type]}`}></span>
                        </span>
                      </span>
                    );
                  })}

                  {/* Detail panel */}
                  <div className="absolute bottom-4 left-4 right-4 z-30 sm:right-auto sm:max-w-[300px]">
                    <div className="panel p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`badge ${SEV_BADGE[hoveredPin.type]}`}>
                          {hoveredPin.type}
                        </span>
                        <span className="text--footnote tabular-nums text-muted">{hoveredPin.sentAgo}</span>
                      </div>
                      <p className="text--body-medium mt-3 text-ink">{hoveredPin.name}</p>
                      <p className="text--footnote mt-2 text-subtle">{hoveredPin.details}</p>
                      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                        <span className="text--footnote flex items-center gap-2 text-subtle">
                          <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                          {hoveredPin.audience}
                        </span>
                        <span className="text--eyebrow text-muted">Active view</span>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="panel absolute right-4 top-4 z-30 hidden select-none flex-col gap-2 px-3 py-2.5 sm:flex">
                    <span className="text--footnote flex items-center gap-2 text-subtle">
                      <span className="sev-mark sev-mark--critical"></span>
                      Critical
                    </span>
                    <span className="text--footnote flex items-center gap-2 text-subtle">
                      <span className="sev-mark sev-mark--advisory"></span>
                      Advisory
                    </span>
                    <span className="text--footnote flex items-center gap-2 text-subtle">
                      <span className="sev-mark sev-mark--info"></span>
                      Info
                    </span>
                    <span className="text--footnote flex items-center gap-2 text-subtle">
                      <span className="sev-mark sev-mark--ok"></span>
                      Safe / open
                    </span>
                  </div>
                </div>
              </div>

              {/* Engagement overlay */}
              <div className="panel absolute -bottom-8 -right-6 z-30 hidden max-w-[220px] select-none p-5 md:block">
                <div className="flex items-center justify-between gap-4">
                  <span className="text--eyebrow text-muted">Engagement</span>
                  <span className="text--footnote tabular-nums text-ink">▲ 12.4%</span>
                </div>
                <p className="text--subtitle1 mt-3 tabular-nums text-ink">
                  94<span className="text--body text-muted">%</span>
                </p>
                <p className="text--footnote mt-1 text-subtle">residents reached · 30 days</p>
                <div className="mt-4 flex h-8 select-none items-end gap-1">
                  {ENGAGEMENT_BARS.map((height, i) => (
                    <span key={i} className="block w-full bg-wash-strong" style={{ height }}></span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ LIVE TICKER — white strip, hairline rules, layered under the nav ═══ */}
        <section className="relative z-0 overflow-hidden border-y border-line bg-paper py-4">
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-paper to-transparent md:left-[164px]"></div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-paper to-transparent"></div>

          <div className="absolute inset-y-0 left-0 z-20 hidden items-center border-r border-line bg-paper pl-5 pr-6 md:flex">
            <span className="text--eyebrow flex items-center gap-2 text-muted">
              <span className="animate-pulse-mono h-1.5 w-1.5 rounded-full bg-ink"></span>
              Live feed
            </span>
          </div>

          <div className="animate-marquee relative flex w-max select-none items-center pl-6 md:pl-44">
            {[0, 1].map((group) => (
              <span key={group} className="flex items-center">
                {TICKER_ITEMS.map((item) => (
                  <span key={`${group}-${item.code}`} className="mx-7 inline-flex items-center gap-3 whitespace-nowrap">
                    <span className={`sev-mark sev-mark--round ${SEV_MARK[item.type]}`}></span>
                    <span className="text--footnote tabular-nums text-muted">{item.code}</span>
                    <span className="text--body-medium text-ink">{item.title}</span>
                    <span className="text--footnote text-line">·</span>
                    <span className="text--footnote text-subtle">{item.detail}</span>
                    <span className="text--footnote text-line">·</span>
                    <span className="text--footnote tabular-nums text-muted">{item.ago}</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </section>

        {/* ═══ CORE METRICS ════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <p className="text--eyebrow text-muted">
            AI Assisted Common Alerting Protocol (CAP) Compliant Alerts
          </p>
          <h2 className="text--subtitle1 mt-6 max-w-4xl text-ink">
            Create AI-assisted alerts with instant translation, severity classification, and
            geofencing aligned with international best-practice early warning systems.
          </h2>

          <div className="mt-16 grid grid-cols-1 border-t border-line pt-12 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.index}
                className="border-line py-6 sm:border-l sm:px-8 sm:py-0 sm:first:border-l-0 sm:first:pl-0 lg:border-l lg:first:border-l-0"
              >
                <p className="text--eyebrow text-muted">{stat.index}</p>
                <p className="text--subtitle1 mt-8 tabular-nums text-ink">{stat.value}</p>
                <p className="text--eyebrow mt-5 text-ink">{stat.label}</p>
                <p className="text--footnote mt-2 text-muted">{stat.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ THREE-STEP FLOW ═════════════════════════════════════════════ */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.2fr] lg:items-end">
              <div>
                <p className="text--eyebrow text-muted">Get started in 10 minutes</p>
                <h2 className="text--subtitle1 mt-6 text-ink">
                  From setup to your live public alert map in three steps.
                </h2>
              </div>
              <p className="text--body max-w-xl text-subtle">
                We configure the platform to match your operational structure, ensuring the community
                sees a live map relevant to their location—on any device, with no app install, account
                sign up, or learning curve.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {/* Step 1 */}
              <article
                className={`h-full cursor-pointer rounded-[4px] border p-7 transition-colors ${
                  activeStep === 0 ? 'border-ink bg-wash' : 'lift border-line bg-paper'
                }`}
                onClick={() => setActiveStep(0)}
              >
                <p className="text--eyebrow text-muted">Step 01</p>
                <h3 className="text--subtitle2 mt-6 text-ink">We set up your map</h3>
                <p className="text--footnote mt-3 text-subtle">
                  Your map is configured for your jurisdiction with custom branding and direct links to
                  your website—reinforcing trust and recognition with your audience.
                </p>
                <div className="mt-8 aspect-[16/10] overflow-hidden rounded-[4px] border border-line bg-paper p-4">
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-line pb-3">
                      <span className="text--eyebrow text-ink">Jurisdiction configuration</span>
                      <span className="sev-mark sev-mark--ok sev-mark--round"></span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="h-2 w-2/3 bg-wash-strong"></div>
                      <div className="h-2 w-full bg-wash"></div>
                      <div className="h-2 w-5/6 bg-wash"></div>
                    </div>
                    <div className="text--eyebrow text-right text-muted">Active geofence</div>
                  </div>
                </div>
              </article>

              {/* Step 2 */}
              <article
                className={`h-full cursor-pointer rounded-[4px] border p-7 transition-colors ${
                  activeStep === 1 ? 'border-ink bg-wash' : 'lift border-line bg-paper'
                }`}
                onClick={() => setActiveStep(1)}
              >
                <p className="text--eyebrow text-muted">Step 02</p>
                <h3 className="text--subtitle2 mt-6 text-ink">Create First-to-Know groups</h3>
                <p className="text--footnote mt-3 text-subtle">
                  Define the audiences that matter—City Wards, Towns, Municipalities, any group that
                  should be the &ldquo;First to Know&rdquo;—then send the same alert to all or some, instantly.
                </p>
                <div className="mt-8 aspect-[16/10] overflow-hidden rounded-[4px] border border-line bg-paper p-4">
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-line pb-3">
                      <span className="text--eyebrow text-ink">Audience clusters</span>
                      <span className="text--footnote tabular-nums text-muted">n=12</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between border-b border-line pb-2">
                        <span className="text--footnote text-ink">Sector A (North)</span>
                        <span className="text--footnote tabular-nums text-subtle">6.4k reached</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text--footnote text-subtle">Sector B (Central)</span>
                        <span className="text--footnote tabular-nums text-muted">4.1k reached</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              {/* Step 3 */}
              <article
                className={`h-full cursor-pointer rounded-[4px] border p-7 transition-colors ${
                  activeStep === 2 ? 'border-ink bg-wash' : 'lift border-line bg-paper'
                }`}
                onClick={() => setActiveStep(2)}
              >
                <p className="text--eyebrow text-muted">Step 03</p>
                <h3 className="text--subtitle2 mt-6 text-ink">Post alerts Everywhere</h3>
                <p className="text--footnote mt-3 text-subtle">
                  Publish a pin, a polygon, or a layer. The map updates everywhere it&rsquo;s embedded—your
                  website, your socials, public QR posters—at once.
                </p>
                <div className="mt-8 aspect-[16/10] overflow-hidden rounded-[4px] border border-line bg-paper p-4">
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex items-center gap-2 border-b border-line pb-3">
                      <span className="sev-mark sev-mark--critical sev-mark--round"></span>
                      <span className="text--eyebrow text-ink">Broadcast trigger active</span>
                    </div>
                    <div className="flex items-stretch gap-2">
                      <div className="flex w-1/3 flex-col items-center gap-1.5 border border-line py-2">
                        <Globe className="h-4 w-4 text-ink" strokeWidth={1.5} />
                        <span className="text--eyebrow text-muted">Website</span>
                      </div>
                      <div className="flex w-1/3 flex-col items-center gap-1.5 border border-line py-2">
                        <QrCode className="h-4 w-4 text-ink" strokeWidth={1.5} />
                        <span className="text--eyebrow text-muted">Poster</span>
                      </div>
                      <div className="flex w-1/3 flex-col items-center gap-1.5 border border-line py-2">
                        <Bell className="h-4 w-4 text-ink" strokeWidth={1.5} />
                        <span className="text--eyebrow text-muted">Push ping</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ═══ FEATURES ════════════════════════════════════════════════════ */}
        <section id="features" className="border-t border-line">
          <div className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.2fr] lg:items-end">
              <div>
                <p className="text--eyebrow text-muted">The platform</p>
                <h2 className="text--subtitle1 mt-6 text-ink">
                  Everything you need to Warn and Inform.
                </h2>
              </div>
              <p className="text--body max-w-xl text-subtle">
                Multi-hazard alerting tools augment SMS and existing systems, closing communication
                gaps with one unified GIS platform.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-6">

              {/* Alert & Incident Map */}
              <div className="panel lift flex flex-col justify-between p-8 lg:col-span-3 lg:row-span-2">
                <div>
                  <div className="flex items-center justify-between">
                    <Layers className="h-5 w-5 text-ink" strokeWidth={1.5} />
                    <span className="text--eyebrow text-muted">alert · incident · map</span>
                  </div>
                  <h3 className="text--subtitle2 mt-8 text-ink">Alert &amp; Incident Map</h3>
                  <p className="text--body mt-3 max-w-md text-subtle">
                    A configurable GIS canvas authorized teams use to publish location-pinned warnings
                    and incidents—embeddable in any website with a simple code snippet.
                  </p>
                </div>

                <div className="mt-10 aspect-[16/10] overflow-hidden rounded-[4px] border border-line bg-wash p-4">
                  <div className="flex h-full flex-col justify-between border border-dashed border-line p-4">
                    <div className="flex items-center justify-between">
                      <span className="text--eyebrow text-muted">Map preview layer</span>
                      <span className="text--eyebrow flex items-center gap-2 text-subtle">
                        <span className="sev-mark sev-mark--ok"></span>
                        OK
                      </span>
                    </div>
                    <div className="my-auto flex h-16 w-full items-center justify-center border border-line bg-paper">
                      <MapPin className="h-6 w-6 text-ink" strokeWidth={1.5} />
                    </div>
                    <div className="flex select-none gap-2">
                      <span className="badge badge--quiet">Base vector</span>
                      <span className="badge badge--quiet">Geofence active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Geofence Alerts */}
              <div className="panel lift flex flex-col justify-between p-8 lg:col-span-3">
                <div>
                  <div className="flex items-center justify-between">
                    <Radio className="h-5 w-5 text-ink" strokeWidth={1.5} />
                    <span className="text--eyebrow text-muted">geofence · alerts</span>
                  </div>
                  <h3 className="text--subtitle2 mt-8 text-ink">Geofence Alerts</h3>
                  <p className="text--body mt-3 text-subtle">
                    Trigger localized alerts the moment someone enters or approaches a defined
                    zone—relevant to where the user actually is, not where they live.
                  </p>
                </div>
                <ul className="mt-8 grid gap-3 border-t border-line pt-5">
                  <li className="text--footnote flex items-center gap-3 text-subtle">
                    <span className="sev-mark sev-mark--info"></span>
                    Draw zones at any scale, from a building to a region
                  </li>
                  <li className="text--footnote flex items-center gap-3 text-subtle">
                    <span className="sev-mark sev-mark--info"></span>
                    Proximity-aware delivery to nearby mobile devices
                  </li>
                </ul>
              </div>

              {/* First to Know Groups */}
              <div className="panel lift flex flex-col justify-between p-8 lg:col-span-2">
                <div>
                  <div className="flex items-center justify-between">
                    <Bell className="h-5 w-5 text-ink" strokeWidth={1.5} />
                    <span className="text--eyebrow text-muted">first · to · know</span>
                  </div>
                  <h3 className="text--subtitle2 mt-8 text-ink">First to Know Groups</h3>
                  <p className="text--footnote mt-3 text-subtle">
                    Create First to Know groups for neighborhoods, school districts, workplaces, and
                    local hubs. Joined anonymously with one tap.
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
                  <span className="text--eyebrow text-muted">No account needed</span>
                  <span className="text--eyebrow text-ink">PII free</span>
                </div>
              </div>

              {/* Event Layers */}
              <div className="panel lift flex flex-col justify-between p-8 lg:col-span-2">
                <div>
                  <div className="flex items-center justify-between">
                    <Sliders className="h-5 w-5 text-ink" strokeWidth={1.5} />
                    <span className="text--eyebrow text-muted">event · layers</span>
                  </div>
                  <h3 className="text--subtitle2 mt-8 text-ink">Event Layers</h3>
                  <p className="text--footnote mt-3 text-subtle">
                    Custom GIS overlays that track an unfolding event—flood lines, road closures,
                    wildfire fronts—updated by your team in real time.
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
                  <span className="text--eyebrow text-muted">Real-time map updates</span>
                  <span className="text--eyebrow text-ink">Live sync</span>
                </div>
              </div>

              {/* Geo Surveys */}
              <div className="panel lift flex flex-col justify-between p-8 lg:col-span-2">
                <div>
                  <div className="flex items-center justify-between">
                    <QrCode className="h-5 w-5 text-ink" strokeWidth={1.5} />
                    <span className="text--eyebrow text-muted">geo · surveys</span>
                  </div>
                  <h3 className="text--subtitle2 mt-8 text-ink">Geo Surveys</h3>
                  <p className="text--footnote mt-3 text-subtle">
                    Anonymous, location-tagged polls that turn community feedback into heat maps of
                    sentiment, resource requirements, and damage reports.
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
                  <span className="text--eyebrow text-muted">Anonymous pinning</span>
                  <span className="text--eyebrow text-ink">Heatmaps</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ WHO WE SERVE ════════════════════════════════════════════════ */}
        <section id="whoweserve" className="border-t border-line">
          <div className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.2fr] lg:items-end">
              <div>
                <p className="text--eyebrow text-muted">Who we serve</p>
                <h2 className="text--subtitle1 mt-6 text-ink">
                  Built for the agencies people turn to first.
                </h2>
              </div>
              <p className="text--body max-w-xl text-subtle">
                Public safety teams across government, civic, and utility services run ResponSync as
                their first-to-know channel—because your community shouldn&rsquo;t need an app, an account,
                or understand English to stay safe.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-12">

              <div className="panel lift select-none p-7 lg:col-span-7">
                <div className="flex items-center justify-between border-b border-line pb-5">
                  <span className="text--eyebrow text-muted">Sector · 01</span>
                  <Globe className="h-4 w-4 text-ink" strokeWidth={1.5} />
                </div>
                <h3 className="text--subtitle2 mt-7 text-ink">Governments</h3>
                <p className="text--footnote mt-3 text-subtle">
                  Equip state and national disaster management agencies with a secure geofenced
                  warnings fabric—operable from central command rooms or deployed at localized levels.
                </p>
              </div>

              <div className="panel lift select-none p-7 lg:col-span-5">
                <div className="flex items-center justify-between border-b border-line pb-5">
                  <span className="text--eyebrow text-muted">Sector · 02</span>
                  <MapPin className="h-4 w-4 text-ink" strokeWidth={1.5} />
                </div>
                <h3 className="text--subtitle2 mt-7 text-ink">Cities &amp; Towns</h3>
                <p className="text--footnote mt-3 text-subtle">
                  Provide local city warnings with dynamic translations and feedback pins. Embed our
                  live map directly on municipal website homepages.
                </p>
              </div>

              <div className="panel lift select-none p-7 lg:col-span-4">
                <div className="flex items-center justify-between border-b border-line pb-5">
                  <span className="text--eyebrow text-muted">Sector · 03</span>
                  <ShieldAlert className="h-4 w-4 text-ink" strokeWidth={1.5} />
                </div>
                <h3 className="text--subtitle2 mt-7 text-ink">Law Enforcement</h3>
                <p className="text--footnote mt-3 text-subtle">
                  Instantly map suspect reports, missing person alerts, or active safety incidents,
                  allowing anonymous public tip-back channels.
                </p>
              </div>

              <div className="panel lift select-none p-7 lg:col-span-4">
                <div className="flex items-center justify-between border-b border-line pb-5">
                  <span className="text--eyebrow text-muted">Sector · 04</span>
                  <Sliders className="h-4 w-4 text-ink" strokeWidth={1.5} />
                </div>
                <h3 className="text--subtitle2 mt-7 text-ink">Emergency Management</h3>
                <p className="text--footnote mt-3 text-subtle">
                  Maintain peacetime citizen connections alongside SMS and sirens with geofenced alerts
                  and post-event disaster recovery maps.
                </p>
              </div>

              <div className="panel lift select-none p-7 lg:col-span-4">
                <div className="flex items-center justify-between border-b border-line pb-5">
                  <span className="text--eyebrow text-muted">Sector · 05</span>
                  <Sliders className="h-4 w-4 text-ink" strokeWidth={1.5} />
                </div>
                <h3 className="text--subtitle2 mt-7 text-ink">Utilities &amp; Power</h3>
                <p className="text--footnote mt-3 text-subtle">
                  Communicate electrical grid outages, water main breaks, or gas leaks with clear
                  polygon boundaries and dynamic restoration timelines.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CLOSING CTA — black band ════════════════════════════════════ */}
        <section id="demo" className="bg-ink text-paper">
          <div className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
            <div className="grid gap-16 lg:grid-cols-[1.3fr_1fr] lg:items-center">
              <div className="text-left">
                <p className="text--eyebrow text-muted">Standby</p>
                <h2 className="text--title4 mt-7 text-paper">
                  Be the trusted channel people go to first.
                </h2>
                <p className="text--body mt-8 max-w-lg text-paper/70">
                  Set up your localized safety map in under ten minutes. Book a 30-minute demonstration
                  with our GIS public safety architects.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <button
                    onClick={() => onLaunchDashboard('authority', 'twin_map')}
                    className="cta cta--primary cta--light"
                  >
                    Govt Mode<span className="cta__arrow">→</span>
                  </button>
                  <button
                    onClick={() => onLaunchDashboard('citizen', 'twin_map')}
                    className="cta cta--secondary cta--light"
                  >
                    Citizen Mode<span className="cta__arrow">→</span>
                  </button>
                </div>
              </div>

              <div className="border border-shade-light-100 p-8">
                <p className="text--eyebrow text-muted">What you&rsquo;ll see in the demo</p>
                <ul className="mt-7">
                  {DEMO_POINTS.map(([num, copy]) => (
                    <li key={num} className="flex items-start gap-5 border-t border-shade-light-100 py-4">
                      <span className="text--eyebrow shrink-0 pt-1 text-muted">{num}</span>
                      <span className="text--body text-paper/80">{copy}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ FOOTER — black ══════════════════════════════════════════════ */}
      <footer className="border-t border-shade-light-100 bg-ink text-paper/70">
        <div className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 lg:px-12">

          <div className="grid gap-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div className="flex flex-col items-start text-left">
              <p className="text--eyebrow text-muted">Get the platform</p>
              <h3 className="text--subtitle2 mt-5 text-paper">
                Ensure your community is the first to know.
              </h3>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => onLaunchDashboard('authority', 'twin_map')}
                  className="cta cta--primary cta--light cta--compact"
                >
                  Govt Mode
                </button>
                <button
                  onClick={() => onLaunchDashboard('citizen', 'twin_map')}
                  className="cta cta--secondary cta--light cta--compact"
                >
                  Citizen Mode
                </button>
              </div>

              <a
                href="mailto:contact@responsync.ai"
                className="text--body mt-10 inline-flex items-center gap-2 text-paper/70 transition-colors hover:text-paper"
              >
                <Mail className="h-4 w-4" strokeWidth={1.5} />
                contact@responsync.ai
              </a>
            </div>

            <div className="text-left">
              <h4 className="text--eyebrow text-paper">Sitemap</h4>
              <ul className="mt-6 space-y-3">
                <li><a className="text--body text-paper/60 transition-colors hover:text-paper" href="#">Home</a></li>
                <li><a className="text--body text-paper/60 transition-colors hover:text-paper" href="#features">Features</a></li>
                <li><a className="text--body text-paper/60 transition-colors hover:text-paper" href="#whoweserve">Who we serve</a></li>
                <li><a className="text--body text-paper/60 transition-colors hover:text-paper" href="#demo">Request demo</a></li>
              </ul>
            </div>

            <div className="text-left">
              <h4 className="text--eyebrow text-paper">Product</h4>
              <ul className="mt-6 space-y-3">
                <li><a className="text--body text-paper/60 transition-colors hover:text-paper" href="#">Partnerships</a></li>
                <li><a className="text--body text-paper/60 transition-colors hover:text-paper" href="#">Disaster Dashboard</a></li>
                <li><a className="text--body text-paper/60 transition-colors hover:text-paper" href="#">Partner Programme</a></li>
                <li><a className="text--body text-paper/60 transition-colors hover:text-paper" href="#">Command OS API</a></li>
              </ul>
            </div>

            <div className="text-left">
              <h4 className="text--eyebrow text-paper">Legal</h4>
              <ul className="mt-6 space-y-3">
                <li><a className="text--body text-paper/60 transition-colors hover:text-paper" href="#">Terms &amp; Conditions</a></li>
                <li><a className="text--body text-paper/60 transition-colors hover:text-paper" href="#">Privacy Policy</a></li>
                <li><a className="text--body text-paper/60 transition-colors hover:text-paper" href="#">Data Processing (GDPR)</a></li>
              </ul>
            </div>
          </div>

          {/* Wordmark */}
          <div className="mt-24 select-none">
            <p aria-hidden="true" className="text-left text-[13vw] font-light uppercase leading-none tracking-[-0.05em] text-paper/10">
              responsync
            </p>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-shade-light-100 pt-8 sm:flex-row sm:items-center">
            <span className="text--footnote text-muted">
              © {new Date().getFullYear()} ResponSync. All rights reserved.
            </span>
            <div className="flex flex-wrap items-center gap-6">
              <span className="text--eyebrow flex items-center gap-2 text-paper/60">
                <span className="sev-mark sev-mark--ok sev-mark--round"></span>
                All systems operational
              </span>
              <a className="text--footnote text-muted transition-colors hover:text-paper" href="#">Terms</a>
              <a className="text--footnote text-muted transition-colors hover:text-paper" href="#">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
