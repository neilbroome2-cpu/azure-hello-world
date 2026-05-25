import { NextRequest, NextResponse } from 'next/server'
import { CosmosClient } from '@azure/cosmos'

function getContainer() {
  const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!)
  return client.database('psa_submissions').container('Oakley')
}

export async function GET(req: NextRequest) {
  const password = req.headers.get('x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const container = getContainer()
    const { resources } = await container.items
      .query('SELECT c.id, c.submitted_at, c.patient_name, c.patient_dob, c.patient_email, c.patient_chi, c.pathway, c.prefer_gp_appointment, c.needs_gp_first, c.ipss_total, c.ipss_severity, c.on_finasteride, c.on_dutasteride, c.family_history, c.reason, c.active_uti, c.bone_pain, c.ethnicity, c.symptoms, c.code, c.group FROM c ORDER BY c.submitted_at DESC')
      .fetchAll()

    return NextResponse.json(resources)
  } catch (err) {
    console.error('Submissions error:', err)
    return NextResponse.json({ error: 'Failed to fetch submissions', detail: String(err) }, { status: 500 })
  }
}
