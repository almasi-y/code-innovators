import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'

const FALLBACK_FEE = 20

const readClient = createClient({ projectId, dataset, apiVersion, useCdn: false })

export async function getRegistrationFee(): Promise<number> {
  try {
    const result = await readClient.fetch<{ registrationFee?: number } | null>(
      `*[_type == "hero"][0]{ registrationFee }`
    )
    return result?.registrationFee ?? FALLBACK_FEE
  } catch {
    return FALLBACK_FEE
  }
}
