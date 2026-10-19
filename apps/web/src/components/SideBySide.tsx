import { ChatMessage, type Msg } from './ChatMessage'

// The judging-criteria panel: same prompt, with and without Qloo.
export function SideBySide({
  grounded,
  plain,
  onClose
}: {
  grounded: Msg | null
  plain: Msg
  onClose: () => void
}) {
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Grounded vs plain comparison"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sbs-panel">
        <div className="sbs-head">
          <div>
            <h3>Same question, two brains</h3>
            <p className="sub">The left answer is grounded in your crowd's Qloo data; the right is a plain LLM guessing.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-small" onClick={onClose}>
            ✕ Close
          </button>
        </div>
        <div className="sbs-grid">
          <div className="sbs-pane">
            <span className="sbs-tag grounded">✳ With Qloo</span>
            {grounded ? (
              <ChatMessage msg={{ ...grounded, streaming: false }} />
            ) : (
              <p className="sbs-text" style={{ color: 'var(--ink-faint)' }}>
                Ask something first — the comparison re-runs your latest question.
              </p>
            )}
          </div>
          <div className="sbs-pane">
            <span className="sbs-tag plain">Without Qloo</span>
            <ChatMessage msg={plain} />
          </div>
        </div>
      </div>
    </div>
  )
}
