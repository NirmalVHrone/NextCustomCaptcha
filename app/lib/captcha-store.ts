interface CaptchaData {
  correctCells: number[] // Array of cell indices (0-based)
  gridSize: { rows: number; cols: number }
  expires: number
}

const store = new Map<string, CaptchaData>()

export function saveCaptcha(id: string, correctCells: number[], gridSize: { rows: number; cols: number }) {
  store.set(id, {
    correctCells,
    gridSize,
    expires: Date.now() + 2 * 60 * 1000 // 2 min TTL
  })
}

export function verifyCaptcha(id: string, selectedCells: number[]): boolean {
  const entry = store.get(id)
  if (!entry) return false
  if (Date.now() > entry.expires) return false
  store.delete(id)
  
  // Check if selected cells exactly match correct cells
  if (selectedCells.length !== entry.correctCells.length) return false
  
  // Sort and compare
  const correct = [...entry.correctCells].sort((a, b) => a - b)
  const selected = [...selectedCells].sort((a, b) => a - b)
  
  return JSON.stringify(correct) === JSON.stringify(selected)
}
