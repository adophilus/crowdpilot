import { useState } from 'react'
import { queryClient } from '../lib/api'

// Inline [ev_NNNN] citation badge → popover with the stored Qloo call.
export function EvidenceBadge({ refId }: { refId: string }) {
  const [open, setOpen] = useState(false)
  const evidence = queryClient.useQuery(
    'get',
    '/qloo/evidence/{refId}',
    { params: { path: { refId } } },
    { enabled: open, staleTime: Number.POSITIVE_INFINITY, retry: 1 }
  )

  const data = evidence.data

  return (
    <span className="ev-badge-wrap">
      <button
        type="button"
        className="ev-badge"
        aria-label={`Show Qloo evidence ${refId}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ⛨ {refId}
      </button>
      {open && (
        <>
          <div className="pop-backdrop" onClick={() => setOpen(false)} />
          <div className="ev-pop" role="dialog" aria-label={`Evidence ${refId}`}>
            <div className="ev-pop-head">
              <span className="ev-pop-title">Qloo evidence · {refId}</span>
              <span className="ev-pop-time">{data?.timestamp ?? ''}</span>
            </div>
            {!data && evidence.isPending && (
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-faint)' }}>
                Fetching the stored Qloo call…
              </p>
            )}
            {evidence.isError && (
              <p className="form-error" style={{ margin: 0 }}>
                Couldn't load this evidence entry.
              </p>
            )}
            {data && (
              <>
                <section>
                  <h4>Request</h4>
                  <pre>{truncate(data.request)}</pre>
                </section>
                <section>
                  <h4>Response</h4>
                  <pre>{truncate(data.response)}</pre>
                </section>
              </>
            )}
          </div>
        </>
      )}
    </span>
  )
}

const truncate = (value: unknown): string => {
  const json = JSON.stringify(value, null, 2) ?? ''
  return json.length > 1800 ? `${json.slice(0, 1800)}\n…` : json
}
