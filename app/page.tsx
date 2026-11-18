import Link from 'next/link'
import './landing.css'

const steps = [
  ['Add incoming batches', 'Enter arrival time, measured moisture, and whether each batch can dry outdoors.'],
  ['Check conditions', 'Record a dry window or expected rain to see how it affects the queue.'],
  ['Assign the dryer', 'Confirm the next batch and keep a record in your assignment history.'],
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
      <a className="landing-nav" href="#how-it-works">How it works</a>
    </header>
    <section className="landing-hero">
      <div className="landing-copy">
        <p className="kicker">For small rice mills</p>
        <h1>Know which paddy batch to dry next.</h1>
        <p>Rank incoming batches by moisture or arrival time. Check outdoor conditions before assigning the next dryer turn.</p>
        <OpenWorkspace />
      </div>
      <figure className="landing-preview">
        <div className="preview-header"><strong>Dryer queue</strong><span>Sample data</span></div>
        <table>
          <thead><tr><th scope="col">Batch</th><th scope="col">Arrival</th><th scope="col">Moisture</th></tr></thead>
          <tbody><tr><th scope="row">PT-024</th><td>07:30</td><td>25%</td></tr><tr><th scope="row">PT-025</th><td>07:45</td><td>23%</td></tr></tbody>
        </table>
        <div className="preview-next">
          <img src="/mill.svg" alt="" />
          <div><span>Next dryer turn</span><strong>PT-024</strong><small>Rain expected</small></div>
        </div>
      </figure>
    </section>
    <section id="how-it-works" className="landing-steps">
      <h2>How it works</h2>
      <ol>{steps.map(([title, description]) => <li key={title}><h3>{title}</h3><p>{description}</p></li>)}</ol>
    </section>
  </main>
}
