import { Suspense } from "react";

import { AcceptInvite } from "@/components/AcceptInvite";

async function Invite({ params }: { params: PageProps<"/invite/[token]">["params"] }) {
  const { token } = await params;
  return <AcceptInvite token={token} />;
}

export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <Suspense>
      <Invite params={params} />
    </Suspense>
  );
}
