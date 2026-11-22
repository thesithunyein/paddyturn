import Link from 'next/link'
import './docs.css'

export const metadata = { title: 'Docs', description: 'How to use PaddyTurn, how it buys forecasts through Telegraph, and how to verify them.' }

const sections = [
  ['start', 'Quick start'], ['forecast', 'Rain checks'], ['verify', 'Verify a forecast'], ['sync', 'Sync devices'],
  ['developers', 'Run it yourself'], ['costs', 'Costs and limits'], ['troubleshooting', 'Troubleshooting'], ['feedback', 'Feedback'],
] as const

const proof = '0xd06ae8c038d83ecd2c1fc631210b7e87dad9cdb618abca1547b43d2056e1ee46'

export default function Docs() {
  return <main className="docs">
    <header className="top">
      <Link href="/" className="brand home-link"><img src="/paddyturn.svg" alt="" width="42" height="42" /><strong>PaddyTurn</strong></Link>
      <nav className="docs-top-links"><Link href="/app">Open workspace</Link></nav>
    </header>
    <div className="docs-layout">
      <aside className="docs-toc" aria-label="On this page"><p>Docs</p>
        <ol>{sections.map(([id, title]) => <li key={id}><a href={`#${id}`}>{title}</a></li>)}</ol></aside>
      <article>
        <h1>PaddyTurn docs</h1>
        <p className="docs-lead">PaddyTurn helps a rice mill decide which paddy batch gets the dryer next. When the weather matters, it buys a rain forecast through Telegraph and keeps proof of it.</p>

        <section id="start"><h2>Quick start</h2>
          <ol>
            <li>Open the <Link href="/app">workspace</Link>. No account is needed.</li>
            <li><strong>Add batch</strong>: ID, arrival time, moisture %, and whether it can dry outdoors.</li>
            <li>Pick <strong>Wettest first</strong> or <strong>First to arrive</strong>.</li>
            <li>If the top batch can dry outdoors, set the weather, or buy a rain check.</li>
            <li><strong>Assign to dryer</strong>. History keeps the decision and any forecast proof.</li>
          </ol>
          <p>Switch between English and Burmese with <strong>EN / မြန်မာ</strong> at the top of any page.</p>
        </section>

        <section id="forecast"><h2>Rain checks through Telegraph</h2>
          <p>A rain check is only offered when the top batch could dry outdoors. Each check:</p>
          <ol>
            <li>Sends the intent <code>WEATHER_FORECAST_GENERAL</code> with your place and window to Telegraph, which routes it to the best-ranked weather provider.</li>
            <li>Is paid from the mill’s Anjoman testnet escrow and returns a payment receipt and a signal hash.</li>
            <li>Is cross-checked against Telegraph’s public record of that signal (free). The record must be <code>verified: true</code> and for the same intent.</li>
            <li>Uses the record’s hourly data to find the highest rain chance in your exact window.</li>
            <li>Compares it with your rain chance limit: below the limit, outdoor drying is safe; at or above, the batch stays in the dryer queue.</li>
          </ol>
          <p>If the record is not published yet, PaddyTurn uses the provider’s daily peak and labels it. If anything cannot be verified, it asks you to check the sky instead of guessing.</p>
        </section>

        <section id="verify"><h2>Verify a forecast</h2>
          <p>In <strong>History → View evidence</strong>, choose <strong>Check on Telegraph</strong>. The proof page shows the verification, place, provider, cost and hourly rain chance, with a link to the raw record.</p>
          <p>Example: <Link href={`/proof/${proof}`}>a real check for Pathein, 22 Nov 2026</Link>. Or check it from a terminal:</p>
          <pre><code>{`curl https://devnode.telegraphprotocol.com/engine/v1/signal/${proof}`}</code></pre>
        </section>

        <section id="sync"><h2>Sync devices</h2>
          <p>Under the queue, choose <strong>Sync with a mill code</strong> and enter a code of 10 to 64 characters. Use the same code on another phone or computer to see the same queue and history. Only a hash of the code is stored. Anyone with the code can see the queue, so share it only with your team.</p>
          <p>The footer shows how many days the mill has used PaddyTurn.</p>
        </section>

        <section id="developers"><h2>Run it yourself</h2>
          <p>Use Node.js 24 and npm.</p>
          <pre><code>{`git clone https://github.com/thesithunyein/paddyturn
cd paddyturn
npm ci
npm test
npm run dev   # http://127.0.0.1:3000/app`}</code></pre>
          <p>See a real Telegraph payment quote without a wallet or spending anything:</p>
          <pre><code>npm run probe -- --quote</code></pre>
          <p>To buy forecasts from the workspace, copy <code>.env.example</code> to <code>.env.local</code> and set:</p>
          <table><thead><tr><th>Variable</th><th>Purpose</th></tr></thead><tbody>
            <tr><td><code>TELEGRAPH_API_KEY</code></td><td>Anjoman API key, paid from your testnet escrow</td></tr>
            <tr><td><code>LOCAL_FORECAST_TOKEN</code></td><td>Access code for the forecast check (24+ characters)</td></tr>
            <tr><td><code>TELEGRAPH_DAILY_BUDGET_USD</code></td><td>Daily spend limit (default 1)</td></tr>
            <tr><td><code>KV_REST_API_URL</code>, <code>KV_REST_API_TOKEN</code></td><td>Optional Upstash Redis for mill sync and a shared daily budget</td></tr>
          </tbody></table>
          <p>Get an API key from <a href="https://anjoman.ai/docs/using/api-keys">Anjoman</a>. Full details are in the <a href="https://github.com/thesithunyein/paddyturn#readme">README</a>.</p>
        </section>

        <section id="costs"><h2>Costs and limits</h2>
          <ul>
            <li>About <strong>0.01 test USDC</strong> per check on testnet so far.</li>
            <li>Anjoman caps one routed request at 0.26 USD. PaddyTurn reserves that cap against the daily budget, then settles to the real cost.</li>
            <li>The daily budget is shared across servers when Redis is connected.</li>
            <li>Testnet only. No real money is spent and no production use is claimed.</li>
          </ul>
        </section>

        <section id="troubleshooting"><h2>Troubleshooting</h2>
          <dl>
            <div><dt>“The forecast access code is not valid.”</dt><dd>Ask the mill manager for the code. It must match <code>LOCAL_FORECAST_TOKEN</code>.</dd></div>
            <div><dt>“Telegraph returned HTTP 4xx/503.”</dt><dd>Telegraph refused or no provider was available. These are not charged. Try again later or check conditions yourself.</dd></div>
            <div><dt>“Public record pending”</dt><dd>Telegraph had not published the record yet. The decision used the provider’s daily peak. Open the proof page a minute later.</dd></div>
            <div><dt>“Today’s forecast budget is used up.”</dt><dd>The daily limit was reached. Set the weather manually until tomorrow (UTC).</dd></div>
            <div><dt>“Mill workspaces are not set up yet.”</dt><dd>The server has no Redis connection. The workspace still works in this browser.</dd></div>
          </dl>
        </section>

        <section id="feedback"><h2>Feedback</h2>
          <p>Tried it? Run <code>npm run probe -- --quote</code> or a workspace check, then <a href="https://github.com/thesithunyein/paddyturn/issues/new">open an issue</a> with what worked and what didn’t. Every report gets a reply.</p>
        </section>
      </article>
    </div>
  </main>
}
