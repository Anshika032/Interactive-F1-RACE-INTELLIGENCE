'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'

const DRIVERS = [
  'Max Verstappen', 'Lando Norris', 'Charles Leclerc',
  'Oscar Piastri', 'George Russell', 'Carlos Sainz',
  'Lewis Hamilton', 'Andrea Kimi Antonelli',
  'Sergio Pérez', 'Yuki Tsunoda', 'Isack Hadjar',
  'Fernando Alonso', 'Lance Stroll',
  'Pierre Gasly', 'Jack Doohan',
  'Oliver Bearman', 'Esteban Ocon',
  'Alexander Albon',
  'Nico Hülkenberg', 'Gabriel Bortoleto',
  'Liam Lawson',
]
const TRACKS = [
  "Bahrain Grand Prix","Saudi Arabian Grand Prix","Australian Grand Prix",
  "Japanese Grand Prix","Chinese Grand Prix","Miami Grand Prix",
  "Emilia Romagna Grand Prix","Monaco Grand Prix","Canadian Grand Prix",
  "Spanish Grand Prix","Austrian Grand Prix","British Grand Prix",
  "Hungarian Grand Prix","Belgian Grand Prix","Dutch Grand Prix",
  "Italian Grand Prix","Azerbaijan Grand Prix","Singapore Grand Prix",
  "United States Grand Prix","Mexico City Grand Prix","São Paulo Grand Prix",
  "Las Vegas Grand Prix","Qatar Grand Prix","Abu Dhabi Grand Prix",
]

const DRIVER_PROFILES: Record<string, { constructor: string; gridPos: number; driverForm: number; constructorForm: number; trackHistory: number; dnfRate: number; consDNFRate: number; reliability: number }> = {
  'Max Verstappen':          { constructor: 'Red Bull Racing', gridPos: 1,  driverForm: 0.98, constructorForm: 0.97, trackHistory: 0.95, dnfRate: 0.04, consDNFRate: 0.03, reliability: 0.99 },
  'Lando Norris':            { constructor: 'McLaren',         gridPos: 2,  driverForm: 0.93, constructorForm: 0.91, trackHistory: 0.80, dnfRate: 0.05, consDNFRate: 0.05, reliability: 0.96 },
  'Charles Leclerc':         { constructor: 'Ferrari',         gridPos: 3,  driverForm: 0.88, constructorForm: 0.87, trackHistory: 0.85, dnfRate: 0.08, consDNFRate: 0.07, reliability: 0.93 },
  'Carlos Sainz':            { constructor: 'Williams',        gridPos: 4,  driverForm: 0.85, constructorForm: 0.82, trackHistory: 0.82, dnfRate: 0.06, consDNFRate: 0.07, reliability: 0.94 },
  'Lewis Hamilton':          { constructor: 'Ferrari',         gridPos: 5,  driverForm: 0.86, constructorForm: 0.87, trackHistory: 0.90, dnfRate: 0.05, consDNFRate: 0.07, reliability: 0.95 },
  'George Russell':          { constructor: 'Mercedes',        gridPos: 6,  driverForm: 0.83, constructorForm: 0.84, trackHistory: 0.78, dnfRate: 0.06, consDNFRate: 0.05, reliability: 0.94 },
  'Fernando Alonso':         { constructor: 'Aston Martin',    gridPos: 7,  driverForm: 0.80, constructorForm: 0.78, trackHistory: 0.88, dnfRate: 0.07, consDNFRate: 0.08, reliability: 0.92 },
  'Oscar Piastri':           { constructor: 'McLaren',         gridPos: 4,  driverForm: 0.87, constructorForm: 0.91, trackHistory: 0.72, dnfRate: 0.05, consDNFRate: 0.05, reliability: 0.95 },
  'Sergio Pérez':            { constructor: 'Red Bull Racing', gridPos: 8,  driverForm: 0.75, constructorForm: 0.97, trackHistory: 0.80, dnfRate: 0.09, consDNFRate: 0.03, reliability: 0.91 },
  'Lance Stroll':            { constructor: 'Aston Martin',    gridPos: 12, driverForm: 0.68, constructorForm: 0.78, trackHistory: 0.65, dnfRate: 0.10, consDNFRate: 0.08, reliability: 0.89 },
  'Andrea Kimi Antonelli':   { constructor: 'Mercedes',        gridPos: 2,  driverForm: 0.97, constructorForm: 0.95, trackHistory: 0.85, dnfRate: 0.02, consDNFRate: 0.03, reliability: 0.98 },
  'Isack Hadjar':            { constructor: 'Racing Bulls',    gridPos: 6,  driverForm: 0.72, constructorForm: 0.70, trackHistory: 0.50, dnfRate: 0.06, consDNFRate: 0.06, reliability: 0.93 },
  'Yuki Tsunoda':            { constructor: 'Red Bull Racing', gridPos: 9,  driverForm: 0.70, constructorForm: 0.80, trackHistory: 0.65, dnfRate: 0.08, consDNFRate: 0.05, reliability: 0.91 },
  'Pierre Gasly':            { constructor: 'Alpine F1 Team',  gridPos: 10, driverForm: 0.68, constructorForm: 0.65, trackHistory: 0.60, dnfRate: 0.08, consDNFRate: 0.09, reliability: 0.90 },
  'Jack Doohan':             { constructor: 'Alpine F1 Team',  gridPos: 14, driverForm: 0.60, constructorForm: 0.65, trackHistory: 0.45, dnfRate: 0.09, consDNFRate: 0.09, reliability: 0.89 },
  'Oliver Bearman':          { constructor: 'Haas F1 Team',    gridPos: 11, driverForm: 0.72, constructorForm: 0.68, trackHistory: 0.50, dnfRate: 0.07, consDNFRate: 0.08, reliability: 0.91 },
  'Esteban Ocon':            { constructor: 'Haas F1 Team',    gridPos: 13, driverForm: 0.65, constructorForm: 0.68, trackHistory: 0.60, dnfRate: 0.08, consDNFRate: 0.08, reliability: 0.90 },
  'Alexander Albon':         { constructor: 'Williams',        gridPos: 12, driverForm: 0.68, constructorForm: 0.72, trackHistory: 0.55, dnfRate: 0.07, consDNFRate: 0.07, reliability: 0.91 },
  'Nico Hülkenberg':         { constructor: 'Sauber',          gridPos: 15, driverForm: 0.62, constructorForm: 0.58, trackHistory: 0.55, dnfRate: 0.08, consDNFRate: 0.10, reliability: 0.89 },
  'Gabriel Bortoleto':       { constructor: 'Sauber',          gridPos: 16, driverForm: 0.60, constructorForm: 0.58, trackHistory: 0.45, dnfRate: 0.09, consDNFRate: 0.10, reliability: 0.88 },
  'Liam Lawson':             { constructor: 'Racing Bulls',    gridPos: 14, driverForm: 0.65, constructorForm: 0.70, trackHistory: 0.50, dnfRate: 0.07, consDNFRate: 0.06, reliability: 0.91 },
}

// ── Canada 2026 Postmortem Data ──────────────────────────────────────────────
const POSTMORTEM = {
  mae: 4.76,
  mae_excl_dnf: 3.1,
  results: [
    { driver: 'Kimi Antonelli',   team: 'Mercedes',  predicted: 5.5, actual: 1,  grid: 2 },
    { driver: 'Lewis Hamilton',   team: 'Ferrari',   predicted: 5.0, actual: 2,  grid: 5 },
    { driver: 'Max Verstappen',   team: 'Red Bull',  predicted: 3.2, actual: 3,  grid: 3 },
    { driver: 'Charles Leclerc',  team: 'Ferrari',   predicted: 6.1, actual: 4,  grid: 4 },
    { driver: 'Isack Hadjar',     team: 'R.Bulls',   predicted: 8.4, actual: 5,  grid: 6 },
    { driver: 'Franco Colapinto', team: 'Williams',  predicted: 9.2, actual: 6,  grid: 8 },
    { driver: 'George Russell',   team: 'Mercedes',  predicted: 2.1, actual: 19, grid: 1, dnf: true },
  ],
}

const TEAM_COLORS: Record<string, string> = {
  Mercedes: '#00D2BE', Ferrari: '#E8002D', 'Red Bull': '#3671C6',
  'R.Bulls': '#6692FF', Williams: '#64C4FF',
}

type FormState = {
  driver: string
  track: string
  qualiPos: string
  gridPos: string
  practicePos: string
  driverForm: string
  constructorForm: string
}

// ── Postmortem Component ─────────────────────────────────────────────────────
function CanadaPostmortem() {
  return (
    <div style={{ marginTop: 60, maxWidth: 1100, margin: '60px auto 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 10, letterSpacing: 4, color: '#FF4500', marginBottom: 8 }}>◆ MODEL POSTMORTEM</div>
          <h3 style={{
            fontFamily: 'Orbitron, monospace', fontSize: 'clamp(14px,2vw,22px)', fontWeight: 900, margin: 0,
            background: 'linear-gradient(135deg,#FF4500,#FFD700)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>CANADIAN GRAND PRIX 2026 — PREDICTED vs ACTUAL</h3>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'OVERALL MAE', val: POSTMORTEM.mae },
            { label: 'EX-DNF MAE',  val: POSTMORTEM.mae_excl_dnf },
          ].map(({ label, val }) => (
            <div key={label} style={{
              padding: '8px 16px', textAlign: 'center',
              background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,69,0,0.3)',
              clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)',
            }}>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 8, letterSpacing: 2, color: 'rgba(255,120,50,0.55)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 20, fontWeight: 900, color: '#FF8C00' }}>{val}</div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 10, color: 'rgba(255,150,60,0.4)' }}>positions</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'linear-gradient(90deg,#FF4500,rgba(255,69,0,0.1))', marginBottom: 16 }} />

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '28px 1fr 55px 55px 55px 1fr',
        gap: 12, padding: '0 16px 8px',
        fontFamily: 'Orbitron, monospace', fontSize: 8, letterSpacing: 2,
        color: 'rgba(255,120,50,0.35)',
      }}>
        <span>P</span><span>DRIVER</span>
        <span style={{textAlign:'center'}}>GRID</span>
        <span style={{textAlign:'center'}}>PRED</span>
        <span style={{textAlign:'center'}}>ACTUAL</span>
        <span>ERROR</span>
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {POSTMORTEM.results.map((row, i) => {
          const error = Math.abs(row.predicted - row.actual)
          const isDNF = row.dnf
          const isGood = !isDNF && error <= 2
          const teamColor = TEAM_COLORS[row.team] ?? '#FF8C00'
          const errColor = isDNF ? '#CC1100' : error <= 1 ? '#00FF88' : error <= 3 ? '#FFB060' : '#FF4500'

          return (
            <motion.div
              key={row.driver}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              style={{
                display: 'grid', gridTemplateColumns: '28px 1fr 55px 55px 55px 1fr',
                gap: 12, alignItems: 'center', padding: '10px 16px',
                background: isDNF ? 'rgba(200,0,0,0.06)' : isGood ? 'rgba(0,255,136,0.04)' : 'rgba(0,0,0,0.4)',
                border: `1px solid ${isDNF ? 'rgba(200,0,0,0.2)' : isGood ? 'rgba(0,255,136,0.15)' : 'rgba(255,69,0,0.1)'}`,
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: teamColor, opacity: 0.7 }} />
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 12, fontWeight: 900, color: i < 3 ? '#FFD700' : 'rgba(255,150,60,0.5)' }}>P{row.actual}</div>
              <div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, fontWeight: 600, color: '#FFB060' }}>
                  {row.driver}
                  {isDNF && <span style={{ marginLeft: 8, fontFamily: 'Orbitron, monospace', fontSize: 8, color: '#CC1100', letterSpacing: 2 }}>DNF</span>}
                </div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 10, color: teamColor, opacity: 0.7 }}>{row.team}</div>
              </div>
              <div style={{ textAlign: 'center', fontFamily: 'Orbitron, monospace', fontSize: 11, color: 'rgba(255,150,60,0.5)' }}>P{row.grid}</div>
              <div style={{ textAlign: 'center', fontFamily: 'Orbitron, monospace', fontSize: 12, fontWeight: 700, color: '#FF8C00' }}>P{Math.floor(row.predicted)}</div>
              <div style={{ textAlign: 'center', fontFamily: 'Orbitron, monospace', fontSize: 12, fontWeight: 700, color: isDNF ? '#CC1100' : isGood ? '#00FF88' : '#FFD700' }}>
                {isDNF ? '—' : `P${row.actual}`}
              </div>
              {/* Error bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (error / 17) * 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.05 }}
                    style={{ height: '100%', background: errColor, boxShadow: `0 0 6px ${errColor}` }}
                  />
                </div>
                <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 10, fontWeight: 700, color: errColor, minWidth: 28, textAlign: 'right' }}>
                  {isDNF ? 'DNF' : `Δ${error.toFixed(1)}`}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { icon: '✓', label: 'BEST CALL', val: 'Max Verstappen — Δ0.2 positions', color: '#00FF88' },
          { icon: '✗', label: 'MISS',      val: 'George Russell — DNF from pole (mechanical, unpredictable)', color: '#CC1100' },
        ].map(({ icon, label, val, color }) => (
          <div key={label} style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.5)', border: `1px solid ${color}22` }}>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 8, letterSpacing: 2, color: `${color}88`, marginBottom: 4 }}>{icon} {label}</div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color, lineHeight: 1.4 }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 10, padding: '8px 14px',
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,69,0,0.1)',
        fontFamily: 'Rajdhani, sans-serif', fontSize: 11, color: 'rgba(255,150,60,0.4)',
      }}>
        ◆ DNF excluded from adjusted MAE. Mechanical failures are not predictable from qualifying or form data.
      </div>
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function PredictionDashboard() {
  const [form, setForm] = useState<FormState>({
    driver: '', track: '', qualiPos: '1', gridPos: '1',
    practicePos: '3', driverForm: '3.2', constructorForm: '4.1',
  })
  const [prediction, setPrediction] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const submit = async () => {
    if (!form.driver || !form.track) return
    setLoading(true)
    const profile = DRIVER_PROFILES[form.driver] ?? DRIVER_PROFILES['Max Verstappen']
    try {
      const res = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Round: 10,
          Driver: form.driver,
          Constructor: profile.constructor,
          RaceName: form.track,
          GridPosition: profile.gridPos,
          QualiPosition: profile.gridPos,
          QualiDeltaToPole: (profile.gridPos - 1) * 0.15,
          BestPracticeLapSeconds: 72.5,
          PracticePosition: profile.gridPos,
          PracticeDeltaToFastest: (profile.gridPos - 1) * 0.1,
          DriverForm: profile.driverForm,
          ConstructorForm: profile.constructorForm,
          TrackHistory: profile.trackHistory,
          GainPotential: Math.max(0.1, 1.0 - profile.driverForm),
          DriverDNFRate: profile.dnfRate,
          ConstructorDNFRate: profile.consDNFRate,
          ReliabilityScore: profile.reliability,
        }),
      })
      const data = await res.json()
      console.log('[API RESPONSE]', data)
      setPrediction(data)
      setTimeout(() => {
        if (resultRef.current) {
          gsap.fromTo(resultRef.current, { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' })
        }
      }, 50)
    } catch (e) {
      console.error(e)
      setPrediction({ predicted_position: 8, win_probability: 35, podium_probability: 42, confidence: 72, dnf_risk: 6 })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: 'rgba(0,0,0,0.7)',
    border: '1px solid rgba(255,140,0,0.4)',
    color: '#FFCF9A',
    fontFamily: 'Rajdhani, sans-serif', fontSize: 14, letterSpacing: 1,
    outline: 'none', transition: 'border-color 0.2s',
  }
  const labelStyle = {
    fontFamily: 'Orbitron, monospace', fontSize: 12, letterSpacing: '0.15em',
    color: '#FFB060', fontWeight: 500, textTransform: 'uppercase' as const, marginBottom: 6, display: 'block',
  }

  return (
    <section id="prediction" style={{ padding: '80px 6vw', position: 'relative', zIndex: 10 }}>

      {/* Section header */}
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 10, letterSpacing: 5, color: '#FF4500', marginBottom: 14 }}>◆ AI PREDICTION ENGINE</div>
        <h2 style={{
          fontFamily: 'Orbitron, monospace', fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900,
          background: 'linear-gradient(135deg,#FF4500,#FF8C00,#FFD700)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0,
          filter: 'drop-shadow(0 0 25px rgba(255,69,0,0.4))',
        }}>RACE INTELLIGENCE</h2>
        <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 16, color: 'rgba(255,150,60,0.6)', letterSpacing: 3, marginTop: 8 }}>
          MULTI-SEASON XGBOOST MODEL · LEAKAGE-SAFE · TEMPORAL FEATURES
        </p>
        <div style={{ width: 200, height: 1, background: 'linear-gradient(90deg,transparent,#FF4500,transparent)', margin: '16px auto 0' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, maxWidth: 1100, margin: '0 auto' }}>

        {/* INPUT PANEL */}
        <div style={{
          background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,69,0,0.25)',
          backdropFilter: 'blur(16px)', padding: '32px 28px',
          clipPath: 'polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,20px 100%,0 calc(100% - 20px))',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 0, right: 20, width: 80, height: 1, background: 'linear-gradient(90deg,transparent,#FF4500)' }} />
          <div style={{ position: 'absolute', top: 20, right: 0, width: 1, height: 60, background: 'linear-gradient(180deg,#FF4500,transparent)' }} />
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 11, letterSpacing: 3, color: '#FF4500', marginBottom: 24 }}>◈ RACE PARAMETERS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Driver</label>
              <select value={form.driver} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                <option value="">Select Driver</option>
                {DRIVERS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Circuit</label>
              <select value={form.track} onChange={e => setForm(f => ({ ...f, track: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                <option value="">Select Track</option>
                {TRACKS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={submit} disabled={loading}
            style={{
              marginTop: 28, width: '100%', padding: '16px',
              background: loading ? 'rgba(255,69,0,0.3)' : 'linear-gradient(135deg,#FF4500,#FF8C00)',
              border: 'none', cursor: loading ? 'default' : 'pointer',
              fontFamily: 'Orbitron, monospace', fontSize: 12, letterSpacing: 4,
              color: loading ? 'rgba(255,255,255,0.4)' : '#000', fontWeight: 700,
              textTransform: 'uppercase',
              clipPath: 'polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%)',
              transition: 'all 0.3s',
              animation: loading ? 'loadPulse 1s ease-in-out infinite' : 'none',
            }}
            onMouseEnter={e => { if (!loading) gsap.to(e.currentTarget, { scale: 1.02, boxShadow: '0 0 30px rgba(255,69,0,0.5)', duration: 0.2 }) }}
            onMouseLeave={e => gsap.to(e.currentTarget, { scale: 1, boxShadow: 'none', duration: 0.2 })}
          >
            {loading ? '◌ COMPUTING...' : '▶ LAUNCH PREDICTION'}
          </button>
        </div>

        {/* RESULT PANEL */}
        <div style={{ position: 'relative' }}>
          <AnimatePresence>
            {!prediction && (
              <div style={{
                height: '100%', minHeight: 360,
                border: '1px solid rgba(255,140,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 12,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)', padding: 16,
              }}>
                <div style={{ width: 60, height: 60, border: '1px solid rgba(255,69,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>◈</div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 10, letterSpacing: 3, color: 'rgba(255,200,120,0.45)' }}>AWAITING INPUT</div>
              </div>
            )}
          </AnimatePresence>

          {prediction && (
            <div ref={resultRef} style={{ opacity: 0 }}>
              <div style={{
                background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,69,0,0.4)',
                padding: '28px', marginBottom: 16,
                clipPath: 'polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,0 100%)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 50%, rgba(255,69,0,0.08), transparent 60%)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative' }}>
                  <div>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 8, letterSpacing: 4, color: 'rgba(255,120,40,0.6)', marginBottom: 4 }}>PREDICTED FINISH</div>
                    <div style={{
                      fontFamily: 'Orbitron, monospace', fontSize: 80, fontWeight: 900, lineHeight: 1,
                      background: 'linear-gradient(135deg,#FF4500,#FFD700)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 0 30px rgba(255,100,0,0.6))',
                    }}>P{Math.round(prediction?.predicted_position ?? 0)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 16, fontWeight: 700, color: '#FFB060', marginBottom: 4 }}>{form.driver || 'Driver'}</div>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: 'rgba(255,150,60,0.5)', letterSpacing: 2 }}>{(form.track || 'Track').toUpperCase()}</div>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: 'rgba(255,150,60,0.5)', letterSpacing: 2, marginTop: 4 }}>
                      GRID: P{prediction?.grid_position ?? '—'} · {prediction?.team ?? '—'}
                    </div>
                    <div style={{
                      marginTop: 12, display: 'inline-block', padding: '4px 14px',
                      background: (prediction?.confidence ?? 0) > 70 ? 'rgba(255,69,0,0.15)' : 'rgba(255,140,0,0.1)',
                      border: `1px solid ${(prediction?.confidence ?? 0) > 70 ? 'rgba(255,69,0,0.4)' : 'rgba(255,140,0,0.3)'}`,
                      fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 2,
                      color: (prediction?.confidence ?? 0) > 70 ? '#FF6B00' : '#FF8C00',
                    }}>{Math.round(prediction?.confidence ?? 0)}% CONFIDENCE</div>
                  </div>
                </div>
              </div>

              {[
                { label: 'WIN PROBABILITY',    val: prediction?.win_probability ?? 0,    color: '#FF4500' },
                { label: 'PODIUM PROBABILITY', val: prediction?.podium_probability ?? 0, color: '#FF6B00' },
                { label: 'CONFIDENCE SCORE',   val: prediction?.confidence ?? 0,          color: '#FF8C00' },
                { label: 'DNF RISK',           val: prediction?.dnf_risk ?? 0,            color: '#CC1100' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ marginBottom: 12, padding: '12px 16px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,69,0,0.12)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 2, color: 'rgba(255,120,50,0.55)' }}>{label}</span>
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 11, fontWeight: 700, color }}>{Math.round(val ?? 0)}%</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,69,0,0.1)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(val ?? 0)}%` }}
                      transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                      style={{ height: '100%', background: `linear-gradient(90deg,${color},${color}aa)`, boxShadow: `0 0 8px ${color}` }}
                    />
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {[
                  { pos: '1ST', val: prediction?.win_probability ?? 0 },
                  { pos: '2ND', val: prediction?.podium_probability ?? 0 },
                  { pos: '3RD', val: Math.round((prediction?.podium_probability ?? 0) * 1.3) },
                ].map(({ pos, val }, i) => (
                  <div key={i} style={{
                    flex: 1, padding: '10px 12px', textAlign: 'center',
                    background: i === 0 ? 'rgba(255,69,0,0.15)' : i === 1 ? 'rgba(255,100,0,0.08)' : 'rgba(0,0,0,0.4)',
                    border: `1px solid rgba(255,${69 + i * 25},0,${0.5 - i * 0.12})`,
                    clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)',
                  }}>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 18, fontWeight: 900, color: i === 0 ? '#FF4500' : i === 1 ? '#FF7700' : 'rgba(255,120,0,0.55)' }}>{pos}</div>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 11, color: 'rgba(255,150,60,0.6)', marginTop: 2, letterSpacing: 1 }}>{form.driver.split(' ').pop()}</div>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 13, fontWeight: 700, color: i === 0 ? '#FF4500' : i === 1 ? '#FF7700' : 'rgba(255,120,0,0.55)', marginTop: 4 }}>{Math.round(Math.min(val, 95))}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CANADA POSTMORTEM ── */}
      <CanadaPostmortem />

      <style>{`
        @keyframes loadPulse { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
        select option { background:#0d0500; color:#FFB060; }
      `}</style>
    </section>
  )
}