import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import {
  BIZ_TYPES,
  type BizType,
  SWITCH_GROUPS,
  type SwitchId,
  TONES,
  type ToneId
} from '../../lib/fixtures'
import { updateWorkspace, useWorkspace } from '../../lib/workspace'

export const Route = createFileRoute('/_app/settings')({
  component: Settings
})

// Settings edit a local draft; Save writes it to the workspace store (which
// also renames the sidebar). There's no settings endpoint yet.
function Settings() {
  const ws = useWorkspace()
  const [name, setName] = useState(ws.business.name)
  const [city, setCity] = useState(ws.business.city)
  const [type, setType] = useState<BizType>(ws.business.type)
  const [tones, setTones] = useState(ws.tones)
  const [last, setLast] = useState<ToneId>(ws.lastTone)
  const [sw, setSw] = useState(ws.switches)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState('All changes saved')
  const [confirming, setConfirming] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const touch = () => {
    setDirty(true)
    setSaved('Unsaved changes')
  }

  const save = () => {
    updateWorkspace((w) => ({
      business: { ...w.business, name: name.trim() || w.business.name, city: city.trim(), type },
      tones,
      lastTone: last,
      switches: sw
    }))
    setDirty(false)
    setSaved('Saving…')
    timer.current = window.setTimeout(() => setSaved('All changes saved'), 700)
  }

  const pick = tones[last] ? last : TONES.find(([id]) => tones[id])?.[0]
  const sample = pick
    ? (TONES.find(([id]) => id === pick)?.[2] ?? '')
    : 'Pick at least one word to hear a sample.'

  return (
    <main className="main main-narrow">
      <header className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">How CrowdPilot talks, acts and keeps you posted.</p>
        </div>
        <div className="save-row">
          <span role="status" className="muted-md">
            {saved}
          </span>
          <button className="btn btn-primary btn-save" type="button" disabled={!dirty} onClick={save}>
            Save changes
          </button>
        </div>
      </header>

      <section className="card" aria-labelledby="biz-h">
        <h2 id="biz-h" className="card-title card-title-16">
          Your business
        </h2>
        <div className="g2 g2-3">
          <div>
            <label htmlFor="s-name" className="label">
              Name
            </label>
            <input
              id="s-name"
              className="field field-sm"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                touch()
              }}
            />
          </div>
          <div>
            <label htmlFor="s-city" className="label">
              City
            </label>
            <input
              id="s-city"
              className="field field-sm"
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                touch()
              }}
            />
          </div>
          <div>
            <label htmlFor="s-type" className="label">
              What you are
            </label>
            <select
              id="s-type"
              className="field field-sm field-select"
              value={type}
              onChange={(e) => {
                setType(e.target.value as BizType)
                touch()
              }}
            >
              {BIZ_TYPES.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="card card-stack card-gap-16" aria-labelledby="voice-h">
        <div>
          <h2 id="voice-h" className="card-title card-title-gap">
            Brand voice
          </h2>
          <p className="muted">
            Pick a few words that sound like you. Pilot writes every post in this
            voice.
          </p>
        </div>
        <fieldset className="chip-line chip-line-8 fieldset">
          <legend className="sr-only">Voice</legend>
          {TONES.map(([id, label]) => {
            const on = Boolean(tones[id])
            return (
              <button
                key={id}
                type="button"
                className="toggle-chip toggle-chip-lg"
                aria-pressed={on}
                onClick={() => {
                  setTones((t) => ({ ...t, [id]: !on }))
                  if (!on) setLast(id)
                  touch()
                }}
              >
                {label}
              </button>
            )
          })}
        </fieldset>
        <div className="sample">
          <div className="muted-xs">How a post might sound</div>
          <div key={sample} className="sample-text fade-in">
            {sample}
          </div>
        </div>
      </section>

      <div className="g2">
        {SWITCH_GROUPS.map((g) => (
          <section key={g.title} className="card">
            <h2 className="card-title card-title-6">{g.title}</h2>
            {g.items.map(([id, label, note]) => {
              const on = Boolean(sw[id as SwitchId])
              return (
                <div key={id} className="switch-row">
                  <span className="min0">
                    <span className="switch-label">{label}</span>
                    <span className="switch-note">{note}</span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    className="sw"
                    aria-checked={on}
                    aria-label={label}
                    onClick={() => {
                      setSw((s) => ({ ...s, [id]: !on }))
                      touch()
                    }}
                  >
                    <span className="knob" />
                  </button>
                </div>
              )
            })}
          </section>
        ))}
      </div>

      <section className="card card-danger" aria-labelledby="dz-h">
        <div>
          <h2 id="dz-h" className="card-title card-title-gap">
            Delete workspace
          </h2>
          <p className="muted">
            Removes your audience profile, plans and connected accounts. This
            can't be undone.
          </p>
        </div>
        {confirming ? (
          <div className="confirm fade-in">
            <span>Are you sure?</span>
            <button type="button" className="btn-quiet btn-quiet-lg" onClick={() => setConfirming(false)}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => setConfirming(false)}
            >
              Yes, delete
            </button>
          </div>
        ) : (
          <button
            className="btn btn-danger-outline"
            type="button"
            onClick={() => setConfirming(true)}
          >
            Delete workspace
          </button>
        )}
      </section>
    </main>
  )
}
