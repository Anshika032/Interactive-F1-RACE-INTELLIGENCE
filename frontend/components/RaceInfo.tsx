'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  SECTOR_1_PATH,
  SECTOR_2_PATH,
  SECTOR_3_PATH,
} from '@/src/data/monaco-sectors'

// ─── Race config ──────────────────────────────────────────────────────────────

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

// ─── Animation path ───────────────────────────────────────────────────────────
// GPS-derived waypoints mapped to the real SVG coordinate space (2000×2000 viewBox)
// Clockwise: SF → Ste Devote → Beau Rivage → Casino → Mirabeau → Fairmont →
//            Portier → Tunnel → Chicane → Piscine → Rascasse → back to SF
const ANIMATION_PATH =
  'M 410,810 L 440,760 L 540,720 L 580,640 L 555,530 ' +
  'L 680,600 L 760,680 L 760,780 L 720,860 L 820,900 ' +
  'L 920,950 L 1040,1000 ' +           // ← S1 ends here (Tunnel entry)
  'L 1200,1050 L 1400,1100 L 1540,1200 L 1470,1250 ' +
  'L 1300,1310 L 1420,1330 L 1560,1360 ' + // ← S2 ends here (Piscine exit)
  'L 1400,1390 L 900,1350 L 600,1200 L 510,1060 L 410,960 L 410,810'

// ─── Hooks ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function RaceInfo() {
  const countdown = useCountdown(NEXT_RACE.date)
  const weather = useWeather(NEXT_RACE.coords.lat, NEXT_RACE.coords.lon)

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

          {/* Circuit SVG — real Iconscout geometry, 2000×2000 native space */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <svg
              viewBox="365 494 1294 954"
              width="100%"
              style={{ maxWidth: 340, maxHeight: 220 }}
              aria-label="Monaco Grand Prix circuit map"
            >
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="glowStrong" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="s1grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF4500"/>
                  <stop offset="100%" stopColor="#FF6600"/>
                </linearGradient>
                <linearGradient id="s2grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF8C00"/>
                  <stop offset="100%" stopColor="#FFB000"/>
                </linearGradient>
                <linearGradient id="s3grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700"/>
                  <stop offset="100%" stopColor="#FF4500"/>
                </linearGradient>
              </defs>

              {/* Track base shadow — all 3 sector paths at low opacity for depth */}
              <path d={SECTOR_1_PATH} fill="none" stroke="rgba(255,100,0,0.08)" strokeWidth="10" strokeLinecap="round"/>
              <path d={SECTOR_2_PATH} fill="none" stroke="rgba(255,100,0,0.08)" strokeWidth="10" strokeLinecap="round"/>
              <path d={SECTOR_3_PATH} fill="none" stroke="rgba(255,100,0,0.08)" strokeWidth="10" strokeLinecap="round"/>

              {/* Sector 1 — S/F → Tunnel entry (orange-red) */}
              <motion.path
                d={SECTOR_1_PATH}
                fill="none"
                stroke="url(#s1grad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#glow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.2 }}
              />

              {/* Sector 2 — Tunnel → Piscine exit (amber) */}
              <motion.path
                d={SECTOR_2_PATH}
                fill="none"
                stroke="url(#s2grad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#glow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.8 }}
              />

              {/* Sector 3 — Rascasse → S/F (gold) */}
              <motion.path
                d={SECTOR_3_PATH}
                fill="none"
                stroke="url(#s3grad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#glow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, ease: 'easeInOut', delay: 1.4 }}
              />

              {/* Tunnel section dashed overlay */}
              <motion.path
                d="M 1040,1000 L 1200,1050 L 1400,1100 L 1540,1200"
                fill="none"
                stroke="rgba(255,200,80,0.6)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="18,12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              />

              {/* Start/Finish line */}
              <motion.line
                x1="510" y1="930" x2="535" y2="958"
                stroke="#FF4500"
                strokeWidth="6"
                filter="url(#glowStrong)"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: 2.0, duration: 0.4 }}
              />

              {/* Corner labels */}
              {([
                [522,  530,  'Casino',  'middle'],
                [470,  895,  'T1',      'end'   ],
                [500,  970,  'S/F',     'middle'],
                [968,  920,  'Hairpin', 'end'   ],
                [1529, 1235, 'Chicane', 'middle'],
                [1262, 1300, 'Tabac',   'start' ],
              ] as const).map(([x, y, t, anchor]) => (
                <motion.text
                  key={t}
                  x={x} y={y}
                  fill="rgba(255,150,60,0.55)"
                  fontSize="28"
                  fontFamily="Orbitron, monospace"
                  textAnchor={anchor}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.2, duration: 0.6 }}
                >
                  {t}
                </motion.text>
              ))}

              {/* Animated racing dot */}
              <motion.circle
                r="18"
                fill="#FF4500"
                filter="url(#glowStrong)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0.8] }}
                transition={{ delay: 2.5, duration: 0.5 }}
              >
                <animateMotion
                  dur="10s"
                  repeatCount="indefinite"
                  begin="2.5s"
                  path={ANIMATION_PATH}
                />
              </motion.circle>

              {/* Sector divider dots — S1/S2 boundary, S2/S3 boundary */}
              {([
                [1089, 1018, '#FF6600', 'S1'],
                [1490, 1358, '#FFB000', 'S2'],
              ] as const).map(([x, y, color, label]) => (
                <motion.g key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }}>
                  <circle cx={x} cy={y} r="14" fill={color} filter="url(#glow)" />
                  <text x={x + 20} y={y + 10} fill={color} fontSize="24" fontFamily="Orbitron, monospace" opacity="0.8">{label}</text>
                </motion.g>
              ))}

              {/* Sector legend */}
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>
                <rect x="380" y="1420" width="28" height="10" fill="#FF4500" rx="3"/>
                <text x="416" y="1432" fill="rgba(255,100,50,0.6)" fontSize="22" fontFamily="Orbitron, monospace">S1</text>
                <rect x="490" y="1420" width="28" height="10" fill="#FFB000" rx="3"/>
                <text x="526" y="1432" fill="rgba(255,100,50,0.6)" fontSize="22" fontFamily="Orbitron, monospace">S2</text>
                <rect x="600" y="1420" width="28" height="10" fill="#FFD700" rx="3"/>
                <text x="636" y="1432" fill="rgba(255,100,50,0.6)" fontSize="22" fontFamily="Orbitron, monospace">S3</text>
                <text x="720" y="1432" fill="rgba(255,100,50,0.4)" fontSize="22" fontFamily="Orbitron, monospace">- - TUNNEL</text>
              </motion.g>
            </svg>
          </div>

          {/* Circuit label */}
          <div style={{ textAlign: 'center', fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: 'rgba(255,150,60,0.4)', letterSpacing: 2, marginBottom: 20 }}>
            {NEXT_RACE.circuit}
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