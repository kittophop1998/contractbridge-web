import { ApiDetail } from "@/features/apis/api-detail";

export default async function Page({
  params,
}: PageProps<"/projects/[projectId]/apis/[apiId]">) {
  const { projectId, apiId } = await params;
  return <ApiDetail projectId={projectId} apiId={apiId} />;
}
