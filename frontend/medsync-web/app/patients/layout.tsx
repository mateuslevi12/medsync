import ProtectedLayout from "../(protected)/layout";

export default function PatientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
