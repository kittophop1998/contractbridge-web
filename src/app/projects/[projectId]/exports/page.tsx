import { ExportsPage } from "@/features/exports/exports-page";

export default async function Page({
  params,
}: PageProps<"/projects/[projectId]/exports">) {
  const { projectId } = await params;
  return <ExportsPage projectId={projectId} />;
}
