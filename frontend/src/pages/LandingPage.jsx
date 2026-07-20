import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, ClipboardList, Truck, Cog, Package, BarChart3, Lock,
  Leaf, Users, Target, Mail, Phone, PlayCircle, Home, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * LandingPage — public marketing page, ported 1:1 from the supplied
 * "Graamam Connect - Landing (minimal).html" hand-off build. Only the
 * color tokens and fonts are mapped onto the app's existing Modern
 * Humanist Tailwind tokens; structure/copy/order are unchanged.
 *
 * Color token map (per hand-off comments):
 *   --teal  -> primary        --cream -> cream-surface   --charcoal -> on-surface
 *   --olive -> olive-success  --clay  -> clay-brown       --teal2    -> secondary
 *   --gold (#DDA444) has no matching token -> literal text-[#DDA444]/bg-[#DDA444].
 *   Raleway -> font-headline, Nunito Sans -> font-body (already loaded globally).
 */

const FEATURES = [
  { Icon: ClipboardList, title: "Orders — B2B & B2C", body: "Multi-item orders, live totals, and per-line discounting for both channels." },
  { Icon: Truck, title: "Warehouse & Dispatch", body: "A stock-check gate before anything ships, plus an auto-generated GST invoice." },
  { Icon: Cog, title: "Production", body: "Starting a run draws down real raw-material inventory, recipe by recipe." },
  { Icon: Package, title: "Inventory & Add Stock", body: "A live inventory view, plus a quick top-up tool to restock materials directly." },
  { Icon: BarChart3, title: "Accounts, Reports & Master Data", body: "Receivables/payables, analytics, and the product, vendor and customer records." },
  { Icon: Lock, title: "Secure, role-based access", body: "Every account signs in to exactly the workspace their role needs — nothing more." },
];

const VALUES = [
  { Icon: Leaf, accent: "border-t-olive-success", iconColor: "text-olive-success", title: "Planet Positive", body: "What we make — and its by-products — doesn't harm air, water, or soil." },
  { Icon: Users, accent: "border-t-secondary", iconColor: "text-secondary", title: "People Positive", body: "Interdependent, resilient communities working toward a shared goal." },
  { Icon: Target, accent: "border-t-[#DDA444]", iconColor: "text-[#DDA444]", title: "Purpose Before and Beyond Profit", body: "Evolving in ways that nourish local ecosystems, led by the communities themselves." },
];

function Eyebrow({ children }) {
  return <span className="font-body font-extrabold text-[12px] tracking-[0.14em] uppercase text-primary">{children}</span>;
}

function BrandMark() {
  return (
    <span className="relative inline-block w-[26px] h-[26px] rounded-full border-[3px] border-primary shrink-0">
      <span className="absolute w-[7px] h-[7px] bg-primary rounded-full" style={{ top: 7, left: 6 }} />
    </span>
  );
}

function BtnPrimary({ href, onClick, className = "", children, small, ...rest }) {
  return (
    <a
      href={href || "#"}
      onClick={onClick}
      className={[
        "group inline-flex items-center gap-2 rounded-full font-body font-extrabold cursor-pointer",
        "bg-primary text-white shadow-[0_14px_28px_-14px_rgba(30,106,114,0.55)]",
        "hover:bg-[#17565c] hover:-translate-y-0.5 transition-all duration-150",
        small ? "px-[18px] py-[9px] text-[13px]" : "px-6 py-[13px] text-[14.5px]",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
      <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-[3px]" />
    </a>
  );
}

function BtnGhost({ href, children }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full font-body font-extrabold text-[14.5px] px-6 py-[13px] border-[1.6px] border-primary text-primary bg-transparent hover:bg-primary/[0.07] hover:-translate-y-0.5 transition-all duration-150"
    >
      {children}
    </a>
  );
}

function FeatureCard({ Icon, title, body }) {
  return (
    <div className="bg-cream-surface border border-on-surface/[0.12] rounded-[14px] p-[22px_20px] transition-all duration-150 hover:-translate-y-1 hover:shadow-[0_20px_38px_-22px_rgba(29,29,27,0.28)]">
      <div className="w-11 h-11 rounded-[11px] bg-primary/[0.09] flex items-center justify-center mb-3.5 text-primary">
        <Icon className="w-[22px] h-[22px]" strokeWidth={1.7} />
      </div>
      <h4 className="font-headline font-extrabold text-[15px] mb-1 text-on-surface">{title}</h4>
      <p className="text-[13px] leading-relaxed text-on-surface/60">{body}</p>
    </div>
  );
}

function ValueCard({ Icon, accent, iconColor, title, body }) {
  return (
    <div className={`bg-white rounded-[14px] p-[22px_20px] border-t-4 ${accent} shadow-[0_14px_28px_-20px_rgba(29,29,27,0.2)]`}>
      <h4 className="font-headline font-extrabold text-[15px] mb-[7px] flex items-center gap-2 text-on-surface">
        <Icon className={`w-[18px] h-[18px] ${iconColor}`} strokeWidth={1.7} />
        {title}
      </h4>
      <p className="text-[13px] text-on-surface/60">{body}</p>
    </div>
  );
}

function ContactItem({ Icon, label, href, value, gold }) {
  return (
    <div className="flex-1 min-w-[220px] flex items-center gap-[13px] bg-[#faf7ee] border border-on-surface/[0.12] rounded-xl px-[17px] py-[15px] text-left">
      <div className={["w-[42px] h-[42px] rounded-[11px] flex items-center justify-center shrink-0", gold ? "bg-[#DDA444]/[0.16] text-[#DDA444]" : "bg-primary/[0.09] text-primary"].join(" ")}>
        <Icon className="w-[21px] h-[21px]" strokeWidth={1.7} />
      </div>
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.05em] text-on-surface/40">{label}</div>
        <a href={href} className="text-[14px] font-bold text-primary">{value}</a>
      </div>
    </div>
  );
}

function TriageChoice({ Icon, title, body, go, alt, onClick, href }) {
  return (
    <a
      href={href || "#"}
      onClick={onClick}
      className={[
        "flex-1 min-w-[240px] block bg-white border-[1.5px] border-on-surface/[0.12] rounded-2xl p-[22px_20px] cursor-pointer transition-all duration-150",
        "hover:-translate-y-1 hover:shadow-[0_22px_44px_-22px_rgba(29,29,27,0.3)]",
        alt ? "hover:border-[#DDA444]" : "hover:border-primary",
      ].join(" ")}
    >
      <div className={["w-[46px] h-[46px] rounded-xl flex items-center justify-center mb-3.5", alt ? "bg-[#DDA444]/[0.16] text-[#DDA444]" : "bg-primary/[0.09] text-primary"].join(" ")}>
        <Icon className="w-6 h-6" strokeWidth={1.7} />
      </div>
      <h4 className="font-headline font-extrabold text-[16px] mb-1.5 text-on-surface">{title}</h4>
      <p className="text-[12.5px] leading-relaxed mb-[13px] text-on-surface/60">{body}</p>
      <span className={["text-[13px] font-extrabold", alt ? "text-clay-brown" : "text-primary"].join(" ")}>{go}</span>
    </a>
  );
}

export default function LandingPage() {
  const [triageOpen, setTriageOpen] = React.useState(false);
  const { guestLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = ""; };
  }, []);

  useEffect(() => {
    document.body.style.overflow = triageOpen ? "hidden" : "";
    if (!triageOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setTriageOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [triageOpen]);

  const openTriage = (e) => { e?.preventDefault(); setTriageOpen(true); };
  const closeTriage = () => setTriageOpen(false);
  const gotoStart = (e) => {
    e?.preventDefault();
    closeTriage();
    document.getElementById("get-started")?.scrollIntoView({ behavior: "smooth" });
  };
  const enterApp = (e) => {
    e?.preventDefault();
    closeTriage();
    guestLogin();
    navigate("/dashboard");
  };

  return (
    <div className="font-body text-on-surface bg-cream-surface leading-[1.6]" data-testid="landing-page">
      {/* NAV */}
      <nav id="nav" className="sticky top-0 z-50 bg-cream-surface/[0.92] backdrop-blur-[6px] border-b border-on-surface/[0.12]">
        <div className="max-w-[1120px] mx-auto px-8 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-headline font-extrabold text-[17px]">
            <BrandMark />
            Graamam <b className="text-primary">Connect</b>
          </div>
          <div className="hidden md:flex gap-7">
            <a href="#features" className="text-[13.5px] font-bold text-on-surface/60 hover:text-primary">Features</a>
            <a href="#about" className="text-[13.5px] font-bold text-on-surface/60 hover:text-primary">About</a>
            <a href="#get-started" className="text-[13.5px] font-bold text-on-surface/60 hover:text-primary">Get started</a>
          </div>
          <BtnPrimary small onClick={openTriage} data-testid="nav-try-it-now">Try it now</BtnPrimary>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero" className="pt-14 pb-[84px] scroll-mt-20">
        <div className="max-w-[1120px] mx-auto px-8">
          <Eyebrow>Protovillage Livelihood Systems</Eyebrow>
          <h1 className="font-headline font-extrabold text-[52px] leading-[1.18] tracking-[-0.02em] mt-3.5 mb-3.5">
            An ERP built for<br /><span className="text-primary">rural FPOs.</span>
          </h1>
          <p className="text-[18px] font-semibold text-on-surface/60 max-w-[600px] mb-6">
            From order to dispatch, one connected system — replacing spreadsheets and WhatsApp threads with a coordinated pipeline built for how an FPO actually operates.
          </p>
          <div className="bg-white border-[1.5px] border-primary border-l-[6px] border-l-primary rounded-xl px-[22px] py-[18px] max-w-[680px] mb-[26px] shadow-[0_14px_30px_-20px_rgba(29,29,27,0.22)]">
            <p className="text-[14px] font-bold leading-[1.55] text-on-surface">
              Built exclusively for FPOs (Farmer Producer Organizations) and organisations working with{" "}
              <a className="text-primary font-extrabold border-b-[1.5px] border-primary/[0.35] hover:border-primary" href="https://www.graamam.in/" target="_blank" rel="noopener noreferrer">Graamam</a>
              {" "}— for rural villages. Not a generic, off-the-shelf ERP.
            </p>
          </div>
          <div className="flex gap-3.5 flex-wrap">
            <BtnPrimary onClick={openTriage} data-testid="hero-try-it-now">Try it now</BtnPrimary>
            <BtnGhost href="#features">See features</BtnGhost>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-white py-[84px] scroll-mt-20">
        <div className="max-w-[1120px] mx-auto px-8">
          <div className="mb-[34px]">
            <Eyebrow>{"What's running today"}</Eyebrow>
            <h2 className="font-headline font-extrabold text-[32px] mt-2 text-on-surface">Everything to run day-to-day operations.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
            {FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-[84px] scroll-mt-20">
        <div className="max-w-[1120px] mx-auto px-8">
          <Eyebrow>The initiative behind the platform</Eyebrow>
          <h2 className="font-headline font-extrabold text-[30px] my-2.5 mb-[18px] text-on-surface">Handmade Happiness.</h2>
          <p className="text-[16px] text-on-surface max-w-[680px] leading-[1.7] mb-3.5">
            <a className="text-primary font-extrabold border-b-[1.5px] border-primary/[0.35] hover:border-primary" href="https://www.graamam.in/" target="_blank" rel="noopener noreferrer">Graamam</a>
            ® — short for <i>GRAAMeena Aarthika Mandali</i> (Rural Economic Zone) — is an initiative of ProtoVillage: a bioregional rural economic model built to grow the entrepreneurial spirit of rural women and turn villages into communities that are ecologically sustainable, socially cohesive, and economically robust.
          </p>
          <p className="text-[16px] text-on-surface max-w-[680px] leading-[1.7] mb-3.5">
            <b className="text-primary">Graamam Connect</b> exists to provide the automation backbone that enables{" "}
            <a className="text-primary font-extrabold border-b-[1.5px] border-primary/[0.35] hover:border-primary" href="https://www.graamam.in/" target="_blank" rel="noopener noreferrer">Graamam</a>
            {" "}to scale with integrity.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px] mt-[26px]">
            {VALUES.map((v) => <ValueCard key={v.title} {...v} />)}
          </div>
        </div>
      </section>

      {/* GET STARTED */}
      <section id="get-started" className="bg-gradient-to-br from-[#fbf7ea] to-[#f3eddd] py-[84px] scroll-mt-20">
        <div className="max-w-[1120px] mx-auto px-8">
          <div className="mb-[34px] text-center">
            <Eyebrow>Get started</Eyebrow>
            <h2 className="font-headline font-extrabold text-[32px] mt-2 text-on-surface">Onboarding is done with our team</h2>
          </div>
          <p className="text-center max-w-[560px] mx-auto text-on-surface/60">
            {"Bringing a new FPO onto Graamam Connect means setting up your organisation, products, and people — we do that together with you. Reach out and we'll get you started."}
          </p>
          <div className="bg-white border border-on-surface/[0.12] rounded-[18px] max-w-[640px] mx-auto mt-[26px] px-8 py-[34px] text-center shadow-[0_24px_56px_-30px_rgba(29,29,27,0.3)]">
            <div className="flex gap-3.5 flex-wrap justify-center mb-6">
              <ContactItem Icon={Mail} label="Email" href="mailto:xxx@graamam.in" value="xxx@graamam.in" />
              <ContactItem Icon={Phone} label="Phone" href="tel:+910000000000" value="+91 XXXXX XXXXX" gold />
            </div>
            <BtnPrimary href="mailto:xxx@graamam.in?subject=Graamam%20Connect%20onboarding" data-testid="contact-onboarding-btn">Contact us for onboarding</BtnPrimary>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-on-surface py-[26px]">
        <div className="max-w-[1120px] mx-auto px-8 flex justify-between flex-wrap gap-2.5">
          <span className="text-[11px] font-bold tracking-[0.04em] uppercase text-white/50">Graamam Connect · Handmade Happiness</span>
          <span className="text-[11px] font-bold tracking-[0.04em] uppercase text-white/50">© Protovillage Livelihood Systems</span>
        </div>
      </footer>

      {/* TRIAGE MODAL */}
      {triageOpen ? (
        <div
          className="fixed inset-0 z-[200] bg-on-surface/[0.55] backdrop-blur-[3px] flex items-center justify-center p-[22px]"
          onClick={(e) => { if (e.target === e.currentTarget) closeTriage(); }}
          data-testid="triage-modal"
        >
          <div className="bg-cream-surface rounded-[20px] max-w-[680px] w-full px-9 pt-[34px] pb-[30px] relative shadow-[0_40px_90px_-30px_rgba(0,0,0,0.5)]" role="dialog" aria-modal="true">
            <button
              onClick={closeTriage}
              aria-label="Close"
              data-testid="triage-close-btn"
              className="absolute top-3 right-3.5 w-[34px] h-[34px] flex items-center justify-center rounded-full text-on-surface/40 hover:bg-on-surface/[0.06] hover:text-on-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <Eyebrow>Welcome to Graamam Connect</Eyebrow>
            <h3 className="font-headline font-extrabold text-[24px] mt-1 mb-1.5 text-on-surface">How would you like to start?</h3>
            <p className="text-[14px] text-on-surface/60 mb-[22px]">{"Pick the one that fits and we'll take you there."}</p>
            <div className="flex gap-4 flex-wrap">
              <TriageChoice
                Icon={PlayCircle}
                title="Try the app now"
                body="Jump straight in — no login needed. Explore every feature with example data and add your own to see how it works."
                go="Open the app →"
                onClick={enterApp}
                href="/dashboard"
              />
              <TriageChoice
                Icon={Home}
                alt
                title="Onboard your FPO"
                body="New FPO? Onboarding is done together with our team — get in touch and we'll take it from there."
                go="Contact us for onboarding →"
                onClick={gotoStart}
                href="#get-started"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
