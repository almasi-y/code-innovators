import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'speaker',
  title: 'Speakers',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role / Title',
      type: 'string',
      description: 'e.g. Keynote Speaker, Tech Innovator, Education Leader',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'photo' },
  },
})
