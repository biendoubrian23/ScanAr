// Re-export from the shared auth store so all existing imports keep working.
// The provider must be mounted at the root layout for this hook to function.
export { useAuth } from '@/lib/stores/authStore';
