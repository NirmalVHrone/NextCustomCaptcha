import sharp from "sharp"
import { randomUUID } from "crypto"
import { saveCaptcha } from "@/lib/captcha-store"

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get("image") as File

  if (!file) {
    return Response.json({ error: "No image uploaded" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const metadata = await sharp(buffer).metadata()
  const width = metadata.width || 800
  const height = metadata.height || 600
  
  // Resize if too large
  const maxWidth = 800
  const maxHeight = 600
  let finalWidth = width
  let finalHeight = height
  
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    finalWidth = Math.floor(width * ratio)
    finalHeight = Math.floor(height * ratio)
  }

  const captchaId = randomUUID()
  
  // Create a 4x4 grid (16 cells total)
  const gridRows = 4
  const gridCols = 4
  const totalCells = gridRows * gridCols
  
  // Randomly select 3-5 cells as correct answers
  const numCorrect = 3 + Math.floor(Math.random() * 3) // 3-5 correct cells
  const allCellIndices = Array.from({ length: totalCells }, (_, i) => i)
  const shuffled = [...allCellIndices].sort(() => Math.random() - 0.5)
  const correctCells = shuffled.slice(0, numCorrect).sort((a, b) => a - b)

  // Process image without drawing boxes (frontend will handle grid overlay)
  const image = await sharp(buffer)
    .resize(finalWidth, finalHeight)
    .png()
    .toBuffer()

  saveCaptcha(captchaId, correctCells, { rows: gridRows, cols: gridCols })

  return Response.json({
    captchaId,
    image: image.toString("base64"),
    gridSize: {
      rows: gridRows,
      cols: gridCols
    },
    imageSize: {
      width: finalWidth,
      height: finalHeight
    }
  })
}
