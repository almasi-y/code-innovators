import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'ticket',
    title: 'Tickets',
    type: 'document',
    fields: [
        defineField({ name: 'ticketId',         title: 'Ticket ID',          type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'registrationId',    title: 'Registration ID',     type: 'string' }),
        defineField({ name: 'customerName',      title: 'Contact Person',      type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'email',             title: 'Email',               type: 'string', validation: (R) => R.required().email() }),
        defineField({ name: 'schoolName',        title: 'School Name',         type: 'string' }),
        defineField({ name: 'phone',             title: 'Phone',               type: 'string' }),
        defineField({ name: 'teamName',          title: 'Team Name',           type: 'string' }),
        defineField({ name: 'teamNumber',        title: 'Team Number',         type: 'number' }),
        defineField({ name: 'totalTeams',        title: 'Total Teams',         type: 'number' }),
        defineField({ name: 'category',          title: 'Category',            type: 'string' }),
        defineField({ name: 'thematicArea',      title: 'Thematic Area',       type: 'string' }),
        defineField({ name: 'learnerNames',      title: 'Learner Names',       type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'amount',            title: 'Amount (KES)',        type: 'number' }),
        defineField({ name: 'paystackReference', title: 'Paystack Reference',  type: 'string' }),
        defineField({ name: 'topUpReferences',   title: 'Top-up Payments',     type: 'array', of: [{ type: 'string' }], description: 'Paystack references for learners added after the original registration' }),
        defineField({
            name: 'status',
            title: 'Status',
            type: 'string',
            options: {
                list: [
                    { title: 'Pending', value: 'pending' },
                    { title: 'Paid', value: 'paid' },
                    { title: 'Failed', value: 'failed' },
                ],
            },
        }),
        defineField({ name: 'ticketType', title: 'Ticket Type', type: 'string' }),
        defineField({ name: 'issuedAt', title: 'Issued At', type: 'datetime' }),
        defineField({ name: 'checkedIn', title: 'Checked In', type: 'boolean', initialValue: false }),
        defineField({ name: 'checkedInAt', title: 'Checked In At', type: 'datetime', readOnly: true }),
    ],
    orderings: [
        { title: 'Newest First', name: 'issuedAtDesc', by: [{ field: 'issuedAt', direction: 'desc' }] },
    ],
    preview: {
        select: { title: 'customerName', subtitle: 'email', status: 'status', ticketId: 'ticketId' },
        prepare({ title, subtitle, status, ticketId }) {
            return { title: `${title} — ${ticketId}`, subtitle: `${subtitle} · ${status}` }
        },
    },
})
