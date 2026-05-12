import crypto from 'crypto'

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
        .update(rawBody)
        .digest('hex')
    try {
        return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(signature, 'hex'))
    } catch {
        return false
    }
}
