import Link from 'next/link'
import './landing.css'

const steps = [
  ['Add your batches', 'Enter when each batch arrived, its moisture reading, and whether it can dry outside.'],
  ['Check the weather', 'Tell PaddyTurn whether you expect dry weather or rain, or buy a rain-chance check through Telegraph.'],
  ['Choose the next batch', 'Assign a batch to the dryer. History saves the batch and time in this browser.'],
]

const questions = [
  ['Do I need an account?', 'Open the workspace and add your first batch. No sign-up is required.'],
  ['Where are my batches and history saved?', 'They stay in this browser. Use the same browser profile to see them again.'],
  ['Can I fix a batch I entered incorrectly?', 'Use the edit button next to a waiting batch to correct its arrival time, moisture reading, or outdoor drying option.'],
  ['Can I move between my phone and computer?', 'You can open PaddyTurn on either device. Each browser keeps its own queue and history.'],
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
        <a className="landing-nav" href="#faq">FAQ</a>
      </nav>
    </header>
    <div className="landing-progress" aria-hidden="true" />
    <section className="landing-hero">
      <div className="landing-copy">
        <h1>Plan your next dryer turn.</h1>
        <p>Add your paddy batches, check the weather, and see which batch should go in next.</p>
        <OpenWorkspace />
      </div>
      <div className="drying-floor-frame">
        <img className="drying-floor" src="/drying-floor.svg?v=2" alt="Illustration of a rice mill beside two outdoor paddy drying beds" width="620" height="430" />
      </div>
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
        <div><dt>Not sure</dt><dd>Review the conditions before making a weather-dependent assignment.</dd></div>
      </dl>
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
      </nav>
    </footer>
  </main>
}
