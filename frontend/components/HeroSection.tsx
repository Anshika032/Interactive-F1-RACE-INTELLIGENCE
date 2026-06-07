"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import gsap from "gsap";

const F1CarScene = dynamic(() => import("./F1CarScene"), {
  ssr: false,
});

const TELEMETRY = [
  { label: "TOP FEATURE WEIGHT", value: "12.7%", color: "#FF4500" },
  { label: "MODEL MAE",          value: "3.61",  color: "#FF6B00" },
  { label: "SEASONS",            value: "2022-26", color: "#FF8C00" },
  { label: "RACE RECORDS",       value: "2,427", color: "#FFD700" },
];

export default function HeroSection() {
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const telRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);

  const scrollToPrediction = () => {
    document.getElementById('prediction')?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 });

    tl.fromTo(
      scanRef.current,
      { scaleX: 0 },
      { scaleX: 1, duration: 1.2, ease: "power3.out" }
    )
      .fromTo(
        badgeRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      )
      .fromTo(
        titleRef.current,
        { opacity: 0, y: 60, skewX: -5 },
        {
          opacity: 1,
          y: 0,
          skewX: 0,
          duration: 0.9,
          ease: "power3.out",
        },
        "-=0.2"
      )
      .fromTo(
        subRef.current,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.7, ease: "power2.out" },
        "-=0.4"
      )
      .fromTo(
        telRef.current?.children ?? [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
        },
        "-=0.3"
      )
      .fromTo(
        ctaRef.current?.children ?? [],
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.12,
          ease: "back.out(1.4)",
        },
        "-=0.2"
      );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden px-6 md:px-12 lg:px-20">

      {/* 3D BACKGROUND */}

      <div className="absolute inset-0 z-[1]">
        <F1CarScene />
      </div>

      {/* OVERLAY */}

      <div className="absolute inset-0 z-[2] bg-black/40" />

      {/* TOP SCAN LINE */}

      <div
        ref={scanRef}
        className="absolute left-0 top-0 z-10 h-0.5 w-full origin-left bg-[linear-gradient(90deg,transparent,#FF4500,#FF8C00,transparent)]"
      />

      {/* CORNERS */}

      {["tl", "tr", "bl", "br"].map((corner) => (
        <div
          key={corner}
          className="absolute z-10 h-12 w-12 border-[rgba(255,69,0,0.6)]"
          style={{
            top: corner.includes("t") ? 24 : undefined,
            bottom: corner.includes("b") ? 24 : undefined,
            left: corner.includes("l") ? 24 : undefined,
            right: corner.includes("r") ? 24 : undefined,
            borderTopWidth: corner.includes("t") ? 1 : 0,
            borderBottomWidth: corner.includes("b") ? 1 : 0,
            borderLeftWidth: corner.includes("l") ? 1 : 0,
            borderRightWidth: corner.includes("r") ? 1 : 0,
          }}
        />
      ))}

      {/* MAIN CONTENT */}

      <div className="relative z-20 flex min-h-screen items-center">

        <div className="max-w-[650px] pt-16">

          {/* BADGE */}

          <div ref={badgeRef} style={{ opacity: 0 }}>
            <span className="border border-orange-500/40 bg-orange-500/10 px-5 py-2 text-sm font-bold uppercase tracking-[0.32em] text-orange-300 backdrop-blur">
              AI RACE INTELLIGENCE — LIVE
            </span>
          </div>

          {/* TITLE */}

          <div ref={titleRef} style={{ opacity: 0 }}>
            <h1 className="mt-6 bg-[linear-gradient(135deg,#FF1500_0%,#FF4500_30%,#FF8C00_60%,#FFD700_85%,#FF4500_100%)] bg-clip-text text-[4rem] md:text-[6rem] lg:text-[7rem] font-black leading-[0.9] text-transparent drop-shadow-[0_0_40px_rgba(255,69,0,0.5)]">
              PITWALL
            </h1>
          </div>

          {/* SUBTEXT */}

          <div ref={subRef} style={{ opacity: 0 }}>
            <p className="mt-4 text-lg uppercase tracking-[0.28em] text-orange-200/70">
              AI-Powered Motorsport Intelligence Platform
            </p>

            <div className="mt-3 h-px w-44 bg-gradient-to-r from-orange-500 to-transparent" />
          </div>

          {/* TELEMETRY */}

          <div
            ref={telRef}
            className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {TELEMETRY.map((item, index) => (
              <div
                key={item.label}
                className="relative overflow-hidden border border-orange-500/20 bg-black/60 px-5 py-4 opacity-0 backdrop-blur-xl"
                style={{
                  clipPath:
                    "polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)",
                }}
              >
                <div
                  className="absolute left-0 right-0 top-0 h-px"
                  style={{
                    background: `linear-gradient(90deg,transparent,${item.color},transparent)`,
                  }}
                />

                <div
                  className="text-2xl font-bold"
                  style={{ color: item.color }}
                >
                  {item.value}
                </div>

                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-orange-300 opacity-90">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* BUTTONS */}

          <div ref={ctaRef} className="mt-10 flex gap-4">

            <a
              href="#prediction"
              className="bg-gradient-to-r from-orange-600 to-orange-400 px-10 py-4 font-bold uppercase tracking-[0.25em] text-black transition hover:scale-105 hover:shadow-[0_0_30px_rgba(255,120,0,0.7)]"
            >
              Predict Race
            </a>

            <button
              onClick={() => document.getElementById('raceinfo')?.scrollIntoView({behavior: 'smooth'})}
              className="border border-orange-500/40 bg-black/40 px-10 py-4 font-bold uppercase tracking-[0.25em] text-orange-300 backdrop-blur transition hover:border-orange-400 hover:bg-orange-500/10"
            >
              CONDITIONS & TIME
            </button>

          </div>
        </div>
      </div>

      {/* RIGHT SIDE HUD */}

      <div className="absolute right-[5vw] top-1/2 z-20 flex -translate-y-1/2 flex-col items-end gap-3">
        {["300 KPH", "SECTOR 1", "QUALI LAP", "DRS OPEN", "PIT IN 3"].map(
          (label, index) => (
            <div
              key={label}
              className="border-r-2 pr-3 text-sm uppercase tracking-[0.2em] text-orange-300 opacity-80"
              style={{
                borderColor: `rgba(255,120,0,${0.3 + index * 0.1})`,
              }}
            >
              {label}
            </div>
          )
        )}
      </div>

      {/* BOTTOM LINE */}

      <div className="absolute bottom-0 left-0 z-10 h-px w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
    </section>
  );
}