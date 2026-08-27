import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchMerchants, createBattleSession } from '../hooks/api'
import CausalGraph from '../components/CausalDashboard/CausalGraph'
import AgentAvatar from '../components/Arena/AgentAvatar'
import BattleLog from '../components/Arena/BattleLog'
import ThreatMeter from '../components/Arena/ThreatMeter'
import CheckoutWidget from '../components/Arena/CheckoutWidget'
import NegotiationChat from '../components/Arena/NegotiationChat'

const formatINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`

export default function ArenaPage() {
  const [merchants, setMerchants] = useState([])
  const [selectedMerchant, setSelectedMerchant] = useState('m001')
  const [sessionId, setSessionId] = useState(null)
  const [arenaState, setArenaState] = useState({
    phase: 'idle',
    generation: 1,
    red_attacks: 0,
    blue_blocks: 0,
    margin_health: 100,
    harm_prevented_inr: 0,
    redGen: 1,
    blueGen: 1,
  })
  const [logs, setLogs] = useState([])
  const [causalData, setCausalData] = useState(null)
  const [currentAttack, setCurrentAttack] = useState(null)
  const [currentDefense, setCurrentDefense] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [llmTurns, setLlmTurns] = useState([])
  const [llmModel, setLlmModel] = useState('template')
  const [isNegotiating, setIsNegotiating] = useState(false)
  const wsRef = useRef(null)
  const currentAttackRef = useRef(null)

  useEffect(() => {
    fetchMerchants().then(d => setMerchants(d.merchants || [])).catch(() => {})
  }, [])

  const addLog = useCallback((type, text, color) => {
    const entry = {
      id: Date.now() + Math.random(),
      type,
      text,
      color,
      time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    }
    setLogs(prev => [...prev.slice(-200), entry])
  }, [])

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'SESSION_STARTED':
        addLog('metric', `Battle session started for merchant ${data.merchant_id}`, 'var(--ac-dodger)')
        break
      case 'PHASE':
        if (data.phase === 'ATTACK') setArenaState(s => ({ ...s, phase: 'attacking' }))
        if (data.phase === 'DEFENSE') setArenaState(s => ({ ...s, phase: 'defending' }))
        addLog('metric', data.message, 'var(--text-muted)')
        break
      case 'LLM_TURN':
        setIsNegotiating(true)
        if (data.status === 'done') {
          setLlmTurns(prev => [...prev, { role: data.role, message: data.message }])
          setLlmModel(data.model || 'template')
        } else {
          // generating state  show spinner log
          addLog('defense', `[LLM] ${data.message}`, 'var(--purple-acc)')
        }
        break
      case 'ATTACK_STEP':
        addLog('attack', `[RED] ${data.message}`, 'var(--red-team)')
        break
      case 'DEFENSE_STEP':
        addLog('defense', `[BLU] ${data.message}`, 'var(--ac-dodger)')
        break
      case 'ATTACK':
        setCurrentAttack(data)
        currentAttackRef.current = data
        addLog('attack', `”ï¸ ATTACK: ${data.strategy_name}  Impact: ${formatINR(data.impact_inr)}`, 'var(--red-team)')
        break
      case 'DEFENSE':
        setCurrentDefense(data)
        if (data.causal_chain?.length) {
          const chain = data.causal_chain
          setCausalData({
            nodes: chain.map((n, i) => ({ ...n, id: n.id || `n${i}`, x: i, y: 0 })),
            edges: chain.slice(1).map((_, i) => ({
              source: chain[i].id || `n${i}`,
              target: chain[i + 1].id || `n${i + 1}`,
              label: 'causes',
            })),
            strategy: currentAttackRef.current?.strategy,
            blocked: data.blocked,
            confidence: data.confidence,
          })
        }
        addLog(
          'defense',
          `¸ DEFENSE: ${data.policy_name}  ${data.blocked ? ' BLOCKED' : ' PASSED'} (conf: ${(data.confidence * 100).toFixed(1)}%)`,
          data.blocked ? 'var(--green-safe)' : 'var(--amber-warn)'
        )
        break
      case 'EPISTEMIC_ESCALATION':
        addLog('escalation', ` ï¸ UNCERTAIN: ${data.message}`, 'var(--amber-warn)')
        break
      case 'EVOLUTION':
        addLog('evolution', ` EVOLVED: ${data.message}`, 'var(--purple-acc)')
        break
      case 'METRIC':
        setArenaState(s => ({
          ...s,
          phase: 'idle',
          generation: data.generation,
          red_attacks: data.red_attacks,
          blue_blocks: data.blue_blocks,
          margin_health: data.margin_health,
          harm_prevented_inr: data.harm_prevented_inr,
          redGen: data.red_generation,
          blueGen: data.blue_generation,
        }))
        break
      default: break
    }
  }, [addLog])

  // Establish WebSocket when sessionId changes
  useEffect(() => {
    if (!sessionId) return
    const ws = new WebSocket(`ws://localhost:8000/api/arena/ws/${sessionId}`)
    wsRef.current = ws
    ws.onmessage = (e) => {
      try { handleMessage(JSON.parse(e.data)) } catch {}
    }
    ws.onerror = () => addLog('metric', 'WebSocket connection error', 'var(--red-team)')
    ws.onclose = () => {
      setIsRunning(false)
      addLog('metric', 'Battle session ended', 'var(--text-muted)')
    }
    return () => ws.close()
  }, [sessionId, handleMessage, addLog])

  const sendWs = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const launchArena = async () => {
    try {
      addLog('metric', ' Initiating adversarial battle session...', 'var(--ac-dodger)')
      const session = await createBattleSession(selectedMerchant)
      setSessionId(session.session_id)
      setIsRunning(true)
      setIsPaused(false)
      setLogs([])
      setArenaState({ phase: 'idle', generation: 1, red_attacks: 0, blue_blocks: 0, margin_health: 100, harm_prevented_inr: 0, redGen: 1, blueGen: 1 })
    } catch (e) {
      addLog('metric', `Error: ${e.message}. Is the backend running on port 8000?`, 'var(--red-team)')
    }
  }

  const pause  = () => { setIsPaused(true);  sendWs({ type: 'PAUSE' }) }
  const resume = () => { setIsPaused(false); sendWs({ type: 'RESUME' }) }
  const reset  = () => {
    sendWs({ type: 'RESET' })
    setIsRunning(false)
    setSessionId(null)
    setLogs([])
    setCurrentAttack(null)
    setCurrentDefense(null)
    setCausalData(null)
    setLlmTurns([])
    setIsNegotiating(false)
    setArenaState({ phase: 'idle', generation: 1, red_attacks: 0, blue_blocks: 0, margin_health: 100, harm_prevented_inr: 0, redGen: 1, blueGen: 1 })
  }
  const changeSpeed = (s) => { setSpeed(s); sendWs({ type: 'SPEED', speed: s }) }

  const blockRate = arenaState.red_attacks > 0
    ? ((arenaState.blue_blocks / arenaState.red_attacks) * 100).toFixed(1)
    : '0.0'

  const merchantName = merchants.find(m => m.id === selectedMerchant)?.name

  return (
    <div className="page-container fade-in" style={{ paddingBottom: '1rem' }}>
      {/* Page header + controls */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Live Arena</h1>
          <p className="page-subtitle">Adversarial self-play gym  Red Team vs. Blue Team in real-time</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {!isRunning && (
            <>
              <select
                className="form-select"
                style={{ width: 200 }}
                value={selectedMerchant}
                onChange={e => setSelectedMerchant(e.target.value)}
              >
                {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <button id="launch-arena-btn" className="btn btn-primary btn-lg" onClick={launchArena}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Launch Arena
              </button>
            </>
          )}

          {isRunning && (
            <>
              {/* Speed controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Speed</span>
                {[0.5, 1, 2, 3].map(s => (
                  <button
                    key={s}
                    className={`btn btn-sm ${speed === s ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => changeSpeed(s)}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {isPaused
                ? <button className="btn btn-success" onClick={resume}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Resume
                  </button>
                : <button className="btn btn-secondary" onClick={pause}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                    </svg>
                    Pause
                  </button>
              }

              <button className="btn btn-danger btn-sm" onClick={reset}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.84"/>
                </svg>
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main arena layout */}
      <div className="arena-layout">
        {/* LEFT: agents + checkout + metrics + log */}
        <div className="arena-main">
          {/* Agent row */}
          <div className="arena-agents-row">
            <AgentAvatar
              type="red"
              generation={arenaState.redGen}
              isActive={arenaState.phase === 'attacking'}
              attacks={arenaState.red_attacks}
              currentStrategy={currentAttack}
            />
            <div className="vs-badge">VS</div>
            <AgentAvatar
              type="blue"
              generation={arenaState.blueGen}
              isActive={arenaState.phase === 'defending'}
              blocks={arenaState.blue_blocks}
              blockRate={blockRate}
            />
          </div>

          {/* Checkout + Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <CheckoutWidget merchantName={merchantName} phase={arenaState.phase} />
            <ThreatMeter
              marginHealth={arenaState.margin_health}
              harmPrevented={arenaState.harm_prevented_inr}
              generation={arenaState.generation}
              blockRate={blockRate}
            />
          </div>

          {/* Battle Log */}
          <BattleLog logs={logs} isRunning={isRunning} />
        </div>

        {/* RIGHT: Causal graph + policy detail + negotiation chat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
          {/* LLM Negotiation Chat  shown when adversarial_negotiation is active */}
          {(isNegotiating || currentAttack?.strategy === 'adversarial_negotiation') && (
            <div className="card scale-in">
              <div className="card-header">
                <span className="card-title"> Live LLM Negotiation</span>
                <span className="badge" style={{
                  background: llmModel !== 'template' ? 'rgba(13,148,251,0.15)' : 'rgba(136,136,136,0.1)',
                  color: llmModel !== 'template' ? 'var(--ac-dodger)' : 'var(--text-muted)',
                  border: `1px solid ${llmModel !== 'template' ? 'rgba(13,148,251,0.3)' : 'rgba(136,136,136,0.2)'}`,
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {llmModel}
                </span>
              </div>
              <div className="card-body">
                <NegotiationChat
                  turns={llmTurns}
                  modelUsed={llmModel}
                  isLive={arenaState.phase === 'defending' && currentAttack?.strategy === 'adversarial_negotiation'}
                />
              </div>
            </div>
          )}
          {/* Causal DAG */}
          <div className="card" style={{ flex: 1, minHeight: 400 }}>
            <div className="card-header">
              <span className="card-title">Causal Attribution DAG</span>
              {currentDefense && (
                <span className={`badge ${currentDefense.blocked ? 'badge-green' : 'badge-amber'}`}>
                  {currentDefense.blocked ? 'BLOCKED' : 'PASSED'}
                </span>
              )}
            </div>
            <div style={{ height: 'calc(100% - 52px)', padding: '0.75rem' }}>
              {causalData ? (
                <CausalGraph data={causalData} />
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: '0.75rem',
                  color: 'var(--text-muted)',
                  opacity: 0.5,
                }}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p style={{ fontSize: '0.78rem', textAlign: 'center', maxWidth: 200 }}>
                    Causal DAG will appear after first defense event
                  </p>
                </div>
              )}
            </div>

            {/* Node type legend */}
            {causalData && (
              <div className="causal-legend">
                {[
                  { type: 'BEHAVIOR', color: '#EF4444' },
                  { type: 'PATTERN', color: '#F97316' },
                  { type: 'IMPACT', color: '#EAB308' },
                  { type: 'COUNTERFACTUAL', color: '#8B5CF6' },
                  { type: 'DECISION', color: '#0D94FB' },
                ].map(n => (
                  <div key={n.type} className="legend-item">
                    <div className="legend-dot" style={{ background: n.color }} />
                    {n.type}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active defense policy */}
          {currentDefense && (
            <div className="card scale-in">
              <div className="card-header">
                <span className="card-title" style={{ fontSize: '0.8rem' }}>Active Defense Policy</span>
                <span className="badge badge-blue" style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)' }}>
                  {currentDefense.policy_id}
                </span>
              </div>
              <div className="card-body" style={{ padding: '0.875rem 1.25rem' }}>
                <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  {currentDefense.policy_name}
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Confidence: <strong style={{ color: 'var(--ac-dodger)' }}>
                      {(currentDefense.confidence * 100).toFixed(1)}%
                    </strong>
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Harm Prevented: <strong style={{ color: 'var(--green-safe)' }}>
                      {formatINR(currentDefense.harm_prevented_inr)}
                    </strong>
                  </span>
                </div>
                {currentDefense.epistemic_escalate && (
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    color: 'var(--amber-warn)',
                    lineHeight: 1.5,
                  }}>
                     ï¸ {currentDefense.escalation_message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current attack detail */}
          {currentAttack && (
            <div className="card scale-in">
              <div className="card-header">
                <span className="card-title" style={{ fontSize: '0.8rem' }}>Active Attack Vector</span>
                <span className="badge badge-red" style={{ fontSize: '0.62rem' }}>
                  {currentAttack.severity}
                </span>
              </div>
              <div className="card-body" style={{ padding: '0.875rem 1.25rem' }}>
                <p style={{ fontSize: '0.84rem', fontWeight: 700, color: currentAttack.color, marginBottom: '0.3rem' }}>
                  {currentAttack.strategy_name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {currentAttack.description}
                </p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Estimated Impact: <strong style={{ color: 'var(--red-team)' }}>
                    {formatINR(currentAttack.impact_inr)}
                  </strong>
                  {' '}Â· Gen <strong style={{ color: 'var(--text-primary)' }}>{currentAttack.generation}</strong>
                  {' '}Â· x<strong style={{ color: 'var(--amber-warn)' }}>{currentAttack.evolution_multiplier}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
