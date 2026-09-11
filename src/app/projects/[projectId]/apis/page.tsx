import { ApisPage } from "@/features/apis/apis-page";

export default async function Page({
  params,
}: PageProps<"/projects/[projectId]/apis">) {
  const { projectId } = await params;
  return <ApisPage projectId={projectId} />;
}
