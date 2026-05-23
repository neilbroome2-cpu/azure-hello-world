import { NextRequest, NextResponse } from 'next/server'
import { CosmosClient } from '@azure/cosmos'

function getContainer() {
  const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!)
  return client.database('oakley').container('psa_submissions')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const container = getContainer()

    const doc = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      submitted_at: new Date().toISOString(),
      patient_name: body.name || '',
      patient_dob: body.dob || '',
      patient_email: body.email || '',
      patient_chi: body.chi || '',
      pathway: body.pathway || '',
      prefer_gp_appointment: body.prefer_gp_appointment || false,
      needs_gp_first: body.needs_gp_first || false,
      ipss_total: body.ipss_total ?? null,
      ipss_severity: body.ipss_severity || null,
      on_finasteride: body.on_finasteride || false,
      on_dutasteride: body.on_dutasteride || false,
      family_history: body.family_history || '',
      reason: body.reason || '',
      active_uti: body.active_uti || '',
      bone_pain: body.bone_pain || '',
      ethnicity: body.ethnicity || '',
      symptoms: body.symptoms || [],
      code: body.code || '',
      group: body.group || '',
      data: body,
    }

    await container.items.create(doc)
    return NextResponse.json({ id: doc.id })
  } catch (err) {
    console.error('Submit error:', err)
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
  }
}
