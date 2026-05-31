"use client";

import gsap from "gsap";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const flashRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pageContent = contentRef.current?.querySelectorAll(".page-content") ?? [];
    const timeline = gsap.timeline();

    timeline
      .fromTo(
        flashRef.current,
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, duration: 0.28, ease: "power3.inOut" },
      )
      .to(flashRef.current, {
        scaleX: 0,
        transformOrigin: "right center",
        duration: 0.34,
        ease: "power3.inOut",
      })
      .fromTo(
        pageContent,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.1,
        },
        "-=0.16",
      );

    return () => {
      timeline.kill();
    };
  }, [pathname]);

  return (
    <>
      <div
        ref={flashRef}
        className="pointer-events-none fixed left-0 top-1/2 z-50 h-1 w-full origin-left bg-[linear-gradient(90deg,transparent,var(--ember-orange),var(--gold-flash),transparent)] shadow-[0_0_34px_rgba(255,69,0,0.9)]"
      />
      <div ref={contentRef}>{children}</div>
    </>
  );
}
