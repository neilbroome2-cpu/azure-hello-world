const { app } = require('@azure/functions')
const { CosmosClient } = require('@azure/cosmos')

function getContainer() {
  const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING)
  return client.database('oakley').container('psa_submissions')
}

app.http('submissions', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'submissions',
  handler: async (request) => {
    const password = request.headers.get('x-admin-password')
    if (password !== process.env.ADMIN_PASSWORD) {
      return { status: 401, body: 'Unauthorized' }
    }

    try {
      const container = getContainer()
      const { resources } = await container.items
        .query('SELECT c.id, c.submitted_at, c.patient_name, c.patient_dob, c.patient_email, c.patient_chi, c.pathway, c.prefer_gp_appointment, c.needs_gp_first, c.ipss_total, c.ipss_severity, c.on_finasteride, c.on_dutasteride, c.family_history, c.reason, c.active_uti, c.bone_pain FROM c ORDER BY c.submitted_at DESC')
        .fetchAll()

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resources),
      }
    } catch (err) {
      console.error('Submissions error:', err)
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to fetch submissions' }),
      }
    }
  },
})
