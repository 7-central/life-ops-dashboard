'use server';

import { domainAreaRepository } from '@/data/repositories/domain-area-repository';
import { projectRepository } from '@/data/repositories/project-repository';
import { revalidatePath } from 'next/cache';

// ============================================
// DOMAIN AREA ACTIONS
// ============================================

export async function createDomainArea(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const sortOrder = formData.get('sortOrder')
      ? parseInt(formData.get('sortOrder') as string, 10)
      : undefined;

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Name is required' };
    }

    await domainAreaRepository.create({
      name: name.trim(),
      sortOrder,
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create domain area' };
  }
}

export async function updateDomainArea(id: string, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const sortOrder = formData.get('sortOrder')
      ? parseInt(formData.get('sortOrder') as string, 10)
      : undefined;

    await domainAreaRepository.update(id, {
      name: name?.trim(),
      sortOrder,
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update domain area' };
  }
}

export async function archiveDomainArea(id: string) {
  try {
    await domainAreaRepository.archive(id);
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to archive domain area' };
  }
}

export async function unarchiveDomainArea(id: string) {
  try {
    await domainAreaRepository.unarchive(id);
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to unarchive domain area' };
  }
}

export async function deleteDomainArea(id: string) {
  try {
    await domainAreaRepository.delete(id);
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Cannot delete domain area with associated tasks',
    };
  }
}

// ============================================
// PROJECT ACTIONS
// ============================================

export async function createProject(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Name is required' };
    }

    await projectRepository.create({
      name: name.trim(),
      description: description?.trim() || undefined,
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create project' };
  }
}

export async function updateProject(id: string, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    await projectRepository.update(id, {
      name: name?.trim(),
      description: description?.trim() || undefined,
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update project' };
  }
}

export async function archiveProject(id: string) {
  try {
    await projectRepository.archive(id);
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to archive project' };
  }
}

export async function unarchiveProject(id: string) {
  try {
    await projectRepository.unarchive(id);
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to unarchive project' };
  }
}

export async function deleteProject(id: string) {
  try {
    await projectRepository.delete(id);
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Cannot delete project with associated tasks',
    };
  }
}
