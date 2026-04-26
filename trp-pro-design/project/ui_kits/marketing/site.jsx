// Marketing site components — pixel-true to the design system.
// Self-contained so the kit is a single drop-in.

const { useState } = React;

function Crown({ size = 28, dark }) {
  // TR monogram seal — editorial, financial, professional.
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="30" fill={dark ? '#FDE68A' : '#1F2937'}/>
      <circle cx="32" cy="32" r="30" fill="none" stroke={dark ? '#1F2937' : '#D97706'} strokeWidth="1"/>
      <circle cx="32" cy="32" r="26" fill="none" stroke={dark ? '#1F2937' : '#D97706'} strokeWidth="0.6" strokeDasharray="0.5 2" opacity="0.7"/>
      <text x="32" y="42" textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontWeight="800" fontSize="28" fill={dark ? '#1F2937' : '#FDE68A'} letterSpacing="-1">TR</text>
      <line x1="20" y1="46" x2="44" y2="46" stroke="#D97706" strokeWidth="0.8"/>
    </svg>
  );
}

function Brand({ dark }) {
  return (
    <a href="#" style={{display:'inline-flex', alignItems:'center', gap:10, fontFamily:'Fraunces, serif', fontWeight:800, fontSize:22, letterSpacing:'-0.01em', color: dark ? '#FFFBEB' : '#1F2937', textDecoration:'none'}}>
      <Crown size={32} dark={dark}/>
      TrapRoyalties<span style={{color:'#D97706'}}>Pro</span>
    </a>
  );
}

function Header() {
  return (
    <header className="tr-header">
      <Brand/>
      <nav className="nav">
        <a href="#how">How it works</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
        <a href="#publishers">For publishers</a>
      </nav>
      <div className="right">
        <button className="btn btn-ghost">Sign in</button>
        <button className="btn btn-primary">Free scan <span className="ar">→</span></button>
      </div>
    </header>
  );
}

function Hero() {
  const [val, setVal] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return (
    <section className="hero">
      <div className="eyebrow">Royalty intelligence · Metadata health</div>
      <h1>You're getting streams.<br/><em>Are you getting paid?</em></h1>
      <p className="lede">Real catalog cleaning. Real data. Real financial impact. We scan your catalog in seconds and flag where royalties are leaking — then fix it for you.</p>

      <form className="scan-card" onSubmit={(e)=>{e.preventDefault(); setSubmitted(true);}}>
        <div className="lab">Free catalog scan</div>
        {!submitted ? (
          <>
            <div className="form">
              <input value={val} onChange={e=>setVal(e.target.value)} placeholder="Spotify artist link or artist name" />
              <button className="btn btn-primary btn-lg" type="submit">Scan now <span className="ar">→</span></button>
            </div>
            <div className="meta">
              <span>No signup</span><span>Results in seconds</span><span>No credit card</span>
            </div>
          </>
        ) : (
          <div style={{padding:'8px 0'}}>
            <div style={{fontFamily:'Fraunces, serif', fontWeight:800, fontSize:48, color:'#F59E0B', lineHeight:1, letterSpacing:'-0.02em'}}>72/100</div>
            <div style={{marginTop:10, color:'rgba(253,230,138,0.85)', fontSize:14}}>Submission Readiness Score</div>
            <div style={{marginTop:14, fontSize:13, color:'rgba(253,230,138,0.7)', lineHeight:1.5}}>
              <strong style={{color:'#FDE68A'}}>14 issues found</strong> across 23 works · 6 missing contributors · 3 split conflicts · estimated <strong style={{color:'#F59E0B'}}>$1,200–$3,400</strong> in leakage
            </div>
            <button className="btn btn-primary btn-lg" style={{marginTop:18}} onClick={(e)=>{e.preventDefault(); setSubmitted(false); setVal('');}}>See full report <span className="ar">→</span></button>
          </div>
        )}
      </form>

      <div className="hero-side">
        <div className="num">€47,000</div>
        <div className="lab">Recovered for a Nordic catalog last quarter.</div>
        <div className="src">Forensic rights audit · 2024</div>
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section className="proof">
      <div className="inner">
        <div className="stat">
          <div className="n">10–30%</div>
          <div className="l">Royalty leakage detected in most catalogs we scan.</div>
        </div>
        <div className="stat">
          <div className="n">€47,000</div>
          <div className="l">Found for a single Nordic publisher in one audit.</div>
        </div>
        <div className="stat">
          <div className="n">CA$2,000</div>
          <div className="l">Unpaid royalties recovered for a 12-track artist.</div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="section" id="how">
      <div className="deck-eyebrow">How it works</div>
      <h2>You don't fix metadata. <em>We fix it for you.</em></h2>
      <div className="steps">
        <div className="step">
          <div className="n">1</div>
          <h3>Free scan</h3>
          <p>Drop a Spotify link or artist name. We cross-reference your catalog against DSPs and PROs and surface every gap.</p>
        </div>
        <div className="step">
          <div className="n">2</div>
          <h3>We clean it</h3>
          <p>A real metadata specialist fixes ISRCs, contributors, splits, and registrations — like a dry-cleaning service for catalogs.</p>
        </div>
        <div className="step">
          <div className="n">3</div>
          <h3>Submission-ready</h3>
          <p>You get CWR-ready exports, a publishing health report, and a fix-later task summary. Ship to PROs the same day.</p>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    { name: 'Single work', price: '149', scope: 'One work', features: ['Full metadata fix','ISRC + ISWC alignment','Split verification','CWR export'] },
    { name: 'Small catalog', price: '399', scope: 'Up to 10 works', features: ['Everything in Single','Contributor validation','Publishing Health Report','Fix-Later task summary'] },
    { name: 'Medium catalog', price: '799', scope: 'Up to 25 works', featured: true, features: ['Everything in Small','Forensic chain-of-title','Priority turnaround','Slack channel access'] },
    { name: 'Large catalog', price: '1,499', scope: 'Up to 50 works', features: ['Everything in Medium','Bulk CWR exports','Audit-ready package','Quarterly health re-scan'] },
  ];
  return (
    <section className="section pricing" id="pricing" style={{maxWidth:'none', padding:'96px 32px'}}>
      <div style={{maxWidth:1200, margin:'0 auto'}}>
        <div className="deck-eyebrow">Pricing</div>
        <h2>Pay once. <em>Get clean.</em></h2>
        <p style={{maxWidth:640, color:'var(--fg2)', fontSize:18, marginTop:14}}>No subscriptions. No tools to learn. If we don't deliver a submission-ready catalog, you don't pay.</p>
        <div className="grid">
          {tiers.map(t => (
            <div key={t.name} className={`tier ${t.featured?'featured':''}`}>
              {t.featured && <div className="ribbon">Most popular</div>}
              <div className="name">{t.name}</div>
              <div className="price"><span className="c">$</span>{t.price}</div>
              <div className="scope">{t.scope}</div>
              <ul>{t.features.map(f => <li key={f}>{f}</li>)}</ul>
              <button className="btn btn-primary pick">Get started <span className="ar">→</span></button>
            </div>
          ))}
        </div>
        <div className="enterprise">
          <div>
            <h3>Publishers & enterprise</h3>
            <p>Custom workflows, dedicated metadata specialist, forensic audits, and bulk CWR pipelines for catalogs of any size.</p>
          </div>
          <button className="btn btn-primary btn-lg">Talk to us <span className="ar">→</span></button>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section className="section" id="faq">
      <div className="deck-eyebrow">Common questions</div>
      <h2>Honest answers. <em>No fine print.</em></h2>
      <div className="faq">
        <div className="col-h">For artists</div>
        <details><summary>I'm not technical. Is this for me?</summary><p>Yes. You don't need to know what ISRC means. You give us a Spotify link, we do everything else. Most clients have zero publishing background.</p></details>
        <details open><summary>Will this cost me a subscription?</summary><p>No. You pay once per catalog. No recurring fees, no seat licenses, no upgrades.</p></details>
        <details><summary>I don't trust PROs. Why bother?</summary><p>PROs aren't the problem — broken metadata is. When the data is clean, the money flows automatically.</p></details>
        <details><summary>What if I don't know what's wrong?</summary><p>The free scan tells you. You'll see your Submission Readiness Score, issue breakdown, and estimated leakage in under a minute.</p></details>

        <div className="col-h">For publishers</div>
        <details><summary>We already have an admin team.</summary><p>Great. We work alongside them — we handle the cleaning, they handle the relationships. Most teams reclaim 20+ hours per audit cycle.</p></details>
        <details><summary>We don't want another dashboard.</summary><p>Neither do we. This is a service, not software. You get clean files, not another tool to log into.</p></details>
        <details><summary>We need compliance, not a tool.</summary><p>Compliance is the deliverable. CWR-ready exports, signed-off splits, verified IPIs. Audit trail included.</p></details>
        <details><summary>We need proof before committing.</summary><p>Run a free scan on a sample of your catalog. We'll show you what we'd find before you spend a dollar.</p></details>
      </div>
    </section>
  );
}

function CTAStrip() {
  return (
    <section className="cta-strip">
      <div className="inner">
        <h2>If we don't deliver,<br/>you don't pay.</h2>
        <p>No subscriptions. No fine print. No tools to learn. Just a clean, submission-ready catalog — or your money back.</p>
        <button className="btn btn-lg">Get your free scan <span className="ar">→</span></button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <div className="inner">
        <div className="brandcol">
          <Brand dark/>
          <p>Royalty intelligence and metadata health for artists, publishers, attorneys, and catalog owners.</p>
        </div>
        <div>
          <h4>Product</h4>
          <a href="#">Free scan</a><a href="#">Cleaning service</a><a href="#">Forensic audit</a><a href="#">CWR exports</a>
        </div>
        <div>
          <h4>Audience</h4>
          <a href="#">For artists</a><a href="#">For publishers</a><a href="#">For attorneys</a><a href="#">For acquisition firms</a>
        </div>
        <div>
          <h4>Company</h4>
          <a href="#">About</a><a href="#">Case studies</a><a href="#">Contact</a><a href="#">Privacy</a>
        </div>
      </div>
      <div className="legal">
        <span>© 2026 TrapRoyaltiesPro</span>
        <span>Real catalog cleaning. Real data. Real financial impact.</span>
      </div>
    </footer>
  );
}

function Site() {
  return (
    <div className="site">
      <Header/>
      <Hero/>
      <Proof/>
      <HowItWorks/>
      <Pricing/>
      <FAQ/>
      <CTAStrip/>
      <Footer/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Site/>);
