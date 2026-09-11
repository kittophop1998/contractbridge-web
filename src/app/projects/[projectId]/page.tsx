import { ProjectOverview } from "@/features/projects/project-overview";

export default async function Page({ params }: PageProps<"/projects/[projectId]">) {
  const { projectId } = await params;
  return <ProjectOverview projectId={projectId} />;
}
