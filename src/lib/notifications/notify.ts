import { prisma } from '@/lib/db/prisma';

export type NotifyInput = {
  userId: string;
  kind: string;
  title: string;
  body?: string;
  href?: string;
};

/** Fire-and-forget notification writer. Never throws. */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
      },
    });
  } catch {
    /* never block the caller */
  }
}