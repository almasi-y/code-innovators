'use server'

import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'

const readClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN,
})

export type CouponLookup =
    | { ok: false; error: string }
    | { ok: true; type: 'free'; feePerLearnerKes: 0 }
    | { ok: true; type: 'discount'; feePerLearnerKes: number }

/** Inspects a coupon without consuming it, so the form knows whether to charge. */
export async function lookupCoupon(codeRaw: string): Promise<CouponLookup> {
    const code = (codeRaw ?? '').trim().toUpperCase()
    if (!/^[A-Z0-9]{4,16}$/.test(code)) return { ok: false, error: 'Invalid coupon format.' }

    const coupon = await readClient.fetch<{
        isUsed?: boolean
        discountType?: string
        feePerLearnerKes?: number
    } | null>(
        `*[_type == "coupon" && code == $code][0]{ isUsed, discountType, feePerLearnerKes }`,
        { code },
        { cache: 'no-store' }
    )

    if (!coupon) return { ok: false, error: 'Coupon not found.' }
    if (coupon.isUsed) return { ok: false, error: 'This coupon has already been used.' }

    if (coupon.discountType === 'fixedPerLearner') {
        const fee = Number(coupon.feePerLearnerKes)
        if (!fee || fee <= 0) return { ok: false, error: 'Coupon is misconfigured. Please contact support.' }
        return { ok: true, type: 'discount', feePerLearnerKes: fee }
    }

    return { ok: true, type: 'free', feePerLearnerKes: 0 }
}
