import {AuthGuard} from "@/components/auth/auth-guard"
import {NewTabPage} from "@/components/new-tab"
import {reatomComponent} from "@reatom/react"

const App = reatomComponent(() => {
  return (
    <AuthGuard>
      <NewTabPage />
    </AuthGuard>
  )
}, "App")

export default App
