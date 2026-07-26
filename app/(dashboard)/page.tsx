import type { Metadata } from "next";

import { FinancialDashboard } from "@/components/dashboard/dashboard";

export const metadata: Metadata = {
  title: "Overview | FinSight.ai",
  description: "Daily financial overview, balances, commitments, and activity.",
};

export default function OverviewPage() {
  return <FinancialDashboard />;
}
