import { Redirect } from 'expo-router';

// Root index redirects to the authenticated app area.
// The (app)/_layout.tsx guard will redirect to (auth)/landing if not signed in.
export default function Index() {
  return <Redirect href="/(app)" />;
}

