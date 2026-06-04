import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'coupon',
    title: 'Coupons',
    type: 'document',
    fields: [
        defineField({
            name: 'code',
            title: 'Coupon Code',
            type: 'string',
            description: 'Uppercase letters and numbers only (e.g. FREE2025)',
            validation: (R) =>
                R.required()
                    .uppercase()
                    .regex(/^[A-Z0-9]{4,16}$/, { name: 'code', invert: false })
                    .error('Must be 4–16 uppercase letters or numbers'),
        }),
        defineField({
            name: 'discountType',
            title: 'Coupon Type',
            type: 'string',
            options: {
                list: [
                    { title: 'Free (100% off — no payment)', value: 'free' },
                    { title: 'Fixed price per learner', value: 'fixedPerLearner' },
                ],
                layout: 'radio',
            },
            initialValue: 'free',
            description: 'Free coupons require no payment. Fixed-price coupons charge the set amount per learner via Paystack.',
        }),
        defineField({
            name: 'feePerLearnerKes',
            title: 'Price per learner (KES)',
            type: 'number',
            description: 'Only for "Fixed price per learner" coupons — e.g. 700',
            hidden: ({ parent }) => parent?.discountType !== 'fixedPerLearner',
            validation: (R) =>
                R.custom((val, ctx) => {
                    const parent = ctx.parent as { discountType?: string } | undefined
                    if (parent?.discountType === 'fixedPerLearner' && (!val || (val as number) <= 0)) {
                        return 'Set a price per learner greater than 0'
                    }
                    return true
                }),
        }),
        defineField({
            name: 'isUsed',
            title: 'Used?',
            type: 'boolean',
            initialValue: false,
        }),
        defineField({
            name: 'usedBy',
            title: 'Used By (School)',
            type: 'string',
            readOnly: true,
            description: 'Filled automatically when the coupon is redeemed',
        }),
        defineField({
            name: 'usedByEmail',
            title: 'Used By (Email)',
            type: 'string',
            readOnly: true,
        }),
        defineField({
            name: 'usedAt',
            title: 'Used At',
            type: 'datetime',
            readOnly: true,
        }),
        defineField({
            name: 'createdAt',
            title: 'Created At',
            type: 'datetime',
            initialValue: () => new Date().toISOString(),
            readOnly: true,
        }),
    ],
    orderings: [
        { title: 'Newest First', name: 'createdAtDesc', by: [{ field: 'createdAt', direction: 'desc' }] },
        { title: 'Unused First', name: 'unusedFirst', by: [{ field: 'isUsed', direction: 'asc' }] },
    ],
    preview: {
        select: {
            title: 'code',
            isUsed: 'isUsed',
            usedBy: 'usedBy',
        },
        prepare({ title, isUsed, usedBy }) {
            return {
                title: title ?? '—',
                subtitle: isUsed ? `✅ Used by ${usedBy ?? 'unknown'}` : '🟢 Available',
            }
        },
    },
})
