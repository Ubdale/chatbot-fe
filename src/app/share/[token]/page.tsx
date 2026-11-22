import { Suspense } from "react";

import { SharedAnswer } from "@/components/SharedAnswer";

async function Shared({ params }: { params: PageProps<"/share/[token]">["params"] }) {
  const { token } = await params;
  return <SharedAnswer token={token} />;
}

export default function SharePage({ params }: PageProps<"/share/[token]">) {
  // With Cache Components, request-time data (route params) must be read under Suspense.
  return (
    <Suspense>
      <Shared params={params} />
    </Suspense>
  );
}
