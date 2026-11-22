// Validation for workspace data sent to the server. Keeps storage bounded and
// rejects anything that is not the shape the workspace writes.
export const maxWorkspaceBytes = 200_000

const isObj = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

function validBatch(value: unknown) {
  return isObj(value) && typeof value.key === 'string' && value.key.length <= 64 && typeof value.id === 'string' && value.id.length <= 32
    && typeof value.arrival === 'string' && value.arrival.length <= 8 && typeof value.moisture === 'number' && typeof value.outdoor === 'boolean'
}

export function validWorkspace(value: unknown): value is { batches: unknown[]; history: unknown[]; priority: string; weather: string } {
  if (!isObj(value)) return false
  const { batches, history, priority, weather } = value
  return Array.isArray(batches) && batches.length <= 200 && batches.every(validBatch)
    && Array.isArray(history) && history.length <= 1000
    && history.every(item => isObj(item) && validBatch(item.batch) && typeof item.at === 'string' && item.at.length <= 40)
    && (priority === 'moisture' || priority === 'arrival') && (weather === 'unknown' || weather === 'dry' || weather === 'rain')
}
