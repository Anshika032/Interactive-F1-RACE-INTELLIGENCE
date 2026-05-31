"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function PredictPage() {

  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [gridPredictions, setGridPredictions] = useState([])
  const [selectedDriver] = useState("Max Verstappen");
  const [selectedConstructor] = useState("Red Bull");
  const [selectedTrack] = useState("Monaco Grand Prix");
  const [gridPosition] = useState(1);
  const [qualifyingPosition] = useState(1);
  const [practicePosition] = useState(1);
  const [driverForm] = useState(0.92);

  const handlePredict = async () => {
    console.log("BUTTON CLICKED")

    try {
      setLoading(true)

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Driver: selectedDriver,
          RaceName: selectedTrack,
          GridPosition: gridPosition,
          QualiPosition: gridPosition,
          Constructor: selectedConstructor,
          Round: 1,
          QualiDeltaToPole: 0.2,
          BestPracticeLapSeconds: 72.5,
          PracticePosition: practicePosition,
          PracticeDeltaToFastest: 0.3,
          DriverForm: driverForm,
          ConstructorForm: 0.95,
          TrackHistory: 0.9,
          GainPotential: 0.8,
          DriverDNFRate: 0.05,
          ConstructorDNFRate: 0.03,
          ReliabilityScore: 0.97,
        }),
      })

      const data = await response.json()

      console.log(data)

      setPrediction({
        position: `P${Math.round(data.predicted_position)}`,
        confidence: Math.round(data.confidence),
        winProbability: Math.round(data.win_probability),
        podiumProbability: Math.round(data.podium_probability),
        dnfRisk: Math.round(data.dnf_risk),
        driver: data.driver,
        team: data.team,
      })

      const gridResponse = await fetch(`${API_BASE_URL}/predict-grid`)
      const gridData = await gridResponse.json()
      setGridPredictions(gridData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  };

  if (!prediction) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-orange-400 flex-col gap-4">
        <motion.button
          onClick={handlePredict}
          disabled={loading}
          className="bg-gradient-to-r from-orange-600 to-orange-400 px-10 py-4 font-bold uppercase tracking-[0.25em] text-black transition hover:scale-105 hover:shadow-[0_0_30px_rgba(255,120,0,0.7)] disabled:opacity-60"
        >
          {loading ? "Loading AI Predictions..." : "Predict Race"}
        </motion.button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-orange-300 p-10">

      <h1 className="text-6xl font-black tracking-tight">
        RACE PREDICTIONS
      </h1>

      <p className="mt-4 text-orange-400/70 tracking-[0.2em] uppercase">
        LIVE AI Prediction Engine
      </p>

      <div className="flex items-center gap-2 mb-6">
        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />

        <span className="text-green-400 text-sm tracking-[0.2em] uppercase">
          AI Prediction System Online
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">

        {/* WINNER */}

        <div className="border border-orange-500/20 bg-black/60 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(255,140,0,0.35)]">

          <div className="text-sm tracking-[0.2em] uppercase text-orange-400">
            WINNER PROBABILITY
          </div>

              <div className="mt-4 text-5xl font-black">
                {prediction.position}
          </div>

          <div className="mt-2 text-orange-200">
            {prediction.winProbability ? `${prediction.winProbability}%` : ''}
          </div>

        </div>

        {/* DNF */}

        <div className="border border-orange-500/20 bg-black/60 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(255,140,0,0.35)]">

          <div className="text-sm tracking-[0.2em] uppercase text-orange-400">
            DNF RISK
          </div>

              <div className="mt-4 text-5xl font-black">
                {isNaN(prediction.dnfRisk) ? '0' : Math.round(prediction.dnfRisk ?? 0)}%
              </div>

          <div className="mt-2 text-red-400">
            {prediction?.dnfRisk ?? 0}%
          </div>

        </div>

        {/* FASTEST LAP */}

        <div className="border border-orange-500/20 bg-black/60 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(255,140,0,0.35)]">

          <div className="text-sm tracking-[0.2em] uppercase text-orange-400">
            FASTEST LAP
          </div>

              <div className="mt-4 text-5xl font-black">
                {prediction?.confidence ?? 0}
              </div>

          <p className="text-orange-300 text-sm mt-2">
            Model Confidence Score
          </p>

        </div>

      </div>

      <div className="mt-10 space-y-4">
        <div>
          <div className="flex justify-between text-orange-300 text-sm mb-1">
            <span>Win Probability</span>
            <span>{prediction?.winProbability ?? 0}%</span>
          </div>

          <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
                animate={{ width: `${prediction?.winProbability ?? 0}%` }}
              transition={{ duration: 1.2 }}
              className="h-full bg-orange-500"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-red-400 text-sm mb-1">
            <span>DNF Risk</span>
            <span>{prediction?.dnfRisk ?? 0}%</span>
          </div>

          <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
                animate={{ width: `${prediction?.dnfRisk ?? 0}%` }}
              transition={{ duration: 1.2 }}
              className="h-full bg-red-500"
            />
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-orange-400 mb-6 tracking-wider">
          AI GRID PREDICTIONS
        </h2>

        <div className="overflow-hidden rounded-2xl border border-orange-500/30">
          <table className="w-full text-left">
            <thead className="bg-orange-500/10 text-orange-300">
              <tr>
                <th className="p-4">POS</th>
                <th className="p-4">DRIVER</th>
                <th className="p-4">TEAM</th>
                <th className="p-4">WIN %</th>
              </tr>
            </thead>

            <tbody>
              {gridPredictions.map((driver: any, index) => (
                <tr
                  key={index}
                  className="
    border-t border-orange-500/10
    hover:bg-orange-500/5
    hover:scale-[1.01]
    hover:shadow-[0_0_20px_rgba(255,140,0,0.15)]
    transition-all
    duration-300
  "
                >
                  <td className="p-4 font-bold text-orange-400">
                    P{Math.round(driver.position)}
                  </td>

                  <td className="p-4 font-semibold text-white">
                    {driver.driver}
                  </td>

                  <td className="p-4 text-neutral-300">
                    {driver.team}
                  </td>

                  <td className="p-4 text-green-400">
                    {Math.round(driver.win_probability)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  );
}
