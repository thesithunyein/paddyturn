import Link from 'next/link'
import './landing.css'

// A real testnet check from the production workspace (22 Nov 2026), shown as
// a sample. Anyone can open the signal on Telegraph's public lookup.
const proofSignal = '0xd06ae8c038d83ecd2c1fc631210b7e87dad9cdb618abca1547b43d2056e1ee46'
const proofUrl = `https://devnode.telegraphprotocol.com/engine/v1/signal/${proofSignal}`

const audience = [
  ['Small rice mills', 'One mechanical dryer and several wet batches arriving at once.'],
  ['Cooperative drying stations', 'Shared drying floors and a queue that changes with the weather.'],
  ['Owners and reviewers', 'A record of why each batch was dried when it was, with proof behind it.'],
]

const steps = [
  ['Add your batches', 'Enter when each batch arrived, its moisture reading, and whether it can dry outside.'],
  ['Check the weather', 'Choose dry or rain yourself, or buy a rain-chance forecast for your mill through Telegraph.'],
  ['Choose the next batch', 'Assign the recommended batch to the dryer. History keeps the decision and any forecast proof.'],
]

const proofPoints = [
  ['Ranked weather source', 'Telegraph sends each check to the best-ranked forecast provider for your place.'],
  ['Paid and receipted', 'Each check costs about one cent of test USDC and comes back with a payment receipt.'],
  ['Anyone can check it', 'Every forecast has a public signal. Open it on Telegraph to see the original answer.'],
]

const questions = [
  ['Do I need an account?', 'Open the workspace and add your first batch. No sign-up is required.'],
  ['Where are my batches and history saved?', 'They stay in this browser. Use the same browser profile to see them again.'],
  ['Can I fix a batch I entered incorrectly?', 'Use the edit button next to a waiting batch to correct its arrival time, moisture reading, or outdoor drying option.'],
  ['Can I move between my phone and computer?', 'You can open PaddyTurn on either device. Each browser keeps its own queue and history.'],
  ['Where does the weather forecast come from?', 'PaddyTurn buys it through Telegraph, which routes each request to the best-ranked forecast provider for the place you enter. Today this runs on Telegraph’s testnet.'],
  ['What does a forecast check cost?', 'About one cent of test USDC per check, with a hard cap per request and a daily limit. PaddyTurn only asks for a forecast when the top batch could dry outdoors.'],
  ['How can I check a forecast is real?', 'Open View evidence in History and choose Check this forecast on Telegraph. It shows the provider’s original answer and its verification.'],
  ['What if the forecast is unclear or fails?', 'PaddyTurn does not guess. It asks you to check conditions yourself, and records no forecast with the assignment.'],
  ['How does PaddyTurn choose the next batch?', 'It ranks the queue by moisture or arrival time. If a dry window lets the first batch go outdoors, it recommends the highest-ranked batch that needs the dryer.'],
  ['Can I use it to decide when paddy is ready for storage?', 'Use a physical moisture reading and follow your mill’s storage procedures. PaddyTurn helps you schedule the dryer.'],
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
        <h1>Know which paddy goes in the dryer next.</h1>
        <p>Line up arriving batches, check the chance of rain, and give your one dryer to the batch that needs it most.</p>
        <div className="landing-actions">
          <OpenWorkspace />
          <a className="landing-secondary" href="#proof">See a real forecast</a>
        </div>
        <p className="landing-trust">Rain checks through Telegraph · about 1¢ each · testnet</p>
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
        <div><dt>Dry weather</dt><dd>A batch that can dry outside can free up the dryer for another batch.</dd></div>
        <div><dt>Rain likely</dt><dd>Keep the batch at the front of the queue for the dryer.</dd></div>
        <div><dt>Not sure</dt><dd>Buy a rain-chance check through Telegraph, or look at the sky yourself before assigning.</dd></div>
      </dl>
    </section>
    <section id="proof" className="landing-proof" aria-labelledby="proof-title">
      <div className="proof-copy">
        <h2 id="proof-title">Every weather decision has a receipt.</h2>
        <p>A weather app tells you what might happen. PaddyTurn also keeps why a batch was dried when it was, so a mill owner or cooperative can check a disputed decision later.</p>
        <dl>{proofPoints.map(([title, description]) => <div key={title}><dt>{title}</dt><dd>{description}</dd></div>)}</dl>
      </div>
      <figure className="proof-sample">
        <figcaption>Real check from the workspace · 22 Nov 2026</figcaption>
        <div className="evidence">
          <div className="evidence-head">
            <span className="badge ok">✓ Verified by Telegraph</span>
            <span className="badge net">Testnet</span>
          </div>
          <div className="evidence-main">
            <p className="evidence-figure"><strong>0%</strong><span>chance of rain · clear</span></p>
            <p className="verdict dry">Below the 40% limit. TEST-01 dried outdoors, so the dryer went to TEST-02.</p>
          </div>
          <dl className="evidence-facts">
            <div><dt>Place</dt><dd>Pathein, Myanmar</dd></div>
            <div><dt>Weather source</dt><dd>Isobar Weather</dd></div>
            <div><dt>Cost</dt><dd>0.01 test USDC</dd></div>
            <div><dt>Signal</dt><dd><code>0xd06ae8…e1ee46</code></dd></div>
          </dl>
          <a className="evidence-link" href={proofUrl} target="_blank" rel="noreferrer">Check this forecast on Telegraph ↗</a>
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
      <p className="landing-note">Forecasts run on Telegraph’s testnet. Use physical moisture readings and your mill’s procedures for storage decisions.</p>
    </footer>
  </main>
}
