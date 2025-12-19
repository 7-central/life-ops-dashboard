import { prisma } from '../prisma';

export interface UpdateProfileData {
  longTermGoals?: string;
  mediumTermGoals?: string;
  shortTermFocus?: string;
  businessPlan?: string;
  lifePlan?: string;
  priorityPrinciples?: string;
  preferences?: string;
  summary?: string;
  summaryGeneratedAt?: Date;
  profileUpdatedAt?: Date;
}

export const userProfileRepository = {
  /**
   * Get the user profile (creates one if it doesn't exist)
   */
  async get() {
    // Try to get existing profile
    let profile = await prisma.userProfile.findFirst();

    // If no profile exists, create a default one
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {},
      });
    }

    return profile;
  },

  /**
   * Update the user profile
   */
  async update(data: UpdateProfileData) {
    const profile = await this.get();

    return prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        ...data,
        profileUpdatedAt: new Date(), // Always update profileUpdatedAt when content changes
      },
    });
  },

  /**
   * Update just the AI summary (doesn't change profileUpdatedAt)
   */
  async updateSummary(summary: string) {
    const profile = await this.get();

    return prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        summary,
        summaryGeneratedAt: new Date(),
        // Don't update profileUpdatedAt - this is just a summary
      },
    });
  },

  /**
   * Check if summary is stale (profile updated after summary was generated)
   */
  async isSummaryStale(): Promise<boolean> {
    const profile = await this.get();

    if (!profile.summary || !profile.summaryGeneratedAt) {
      return true; // No summary exists
    }

    // Check if profile was updated after summary was generated
    return profile.profileUpdatedAt > profile.summaryGeneratedAt;
  },
};
