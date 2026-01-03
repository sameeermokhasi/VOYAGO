import { useEffect, useRef } from 'react'

export default function RideChart({ data }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!data || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Simple bar chart
    const barWidth = width / data.length - 10
    const maxValue = Math.max(...data.map(d => d.value))

    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * (height - 40)
      const x = index * (barWidth + 10) + 10
      const y = height - barHeight - 20

      // Draw bar
      const gradient = ctx.createLinearGradient(0, y, 0, height)
      gradient.addColorStop(0, '#22c55e')
      gradient.addColorStop(1, '#16a34a')
      
      ctx.fillStyle = gradient
      ctx.fillRect(x, y, barWidth, barHeight)

      // Draw label
      ctx.fillStyle = '#6b7280'
      ctx.font = '12px Inter'
      ctx.textAlign = 'center'
      ctx.fillText(item.label, x + barWidth / 2, height - 5)

      // Draw value
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 14px Inter'
      ctx.fillText(item.value, x + barWidth / 2, y - 5)
    })
  }, [data])

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={300}
      className="w-full h-auto"
    />
  )
}
