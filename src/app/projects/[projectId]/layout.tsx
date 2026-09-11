import { ProjectNav } from "@/features/projects/project-nav";

export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<"/projects/[projectId]">) {
  const { projectId } = await params;

  return (
    <div className="space-y-8">
      <ProjectNav projectId={projectId} />
      {children}
    </div>
  );
}
