import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { verifyWebhookSignature } from '@/lib/paystack-utils'

const writeClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN,
})

export async function POST(request: Request) {
    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature') ?? ''

    if (!verifyWebhookSignature(rawBody, signature)) {
        return new Response('Unauthorized', { status: 401 })
    }

    let event: { event: string; data: Record<string, unknown> }
    try {
        event = JSON.parse(rawBody)
    } catch {
        return new Response('Bad Request', { status: 400 })
    }

    if (event.event === 'charge.success') {
        const txData = event.data as {
            reference: string
            status: string
            metadata?: { ticketId?: string }
        }

        if (txData.status === 'success') {
            const existing = await writeClient.fetch<{ _id: string } | null>(
                `*[_type == "ticket" && paystackReference == $ref][0]{ _id }`,
                { ref: txData.reference }
            )
            if (existing?._id) {
                await writeClient.patch(existing._id).set({ status: 'paid' }).commit()
            }
        }
    }

    return new Response('OK', { status: 200 })
}
