// Shared registration limits — used by the register form (client) and the
// completeRegistration / redeemCoupon server actions.

export const CATEGORIES = [
    'Website and Mobile App Development',
    'Line Following',
    'Animation and Gamification',
    'Automation',
] as const

export const THEMATIC_AREAS = [
    'Education',
    'Security',
    'Health',
    'Agriculture',
    'Cybersecurity',
    'Environment',
] as const

export const MAX_OBSERVERS = 5

// Schools can register unlimited teams; this is only an abuse safety-cap
// enforced server-side (a single legitimate school will never hit it).
export const SERVER_MAX_TEAMS = 100

type LearnerLimit = { min: number; max: number }

// Min 2, max 5 learners per team for every category.
const LEARNER_LIMITS: Record<string, LearnerLimit> = {
    'Website and Mobile App Development': { min: 2, max: 5 },
    'Line Following':                     { min: 2, max: 5 },
    'Animation and Gamification':         { min: 2, max: 5 },
    'Automation':                         { min: 2, max: 5 },
}

const DEFAULT_LEARNER_LIMIT: LearnerLimit = { min: 2, max: 5 }

export function learnerLimit(category: string): LearnerLimit {
    return LEARNER_LIMITS[category] ?? DEFAULT_LEARNER_LIMIT
}
