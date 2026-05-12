import { groq } from 'next-sanity'

export const heroQuery = groq`
  *[_type == "hero"][0] {
    title,
    eventDate,
    location,
    format,
    "backgroundImage": backgroundImage.asset->url + "?w=1920&auto=format&fit=max&q=80",
    primaryCta,
    secondaryCta,
    registrationFee
  }
`

export const keynotesQuery = groq`
  *[_type == "keynote"] | order(order asc) {
    _id,
    title,
    description,
    image
  }
`

export const timelineQuery = groq`
  *[_type == "timelinePhase"] | order(order asc) {
    _id,
    title,
    description,
    "images": images[].asset->url,
    order
  }
`

export const domainsSectionQuery = groq`
  *[_type == "domainsSection"][0] {
    "educationImage": educationImage.asset->url,
    healthVideoUrl
  }
`

export const speakersQuery = groq`
  *[_type == "speaker"] | order(order asc) {
    _id,
    name,
    role,
    "photo": photo.asset->url,
  }
`

export const competitionCategoriesQuery = groq`
  *[_type == "competitionCategories"][0] {
    "categories": categories[] {
      name,
      "image": image.asset->url + "?w=1600&auto=format&fit=crop&q=95",
      bullets
    }
  }
`
