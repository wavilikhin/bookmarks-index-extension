import { AuthGuard } from "@/components/auth/auth-guard"
import { NewTabPage } from "@/components/new-tab"

export function App() {
  return (
    <AuthGuard>
      <NewTabPage />
    </AuthGuard>
  )
}

export default App
