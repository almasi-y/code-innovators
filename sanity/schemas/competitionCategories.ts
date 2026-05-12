import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'competitionCategories',
  title: 'Competition Categories',
  type: 'document',
  fields: [
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Category Name',
              type: 'string',
              description: 'e.g. "Technological" or "Problem Solving"',
            }),
            defineField({
              name: 'image',
              title: 'Cover Image',
              type: 'image',
              options: { hotspot: true },
            }),
            defineField({
              name: 'bullets',
              title: 'Description Points',
              type: 'array',
              of: [{ type: 'string' }],
              description: 'Each point appears as a bullet on the category card',
            }),
          ],
          preview: {
            select: { title: 'name', media: 'image' },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Competition Categories' }),
  },
})
