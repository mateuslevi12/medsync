import { TriageWorkspace } from "@/components/pages/triage-workspace";

export default async function TriagemDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TriageWorkspace attendanceId={id} />;
}
