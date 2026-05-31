'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// Next race data — update after each race
const NEXT_RACE = {
  name: 'Monaco Grand Prix',
  circuit: 'Circuit de Monaco',
  location: 'Monte Carlo, Monaco',
  round: 6,
  date: '2026-06-07T13:00:00Z',
  laps: 78,
  length: 3.337,
  drsZones: 1,
  lapRecord: '1:12.909',
  lapRecordHolder: 'Verstappen',
  lapRecordYear: 2021,
  coords: { lat: 43.7347, lon: 7.4206 },
}

// Monaco circuit SVG path — simplified outline
const MONACO_PATH = `
  M 160,40 L 220,38 L 260,55 L 275,80 L 265,110
  L 240,130 L 200,140 L 180,160 L 175,185
  L 185,205 L 210,215 L 240,210 L 265,195
  L 280,175 L 285,150 L 275,125
  L 290,100 L 310,85 L 330,90 L 340,110
  L 330,135 L 300,155 L 270,165
  L 255,185 L 250,210 L 255,235
  L 270,250 L 295,255 L 320,245
  L 335,225 L 330,200 L 310,185
  L 295,175 L 300,155
`

const CIRCUIT_PATHS: Record<string, { path: string; viewBox: string; label: string }> = {
  'Monaco Grand Prix': {
    viewBox: '0 0 400 320',
    label: 'Circuit de Monaco',
    path: `M 200,30 L 260,28 L 300,45 L 315,75 L 305,105
           L 275,128 L 235,138 L 210,158 L 202,182
           L 212,205 L 238,215 L 268,208 L 288,190
           L 295,168 L 285,142
           L 300,115 L 322,98 L 345,103 L 355,125
           L 343,152 L 310,172 L 278,182
           L 262,205 L 256,232 L 262,258
           L 278,272 L 305,276 L 330,264
           L 345,242 L 338,215 L 316,198
           L 298,186 L 302,168
           L 318,142 L 338,128 L 358,132
           L 365,152 L 355,175 L 332,188
           L 308,195 L 290,210 L 278,230
           L 272,255 L 265,275 L 248,285
           L 225,288 L 202,280 L 185,262
           L 178,240 L 182,215 L 195,195
           L 185,175 L 168,162 L 145,155
           L 122,158 L 102,172 L 92,192
           L 95,215 L 110,230 L 132,235
           L 155,228 L 170,212 L 168,192
           L 155,178 L 138,172
           L 118,145 L 108,118 L 115,92
           L 135,72 L 162,58 L 190,48 Z`,
  },
  'Barcelona Grand Prix': {
    viewBox: '0 0 400 300',
    label: 'Circuit de Barcelona-Catalunya',
    path: `M 60,80 L 180,75 L 280,80 L 330,100 L 345,130
           L 330,160 L 295,175 L 260,170 L 235,185
           L 220,210 L 225,235 L 248,248
           L 275,245 L 295,228 L 290,205
           L 270,192 L 248,188 L 232,198
           L 215,215 L 210,240 L 220,262
           L 242,272 L 268,268 L 285,252
           L 280,230 L 262,218
           L 240,212 L 225,222 L 218,242
           L 225,260 L 245,268 L 265,262
           L 275,245
           L 252,235 L 238,220 L 240,205
           L 255,195 L 275,192 L 295,198
           L 312,215 L 315,238 L 302,255
           L 278,262 L 255,258 L 238,242
           L 235,220 L 248,205 L 268,198
           L 285,202 L 298,218 L 295,238
           L 280,250 L 260,252 L 245,240
           L 242,222 L 255,210 L 272,208
           L 288,215
           L 320,188 L 345,165 L 348,138
           L 335,110 L 308,92 L 270,82
           L 175,78 L 65,82 L 42,100
           L 38,130 L 50,155 L 75,165
           L 100,160 L 118,145 L 112,122
           L 92,108 L 68,102 Z`,
  },
}

function getCircuitPath(raceName: string) {
  return CIRCUIT_PATHS[raceName] || CIRCUIT_PATHS['Monaco Grand Prix']
}

function useCountdown(targetDate: string) {
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) { setTime({ days: 0, hours: 0, mins: 0, secs: 0 }); return }
      setTime({
        days:  Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins:  Math.floor((diff % 3600000) / 60000),
        secs:  Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])
  return time
}

function useWeather(lat: number, lon: number) {
  const [weather, setWeather] = useState<{ rain: number; temp: number; desc: string } | null>(null)
  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation_probability,weathercode&timezone=auto`)
      .then(r => r.json())
      .then(d => {
        const code = d.current?.weathercode ?? 0
        const desc = code === 0 ? 'Clear' : code < 3 ? 'Partly Cloudy' : code < 60 ? 'Overcast' : code < 70 ? 'Rain' : 'Heavy Rain'
        setWeather({
          rain: d.current?.precipitation_probability ?? 0,
          temp: Math.round(d.current?.temperature_2m ?? 20),
          desc,
        })
      })
      .catch(() => setWeather({ rain: 30, temp: 22, desc: 'Unknown' }))
  }, [lat, lon])
  return weather
}

export default function RaceInfo() {
  const countdown = useCountdown(NEXT_RACE.date)
  const weather = useWeather(NEXT_RACE.coords.lat, NEXT_RACE.coords.lon)
  const circuit = getCircuitPath(NEXT_RACE.name)

  const countdownUnits = [
    { label: 'DAYS',  val: countdown.days },
    { label: 'HRS',   val: countdown.hours },
    { label: 'MINS',  val: countdown.mins },
    { label: 'SECS',  val: countdown.secs },
  ]

  const circuitStats = [
    { label: 'LAPS',       val: NEXT_RACE.laps },
    { label: 'LENGTH',     val: `${NEXT_RACE.length}km` },
    { label: 'DRS ZONES',  val: NEXT_RACE.drsZones },
    { label: 'LAP RECORD', val: NEXT_RACE.lapRecord },
  ]

  return (
    <section id="raceinfo" style={{ padding: '0 6vw 80px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 10, letterSpacing: 5, color: '#FF4500', marginBottom: 12 }}>
          ◆ NEXT RACE
        </div>
        <h2 style={{
          fontFamily: 'Orbitron, monospace', fontSize: 'clamp(20px,3vw,36px)', fontWeight: 900, margin: 0,
          background: 'linear-gradient(135deg,#FF4500,#FF8C00,#FFD700)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {NEXT_RACE.name.toUpperCase()}
        </h2>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 14, color: 'rgba(255,150,60,0.5)', letterSpacing: 3, marginTop: 6 }}>
          {NEXT_RACE.location} · Round {NEXT_RACE.round}
        </div>
        <div style={{ width: 200, height: 1, background: 'linear-gradient(90deg,transparent,#FF4500,transparent)', margin: '16px auto 0' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* LEFT — Circuit SVG + Stats */}
        <div style={{
          background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,69,0,0.2)',
          padding: '28px', position: 'relative', overflow: 'hidden',
          clipPath: 'polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,0 100%)',
        }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 3, color: '#FF4500', marginBottom: 16 }}>
            ◈ CIRCUIT MAP
          </div>

          {/* Circuit SVG */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <svg viewBox={circuit.viewBox} width="100%" style={{ maxWidth: 320, maxHeight: 200 }}>
              {/* Glow filter */}
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF4500"/>
                  <stop offset="50%" stopColor="#FF8C00"/>
                  <stop offset="100%" stopColor="#FFD700"/>
                </linearGradient>
              </defs>
              {/* Track shadow */}
              <path d={circuit.path} fill="none" stroke="rgba(255,69,0,0.15)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Main track */}
              <motion.path
                d={circuit.path}
                fill="none"
                stroke="url(#trackGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.5, ease: 'easeInOut', delay: 0.3 }}
              />
              {/* Start/finish dot */}
              <motion.circle
                cx="200" cy="30" r="5"
                fill="#FF4500"
                filter="url(#glow)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 2.8, duration: 0.4 }}
              />
              <motion.text
                x="210" y="25"
                fill="rgba(255,150,60,0.7)"
                fontSize="10"
                fontFamily="Orbitron, monospace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
              >
                S/F
              </motion.text>
            </svg>
          </div>

          {/* Circuit label */}
          <div style={{ textAlign: 'center', fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: 'rgba(255,150,60,0.4)', letterSpacing: 2, marginBottom: 20 }}>
            {circuit.label}
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {circuitStats.map(({ label, val }) => (
              <div key={label} style={{
                padding: '10px 12px',
                background: 'rgba(255,69,0,0.05)',
                border: '1px solid rgba(255,69,0,0.1)',
              }}>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 8, letterSpacing: 2, color: 'rgba(255,120,50,0.4)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 14, fontWeight: 700, color: '#FF8C00' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Lap record note */}
          <div style={{ marginTop: 10, fontFamily: 'Rajdhani, sans-serif', fontSize: 11, color: 'rgba(255,150,60,0.35)', textAlign: 'center' }}>
            {NEXT_RACE.lapRecordHolder} · {NEXT_RACE.lapRecordYear}
          </div>
        </div>

        {/* RIGHT — Countdown + Weather */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Countdown */}
          <div style={{
            background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,69,0,0.2)',
            padding: '28px',
            clipPath: 'polygon(0 0,100% 0,100% calc(100% - 20px),calc(100% - 20px) 100%,0 100%)',
          }}>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 3, color: '#FF4500', marginBottom: 20 }}>◈ RACE STARTS IN</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {countdownUnits.map(({ label, val }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <motion.div
                    key={val}
                    initial={{ opacity: 0.5, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      fontFamily: 'Orbitron, monospace', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 900,
                      background: 'linear-gradient(135deg,#FF4500,#FFD700)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 0 12px rgba(255,69,0,0.4))',
                    }}
                  >
                    {String(val).padStart(2, '0')}
                  </motion.div>
                  <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 8, letterSpacing: 3, color: 'rgba(255,120,50,0.4)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,69,0,0.3),transparent)' }} />
            <div style={{ marginTop: 12, fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: 'rgba(255,150,60,0.4)', textAlign: 'center', letterSpacing: 2 }}>
              {new Date(NEXT_RACE.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* Weather */}
          <div style={{
            background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,69,0,0.2)',
            padding: '28px', flex: 1,
          }}>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 3, color: '#FF4500', marginBottom: 20 }}>◈ RACE DAY WEATHER</div>

            {weather ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                  {/* Weather icon */}
                  <div style={{ fontSize: 48 }}>
                    {weather.rain > 60 ? '🌧️' : weather.rain > 30 ? '⛅' : '☀️'}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 28, fontWeight: 900, color: '#FF8C00' }}>
                      {weather.temp}°C
                    </div>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: 'rgba(255,150,60,0.5)', letterSpacing: 2, marginTop: 2 }}>
                      {weather.desc}
                    </div>
                  </div>
                </div>

                {/* Rain probability bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 8, letterSpacing: 2, color: 'rgba(255,120,50,0.4)' }}>RAIN PROBABILITY</span>
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 10, fontWeight: 700, color: weather.rain > 50 ? '#4499FF' : '#FF8C00' }}>{weather.rain}%</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,69,0,0.1)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${weather.rain}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        background: weather.rain > 50
                          ? 'linear-gradient(90deg,#2266CC,#4499FF)'
                          : 'linear-gradient(90deg,#FF4500,#FF8C00)',
                        boxShadow: `0 0 8px ${weather.rain > 50 ? '#4499FF' : '#FF8C00'}`,
                      }}
                    />
                  </div>
                </div>

                {/* Wet race indicator */}
                {weather.rain > 40 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      marginTop: 16, padding: '8px 14px',
                      background: 'rgba(68,153,255,0.08)',
                      border: '1px solid rgba(68,153,255,0.25)',
                      fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 2,
                      color: '#4499FF',
                    }}
                  >
                    ⚠ WET RACE CONDITIONS LIKELY — STRATEGY IMPACT HIGH
                  </motion.div>
                )}

                <div style={{ marginTop: 12, fontFamily: 'Rajdhani, sans-serif', fontSize: 10, color: 'rgba(255,150,60,0.25)', letterSpacing: 1 }}>
                  Live via OpenMeteo · {NEXT_RACE.location}
                </div>
              </>
            ) : (
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: 'rgba(255,150,60,0.3)', letterSpacing: 2 }}>
                FETCHING WEATHER DATA...
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}