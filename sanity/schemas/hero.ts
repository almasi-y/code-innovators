import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'hero',
  title: 'Hero Section',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Event Title',
      type: 'string',
      description: 'e.g. Code Innovation Festival',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'eventDate',
      title: 'Event Date Label',
      type: 'string',
      description: 'e.g. Sep 27, 2025 — shown in the green pill',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'e.g. Mombasa, Kenya — shown in outline pill',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'format',
      title: 'Event Format',
      type: 'string',
      description: 'e.g. Inter-School Competition — shown in outline pill',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Hero Background Image',
      type: 'image',
      options: { hotspot: true },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'registrationFee',
      title: 'Registration Fee (KES)',
      type: 'number',
      description: 'Per-student registration fee in KES — e.g. 20',
      validation: (R) => R.required().min(0),
    }),
    defineField({
      name: 'primaryCta',
      title: 'Primary CTA Button Label',
      type: 'string',
      description: 'e.g. Register Your School',
    }),
    defineField({
      name: 'secondaryCta',
      title: 'Secondary CTA Button Label',
      type: 'string',
      description: 'e.g. Learn More',
    }),
  ],
  preview: {
    select: { title: 'title' },
  },
})
