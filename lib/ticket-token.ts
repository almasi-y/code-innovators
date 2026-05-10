import crypto from 'crypto'

const SECRET = process.env.TICKET_SIGNING_SECRET!

/** Signs a ticketId → 32-char hex token. Stateless, no DB needed. */
export function signTicketId(ticketId: string): string {
    return crypto.createHmac('sha256', SECRET).update(ticketId).digest('hex').slice(0, 32)
}

/** Returns true only if the token was produced by signTicketId for this ticketId. */
export function verifyTicketToken(ticketId: string, token: string): boolean {
    const expected = signTicketId(ticketId)
    // Constant-time comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'))
    } catch {
        return false
    }
}
