import { MainScreen } from '@/screens'
import { AuthGuard } from './auth'

export default function App() {
  return (
    <AuthGuard>
      <MainScreen />
    </AuthGuard>
  )
}
