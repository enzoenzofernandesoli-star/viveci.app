import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RotaProtegida } from './components/RotaProtegida'
import { RotaOnboardingCompleto } from './components/RotaOnboardingCompleto'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Treinos from './pages/Treinos'
import SessaoTreino from './pages/SessaoTreino'
import Exercicios from './pages/Exercicios'
import Nutricao from './pages/Nutricao'
import Desafio from './pages/Desafio'
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
              <Route path="treinos" element={<Treinos />} />
              <Route path="treinos/sessao" element={<SessaoTreino />} />
              <Route path="exercicios" element={<Exercicios />} />
              <Route path="nutricao" element={<Nutricao />} />
              <Route path="desafio" element={<Desafio />} />
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
