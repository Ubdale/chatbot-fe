import { Suspense } from "react";

import { DashboardsView } from "@/components/DashboardsView";

async function One({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DashboardsView id={id} />;
}

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <One params={params} />
    </Suspense>
  );
}
