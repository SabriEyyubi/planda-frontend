import { getProjects } from '@/features/projects/api/projects-adapter';
import { CompareBoard } from '@/features/projects/components/compare-board';

export default async function Page() {
  const { items } = await getProjects('limit=100');
  return (
    <main id="main-content" tabIndex={-1} className="page container">
      <CompareBoard projects={items} />
    </main>
  );
}
