import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RotaProtegida } from './components/RotaProtegida'
import { RotaOnboardingCompleto } from './components/RotaOnboardingCompleto'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Treinos from './pages/Treinos'
import RotinaEditor from './pages/RotinaEditor'
import SessaoTreino from './pages/SessaoTreino'
import Nutricao from './pages/Nutricao'
import Evolucao from './pages/Evolucao'
import Perfil from './pages/Perfil'
import Planos from './pages/Planos'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<RotaProtegida />}>
          <Route path="onboarding" element={<Onboarding />} />
          <Route element={<RotaOnboardingCompleto />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="treino" element={<Treinos />} />
              <Route path="treino/nova" element={<RotinaEditor />} />
              <Route path="treino/:id/editar" element={<RotinaEditor />} />
              <Route path="treino/:id/sessao" element={<SessaoTreino />} />
              <Route path="nutricao" element={<Nutricao />} />
              <Route path="evolucao" element={<Evolucao />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="planos" element={<Planos />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
