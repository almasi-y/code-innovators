import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'domainsSection',
  title: 'Problem-Solving Domains Section',
  type: 'document',
  fields: [
    defineField({
      name: 'educationImage',
      title: 'Education Domain Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Image shown in the Education card',
    }),
    defineField({
      name: 'healthVideoUrl',
      title: 'Health Domain YouTube URL',
      type: 'url',
      description: 'YouTube video URL for the Health card (e.g. https://www.youtube.com/watch?v=xxxxx)',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Domains Section' }),
  },
})
