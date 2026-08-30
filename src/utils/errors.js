export const friendlyFirestoreError = (err) => {
  if (err?.code === 'permission-denied') {
    return "You don't have permission to save this (check Firestore rules)."
  }
  if (err?.code === 'unavailable') {
    return "Couldn't reach the server — check your connection and try again."
  }
  return err?.message || 'Something went wrong saving that.'
}