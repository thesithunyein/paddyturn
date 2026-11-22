import { notFound } from 'next/navigation'
import { fetchSignal, signalPattern } from '../../../lib/signal'
import ProofView from './view'

type Props = { params: Promise<{ signal: string }> }

export async function generateMetadata({ params }: Props) {
  const { signal } = await params
  return { title: `Forecast proof ${signal.slice(0, 10)}…`, description: 'A PaddyTurn weather check, verified on Telegraph.' }
}

export default async function ProofPage({ params }: Props) {
  const { signal } = await params
  if (!signalPattern.test(signal)) notFound()
  let record
  try {
    // Signal records are immutable once published, so cache them for a day.
    record = await fetchSignal(signal.toLowerCase(), { next: { revalidate: 86_400 } })
  } catch {
    return <ProofView hash={signal} unavailable />
  }
  if (!record) notFound()
  return <ProofView hash={signal} record={record} />
}
