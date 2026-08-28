import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

const SignIn = lazy(() => import('./components/ui/SignIn'))
const SignUp = lazy(() => import('./components/ui/SignUp'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const ProfileSetup = lazy(() => import('./components/ProfileSetup'))
const SkillGapAnalyzer = lazy(() => import('./pages/SkillGapAnalyzer'))
const Skills = lazy(() => import('./pages/Skills'))
const SkillDetail = lazy(() => import('./pages/SkillDetail'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Goals = lazy(() => import('./pages/Goals'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Settings = lazy(() => import('./pages/Settings'))
const LearningRecommender = lazy(() => import('./pages/LearningRecommender'))

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    }>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <SignIn />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/dashboard" /> : <SignUp />}
        />
        <Route
          path="/profile-setup"
          element={user ? <ProfileSetup /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/skills"
          element={user ? <Skills /> : <Navigate to="/login" />}
        />
        <Route
          path="/skills/:id"
          element={user ? <SkillDetail /> : <Navigate to="/login" />}
        />
        <Route
          path="/portfolio"
          element={user ? <Portfolio /> : <Navigate to="/login" />}
        />
        <Route
          path="/tasks"
          element={user ? <Tasks /> : <Navigate to="/login" />}
        />
        <Route
          path="/goals"
          element={user ? <Goals /> : <Navigate to="/login" />}
        />
        <Route
          path="/analytics"
          element={user ? <Analytics /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings"
          element={user ? <Settings /> : <Navigate to="/login" />}
        />
        <Route
          path="/skill-gap"
          element={user ? <SkillGapAnalyzer /> : <Navigate to="/login" />}
        />
        <Route
          path="/learning-path"
          element={user ? <LearningRecommender /> : <Navigate to="/login" />}
        />
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </Suspense>
  )
}

export default App
