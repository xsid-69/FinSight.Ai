"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ChartLineUp,
  ClockCounterClockwise,
  CloudCheck,
  HardDrives,
  House,
  Sparkle,
  User,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useFirebaseStatus } from "@/hooks/use-firebase-status";

const navigation = [
  { label: "Home", href: "/", Icon: House },
  { label: "Insights", href: "/insights", Icon: Sparkle },
  { label: "Plan", href: "/plan", Icon: ChartLineUp },
  { label: "Future", href: "/forecast", Icon: ClockCounterClockwise },
] as const;

function BrandMark() {
  return (
    <span className="grid size-10 place-items-center rounded-[14px] bg-accent text-accent-ink shadow-brand">
      <ChartLineUp aria-hidden="true" size={21} weight="bold" />
    </span>
  );
}

export function AppNavigation() {
  const reduceMotion = useReducedMotion();
  const status = useFirebaseStatus();
  const pathname = usePathname();
  const StatusIcon = status.syncLabel === "Local data" ? HardDrives : CloudCheck;

  return (
    <>
      <header className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 pb-1 pt-4 md:hidden">
        <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          <BrandMark />
          <span className="text-lg font-bold tracking-[-0.04em]">FinSight</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex min-h-10 items-center gap-1.5 rounded-xl bg-surface px-3 text-[11px] font-semibold text-muted shadow-soft">
            <StatusIcon aria-hidden="true" size={15} weight="fill" className="text-accent" />
            {status.syncLabel}
          </span>
          <span className="grid size-10 place-items-center rounded-[14px] bg-ink text-canvas"><User aria-hidden="true" size={18} weight="bold" /></span>
        </div>
      </header>

      <motion.aside
        initial={reduceMotion ? false : { opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-y-0 left-0 z-sticky hidden w-[92px] flex-col items-center border-r border-line bg-surface px-3 py-6 md:flex"
      >
        <Link href="/" aria-label="FinSight home" className="rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><BrandMark /></Link>
        <nav aria-label="Dashboard sections" className="mt-10 flex w-full flex-1 flex-col gap-2">
          {navigation.map(({ label, href, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[18px] text-[10px] font-bold transition duration-300 ease-app focus-visible:outline-2 focus-visible:outline-accent ${isActive ? "bg-accent-soft text-accent" : "text-muted hover:bg-canvas hover:text-ink"}`}
              >
                <Icon aria-hidden="true" size={21} weight={isActive ? "fill" : "bold"} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex w-full flex-col items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[14px] bg-canvas text-accent" title={status.syncLabel}><StatusIcon aria-hidden="true" size={19} weight="fill" /></span>
          <span className="grid size-10 place-items-center rounded-[14px] bg-ink text-canvas"><User aria-hidden="true" size={18} weight="bold" /></span>
        </div>
      </motion.aside>

      <motion.nav
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        aria-label="Primary navigation"
        className="fixed inset-x-3 bottom-3 z-sticky rounded-[22px] bg-nav p-1.5 shadow-nav backdrop-blur-xl md:hidden"
      >
        <div className="grid grid-cols-4 gap-1 pb-safe">
          {navigation.map(({ label, href, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-[17px] text-[10px] font-bold transition duration-300 ease-app focus-visible:outline-2 focus-visible:outline-accent ${isActive ? "bg-accent text-accent-ink" : "text-nav-muted"}`}
              >
                <Icon aria-hidden="true" size={21} weight={isActive ? "fill" : "bold"} />
                {label}
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
}
