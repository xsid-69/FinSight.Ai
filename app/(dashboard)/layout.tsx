import { AppNavigation } from "@/components/dashboard/app-navigation";
import { PageTransition } from "@/components/providers/page-transition";
import { SmoothScroll } from "@/components/providers/smooth-scroll";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SmoothScroll>
      <div className="min-h-[100dvh] bg-canvas text-ink">
        <a href="#main-content" className="sr-only z-tooltip rounded-xl bg-ink px-4 py-2 text-canvas focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
        <AppNavigation />
        <main id="main-content" className="mx-auto w-full max-w-[1280px] px-4 pb-32 pt-5 md:pl-[124px] md:pr-8 md:pt-9 lg:pb-20">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </SmoothScroll>
  );
}
