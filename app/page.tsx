import Link from 'next/link'
import './landing.css'

// A real testnet check from the production workspace (22 Nov 2026), shown as
// a sample. Anyone can open the signal on Telegraph's public lookup.
const proofSignal = '0xd06ae8c038d83ecd2c1fc631210b7e87dad9cdb618abca1547b43d2056e1ee46'
const proofUrl = `/proof/${proofSignal}`

const audience = [
  ['Small rice mills', 'One dryer, many batches.'],
  ['Drying cooperatives', 'Shared floors, changing weather.'],
  ['Mill owners', 'Proof behind every decision.'],
]

const steps = [
  ['Add batches', 'Arrival time, moisture, outdoor or not.'],
  ['Check the rain', 'Choose it yourself or buy a verified forecast.'],
  ['Assign the dryer', 'History keeps the decision and its proof.'],
]

const proofPoints = [
  ['Ranked source', 'The best forecast provider for your place.'],
  ['Receipted', 'About 1¢ a check, with a payment receipt.'],
  ['Public', 'Anyone can open the original answer.'],
]

const questions = [
  ['Do I need an account?', 'No. Open the workspace and add a batch.'],
  ['Where is my data saved?', 'In this browser. Each device keeps its own queue.'],
  ['Where does the forecast come from?', 'Telegraph routes it to the best-ranked weather provider. Testnet for now.'],
  ['What does a check cost?', 'About 1¢ of test USDC, with per-request and daily caps.'],
  ['How do I check a forecast is real?', 'History → View evidence → Check on Telegraph.'],
  ['What if the forecast fails?', 'PaddyTurn won’t guess. It asks you to check the sky.'],
  ['Does it decide storage readiness?', 'No. Use a moisture meter and your mill’s procedures.'],
]

function OpenWorkspace() {
  return <Link className="primary landing-action" href="/app">Open workspace
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
  </Link>
}

export default function Landing() {
  return <main className="landing">
    <header className="top">
      <Link href="/" className="brand home-link"><img src="/paddyturn.svg" alt="" width="42" height="42" /><strong>PaddyTurn</strong></Link>
      <nav className="landing-links" aria-label="Main navigation">
        <a className="landing-nav" href="#how-it-works">How it works</a>
        <a className="landing-nav" href="#proof">Verified forecasts</a>
        <a className="landing-nav" href="#faq">FAQ</a>
      </nav>
    </header>
    <div className="landing-progress" aria-hidden="true" />
    <section className="landing-hero">
      <div className="landing-copy">
        <h1>Dry the right batch next.</h1>
        <p>Rank arriving paddy, check the rain, and give your dryer to the batch that needs it.</p>
        <div className="landing-actions">
          <OpenWorkspace />
          <a className="landing-secondary" href="#proof">See a real forecast</a>
        </div>
        <p className="landing-trust">Verified rain checks · ~1¢ each · testnet</p>
      </div>
      <div className="drying-floor-frame">
        <img className="drying-floor" src="/drying-floor.svg?v=2" alt="Illustration of a rice mill beside two outdoor paddy drying beds" width="620" height="430" />
      </div>
    </section>
    <section className="landing-audience" aria-label="Who PaddyTurn is for">
      {audience.map(([title, description]) => <div key={title}><h2>{title}</h2><p>{description}</p></div>)}
    </section>
    <section id="how-it-works" className="landing-steps">
      <h2>How it works</h2>
      <ol>{steps.map(([title, description]) => <li key={title}><h3>{title}</h3><p>{description}</p></li>)}</ol>
    </section>
    <section className="landing-weather" aria-labelledby="weather-title">
      <div className="weather-intro">
        <h2 id="weather-title">When the weather changes</h2>
        <div className="weather-scene" aria-hidden="true">
          <div className="weather-object">
            <span className="weather-depth" />
            <span className="weather-face">
              <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                <circle cx="18" cy="17" r="8" fill="#e6be64" />
                <path d="M18 5V2M6 17H3M9 8 6 5M28 8l3-3" stroke="#9a712e" strokeWidth="2" strokeLinecap="round" />
                <path d="M17 33h19a7 7 0 1 0-1-14 9 9 0 0 0-17 5 4.5 4.5 0 0 0-1 9Z" fill="#fffdf4" stroke="#42694d" strokeWidth="2" />
                <path d="m23 38-2 4m10-4-2 4" stroke="#42694d" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>
      <dl>
        <div><dt>Dry</dt><dd>Outdoor batches go outside. The dryer goes to the next one.</dd></div>
        <div><dt>Rain</dt><dd>The wettest batch keeps the dryer.</dd></div>
        <div><dt>Not sure</dt><dd>Buy a rain check first.</dd></div>
      </dl>
    </section>
    <section id="proof" className="landing-proof" aria-labelledby="proof-title">
      <div className="proof-copy">
        <h2 id="proof-title">Every decision has a receipt.</h2>
        <p>Know why each batch was dried, and prove it later.</p>
        <dl>{proofPoints.map(([title, description]) => <div key={title}><dt>{title}</dt><dd>{description}</dd></div>)}</dl>
      </div>
      <figure className="proof-sample">
        <figcaption>Real check · 22 Nov 2026</figcaption>
        <div className="evidence">
          <div className="evidence-head">
            <span className="badge ok">✓ Verified by Telegraph</span>
            <span className="badge net">Testnet</span>
          </div>
          <div className="evidence-main">
            <p className="evidence-figure"><strong>0%</strong><span>chance of rain · clear</span></p>
            <p className="verdict dry">Below 40%. TEST-01 dried outside; TEST-02 got the dryer.</p>
          </div>
          <dl className="evidence-facts">
            <div><dt>Place</dt><dd>Pathein, Myanmar</dd></div>
            <div><dt>Source</dt><dd>Isobar Weather</dd></div>
            <div><dt>Cost</dt><dd>0.01 test USDC</dd></div>
            <div><dt>Signal</dt><dd><code>0xd06ae8…e1ee46</code></dd></div>
          </dl>
          <a className="evidence-link" href={proofUrl}>Check on Telegraph →</a>
        </div>
      </figure>
    </section>
    <section id="faq" className="landing-faq" aria-labelledby="faq-title">
      <h2 id="faq-title">FAQ</h2>
      <div className="landing-questions">
        {questions.map(([question, answer]) => <details key={question}>
          <summary>{question}<span aria-hidden="true" /></summary>
          <p>{answer}</p>
        </details>)}
      </div>
    </section>
    <footer className="landing-footer">
      <Link href="/" className="brand home-link"><img src="/paddyturn.svg" alt="" width="32" height="32" /><strong>PaddyTurn</strong></Link>
      <nav className="landing-links" aria-label="Footer navigation">
        <Link href="/app">Workspace</Link>
        <a href="https://github.com/thesithunyein/paddyturn#readme">Documentation</a>
        <a href="https://github.com/thesithunyein/paddyturn/issues">Report an issue</a>
        <a href="https://telegraphprotocol.com/">Telegraph</a>
      </nav>
      <p className="landing-note">Forecasts run on Telegraph testnet.</p>
    </footer>
  </main>
}
