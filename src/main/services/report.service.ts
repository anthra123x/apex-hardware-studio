import { dialog, BrowserWindow } from 'electron'
import { writeFileSync } from 'fs'
import type { ReportData, ReportSectionItem } from '../../shared/types/report.types'

function sectionHTML(title: string, items: ReportSectionItem[]): string {
  if (!items || items.length === 0) return ''
  return `
<h2>${title}</h2>
<table>
  <tr><th>Prueba</th><th>Valor</th><th>Estado</th></tr>
  ${items.map(i => `<tr>
    <td>${i.name}</td>
    <td>${i.value}</td>
    <td class="${i.status.toLowerCase()}">${i.status}</td>
  </tr>`).join('\n  ')}
</table>`
}

function generateHTML(data: ReportData): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Reporte Técnico — ${data.deviceName} | Apex Hardware Studio</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:960px;margin:0 auto;padding:40px 24px;color:#0f172a;background:#f8fafc}
.header-box{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #0284c7;padding-bottom:16px;margin-bottom:28px}
h1{font-size:26px;font-weight:800;color:#0f172a;margin:0}
.brand{font-size:12px;font-weight:700;color:#0284c7;text-transform:uppercase;letter-spacing:1px}
h2{font-size:18px;font-weight:700;color:#0369a1;margin-top:32px;margin-bottom:8px;display:flex;align-items:center;gap:8px}
table{width:100%;border-collapse:collapse;margin:12px 0 24px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);border:1px solid #e2e8f0}
th,td{text-align:left;padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:13px}
th{background:#f8fafc;font-weight:600;color:#475569;text-transform:uppercase;font-size:11px;letter-spacing:.5px}
tr:last-child td{border-bottom:none}
.pass{color:#16a34a;font-weight:700}
.fail{color:#dc2626;font-weight:700}
.warn{color:#d97706;font-weight:700}
.skip{color:#94a3b8}
.observations{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-top:12px;color:#92400e;font-size:13px;line-height:1.6}
.footer{margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center}
.badge{display:inline-block;padding:3px 12px;border-radius:999px;font-size:12px;font-weight:700}
.badge.pass{background:#dcfce7;color:#16a34a}
.badge.fail{background:#fee2e2;color:#dc2626}
.badge.warn{background:#fef3c7;color:#d97706}
@media print {
  body { background:#fff; padding:0 }
  table { box-shadow:none }
}
</style>
</head>
<body>
<div class="header-box">
  <div>
    <div class="brand">Apex Hardware Studio</div>
    <h1>Reporte de Diagnóstico y Certificación de Hardware</h1>
  </div>
</div>

<table>
  <tr><th>Equipo</th><td><strong>${data.deviceName}</strong></td></tr>
  <tr><th>Modelo</th><td>${data.model || '—'}</td></tr>
  <tr><th>Número de Serie</th><td>${data.serialNumber || '—'}</td></tr>
  <tr><th>Fabricante</th><td>${data.manufacturer || '—'}</td></tr>
  <tr><th>Sistema Operativo</th><td>${data.osInfo || '—'}</td></tr>
  <tr><th>Fecha de Prueba</th><td>${data.diagnosticDate}</td></tr>
  <tr><th>Técnico Responsable</th><td>${data.technician || 'No especificado'}</td></tr>
  <tr><th>Dictamen General</th><td><span class="badge ${data.status === 'APROBADO' ? 'pass' : data.status === 'APROBADO_CON_OBSERVACIONES' ? 'warn' : 'fail'}">${data.status}</span></td></tr>
</table>

${sectionHTML('Componentes Principales (CPU / RAM / GPU / Placa)', data.hardwareResults)}
${sectionHTML('Almacenamiento y Salud de Discos', data.storageResults)}
${sectionHTML('Batería y Energía', data.batteryResults)}
${sectionHTML('Pruebas de Componentes y Periféricos', data.manualTestResults)}

${data.observations ? `<h2>Observaciones del Diagnóstico</h2><div class="observations">${data.observations.replace(/\n/g, '<br>')}</div>` : ''}

<div class="footer">
  Generado por <strong>Apex Hardware Studio v2.0</strong> — ${new Date().toLocaleString('es-MX')}
</div>
</body>
</html>`
}

export async function generateReport(data: ReportData): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
  if (!win) throw new Error('No window available')

  const safeDate = (data.diagnosticDate || new Date().toISOString()).slice(0, 10)
  const result = await dialog.showSaveDialog(win, {
    title: 'Guardar Reporte de Diagnóstico — Apex Hardware Studio',
    defaultPath: `Apex_Reporte_${data.deviceName || 'equipo'}_${safeDate}.html`,
    filters: [
      { name: 'HTML', extensions: ['html'] },
      { name: 'Todos los archivos', extensions: ['*'] },
    ],
  })

  if (result.canceled || !result.filePath) return null

  const html = generateHTML(data)
  writeFileSync(result.filePath, html, 'utf8')
  return result.filePath
}
