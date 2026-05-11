import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'competitionCategories',
  title: 'Competition Categories',
  type: 'document',
  fields: [
    defineField({
      name: 'technologicalImage',
      title: 'Technological Category Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Image shown on the "Technological" category card',
    }),
    defineField({
      name: 'problemSolvingImage',
      title: 'Problem Solving Category Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Image shown on the "Problem Solving" category card',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Competition Categories' }),
  },
})
