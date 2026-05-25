import { NextRequest, NextResponse } from 'next/server'
import { CosmosClient } from '@azure/cosmos'
import { EmailClient } from '@azure/communication-email'

function getContainer() {
  const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!)
  return client.database('psa_submissions').container('Oakley')
}

function calcAge(dob: string): string {
  if (!dob) return '—'
  const today = new Date(), b = new Date(dob)
  let age = today.getFullYear() - b.getFullYear()
  if (today.getMonth() - b.getMonth() < 0 || (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())) age--
  return String(age)
}

function groupLabel(group: string): string {
  return { direct: 'Direct to PSA', assess: 'PSA + Appointment', review: 'GP Review' }[group] ?? group
}

function groupColour(group: string): string {
  return { direct: '#166534', assess: '#92400e', review: '#991b1b' }[group] ?? '#1e3a5f'
}

function groupBg(group: string): string {
  return { direct: '#dcfce7', assess: '#fef3c7', review: '#fee2e2' }[group] ?? '#dbeafe'
}

function buildEmailHtml(doc: ReturnType<typeof buildDoc>): string {
  const flags: string[] = []
  if (doc.prefer_gp_appointment) flags.push('Wants GP appointment first')
  if (doc.needs_gp_first) flags.push('Needs GP review (mobility)')
  if (doc.on_finasteride) flags.push('On Finasteride')
  if (doc.on_dutasteride) flags.push('On Dutasteride')
  if (doc.active_uti === 'yes') flags.push('Active UTI')
  if (doc.bone_pain === 'yes') flags.push('Bone pain')
  if (doc.family_history === 'Yes — father or brother' || doc.family_history === 'Yes — other relative') flags.push(`Family history: ${doc.family_history}`)

  const flagsHtml = flags.length
    ? flags.map(f => `<span style="display:inline-block;background:#fee2e2;color:#991b1b;border-radius:4px;padding:2px 8px;font-size:12px;margin:2px;">${f}</span>`).join(' ')
    : '<span style="display:inline-block;background:#dcfce7;color:#166534;border-radius:4px;padding:2px 8px;font-size:12px;">No flags</span>'

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

    <div style="background:#005EB8;padding:24px;">
      <h1 style="color:#ffffff;margin:0;font-size:18px;">New PSA Consent Submission</h1>
      <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">Oakley Medical Practice — ${new Date(doc.submitted_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    </div>

    <div style="padding:24px;">

      <div style="background:${groupBg(doc.group)};border:1px solid ${groupColour(doc.group)}30;border-radius:10px;padding:16px;text-align:center;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${groupColour(doc.group)};">Appointment Code</p>
        <p style="margin:0 0 8px;font-family:monospace;font-size:26px;font-weight:700;letter-spacing:0.15em;color:${groupColour(doc.group)};">${doc.code}</p>
        <span style="display:inline-block;background:${groupColour(doc.group)};color:#ffffff;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:600;">${groupLabel(doc.group)}</span>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
        <tr><td style="padding:6px 0;color:#6b7280;font-weight:600;width:40%;">Patient</td><td style="padding:6px 0;color:#111827;font-weight:700;">${doc.patient_name}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-weight:600;">Date of birth</td><td style="padding:6px 0;color:#111827;">${doc.patient_dob} (Age ${calcAge(doc.patient_dob)})</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-weight:600;">CHI number</td><td style="padding:6px 0;color:#111827;">${doc.patient_chi || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-weight:600;">Email</td><td style="padding:6px 0;color:#111827;">${doc.patient_email || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-weight:600;">Pathway</td><td style="padding:6px 0;color:#111827;text-transform:capitalize;">${doc.pathway || '—'}</td></tr>
        ${doc.ipss_total !== null ? `<tr><td style="padding:6px 0;color:#6b7280;font-weight:600;">IPSS score</td><td style="padding:6px 0;color:#111827;">${doc.ipss_total}/35 — ${doc.ipss_severity}</td></tr>` : ''}
        ${doc.reason ? `<tr><td style="padding:6px 0;color:#6b7280;font-weight:600;">Reason</td><td style="padding:6px 0;color:#111827;">${doc.reason}</td></tr>` : ''}
        ${doc.ethnicity ? `<tr><td style="padding:6px 0;color:#6b7280;font-weight:600;">Ethnicity</td><td style="padding:6px 0;color:#111827;">${doc.ethnicity}</td></tr>` : ''}
      </table>

      <div style="margin-top:12px;">
        <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;margin-bottom:6px;">Clinical flags</p>
        ${flagsHtml}
      </div>

      ${doc.symptoms?.length ? `
      <div style="margin-top:16px;">
        <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;margin-bottom:6px;">Symptoms reported</p>
        <p style="font-size:13px;color:#374151;">${doc.symptoms.join(', ')}</p>
      </div>` : ''}

    </div>

    <div style="background:#f9fafb;padding:14px 24px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">Oakley Medical Practice · PSA Consent System · Confidential</p>
    </div>

  </div>
</body>
</html>`
}

function buildDoc(body: Record<string, unknown>) {
  return {
    id: Math.random().toString(36).substring(2) + Date.now().toString(36),
    submitted_at: new Date().toISOString(),
    patient_name: (body.name as string) || '',
    patient_dob: (body.dob as string) || '',
    patient_email: (body.email as string) || '',
    patient_chi: (body.chi as string) || '',
    pathway: (body.pathway as string) || '',
    prefer_gp_appointment: (body.prefer_gp_appointment as boolean) || false,
    needs_gp_first: (body.needs_gp_first as boolean) || false,
    ipss_total: body.ipss_total != null ? (body.ipss_total as number) : null,
    ipss_severity: (body.ipss_severity as string) || null,
    on_finasteride: (body.on_finasteride as boolean) || false,
    on_dutasteride: (body.on_dutasteride as boolean) || false,
    family_history: (body.family_history as string) || '',
    reason: (body.reason as string) || '',
    active_uti: (body.active_uti as string) || '',
    bone_pain: (body.bone_pain as string) || '',
    ethnicity: (body.ethnicity as string) || '',
    symptoms: (body.symptoms as string[]) || [],
    code: (body.code as string) || '',
    group: (body.group as string) || '',
    data: body,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const container = getContainer()
    const doc = buildDoc(body)

    await container.items.create(doc)

    // Send email notification via Azure Communication Services
    if (process.env.ACS_CONNECTION_STRING && process.env.EMAIL_FROM) {
      try {
        const emailClient = new EmailClient(process.env.ACS_CONNECTION_STRING)
        const message = {
          senderAddress: process.env.EMAIL_FROM,
          content: {
            subject: `PSA Consent — ${doc.patient_name} [${doc.code}]`,
            html: buildEmailHtml(doc),
          },
          recipients: {
            to: [{ address: 'neil.broome@nhs.scot' }],
          },
        }
        const poller = await emailClient.beginSend(message)
        await poller.pollUntilDone()
      } catch (emailErr) {
        console.error('Email send error:', emailErr)
        // Don't fail the submission if email fails
      }
    }

    return NextResponse.json({ id: doc.id })
  } catch (err) {
    console.error('Submit error:', err)
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
  }
}
