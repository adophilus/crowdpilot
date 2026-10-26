import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Icon } from '../../components/ui'
import { getToken } from '../../lib/api'
import { GOALS, type GoalId } from '../../lib/fixtures'
import { updateOnboarding, useOnboarding } from '../../lib/onboarding'

export const Route = createFileRoute('/_onboarding/onboarding/goal')({
  ssr: false,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/onboarding/account', replace: true })
  },
  component: OnboardingGoal
})

function OnboardingGoal() {
  const navigate = useNavigate()
  const ob = useOnboarding()

  return (
    <div className="onb-col">
      <h1 className="onb-title">What do you want help with first?</h1>
      <p className="onb-lede">Pick one to start. You can switch any time.</p>
      <div role="radiogroup" aria-label="Your goal" className="goal-list">
        {GOALS.map((g) => {
          const on = ob.goal === g.id
          return (
            // biome-ignore lint/a11y/useSemanticElements: custom radio card from the design
            <button
              key={g.id}
              type="button"
              role="radio"
              aria-checked={on}
              className="opt goal"
              data-on={on || undefined}
              onClick={() => updateOnboarding({ goal: g.id as GoalId })}
            >
              <span className="goal-icon">
                <Icon d={g.icon} size={22} />
              </span>
              <span className="goal-text">
                <span className="goal-title">{g.title}</span>
                <span className="goal-body">{g.body}</span>
              </span>
              <span className="radio" />
            </button>
          )
        })}
      </div>
      <div className="onb-nav onb-nav-lg">
        <span />
        <button
          className="btn btn-primary"
          type="button"
          disabled={!ob.goal}
          onClick={() => navigate({ to: '/onboarding/connect' })}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
