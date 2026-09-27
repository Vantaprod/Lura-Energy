import { prisma } from '@/lib/db/prisma'; import { ContentIndex } from '@/components/public/content-index';
export const dynamic = 'force-dynamic';
export default async function ProjectsPage() { const items = (process.env.NODE_ENV === 'development' && process.env.PREVIEW_WITHOUT_DATABASE) === 'true' ? [] : await prisma.project.findMany({ where: { published: true }, include:{media:true}, orderBy: { sortOrder: 'asc' } }); return <ContentIndex title="Projects" eyebrow="Installation work" description="Explore project information published by Lura." items={items} path="/projects" />; }
