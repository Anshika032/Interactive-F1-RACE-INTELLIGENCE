'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Race calendar ────────────────────────────────────────────────────────────
const RACE_CALENDAR = [
  { round: 1,  name: 'Australian Grand Prix',      circuit: 'Albert Park Circuit',           location: 'Melbourne, Australia',    date: '2026-03-15T05:00:00Z', laps: 58, length: 5.278, drsZones: 4, lapRecord: '1:20.235', lapRecordHolder: 'Leclerc',     lapRecordYear: 2022, coords: { lat: -37.8497, lon: 144.9680 }, svg: 'melbourne.svg',  sf: { x: 62, y: 48  } },
  { round: 2,  name: 'Chinese Grand Prix',          circuit: 'Shanghai International Circuit', location: 'Shanghai, China',         date: '2026-03-22T07:00:00Z', laps: 56, length: 5.451, drsZones: 2, lapRecord: '1:32.238', lapRecordHolder: 'Verstappen',  lapRecordYear: 2024, coords: { lat: 31.3389,  lon: 121.2198 }, svg: 'shanghai.svg',   sf: { x: 50, y: 50  } },
  { round: 3,  name: 'Japanese Grand Prix',         circuit: 'Suzuka International Circuit',   location: 'Suzuka, Japan',           date: '2026-04-05T05:00:00Z', laps: 53, length: 5.807, drsZones: 1, lapRecord: '1:30.983', lapRecordHolder: 'Verstappen',  lapRecordYear: 2023, coords: { lat: 34.8431,  lon: 136.5419 }, svg: 'suzuka.svg',     sf: { x: 50, y: 50  } },
  { round: 4,  name: 'Miami Grand Prix',            circuit: 'Miami International Autodrome',  location: 'Miami, Florida, USA',     date: '2026-05-03T19:00:00Z', laps: 57, length: 5.412, drsZones: 3, lapRecord: '1:29.708', lapRecordHolder: 'Verstappen',  lapRecordYear: 2023, coords: { lat: 25.9581,  lon: -80.2389 }, svg: 'miami.svg',      sf: { x: 50, y: 50  } },
  { round: 5,  name: 'Canadian Grand Prix',         circuit: 'Circuit Gilles Villeneuve',      location: 'Montreal, Canada',        date: '2026-06-08T18:00:00Z', laps: 70, length: 4.361, drsZones: 2, lapRecord: '1:13.078', lapRecordHolder: 'Verstappen',  lapRecordYear: 2019, coords: { lat: 45.5017,  lon: -73.5226 }, svg: 'montreal.svg',   sf: { x: 50, y: 50  } },
  { round: 6,  name: 'Monaco Grand Prix',           circuit: 'Circuit de Monaco',              location: 'Monte Carlo, Monaco',     date: '2026-06-07T13:00:00Z', laps: 78, length: 3.337, drsZones: 1, lapRecord: '1:12.909', lapRecordHolder: 'Verstappen',  lapRecordYear: 2021, coords: { lat: 43.7347,  lon: 7.4206  }, svg: 'monaco.svg',     sf: { x: 22, y: 68  } },
  { round: 7,  name: 'Spanish Grand Prix',          circuit: 'Circuit de Barcelona-Catalunya', location: 'Barcelona, Spain',        date: '2026-06-14T13:00:00Z', laps: 66, length: 4.657, drsZones: 2, lapRecord: '1:16.330', lapRecordHolder: 'Verstappen',  lapRecordYear: 2023, coords: { lat: 41.5700,  lon: 2.2611  }, svg: 'barcelona.svg',  sf: { x: 87, y: 21  } },
  { round: 8,  name: 'Austrian Grand Prix',         circuit: 'Red Bull Ring',                  location: 'Spielberg, Austria',      date: '2026-06-28T13:00:00Z', laps: 71, length: 4.318, drsZones: 3, lapRecord: '1:05.619', lapRecordHolder: 'Verstappen',  lapRecordYear: 2021, coords: { lat: 47.2197,  lon: 14.7647 }, svg: 'austria.svg',    sf: { x: 50, y: 50  } },
  { round: 9,  name: 'British Grand Prix',          circuit: 'Silverstone Circuit',            location: 'Silverstone, UK',         date: '2026-07-05T14:00:00Z', laps: 52, length: 5.891, drsZones: 2, lapRecord: '1:27.097', lapRecordHolder: 'Hamilton',    lapRecordYear: 2020, coords: { lat: 52.0786,  lon: -1.0169 }, svg: 'silverstone.svg',sf: { x: 50, y: 50  } },
  { round: 10, name: 'Hungarian Grand Prix',        circuit: 'Hungaroring',                    location: 'Budapest, Hungary',       date: '2026-07-19T13:00:00Z', laps: 70, length: 4.381, drsZones: 1, lapRecord: '1:16.627', lapRecordHolder: 'Hamilton',    lapRecordYear: 2020, coords: { lat: 47.5789,  lon: 19.2486 }, svg: 'hungary.svg',    sf: { x: 50, y: 50  } },
  { round: 11, name: 'Belgian Grand Prix',          circuit: 'Circuit de Spa-Francorchamps',   location: 'Stavelot, Belgium',       date: '2026-07-26T13:00:00Z', laps: 44, length: 7.004, drsZones: 2, lapRecord: '1:46.286', lapRecordHolder: 'Bottas',      lapRecordYear: 2018, coords: { lat: 50.4372,  lon: 5.9714  }, svg: 'spa.svg',        sf: { x: 50, y: 50  } },
  { round: 12, name: 'Dutch Grand Prix',            circuit: 'Circuit Zandvoort',              location: 'Zandvoort, Netherlands',  date: '2026-08-30T13:00:00Z', laps: 72, length: 4.259, drsZones: 2, lapRecord: '1:11.097', lapRecordHolder: 'Verstappen',  lapRecordYear: 2021, coords: { lat: 52.3888,  lon: 4.5407  }, svg: 'zandvoort.svg',  sf: { x: 50, y: 50  } },
  { round: 13, name: 'Italian Grand Prix',          circuit: 'Autodromo Nazionale Monza',      location: 'Monza, Italy',            date: '2026-09-06T13:00:00Z', laps: 53, length: 5.793, drsZones: 2, lapRecord: '1:21.046', lapRecordHolder: 'Barrichello', lapRecordYear: 2004, coords: { lat: 45.6156,  lon: 9.2811  }, svg: 'monza.svg',      sf: { x: 50, y: 50  } },
  { round: 14, name: 'Azerbaijan Grand Prix',       circuit: 'Baku City Circuit',              location: 'Baku, Azerbaijan',        date: '2026-09-20T11:00:00Z', laps: 51, length: 6.003, drsZones: 2, lapRecord: '1:43.009', lapRecordHolder: 'Leclerc',     lapRecordYear: 2019, coords: { lat: 40.3725,  lon: 49.8533 }, svg: 'baku.svg',       sf: { x: 50, y: 50  } },
  { round: 15, name: 'Singapore Grand Prix',        circuit: 'Marina Bay Street Circuit',      location: 'Singapore',               date: '2026-10-04T12:00:00Z', laps: 62, length: 5.063, drsZones: 3, lapRecord: '1:35.867', lapRecordHolder: 'Leclerc',     lapRecordYear: 2023, coords: { lat: 1.2914,   lon: 103.864 }, svg: 'singapore.svg',  sf: { x: 50, y: 50  } },
  { round: 16, name: 'United States Grand Prix',    circuit: 'Circuit of the Americas',        location: 'Austin, Texas, USA',      date: '2026-10-18T19:00:00Z', laps: 56, length: 5.513, drsZones: 2, lapRecord: '1:36.169', lapRecordHolder: 'Hamilton',    lapRecordYear: 2012, coords: { lat: 30.1328,  lon: -97.641 }, svg: 'austin.svg',     sf: { x: 50, y: 50  } },
  { round: 17, name: 'Mexico City Grand Prix',      circuit: 'Autodromo Hermanos Rodriguez',   location: 'Mexico City, Mexico',     date: '2026-10-25T19:00:00Z', laps: 71, length: 4.304, drsZones: 3, lapRecord: '1:17.774', lapRecordHolder: 'Verstappen',  lapRecordYear: 2021, coords: { lat: 19.4042,  lon: -99.090 }, svg: 'mexico.svg',     sf: { x: 50, y: 50  } },
  { round: 18, name: 'São Paulo Grand Prix',        circuit: 'Autodromo Jose Carlos Pace',     location: 'São Paulo, Brazil',       date: '2026-11-08T17:00:00Z', laps: 71, length: 4.309, drsZones: 2, lapRecord: '1:10.540', lapRecordHolder: 'Verstappen',  lapRecordYear: 2023, coords: { lat: -23.703, lon: -46.699 }, svg: 'interlagos.svg', sf: { x: 50, y: 50  } },
  { round: 19, name: 'Las Vegas Grand Prix',        circuit: 'Las Vegas Strip Circuit',        location: 'Las Vegas, USA',          date: '2026-11-21T06:00:00Z', laps: 50, length: 6.201, drsZones: 2, lapRecord: '1:35.490', lapRecordHolder: 'Leclerc',     lapRecordYear: 2023, coords: { lat: 36.1147, lon: -115.17 }, svg: 'lasvegas.svg',   sf: { x: 50, y: 50  } },
  { round: 20, name: 'Qatar Grand Prix',            circuit: 'Lusail International Circuit',   location: 'Lusail, Qatar',           date: '2026-11-29T15:00:00Z', laps: 57, length: 5.380, drsZones: 2, lapRecord: '1:24.319', lapRecordHolder: 'Verstappen',  lapRecordYear: 2023, coords: { lat: 25.4900, lon: 51.4542 }, svg: 'lusail.svg',     sf: { x: 50, y: 50  } },
  { round: 21, name: 'Abu Dhabi Grand Prix',        circuit: 'Yas Marina Circuit',             location: 'Abu Dhabi, UAE',          date: '2026-12-06T13:00:00Z', laps: 58, length: 5.281, drsZones: 2, lapRecord: '1:26.103', lapRecordHolder: 'Verstappen',  lapRecordYear: 2021, coords: { lat: 24.4672, lon: 54.6031 }, svg: 'abudhabi.svg',   sf: { x: 50, y: 50  } },
]

const now = Date.now()
const nextIdx = RACE_CALENDAR.findIndex(r => new Date(r.date).getTime() > now)
const NEXT_RACE = nextIdx >= 0 ? RACE_CALENDAR[nextIdx] : RACE_CALENDAR[RACE_CALENDAR.length - 1]
const PREV_RACE = nextIdx > 0 ? RACE_CALENDAR[nextIdx - 1] : RACE_CALENDAR[0]

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

function useWeather(lat: number, lon: number, enabled: boolean) {
  const [weather, setWeather] = useState<{ rain: number; temp: number; desc: string } | null>(null)
  useEffect(() => {
    if (!enabled) return
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_probability_max,temperature_2m_max,weathercode&timezone=auto&forecast_days=16`)
      .then(r => r.json())
      .then(d => {
        const raceDate = NEXT_RACE.date.split('T')[0]
        const idx = (d.daily?.time ?? []).indexOf(raceDate)
        const i = idx >= 0 ? idx : Math.min(4, (d.daily?.time ?? []).length - 1)
        const code = d.daily?.weathercode?.[i] ?? 0
        const desc = code === 0 ? 'Clear' : code < 3 ? 'Partly Cloudy' : code < 60 ? 'Overcast' : code < 70 ? 'Rain' : 'Heavy Rain'
        setWeather({ rain: d.daily?.precipitation_probability_max?.[i] ?? 0, temp: Math.round(d.daily?.temperature_2m_max?.[i] ?? 20), desc })
      })
      .catch(() => setWeather({ rain: 30, temp: 22, desc: 'Unknown' }))
  }, [lat, lon, enabled])
  return weather
}

// ─── Circuit map component ────────────────────────────────────────────────────
function CircuitMap({ race }: { race: typeof NEXT_RACE }) {
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
      {/* Real SVG circuit — recolored orange via CSS filter */}
      <motion.img
        key={race.round}
        src={`/circuits/${race.svg}`}
        alt={race.circuit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          maxWidth: 300,
          maxHeight: 200,
          width: '100%',
          // Black stroke → orange: invert to white, sepia+saturate+hue-rotate to orange
          filter: 'invert(1) sepia(1) saturate(6) hue-rotate(330deg) brightness(1.1)',
        }}
      />

      {/* S/F pulse dot — positioned as % over the image */}
      <motion.div
        key={`sf-${race.round}`}
        style={{
          position: 'absolute',
          left: `${race.sf.x}%`,
          top: `${race.sf.y}%`,
          transform: 'translate(-50%, -50%)',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#FF4500',
          boxShadow: '0 0 8px #FF4500, 0 0 16px #FF4500',
        }}
        animate={{
          scale: [1, 1.8, 1],
          opacity: [1, 0.4, 1],
          boxShadow: [
            '0 0 6px #FF4500, 0 0 12px #FF4500',
            '0 0 12px #FF4500, 0 0 24px #FF4500',
            '0 0 6px #FF4500, 0 0 12px #FF4500',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* S/F label */}
      <div style={{
        position: 'absolute',
        left: `${race.sf.x}%`,
        top: `${race.sf.y + 6}%`,
        transform: 'translateX(-50%)',
        fontFamily: 'Orbitron, monospace',
        fontSize: 8,
        color: 'rgba(255,100,50,0.7)',
        letterSpacing: 1,
        whiteSpace: 'nowrap',
      }}>
        S/F
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RaceInfo() {
  const [tab, setTab] = useState<'next' | 'prev'>('next')
  const race = tab === 'next' ? NEXT_RACE : PREV_RACE

  const countdown = useCountdown(NEXT_RACE.date)
  const weather = useWeather(NEXT_RACE.coords.lat, NEXT_RACE.coords.lon, tab === 'next')

  const circuitStats = [
    { label: 'LAPS',       val: race.laps },
    { label: 'LENGTH',     val: `${race.length}km` },
    { label: 'DRS ZONES',  val: race.drsZones },
    { label: 'LAP RECORD', val: race.lapRecord },
  ]

  const countdownUnits = [
    { label: 'DAYS', val: countdown.days },
    { label: 'HRS',  val: countdown.hours },
    { label: 'MINS', val: countdown.mins },
    { label: 'SECS', val: countdown.secs },
  ]

  return (
    <section id="raceinfo" style={{ padding: '0 6vw 80px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Tab switcher ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 36 }}>
        {(['next', 'prev'] as const).map((t) => {
          const active = tab === t
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              fontFamily: 'Orbitron, monospace', fontSize: 10, letterSpacing: 3,
              padding: '10px 28px',
              background: active ? 'rgba(255,69,0,0.15)' : 'transparent',
              border: '1px solid', borderColor: active ? '#FF4500' : 'rgba(255,69,0,0.2)',
              color: active ? '#FF8C00' : 'rgba(255,120,50,0.4)',
              cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
            }}>
              {t === 'next' ? '▶ NEXT RACE' : '◀ PREV RACE'}
              {active && (
                <motion.div layoutId="tabUnderline" style={{
                  position: 'absolute', bottom: -1, left: 0, right: 0, height: 2,
                  background: 'linear-gradient(90deg,transparent,#FF4500,transparent)',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Header ── */}
      <AnimatePresence mode="wait">
        <motion.div key={race.round} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
          style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 10, letterSpacing: 5, color: '#FF4500', marginBottom: 12 }}>
            {tab === 'next' ? '◆ NEXT RACE' : `◆ PREV RACE · ROUND ${race.round}`}
          </div>
          <h2 style={{
            fontFamily: 'Orbitron, monospace', fontSize: 'clamp(20px,3vw,36px)', fontWeight: 900, margin: 0,
            background: 'linear-gradient(135deg,#FF4500,#FF8C00,#FFD700)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {race.name.toUpperCase()}
          </h2>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 14, color: 'rgba(255,150,60,0.5)', letterSpacing: 3, marginTop: 6 }}>
            {race.location} · Round {race.round}
            {tab === 'prev' && <span style={{ marginLeft: 12, color: 'rgba(100,255,100,0.5)', fontSize: 11 }}>✓ COMPLETED</span>}
          </div>
          <div style={{ width: 200, height: 1, background: 'linear-gradient(90deg,transparent,#FF4500,transparent)', margin: '16px auto 0' }} />
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* LEFT — Circuit map + stats */}
        <div style={{
          background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,69,0,0.2)',
          padding: '28px', position: 'relative', overflow: 'hidden',
          clipPath: 'polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,0 100%)',
        }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 3, color: '#FF4500', marginBottom: 16 }}>
            ◈ CIRCUIT MAP
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={race.round} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <CircuitMap race={race} />
            </motion.div>
          </AnimatePresence>

          <div style={{ textAlign: 'center', fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: 'rgba(255,150,60,0.75)', letterSpacing: 2, marginBottom: 20 }}>
            {race.circuit}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {circuitStats.map(({ label, val }) => (
              <div key={label} style={{ padding: '10px 12px', background: 'rgba(255,69,0,0.05)', border: '1px solid rgba(255,69,0,0.1)' }}>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 8, letterSpacing: 2, color: 'rgba(255,120,50,0.75)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 14, fontWeight: 700, color: '#FF8C00' }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontFamily: 'Rajdhani, sans-serif', fontSize: 11, color: 'rgba(255,150,60,0.7)', textAlign: 'center' }}>
            {race.lapRecordHolder} · {race.lapRecordYear}
          </div>
        </div>

        {/* RIGHT — Countdown / Completed + Weather */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <AnimatePresence mode="wait">
            {tab === 'next' ? (
              <motion.div key="countdown" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} style={{
                  background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,69,0,0.2)', padding: '28px',
                  clipPath: 'polygon(0 0,100% 0,100% calc(100% - 20px),calc(100% - 20px) 100%,0 100%)',
                }}>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 3, color: '#FF4500', marginBottom: 20 }}>◈ RACE STARTS IN</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {countdownUnits.map(({ label, val }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <motion.div key={val} initial={{ opacity: 0.5, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{
                        fontFamily: 'Orbitron, monospace', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 900,
                        background: 'linear-gradient(135deg,#FF4500,#FFD700)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 12px rgba(255,69,0,0.4))',
                      }}>
                        {String(val).padStart(2, '0')}
                      </motion.div>
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 8, letterSpacing: 3, color: 'rgba(255,120,50,0.75)', marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 20, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,69,0,0.3),transparent)' }} />
                <div style={{ marginTop: 12, fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: 'rgba(255,150,60,0.75)', textAlign: 'center', letterSpacing: 2 }}>
                  {new Date(NEXT_RACE.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </motion.div>
            ) : (
              <motion.div key="completed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} style={{
                  background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(100,255,100,0.15)', padding: '28px',
                  clipPath: 'polygon(0 0,100% 0,100% calc(100% - 20px),calc(100% - 20px) 100%,0 100%)',
                }}>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 3, color: 'rgba(100,255,100,0.6)', marginBottom: 20 }}>◈ RACE COMPLETED</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 48 }}>🏁</div>
                  <div>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 13, fontWeight: 700, color: 'rgba(100,255,100,0.8)', letterSpacing: 2 }}>
                      ROUND {PREV_RACE.round} · 2026
                    </div>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: 'rgba(255,150,60,0.5)', letterSpacing: 2, marginTop: 4 }}>
                      {new Date(PREV_RACE.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(100,255,100,0.2),transparent)', marginBottom: 16 }} />
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: 'rgba(255,150,60,0.4)', letterSpacing: 2, textAlign: 'center' }}>
                  {PREV_RACE.circuit}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Weather — next tab only */}
          <AnimatePresence>
            {tab === 'next' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }} style={{
                  background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,69,0,0.2)', padding: '28px', flex: 1,
                }}>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 3, color: '#FF4500', marginBottom: 20 }}>◈ RACE DAY WEATHER</div>
                {weather ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                      <div style={{ fontSize: 48 }}>{weather.rain > 60 ? '🌧️' : weather.rain > 30 ? '⛅' : '☀️'}</div>
                      <div>
                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 28, fontWeight: 900, color: '#FF8C00' }}>{weather.temp}°C</div>
                        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: 'rgba(255,150,60,0.5)', letterSpacing: 2, marginTop: 2 }}>{weather.desc}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 8, letterSpacing: 2, color: 'rgba(255,120,50,0.75)' }}>RAIN PROBABILITY</span>
                        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 10, fontWeight: 700, color: weather.rain > 50 ? '#4499FF' : '#FF8C00' }}>{weather.rain}%</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,69,0,0.1)', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${weather.rain}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                          style={{
                            height: '100%',
                            background: weather.rain > 50 ? 'linear-gradient(90deg,#2266CC,#4499FF)' : 'linear-gradient(90deg,#FF4500,#FF8C00)',
                            boxShadow: `0 0 8px ${weather.rain > 50 ? '#4499FF' : '#FF8C00'}`,
                          }} />
                      </div>
                    </div>
                    {weather.rain > 40 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                        marginTop: 16, padding: '8px 14px',
                        background: 'rgba(68,153,255,0.08)', border: '1px solid rgba(68,153,255,0.25)',
                        fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 2, color: '#4499FF',
                      }}>
                        ⚠ WET RACE CONDITIONS LIKELY — STRATEGY IMPACT HIGH
                      </motion.div>
                    )}
                    <div style={{ marginTop: 12, fontFamily: 'Rajdhani, sans-serif', fontSize: 10, color: 'rgba(255,150,60,0.25)', letterSpacing: 1 }}>
                      Live via OpenMeteo · {NEXT_RACE.location}
                    </div>
                  </>
                ) : (
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: 'rgba(255,150,60,0.3)', letterSpacing: 2 }}>FETCHING WEATHER DATA...</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </section>
  )
}