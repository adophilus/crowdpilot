// Contract with the webapp (apps/web). Override per deploy via VITE_APP_URL.
export const APP_URL: string =
  import.meta.env.VITE_APP_URL ?? 'http://localhost:3000'

export const GET_STARTED_URL = `${APP_URL}/onboarding`
export const DEMO_URL = `${APP_URL}/demo`

export const REPO_URL = 'https://github.com/adophilus/crowdpilot'
export const ISSUES_URL = `${REPO_URL}/issues`
export const NEW_ISSUE_URL = `${REPO_URL}/issues/new`
