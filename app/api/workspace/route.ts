import { maxWorkspaceBytes, validWorkspace } from '../../../lib/workspace'
import { millId, redis, storeReady, today, validMillCode } from '../../../lib/store'

// Server-side mill workspace: the same queue and history on every device that
// knows the mill code. Each day with activity is recorded to show repeat use.
const keyFor = (id: string) => `pt:mill:${id}`

function codeFrom(request: Request) {
  const code = request.headers.get('x-mill-code') || ''
  return validMillCode(code) ? code : undefined
}

export async function GET(request: Request) {
  if (!storeReady) return Response.json({ reason: 'Mill workspaces are not set up on this server.' }, { status: 503 })
  const code = codeFrom(request)
  if (!code) return Response.json({ reason: 'Use a mill code of 10 to 64 characters.' }, { status: 400 })
  const id = millId(code)
  try {
    const [data, days] = await redis([['GET', keyFor(id)], ['SCARD', `${keyFor(id)}:days`]])
    return Response.json({ workspace: typeof data === 'string' ? JSON.parse(data) : null, activeDays: Number(days) || 0 })
  } catch {
    return Response.json({ reason: 'Mill workspace is unavailable. Your changes stay in this browser.' }, { status: 503 })
  }
}

export async function PUT(request: Request) {
  if (!storeReady) return Response.json({ reason: 'Mill workspaces are not set up on this server.' }, { status: 503 })
  const code = codeFrom(request)
  if (!code) return Response.json({ reason: 'Use a mill code of 10 to 64 characters.' }, { status: 400 })
  const text = await request.text()
  if (text.length > maxWorkspaceBytes) return Response.json({ reason: 'Workspace is too large.' }, { status: 413 })
  let body: { workspace?: unknown }
  try { body = JSON.parse(text) } catch { return Response.json({ reason: 'Invalid request.' }, { status: 400 }) }
  if (!validWorkspace(body.workspace)) return Response.json({ reason: 'Invalid workspace.' }, { status: 400 })
  const id = millId(code)
  const workspace = { ...body.workspace, updatedAt: new Date().toISOString() }
  try {
    const [, , days] = await redis([
      ['SET', keyFor(id), JSON.stringify(workspace)],
      ['SADD', `${keyFor(id)}:days`, today()],
      ['SCARD', `${keyFor(id)}:days`],
      ['SADD', 'pt:mills', id],
    ])
    return Response.json({ updatedAt: workspace.updatedAt, activeDays: Number(days) || 0 })
  } catch {
    return Response.json({ reason: 'Mill workspace is unavailable. Your changes stay in this browser.' }, { status: 503 })
  }
}
