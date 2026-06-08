import { MedicalWorkspace } from "@/components/pages/medical-workspace";

export default async function AtendimentoMedicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MedicalWorkspace attendanceId={id} />;
}
