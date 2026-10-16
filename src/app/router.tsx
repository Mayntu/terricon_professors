import { Route, Routes } from 'react-router'
import { FoundationLayout } from '@/layouts/FoundationLayout'
import { FoundationPage } from '@/pages/foundation/FoundationPage'
import { PlannedPage } from '@/pages/planned/PlannedPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { plannedScreens } from './routes'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<FoundationLayout />}>
        <Route index element={<FoundationPage />} />
        {plannedScreens.map((screen) => (
          <Route key={screen.id} path={screen.path} element={<PlannedPage screen={screen} />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
