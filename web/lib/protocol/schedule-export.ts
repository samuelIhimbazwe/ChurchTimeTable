import type { ProtocolMonthlySchedulePrintGrid } from '@/lib/api/modules/protocol'
import {
  resolveBulletinTitle,
  resolveCellText,
  resolveChurchName,
  resolveFooterLines,
  resolveIgaburoTitle,
  resolveServiceHeader,
  resolveWeekTitle,
} from '@/lib/protocol/bulletin-overrides'
import { CHURCH_LOGO_SRC } from '@/lib/constants/church-branding'
import {
  BULLETIN_COLUMNS,
  findWeekService,
  monthNameRw,
} from '@/lib/protocol/schedule-bulletin'

const COLUMN_FILLS = {
  TUESDAY_SERVICE: 'B8D4E8',
  FRIDAY_SERVICE: 'F5D0A8',
  SUNDAY_SERVICE_1: 'C8E6C9',
  SUNDAY_SERVICE_2: 'A5D6A7',
} as const

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function scheduleExportFilename(
  data: ProtocolMonthlySchedulePrintGrid,
  ext: 'pdf' | 'docx' | 'xlsx',
) {
  const month = monthNameRw(data.plan.month ?? 1)
  return `Amateraniro-${month}-${data.plan.year}.${ext}`
}

function assertExportData(data: ProtocolMonthlySchedulePrintGrid) {
  if (!data?.plan) {
    throw new Error('Schedule data not loaded')
  }
  if (!Array.isArray(data.weeks)) {
    throw new Error('Schedule weeks missing from export data')
  }
}

function weekColumnCells(
  data: ProtocolMonthlySchedulePrintGrid,
  week: ProtocolMonthlySchedulePrintGrid['weeks'][number],
) {
  const overrides = data.bulletinOverrides ?? null
  return BULLETIN_COLUMNS.map((col) => {
    const service = findWeekService(week, col.code)
    return {
      header: service
        ? resolveServiceHeader(service, overrides)
        : col.header,
      cellText: service ? resolveCellText(service, overrides) : '—',
      fill: COLUMN_FILLS[col.code as keyof typeof COLUMN_FILLS] ?? 'FFFFFF',
    }
  })
}

export async function exportSchedulePdf(bulletinElementId: string, filename: string) {
  const element = document.getElementById(bulletinElementId)
  if (!element) {
    throw new Error('Schedule document not found — switch to Bulletin view or reload the page')
  }

  const [{ default: html2canvas }, jspdfModule] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])
  const jsPDF = jspdfModule.default ?? jspdfModule.jsPDF
  if (!jsPDF) {
    throw new Error('PDF library failed to load')
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 8
  const contentWidth = pageWidth - margin * 2

  const imgWidth = contentWidth
  const imgHeight = (canvas.height * contentWidth) / canvas.width
  const imgData = canvas.toDataURL('image/png')

  let heightLeft = imgHeight
  let y = margin

  pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight)
  heightLeft -= pageHeight - margin * 2

  while (heightLeft > 0) {
    pdf.addPage()
    y = margin - (imgHeight - heightLeft)
    pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2
  }

  pdf.save(filename)
}

export async function exportScheduleExcel(
  data: ProtocolMonthlySchedulePrintGrid,
  filename: string,
) {
  assertExportData(data)
  const excelModule = await import('exceljs')
  const ExcelJS = excelModule.default ?? excelModule

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Protocol Ministry'
  const ws = wb.addWorksheet('Amateraniro', {
    views: [{ showGridLines: false }],
  })

  ws.columns = [{ width: 24 }, { width: 24 }, { width: 28 }, { width: 28 }]

  let row = 1
  try {
    const logoResponse = await fetch(CHURCH_LOGO_SRC)
    if (logoResponse.ok) {
      const logoBuffer = await logoResponse.arrayBuffer()
      const imageId = wb.addImage({
        buffer: logoBuffer,
        extension: 'png',
      })
      ws.addImage(imageId, {
        tl: { col: 1.4, row: 0 },
        ext: { width: 72, height: 72 },
      })
      row = 5
    }
  } catch {
    // Logo is optional for spreadsheet export.
  }

  const titleRow = ws.getRow(row)
  titleRow.getCell(1).value = resolveChurchName(data.bulletinOverrides)
  titleRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF1E4D8C' } }
  titleRow.getCell(1).alignment = { horizontal: 'center' }
  ws.mergeCells(row, 1, row, 4)
  row += 1

  const subtitleRow = ws.getRow(row)
  subtitleRow.getCell(1).value = resolveBulletinTitle(data, data.bulletinOverrides)
  subtitleRow.getCell(1).font = { bold: true, size: 11 }
  subtitleRow.getCell(1).alignment = { horizontal: 'center', wrapText: true }
  ws.mergeCells(row, 1, row, 4)
  row += 2

  const thinBorder = {
    top: { style: 'thin' as const },
    left: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    right: { style: 'thin' as const },
  }

  for (const week of data.weeks) {
    const weekTitle = resolveWeekTitle(week, data.bulletinOverrides)
    const weekRow = ws.getRow(row)
    weekRow.getCell(1).value = weekTitle
    weekRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    weekRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9E9E9E' },
    }
    weekRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
    ws.mergeCells(row, 1, row, 4)
    row += 1

    const columns = weekColumnCells(data, week)
    const headerRow = ws.getRow(row)
    columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1)
      cell.value = col.header
      cell.font = { bold: true, size: 10 }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${col.fill}` },
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.border = thinBorder
    })
    row += 1

    const dataRow = ws.getRow(row)
    columns.forEach((col, idx) => {
      const cell = dataRow.getCell(idx + 1)
      cell.value = col.cellText
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.font = { size: 10 }
      cell.border = thinBorder
    })
    row += 2
  }

  for (const service of data.igaburo) {
    const igHeader = ws.getRow(row)
    igHeader.getCell(1).value = resolveIgaburoTitle(
      service,
      data.plan.year,
      data.bulletinOverrides,
    )
    igHeader.getCell(1).font = { bold: true }
    igHeader.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5E6A8' },
    }
    ws.mergeCells(row, 1, row, 4)
    row += 1

    const igRow = ws.getRow(row)
    igRow.getCell(1).value = resolveCellText(service, data.bulletinOverrides)
    igRow.getCell(1).alignment = { horizontal: 'center', wrapText: true }
    igRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F4FC' },
    }
    igRow.getCell(1).border = thinBorder
    ws.mergeCells(row, 1, row, 4)
    row += 2
  }

  for (const line of resolveFooterLines(data, data.bulletinOverrides)) {
    const footerRow = ws.getRow(row)
    footerRow.getCell(1).value = line
    footerRow.getCell(1).font = { size: 9 }
    footerRow.getCell(1).alignment = { wrapText: true }
    ws.mergeCells(row, 1, row, 4)
    row += 1
  }

  const buffer = await wb.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    filename,
  )
}

export async function exportScheduleWord(
  data: ProtocolMonthlySchedulePrintGrid,
  filename: string,
) {
  assertExportData(data)
  const docx = await import('docx')

  const {
    AlignmentType,
    BorderStyle,
    Document,
    ImageRun,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
  } = docx

  const border = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
  }

  const cellParagraphs = (text: string, bold = false) =>
    text.split('\n').map(
      (line) =>
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: line, bold, size: 20 })],
        }),
    )

  const shadedCell = (text: string, fill: string, bold = true) =>
    new TableCell({
      borders: border,
      shading: { fill },
      verticalAlign: VerticalAlign.CENTER,
      children: cellParagraphs(text, bold),
    })

  const textCell = (text: string) =>
    new TableCell({
      borders: border,
      verticalAlign: VerticalAlign.CENTER,
      children: cellParagraphs(text, false),
    })

  const children: Array<
    InstanceType<typeof Paragraph> | InstanceType<typeof Table>
  > = []

  try {
    const logoResponse = await fetch(CHURCH_LOGO_SRC)
    if (logoResponse.ok) {
      const logoBuffer = await logoResponse.arrayBuffer()
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new ImageRun({
              type: 'png',
              data: new Uint8Array(logoBuffer),
              transformation: { width: 72, height: 72 },
            }),
          ],
        }),
      )
    }
  } catch {
    // Logo is optional for Word export.
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: resolveChurchName(data.bulletinOverrides),
          bold: true,
          size: 24,
          color: '1E4D8C',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: resolveBulletinTitle(data, data.bulletinOverrides),
          bold: true,
          size: 22,
        }),
      ],
    }),
  )

  for (const week of data.weeks) {
    const weekTitle = resolveWeekTitle(week, data.bulletinOverrides)
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 4,
                shading: { fill: '9E9E9E' },
                borders: border,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: weekTitle, bold: true, color: 'FFFFFF', size: 20 }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    )

    const columns = weekColumnCells(data, week)
    const tue = findWeekService(week, 'TUESDAY_SERVICE')
    const fri = findWeekService(week, 'FRIDAY_SERVICE')
    const sun1 = findWeekService(week, 'SUNDAY_SERVICE_1')
    const sun2 = findWeekService(week, 'SUNDAY_SERVICE_2')

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: columns.map((col) => shadedCell(col.header, col.fill)),
          }),
          new TableRow({
            children: [tue, fri, sun1, sun2].map((service) =>
              textCell(service ? resolveCellText(service, data.bulletinOverrides) : '—'),
            ),
          }),
        ],
      }),
    )
    children.push(new Paragraph({ text: '', spacing: { after: 120 } }))
  }

  for (const service of data.igaburo) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 4,
                shading: { fill: 'F5E6A8' },
                borders: border,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: resolveIgaburoTitle(
                          service,
                          data.plan.year,
                          data.bulletinOverrides,
                        ),
                        bold: true,
                        size: 20,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 4,
                shading: { fill: 'E8F4FC' },
                borders: border,
                children: cellParagraphs(
                  resolveCellText(service, data.bulletinOverrides),
                  false,
                ),
              }),
            ],
          }),
        ],
      }),
    )
    children.push(new Paragraph({ text: '', spacing: { after: 120 } }))
  }

  for (const line of resolveFooterLines(data, data.bulletinOverrides)) {
    children.push(
      new Paragraph({
        spacing: { before: 120 },
        children: [new TextRun({ text: line, size: 18 })],
      }),
    )
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, filename)
}
