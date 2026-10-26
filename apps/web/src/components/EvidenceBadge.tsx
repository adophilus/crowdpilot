import { bearer, queryClient } from '../lib/api'
import { Icon } from './ui'

// Inline [ev_NNNN] citation chip. The panel it opens lives inside the bubble
// (EvidencePanel) so it never overflows the narrow chat column.
export function EvidenceBadge({
  refId,
  open,
  onToggle
}: {
  refId: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className="ev-chip"
      aria-label={`Show Qloo evidence ${refId}`}
      aria-expanded={open}
      data-open={open || undefined}
      onClick={onToggle}
    >
      <span className="ev-dot" aria-hidden="true" />
      {refId}
    </button>
  )
}

// GET /qloo/evidence/:refId is session-gated, so the fetch carries the bearer.
export function EvidencePanel({
  refId,
  onClose
}: {
  refId: string
  onClose: () => void
}) {
  const { headers } = bearer()
  const evidence = queryClient.useQuery(
    'get',
    '/qloo/evidence/{refId}',
    // openapi-typescript declares no header params for this route; openapi-fetch
    // still merges params.header into the request at runtime.
    { params: { path: { refId }, header: headers as never } },
    { staleTime: Number.POSITIVE_INFINITY, retry: 1 }
  )
  const data = evidence.data

  return (
    <section className="ev-panel" aria-label={`Qloo evidence ${refId}`}>
      <header className="ev-panel-head">
        <span>
          <span className="ev-panel-title">Qloo call</span>
          <span className="ev-panel-ref">{refId}</span>
        </span>
        <button
          type="button"
          className="icon-btn icon-btn-sm"
          aria-label="Close evidence"
          onClick={onClose}
        >
          <Icon name="close" size={14} stroke={2.2} />
        </button>
      </header>
      {!data && evidence.isPending && (
        <p className="ev-panel-note">Fetching the stored Qloo call…</p>
      )}
      {evidence.isError && (
        <p className="ev-panel-note is-error">
          Couldn't load this evidence entry.
        </p>
      )}
      {data && (
        <>
          {data.timestamp && (
            <p className="ev-panel-note">{String(data.timestamp)}</p>
          )}
          <h4>Request</h4>
          <pre>{truncate(data.request, 600)}</pre>
          <h4>Response</h4>
          <pre>{truncate(data.response, 1400)}</pre>
        </>
      )}
    </section>
  )
}

const truncate = (value: unknown, max: number): string => {
  const json = JSON.stringify(value, null, 2) ?? ''
  return json.length > max ? `${json.slice(0, max)}\n…` : json
}
