import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Lang } from '../../lib/messages'

// Docs text in English and Burmese. Code, commands and setting names stay in
// English in both, because they must be typed exactly.
export const proof = '0xd06ae8c038d83ecd2c1fc631210b7e87dad9cdb618abca1547b43d2056e1ee46'

type Section = { id: string; title: string; body: ReactNode }
type Docs = { toc: string; open: string; title: string; lead: string; sections: Section[] }

const code = {
  curl: `curl https://devnode.telegraphprotocol.com/engine/v1/signal/${proof}`,
  run: `git clone https://github.com/thesithunyein/paddyturn
cd paddyturn
npm ci
npm test
npm run dev   # http://127.0.0.1:3000/app`,
}

function Vars({ head, rows }: { head: [string, string]; rows: [ReactNode, string][] }) {
  return <table><thead><tr><th>{head[0]}</th><th>{head[1]}</th></tr></thead>
    <tbody>{rows.map(([name, purpose], index) => <tr key={index}><td>{name}</td><td>{purpose}</td></tr>)}</tbody></table>
}

const varNames: ReactNode[] = [<code key="a">TELEGRAPH_API_KEY</code>, <code key="b">LOCAL_FORECAST_TOKEN</code>,
  <code key="c">TELEGRAPH_DAILY_BUDGET_USD</code>, <><code>KV_REST_API_URL</code>, <code>KV_REST_API_TOKEN</code></>]

export const docs: Record<Lang, Docs> = {
  en: {
    toc: 'Docs', open: 'Open workspace', title: 'PaddyTurn docs',
    lead: 'PaddyTurn helps a rice mill decide which paddy batch gets the dryer next. When the weather matters, it buys a rain forecast through Telegraph and keeps proof of it.',
    sections: [
      { id: 'start', title: 'Quick start', body: <>
        <ol>
          <li>Open the <Link href="/app">workspace</Link>. No account is needed.</li>
          <li><strong>Add batch</strong>: ID, arrival time, moisture %, and whether it can dry outdoors.</li>
          <li>Pick <strong>Wettest first</strong> or <strong>First to arrive</strong>.</li>
          <li>If the top batch can dry outdoors, set the weather, or buy a rain check.</li>
          <li><strong>Assign to dryer</strong>. History keeps the decision and any forecast proof.</li>
        </ol>
        <p>Switch between English and Burmese with <strong>EN / မြန်မာ</strong> at the top of any page.</p></> },
      { id: 'forecast', title: 'Rain checks', body: <>
        <p>A rain check is only offered when the top batch could dry outdoors. Each check:</p>
        <ol>
          <li>Sends the intent <code>WEATHER_FORECAST_GENERAL</code> with your place and window to Telegraph, which routes it to the best-ranked weather provider.</li>
          <li>Is paid from the mill’s Anjoman testnet escrow and returns a payment receipt and a signal hash.</li>
          <li>Is cross-checked against Telegraph’s public record of that signal (free). The record must be <code>verified: true</code> and for the same intent.</li>
          <li>Uses the record’s hourly data to find the highest rain chance in your exact window.</li>
          <li>Compares it with your rain chance limit: below the limit, outdoor drying is safe; at or above, the batch stays in the dryer queue.</li>
        </ol>
        <p>If the record is not published yet, PaddyTurn uses the provider’s daily peak and labels it. If anything cannot be verified, it asks you to check the sky instead of guessing.</p></> },
      { id: 'verify', title: 'Verify a forecast', body: <>
        <p>In <strong>History → View evidence</strong>, choose <strong>Check on Telegraph</strong>. The proof page shows the verification, place, provider, cost and hourly rain chance, with a link to the raw record.</p>
        <p>Example: <Link href={`/proof/${proof}`}>a real check for Pathein, 22 Nov 2026</Link>. Or check it from a terminal:</p>
        <pre><code>{code.curl}</code></pre></> },
      { id: 'sync', title: 'Sync devices', body: <>
        <p>Under the queue, choose <strong>Sync with a mill code</strong> and enter a code of 10 to 64 characters. Use the same code on another phone or computer to see the same queue and history. Only a hash of the code is stored. Anyone with the code can see the queue, so share it only with your team.</p>
        <p>The footer shows how many days the mill has used PaddyTurn.</p></> },
      { id: 'developers', title: 'Run it yourself', body: <>
        <p>Use Node.js 24 and npm.</p>
        <pre><code>{code.run}</code></pre>
        <p>See a real Telegraph payment quote without a wallet or spending anything:</p>
        <pre><code>npm run probe -- --quote</code></pre>
        <p>To buy forecasts from the workspace, copy <code>.env.example</code> to <code>.env.local</code> and set:</p>
        <Vars head={['Variable', 'Purpose']} rows={[
          [varNames[0], 'Anjoman API key, paid from your testnet escrow'],
          [varNames[1], 'Access code for the forecast check (24+ characters)'],
          [varNames[2], 'Daily spend limit (default 1)'],
          [varNames[3], 'Optional Upstash Redis for mill sync and a shared daily budget']]} />
        <p>Get an API key from <a href="https://anjoman.ai/docs/using/api-keys">Anjoman</a>. Full details are in the <a href="https://github.com/thesithunyein/paddyturn#readme">README</a>.</p></> },
      { id: 'costs', title: 'Costs and limits', body: <ul>
        <li>About <strong>0.01 test USDC</strong> per check on testnet so far.</li>
        <li>Anjoman caps one routed request at 0.26 USD. PaddyTurn reserves that cap against the daily budget, then settles to the real cost.</li>
        <li>The daily budget is shared across servers when Redis is connected.</li>
        <li>Testnet only. No real money is spent and no production use is claimed.</li>
      </ul> },
      { id: 'troubleshooting', title: 'Troubleshooting', body: <dl>
        <div><dt>“The forecast access code is not valid.”</dt><dd>Ask the mill manager for the code. It must match <code>LOCAL_FORECAST_TOKEN</code>.</dd></div>
        <div><dt>“Telegraph returned HTTP 4xx/503.”</dt><dd>Telegraph refused or no provider was available. These are not charged. Try again later or check conditions yourself.</dd></div>
        <div><dt>“Public record pending”</dt><dd>Telegraph had not published the record yet. The decision used the provider’s daily peak. Open the proof page a minute later.</dd></div>
        <div><dt>“Today’s forecast budget is used up.”</dt><dd>The daily limit was reached. Set the weather manually until tomorrow (UTC).</dd></div>
        <div><dt>“Mill workspaces are not set up yet.”</dt><dd>The server has no Redis connection. The workspace still works in this browser.</dd></div>
      </dl> },
      { id: 'feedback', title: 'Feedback', body: <p>Tried it? Run <code>npm run probe -- --quote</code> or a workspace check, then <a href="https://github.com/thesithunyein/paddyturn/issues/new">open an issue</a> with what worked and what didn’t. Every report gets a reply.</p> },
    ],
  },
  my: {
    toc: 'လမ်းညွှန်', open: 'လုပ်ငန်းခွင် ဖွင့်ရန်', title: 'PaddyTurn လမ်းညွှန်',
    lead: 'PaddyTurn သည် မည်သည့် စပါးအသုတ်ကို အခြောက်ခံစက်ထဲ နောက်ထည့်ရမည်ကို ဆန်စက်အား ဆုံးဖြတ်ရာတွင် ကူညီသည်။ ရာသီဥတု အရေးပါသောအခါ Telegraph မှတစ်ဆင့် မိုးခန့်မှန်းချက် ဝယ်ယူပြီး အထောက်အထားကို သိမ်းထားသည်။',
    sections: [
      { id: 'start', title: 'အမြန် စတင်ရန်', body: <>
        <ol>
          <li><Link href="/app">လုပ်ငန်းခွင်</Link>ကို ဖွင့်ပါ။ အကောင့် မလိုပါ။</li>
          <li><strong>အသုတ် ထည့်ရန်</strong> - ID၊ ရောက်ချိန်၊ အစိုဓာတ် %၊ အပြင်လှန်းနိုင်မနိုင် ထည့်ပါ။</li>
          <li><strong>အစိုဆုံး အရင်</strong> သို့မဟုတ် <strong>အရင်ရောက် အရင်</strong> ကို ရွေးပါ။</li>
          <li>ထိပ်ဆုံးအသုတ်ကို အပြင်လှန်းနိုင်လျှင် ရာသီဥတုကို သတ်မှတ်ပါ သို့မဟုတ် မိုးစစ်ဆေးချက် ဝယ်ပါ။</li>
          <li><strong>အခြောက်ခံစက်ထဲ ထည့်ရန်</strong> ကို နှိပ်ပါ။ ဆုံးဖြတ်ချက်နှင့် ခန့်မှန်းချက် အထောက်အထားကို မှတ်တမ်းတွင် သိမ်းသည်။</li>
        </ol>
        <p>စာမျက်နှာတိုင်း၏ အပေါ်ရှိ <strong>EN / မြန်မာ</strong> ဖြင့် ဘာသာစကား ပြောင်းနိုင်သည်။</p></> },
      { id: 'forecast', title: 'မိုးစစ်ဆေးချက်', body: <>
        <p>ထိပ်ဆုံးအသုတ်ကို အပြင်လှန်းနိုင်မှသာ မိုးစစ်ဆေးချက် ဝယ်နိုင်သည်။ စစ်ဆေးချက် တစ်ခုစီသည် -</p>
        <ol>
          <li>သင့်နေရာနှင့် အချိန်ကို <code>WEATHER_FORECAST_GENERAL</code> intent ဖြင့် Telegraph သို့ ပို့ပြီး Telegraph က အဆင့်အမြင့်ဆုံး မိုးလေဝသ ပံ့ပိုးသူထံ လွှဲပေးသည်။</li>
          <li>ဆန်စက်၏ Anjoman testnet escrow မှ ငွေပေးချေပြီး ငွေပေးချေမှု ပြေစာနှင့် signal hash ပြန်ရသည်။</li>
          <li>ထို signal ၏ Telegraph အများမြင် မှတ်တမ်းနှင့် အခမဲ့ တိုက်စစ်သည်။ မှတ်တမ်းသည် <code>verified: true</code> ဖြစ်ရမည်ဖြစ်ပြီး intent တူရမည်။</li>
          <li>မှတ်တမ်းရှိ နာရီအလိုက် ဒေတာဖြင့် သင်ရွေးသော အချိန်အတွင်း အမြင့်ဆုံး မိုးရွာနိုင်ခြေကို ရှာသည်။</li>
          <li>ထိုတန်ဖိုးကို သင့် ကန့်သတ်ချက်နှင့် နှိုင်းယှဉ်သည် - ကန့်သတ်ချက်အောက်ဆိုလျှင် အပြင်လှန်းရန် စိတ်ချရပြီး၊ ညီ သို့မဟုတ် ကျော်လျှင် အသုတ်ကို အခြောက်ခံစက် စာရင်းတွင် ထားသည်။</li>
        </ol>
        <p>မှတ်တမ်း မထုတ်ပြန်ရသေးလျှင် ပံ့ပိုးသူ၏ တစ်နေ့တာ အမြင့်ဆုံးတန်ဖိုးကို သုံးပြီး ထိုသို့ ဖော်ပြသည်။ တစ်ခုခု အတည်မပြုနိုင်ပါက မှန်းဆမည် မဟုတ်ဘဲ ကောင်းကင်ကို ကိုယ်တိုင်စစ်ရန် ပြောမည်။</p></> },
      { id: 'verify', title: 'ခန့်မှန်းချက်ကို စစ်ဆေးရန်', body: <>
        <p><strong>မှတ်တမ်း → အထောက်အထား ကြည့်ရန်</strong> တွင် <strong>Telegraph တွင် စစ်ဆေးရန်</strong> ကို ရွေးပါ။ အထောက်အထား စာမျက်နှာတွင် အတည်ပြုချက်၊ နေရာ၊ ပံ့ပိုးသူ၊ ကုန်ကျစရိတ်နှင့် နာရီအလိုက် မိုးရွာနိုင်ခြေကို မူရင်းမှတ်တမ်း လင့်ခ်နှင့်အတူ ပြသည်။</p>
        <p>ဥပမာ - <Link href={`/proof/${proof}`}>ပုသိမ်အတွက် တကယ့် စစ်ဆေးချက် (၂၀၂၆ နိုဝင်ဘာ ၂၂)</Link>။ သို့မဟုတ် terminal မှ စစ်ပါ -</p>
        <pre><code>{code.curl}</code></pre></> },
      { id: 'sync', title: 'စက်များ ချိတ်ဆက်ရန်', body: <>
        <p>စာရင်းအောက်ရှိ <strong>ဆန်စက်ကုဒ်ဖြင့် ချိတ်ဆက်ရန်</strong> ကို ရွေးပြီး စာလုံး ၁၀ မှ ၆၄ လုံးရှိ ကုဒ်တစ်ခု ထည့်ပါ။ အခြားဖုန်း သို့မဟုတ် ကွန်ပျူတာတွင် ကုဒ်တူကို သုံးလျှင် စာရင်းနှင့် မှတ်တမ်း တူတူ မြင်ရမည်။ ကုဒ်၏ hash ကိုသာ သိမ်းသည်။ ကုဒ်သိသူတိုင်း စာရင်းကို မြင်နိုင်သဖြင့် သင့်အဖွဲ့နှင့်သာ မျှဝေပါ။</p>
        <p>အောက်ခြေတွင် ဆန်စက်က PaddyTurn ကို ရက်ပေါင်း မည်မျှ သုံးခဲ့သည်ကို ပြသည်။</p></> },
      { id: 'developers', title: 'ကိုယ်တိုင် run ရန်', body: <>
        <p>Node.js 24 နှင့် npm ကို သုံးပါ။</p>
        <pre><code>{code.run}</code></pre>
        <p>wallet မလိုဘဲ၊ ငွေမကုန်ဘဲ Telegraph ငွေပေးချေမှု quote အစစ်ကို ကြည့်ရန် -</p>
        <pre><code>npm run probe -- --quote</code></pre>
        <p>လုပ်ငန်းခွင်မှ ခန့်မှန်းချက် ဝယ်ရန် <code>.env.example</code> ကို <code>.env.local</code> သို့ ကူးပြီး အောက်ပါတို့ကို သတ်မှတ်ပါ -</p>
        <Vars head={['Variable', 'အသုံးပြုပုံ']} rows={[
          [varNames[0], 'Anjoman API key၊ သင့် testnet escrow မှ ငွေပေးချေသည်'],
          [varNames[1], 'ခန့်မှန်းချက် စစ်ဆေးရန် ဝင်ရောက်ကုဒ် (စာလုံး ၂၄ လုံးနှင့်အထက်)'],
          [varNames[2], 'တစ်ရက် သုံးစွဲမှု ကန့်သတ်ချက် (ပုံသေ 1)'],
          [varNames[3], 'ဆန်စက် ချိတ်ဆက်မှုနှင့် မျှဝေ ကန့်သတ်ချက်အတွက် Upstash Redis (မဖြစ်မနေ မဟုတ်)']]} />
        <p>API key ကို <a href="https://anjoman.ai/docs/using/api-keys">Anjoman</a> တွင် ရယူပါ။ အသေးစိတ်ကို <a href="https://github.com/thesithunyein/paddyturn#readme">README</a> တွင် ကြည့်ပါ။</p></> },
      { id: 'costs', title: 'ကုန်ကျစရိတ်နှင့် ကန့်သတ်ချက်', body: <ul>
        <li>testnet ပေါ်တွင် စစ်ဆေးချက် တစ်ခုလျှင် <strong>test USDC 0.01</strong> ခန့် ကျသည်။</li>
        <li>Anjoman က တောင်းဆိုမှု တစ်ခုကို USD 0.26 အထိ ကန့်သတ်သည်။ PaddyTurn က ထိုပမာဏကို တစ်ရက်ကန့်သတ်ချက်မှ ကြိုဖယ်ထားပြီး အမှန်ကုန်ကျငွေဖြင့် ပြန်ညှိသည်။</li>
        <li>Redis ချိတ်ဆက်ထားလျှင် တစ်ရက်ကန့်သတ်ချက်ကို server အားလုံး မျှဝေသုံးသည်။</li>
        <li>testnet သာ ဖြစ်သည်။ ငွေအစစ် မသုံးပါ၊ production အသုံးပြုမှုဟု မဆိုပါ။</li>
      </ul> },
      { id: 'troubleshooting', title: 'ပြဿနာ ဖြေရှင်းရန်', body: <dl>
        <div><dt>“ဝင်ရောက်ကုဒ် မမှန်ပါ”</dt><dd>ကုဒ်ကို ဆန်စက်မန်နေဂျာထံ တောင်းပါ။ <code>LOCAL_FORECAST_TOKEN</code> နှင့် ကိုက်ညီရမည်။</dd></div>
        <div><dt>“Telegraph returned HTTP 4xx/503”</dt><dd>Telegraph က ငြင်းဆိုခြင်း သို့မဟုတ် ပံ့ပိုးသူ မရှိခြင်း ဖြစ်သည်။ ငွေမကောက်ပါ။ နောက်မှ ထပ်စမ်းပါ သို့မဟုတ် ရာသီဥတုကို ကိုယ်တိုင်စစ်ပါ။</dd></div>
        <div><dt>“အများမြင် မှတ်တမ်း စောင့်ဆဲ”</dt><dd>Telegraph က မှတ်တမ်း မထုတ်ပြန်ရသေးပါ။ ပံ့ပိုးသူ၏ တစ်နေ့တာ အမြင့်ဆုံးတန်ဖိုးဖြင့် ဆုံးဖြတ်ခဲ့သည်။ တစ်မိနစ်ခန့်အကြာ အထောက်အထား စာမျက်နှာကို ဖွင့်ပါ။</dd></div>
        <div><dt>“ယနေ့ ခန့်မှန်းချက် ဘတ်ဂျက် ကုန်ပြီ”</dt><dd>တစ်ရက် ကန့်သတ်ချက် ပြည့်သွားပြီ။ နောက်နေ့ (UTC) အထိ ရာသီဥတုကို ကိုယ်တိုင် သတ်မှတ်ပါ။</dd></div>
        <div><dt>“ဆန်စက် လုပ်ငန်းခွင်များ မပြင်ဆင်ရသေးပါ”</dt><dd>server တွင် Redis ချိတ်ဆက်မှု မရှိပါ။ လုပ်ငန်းခွင်ကို ဤ browser တွင် ဆက်သုံးနိုင်သည်။</dd></div>
      </dl> },
      { id: 'feedback', title: 'အကြံပြုချက်', body: <p>စမ်းသုံးပြီးပြီလား။ <code>npm run probe -- --quote</code> သို့မဟုတ် လုပ်ငန်းခွင် စစ်ဆေးချက်ကို run ပြီး အဆင်ပြေသည်/မပြေသည်ကို <a href="https://github.com/thesithunyein/paddyturn/issues/new">issue ဖွင့်၍</a> ပြောပြပါ။ အစီရင်ခံစာတိုင်းကို ပြန်ဖြေပါမည်။</p> },
    ],
  },
}
