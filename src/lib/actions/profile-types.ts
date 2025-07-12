
'use server';

import type { ProfileTypeOption, ProfileType } from '@/types';

// This function now returns a hardcoded list of profile types.
// This is more robust as it doesn't depend on a Firestore collection that might not exist.
export async function getProfileTypeOptions(): Promise<ProfileTypeOption[]> {
  console.log("ProfileTypeActions: Returning hardcoded profile types.");
  
  const profileTypes: ProfileTypeOption[] = [
    { id: 'super_admin', label: 'Super Admin' },
    { id: 'club_admin', label: 'Administrador de Club' },
    { id: 'coordinator', label: 'Coordinador' },
    { id: 'coach', label: 'Entrenador' },
    { id: 'scorer', label: 'Anotador' },
    { id: 'parent_guardian', label: 'Padre/Madre/Tutor' },
    { id: 'player', label: 'Jugador' },
    { id: 'user', label: 'Usuario General' },
  ];

  // We can still sort them alphabetically by label if needed
  profileTypes.sort((a, b) => a.label.localeCompare(b.label));

  return Promise.resolve(profileTypes);
}
