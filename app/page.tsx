"use client"
import { useState } from "react"

interface GridSize {
  rows: number
  cols: number
}

interface ImageSize {
  width: number
  height: number
}

export default function Home() {
  const [captchaId, setCaptchaId] = useState("")
  const [captchaImage, setCaptchaImage] = useState("")
  const [gridSize, setGridSize] = useState<GridSize | null>(null)
  const [imageSize, setImageSize] = useState<ImageSize | null>(null)
  const [selectedCells, setSelectedCells] = useState<Set<number>>(new Set())
  const [result, setResult] = useState<string | null>(null)

  async function uploadImage(file: File) {
    const fd = new FormData()
    fd.append("image", file)

    const res = await fetch("/api/captcha/create", {
      method: "POST",
      body: fd
    })

    const data = await res.json()
    setCaptchaId(data.captchaId)
    setCaptchaImage(data.image)
    setGridSize(data.gridSize)
    setImageSize(data.imageSize)
    setSelectedCells(new Set())
    setResult(null)
  }

  function toggleCell(cellIndex: number) {
    setSelectedCells(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cellIndex)) {
        newSet.delete(cellIndex)
      } else {
        newSet.add(cellIndex)
      }
      return newSet
    })
  }

  async function verify() {
    const res = await fetch("/api/captcha/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        captchaId, 
        selectedCells: Array.from(selectedCells).sort((a, b) => a - b)
      })
    })

    const data = await res.json()
    setResult(data.success ? "✅ Verified" : "❌ Failed")
  }

  async function downloadImage() {
    if (selectedCells.size === 0) return

    try {
      const res = await fetch("/api/captcha/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: captchaImage,
          selectedCells: Array.from(selectedCells).sort((a, b) => a - b),
          gridSize,
          imageSize
        })
      })

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "captcha-selected.png"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading image:", error)
      alert("Failed to download image. Please try again.")
    }
  }

  function shareOnLinkedIn() {
    if (selectedCells.size === 0) return

    // For LinkedIn sharing, we'll use the share API with a text
    // Note: LinkedIn's share URL requires a URL to share, so we'll prompt download first
    // or use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: "Check out my image captcha selection!",
        text: "I've selected some interesting areas in this image captcha",
        url: window.location.href
      }).catch(err => {
        console.log("Error sharing:", err)
        // Fallback to LinkedIn share URL
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`
        window.open(linkedInUrl, "_blank")
      })
    } else {
      // Fallback: Open LinkedIn share dialog
      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`
      window.open(linkedInUrl, "_blank")
    }
  }

  if (!gridSize || !imageSize) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Image Captcha</h1>
        <p>Upload an image to create a captcha with clickable grid cells</p>
        <input 
          type="file" 
          accept="image/*"
          onChange={e => e.target.files && uploadImage(e.target.files[0])} 
        />
      </div>
    )
  }

  const cellWidth = imageSize.width / gridSize.cols
  const cellHeight = imageSize.height / gridSize.rows

  return (
    <div style={{ padding: 40, maxWidth: 800 }}>
      <h1>Image Captcha</h1>
      <input 
        type="file" 
        accept="image/*"
        onChange={e => e.target.files && uploadImage(e.target.files[0])} 
        style={{ marginBottom: 20 }}
      />

      {captchaImage && (
        <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
          <img 
            src={`data:image/png;base64,${captchaImage}`} 
            alt="Captcha"
            style={{ display: "block", maxWidth: "100%" }}
          />
          
          {/* Grid Overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "grid",
              gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize.rows}, 1fr)`,
              pointerEvents: "auto"
            }}
          >
            {Array.from({ length: gridSize.rows * gridSize.cols }, (_, index) => {
              const isSelected = selectedCells.has(index)
              return (
                <div
                  key={index}
                  onClick={() => toggleCell(index)}
                  style={{
                    border: isSelected ? "4px solid #4a90e2" : "1px solid white",
                    backgroundColor: isSelected ? "rgba(74, 144, 226, 0.2)" : "transparent",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.2s"
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: 4,
                        left: 4,
                        width: 20,
                        height: 20,
                        backgroundColor: "#4a90e2",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: 12,
                        fontWeight: "bold"
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {captchaImage && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <button 
            onClick={verify}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              backgroundColor: "#4a90e2",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            Verify
          </button>
          <button
            onClick={() => {
              setSelectedCells(new Set())
              setResult(null)
            }}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              backgroundColor: "#ccc",
              color: "black",
              border: "none",
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            Reset
          </button>
          <button
            onClick={downloadImage}
            disabled={selectedCells.size === 0}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              backgroundColor: selectedCells.size === 0 ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: selectedCells.size === 0 ? "not-allowed" : "pointer",
              opacity: selectedCells.size === 0 ? 0.6 : 1
            }}
          >
            📥 Download Image
          </button>
          <button
            onClick={shareOnLinkedIn}
            disabled={selectedCells.size === 0}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              backgroundColor: selectedCells.size === 0 ? "#ccc" : "#0077b5",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: selectedCells.size === 0 ? "not-allowed" : "pointer",
              opacity: selectedCells.size === 0 ? 0.6 : 1
            }}
          >
            🔗 Share on LinkedIn
          </button>
        </div>
      )}

      {result && (
        <p style={{ 
          marginTop: 20, 
          fontSize: 18, 
          fontWeight: "bold",
          color: result.includes("✅") ? "green" : "red"
        }}>
          {result}
        </p>
      )}
    </div>
  )
}
