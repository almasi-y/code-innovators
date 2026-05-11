'use server'

import { getRegistrationFee as fetchFee } from '@/lib/registrationFee'

export async function getRegistrationFee(): Promise<number> {
  return fetchFee()
}
