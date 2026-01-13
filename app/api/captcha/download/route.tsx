import sharp from "sharp"

export async function POST(req: Request) {
  const { imageBase64, selectedCells, gridSize, imageSize } = await req.json()

  if (!imageBase64 || !selectedCells || !gridSize || !imageSize) {
    return Response.json({ error: "Missing required parameters" }, { status: 400 })
  }

  const imageBuffer = Buffer.from(imageBase64, "base64")
  const { rows, cols } = gridSize
  const { width, height } = imageSize

  const cellWidth = width / cols
  const cellHeight = height / rows

  // Create SVG with selected grid cells marked
  const gridOverlay = Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    const x = col * cellWidth
    const y = row * cellHeight
    const isSelected = selectedCells.includes(index)

    if (isSelected) {
      return `
        <rect x="${x}" y="${y}" 
              width="${cellWidth}" height="${cellHeight}" 
              fill="rgba(74, 144, 226, 0.3)" 
              stroke="#4a90e2" 
              stroke-width="4"/>
        <circle cx="${x + 20}" cy="${y + 20}" r="10" fill="#4a90e2"/>
        <text x="${x + 20}" y="${y + 25}" 
              font-size="14" 
              fill="white" 
              text-anchor="middle" 
              dominant-baseline="middle">✓</text>
      `
    }
    return ""
  }).join("")

  const gridLines = []
  // Vertical lines
  for (let i = 0; i <= cols; i++) {
    const x = i * cellWidth
    gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="white" stroke-width="1" opacity="0.5"/>`)
  }
  // Horizontal lines
  for (let i = 0; i <= rows; i++) {
    const y = i * cellHeight
    gridLines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="white" stroke-width="1" opacity="0.5"/>`)
  }

  const imageWithGrid = await sharp(imageBuffer)
    .composite([
      {
        input: Buffer.from(`
          <svg width="${width}" height="${height}">
            ${gridOverlay}
            ${gridLines.join("")}
          </svg>
        `),
        top: 0,
        left: 0
      }
    ])
    .png()
    .toBuffer()

  return new Response(imageWithGrid as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'attachment; filename="captcha-selected.png"'
    }
  })
}

