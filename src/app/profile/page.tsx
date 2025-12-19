import { userProfileRepository } from '@/data/repositories/user-profile-repository';
import { ProfileForm } from '@/components/features/profile-form';
import Link from 'next/link';

export default async function ProfilePage() {
  const profile = await userProfileRepository.get();
  const isSummaryStale = await userProfileRepository.isSummaryStale();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">User Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your goals, plans, and prioritization principles for AI-powered task management
          </p>
        </div>

        <ProfileForm profile={profile} isSummaryStale={isSummaryStale} />
      </div>
    </div>
  );
}
