export async function triggerEmergencyAlert(userId: string): Promise<{ success: boolean }> {
  if (!userId) {
    throw new Error('User not found for emergency alert.');
  }

  return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 300));
}