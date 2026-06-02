import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'schoolRegistration',
    title: 'School Registrations',
    type: 'document',
    fields: [
        defineField({ name: 'schoolName',    title: 'School Name',    type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'contactPerson', title: 'Contact Person', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'email',         title: 'Email Address',  type: 'string', validation: (R) => R.required().email() }),
        defineField({ name: 'phone',         title: 'Phone Number',   type: 'string' }),
        defineField({
            name: 'teams',
            title: 'Teams',
            type: 'array',
            of: [{
                type: 'object',
                fields: [
                    defineField({ name: 'teamName',     title: 'Team Name',     type: 'string' }),
                    defineField({ name: 'category',     title: 'Category',      type: 'string' }),
                    defineField({ name: 'thematicArea', title: 'Thematic Area', type: 'string' }),
                    defineField({ name: 'learnerNames', title: 'Learner Names', type: 'array', of: [{ type: 'string' }] }),
                ],
                preview: {
                    select: { title: 'teamName', category: 'category', learners: 'learnerNames' },
                    prepare({ title, category, learners }: Record<string, any>) {
                        const names = (learners || []).filter(Boolean).join(', ')
                        return { title, subtitle: category ? `${category} · ${names}` : names }
                    }
                },
            }],
        }),
        defineField({
            name: 'observerNames',
            title: 'Observers (Not Charged)',
            type: 'array',
            of: [{ type: 'string' }],
            description: 'School-wide observers — attend but do not compete and are not charged',
        }),
        defineField({ name: 'totalLearners',  title: 'Total Learners',    type: 'number' }),
        defineField({ name: 'totalAmountKes', title: 'Total Amount (KES)', type: 'number' }),
        defineField({ name: 'registrationId', title: 'Registration ID',    type: 'string' }),
        defineField({ name: 'paystackReference', title: 'Paystack Reference', type: 'string' }),
        defineField({ name: 'couponCode',     title: 'Coupon Code',       type: 'string' }),
        defineField({ name: 'submittedAt',    title: 'Submitted At',      type: 'datetime' }),
    ],
    orderings: [
        { title: 'Newest First', name: 'submittedAtDesc', by: [{ field: 'submittedAt', direction: 'desc' }] },
    ],
    preview: {
        select: {
            title: 'schoolName',
            subtitle: 'contactPerson',
            teams: 'teams',
        },
        prepare({ title, subtitle, teams }: Record<string, any>) {
            const learnerNames = (teams || []).flatMap((t: any) => t.learnerNames || []).filter(Boolean).join(', ')
            return {
                title,
                subtitle: learnerNames ? `${subtitle} · ${learnerNames}` : subtitle,
            }
        },
    },
})
