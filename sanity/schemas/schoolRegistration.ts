import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'schoolRegistration',
    title: 'School Registrations',
    type: 'document',
    fields: [
        defineField({
            name: 'schoolName',
            title: 'School Name',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'contactPerson',
            title: 'Contact Person',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'email',
            title: 'Email Address',
            type: 'string',
            validation: (Rule) => Rule.required().email(),
        }),
        defineField({
            name: 'phone',
            title: 'Phone Number',
            type: 'string',
        }),
        defineField({
            name: 'teams',
            title: 'Number of Teams',
            type: 'string',
            options: {
                list: [
                    { title: '1 – 2 teams', value: '1 – 2 teams' },
                    { title: '3 – 5 teams', value: '3 – 5 teams' },
                    { title: '5 – 10 teams', value: '5 – 10 teams' },
                ],
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'submittedAt',
            title: 'Submitted At',
            type: 'datetime',
        }),
    ],
    orderings: [
        {
            title: 'Newest First',
            name: 'submittedAtDesc',
            by: [{ field: 'submittedAt', direction: 'desc' }],
        },
    ],
    preview: {
        select: {
            title: 'schoolName',
            subtitle: 'contactPerson',
            teams: 'teams',
        },
        prepare({ title, subtitle, teams }) {
            return {
                title,
                subtitle: `${subtitle} — ${teams}`,
            }
        },
    },
})
