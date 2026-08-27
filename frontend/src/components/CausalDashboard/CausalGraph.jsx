import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const NODE_COLORS = {
  BEHAVIOR:       { fill: 'rgba(239,68,68,0.15)',  stroke: '#EF4444', text: '#FCA5A5' },
  PATTERN:        { fill: 'rgba(249,115,22,0.15)', stroke: '#F97316', text: '#FDC396' },
  IMPACT:         { fill: 'rgba(234,179,8,0.15)',  stroke: '#EAB308', text: '#FDE047' },
  COUNTERFACTUAL: { fill: 'rgba(139,92,246,0.15)', stroke: '#8B5CF6', text: '#C4B5FD' },
  DECISION:       { fill: 'rgba(13,148,251,0.15)', stroke: '#0D94FB', text: '#7DD3FC' },
  UNCERTAINTY:    { fill: 'rgba(245,158,11,0.15)', stroke: '#F59E0B', text: '#FCD34D' },
}

export default function CausalGraph({ data }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!data || !svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const container = svgRef.current.parentElement
    const nodes = data.nodes || []
    const W = Math.max(container.clientWidth || 320, (nodes.length || 0) * 140 + 80)
    const H = container.clientHeight || 360

    svg.attr('width', W).attr('height', H).attr('viewBox', `0 0 ${W} ${H}`)

    const defs = svg.append('defs')

    // Arrow marker
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'rgba(13,148,251,0.6)')

    const edges = data.edges || []

    // Layout: horizontal left-to-right based on x position
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))
    const xMin = Math.min(...nodes.map(n => n.x ?? 0))
    const xMax = Math.max(...nodes.map(n => n.x ?? 0)) || 1
    const yMin = Math.min(...nodes.map(n => n.y ?? 0))
    const yMax = Math.max(...nodes.map(n => n.y ?? 0)) || 1

    const padding = 60
    const scaleX = d3.scaleLinear().domain([xMin, xMax]).range([padding, W - padding])
    const scaleY = d3.scaleLinear().domain([yMin - 0.5, yMax + 0.5]).range([padding, H - padding])

    const nodeCoords = nodes.map(n => ({
      ...n,
      cx: scaleX(n.x ?? 0),
      cy: scaleY(n.y ?? 0),
    }))
    const coordMap = Object.fromEntries(nodeCoords.map(n => [n.id, n]))

    // Edges
    const edgeGroup = svg.append('g').attr('class', 'edges')
    edges.forEach((edge) => {
      const s = coordMap[edge.source]
      const t = coordMap[edge.target]
      if (!s || !t) return
      edgeGroup.append('line')
        .attr('x1', s.cx).attr('y1', s.cy)
        .attr('x2', t.cx).attr('y2', t.cy)
        .attr('stroke', 'rgba(13,148,251,0.35)')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5 4')
        .attr('marker-end', 'url(#arrow)')
        .style('animation', 'dash-flow 3s linear infinite')
    })

    // Nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes')
    nodeCoords.forEach((node) => {
      const colors = NODE_COLORS[node.type] || NODE_COLORS.BEHAVIOR
      const g = nodeGroup.append('g')
        .attr('transform', `translate(${node.cx},${node.cy})`)
        .style('cursor', 'pointer')

      const rectW = 110
      const rectH = 52

      // Glow filter
      const filterId = `glow-${node.id}`
      const filter = defs.append('filter').attr('id', filterId)
      filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur')
      const feMerge = filter.append('feMerge')
      feMerge.append('feMergeNode').attr('in', 'coloredBlur')
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

      // Rect
      g.append('rect')
        .attr('x', -rectW / 2).attr('y', -rectH / 2)
        .attr('width', rectW).attr('height', rectH)
        .attr('rx', 8).attr('ry', 8)
        .attr('fill', colors.fill)
        .attr('stroke', colors.stroke)
        .attr('stroke-width', node.type === 'DECISION' ? 2 : 1)
        .attr('filter', node.type === 'DECISION' ? `url(#${filterId})` : null)

      // Type label
      g.append('text')
        .attr('y', -rectH / 2 + 11)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.stroke)
        .attr('font-size', 8)
        .attr('font-weight', 700)
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('letter-spacing', 1)
        .text(node.type)

      // Label
      const words = (node.label || '').split(' ')
      const line1 = words.slice(0, 2).join(' ')
      const line2 = words.slice(2).join(' ')
      g.append('text')
        .attr('y', line2 ? -2 : 4)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.text)
        .attr('font-size', 10)
        .attr('font-weight', 600)
        .attr('font-family', 'Space Grotesk, sans-serif')
        .text(line1)
      if (line2) {
        g.append('text')
          .attr('y', 12)
          .attr('text-anchor', 'middle')
          .attr('fill', colors.text)
          .attr('font-size', 10)
          .attr('font-weight', 600)
          .attr('font-family', 'Space Grotesk, sans-serif')
          .text(line2)
      }

      // Confidence bar at bottom
      const conf = node.confidence || 0.9
      const barW = rectW - 16
      g.append('rect')
        .attr('x', -barW / 2).attr('y', rectH / 2 - 8)
        .attr('width', barW).attr('height', 3)
        .attr('rx', 1.5)
        .attr('fill', 'rgba(255,255,255,0.1)')
      g.append('rect')
        .attr('x', -barW / 2).attr('y', rectH / 2 - 8)
        .attr('width', barW * conf).attr('height', 3)
        .attr('rx', 1.5)
        .attr('fill', colors.stroke)
        .attr('opacity', 0.8)
    })

    // Animate nodes in
    nodeGroup.selectAll('g')
      .attr('opacity', 0)
      .transition()
      .delay((_, i) => i * 120)
      .duration(400)
      .attr('opacity', 1)

  }, [data])

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 280, overflowX: 'auto', overflowY: 'hidden' }}>
      <svg ref={svgRef} style={{ width: '100%', minWidth: Math.max(320, (data?.nodes?.length || 0) * 140 + 80), height: '100%' }} />
    </div>
  )
}
