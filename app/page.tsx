import Link from 'next/link'
import './landing.css'

const steps = [
  ['Add your batches', 'Enter when each batch arrived, its moisture reading, and whether it can dry outside.'],
  ['Check the weather', 'Tell PaddyTurn whether you expect dry weather or rain.'],
  ['Choose the next batch', 'Confirm the batch going into the dryer. You’ll find it in History.'],
]

const questions = [
  ['How does PaddyTurn choose the next batch?', 'It ranks the queue by moisture or arrival time. If a dry window lets the first batch go outdoors, it recommends the highest-ranked batch that needs the dryer.'],
  ['What if the weather is uncertain?', 'PaddyTurn asks you to review conditions when they could change the dryer assignment. You confirm the final decision.'],
  ['Where are my batches saved?', 'Your queue and assignment history stay in this browser. Open PaddyTurn in the same browser profile to pick up where you left off.'],
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
    <section className="landing-hero">
      <div className="landing-copy">
        <h1>Know what to dry next.</h1>
        <p>A dryer queue for rice mills. Add your batches, check the weather, and choose what goes in next.</p>
        <OpenWorkspace />
      </div>
      <img className="drying-floor" src="/drying-floor.svg" alt="Illustration of a rice mill beside two outdoor paddy drying beds" width="620" height="430" />
    </section>
    <section id="how-it-works" className="landing-steps">
      <h2>How it works</h2>
      <ol>{steps.map(([title, description]) => <li key={title}><h3>{title}</h3><p>{description}</p></li>)}</ol>
    </section>
    <section id="faq" className="landing-faq" aria-labelledby="faq-title">
      <h2 id="faq-title">Frequently asked questions</h2>
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
