import { notFound, redirect } from 'next/navigation';
import { timeboxRepository } from '@/data/repositories/timebox-repository';
import { FocusSession } from '@/components/features/focus-session';

interface FocusPageProps {
  params: Promise<{
    timeblockId: string;
  }>;
}

export default async function FocusPage({ params }: FocusPageProps) {
  const { timeblockId } = await params;

  const timeblock = await timeboxRepository.getById(timeblockId);

  if (!timeblock) {
    notFound();
  }

  // Check if timeblock is already completed or abandoned
  if (timeblock.completed || timeblock.abandonReason) {
    redirect('/schedule');
  }

  return <FocusSession timeblock={timeblock} />;
}
