import { type SchemaTypeDefinition } from 'sanity'
import hero from '../schemas/hero'
import sponsorApplication from '../schemas/sponsorApplication'
import schoolRegistration from '../schemas/schoolRegistration'
import keynote from '../schemas/keynote'
import timelinePhase from '../schemas/timelinePhase'
import domainsSection from '../schemas/domainsSection'
import ticket from '../schemas/ticket'
import coupon from '../schemas/coupon'
import competitionCategories from '../schemas/competitionCategories'
import speaker from '../schemas/speaker'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [hero, sponsorApplication, schoolRegistration, keynote, timelinePhase, domainsSection, ticket, coupon, competitionCategories, speaker],
}