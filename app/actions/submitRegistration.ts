'use server'

import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'

const writeClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN,
})

export interface RegistrationFormData {
    schoolName: string
    contactPerson: string
    email: string
    phone: string
    teamName: string
    thematicArea: string
    category: string
    learnerNames: string[]
}

export async function submitRegistration(data: RegistrationFormData) {
    try {
        await writeClient.create({
            _type: 'schoolRegistration',
            schoolName: data.schoolName,
            contactPerson: data.contactPerson,
            email: data.email,
            phone: data.phone || undefined,
            teamName: data.teamName,
            thematicArea: data.thematicArea,
            category: data.category,
            learnerNames: data.learnerNames,
            submittedAt: new Date().toISOString(),
        })
        return { success: true }
    } catch (err) {
        console.error('Sanity write error:', err)
        return { success: false, error: 'Failed to submit. Please try again.' }
    }
}
