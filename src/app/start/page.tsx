import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import Nav from '@/components/Nav';
import StartFlow from '@/components/start/StartFlow';
import { requireUser } from '@/lib/auth';
import { db, schema } from '@/db';
import { londonToday, suggestedDate } from '@/lib/dates';
import { nameCase } from '@/lib/labels';

export const metadata: Metadata = { title: 'Tell us about your day' };
const safe = (n?: string) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '');

export default async function Start({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const u = await requireUser('couple', '/start');
  const [plan] = await db.select().from(schema.plans).where(eq(schema.plans.userId, u.id)).limit(1);
  return (
    <>
      <Nav />
      <StartFlow
        next={safe(sp.next)} today={londonToday()} suggested={suggestedDate()}
        initial={{
          firstName: nameCase(u.firstName), partnerName: u.partnerName ? nameCase(u.partnerName) : '', lastName: plan?.lastName ?? '',
          weddingDate: plan?.weddingDate ?? null, flexDow: plan?.flexDow ?? null, flexMonths: plan?.flexMonths ?? [],
          guests: plan?.guests ?? 80, evening: plan?.eveningGuests ?? 30, budgetPence: plan?.budgetPence ?? null, styles: plan?.styles ?? [], needs: plan?.needs ?? [],
        }}
      />
    </>
  );
}
