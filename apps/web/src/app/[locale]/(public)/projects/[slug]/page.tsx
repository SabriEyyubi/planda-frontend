import { getProject } from '@/features/projects/api/projects-adapter';
import { ProjectDetail } from '@/features/projects/components/project-detail';
import { notFound } from 'next/navigation';

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  return <ProjectDetail project={project} />;
}
