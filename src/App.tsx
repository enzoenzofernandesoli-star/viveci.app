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
import Perfil from './pages/Perfil'
import Configuracoes from './pages/Configuracoes'
import BodyScan from './pages/BodyScan'
import AnalisarMovimento from './pages/AnalisarMovimento'
import Social from './pages/Social'
import PerfilPublico from './pages/PerfilPublico'
import Planos from './pages/Planos'
import Corpo from './pages/Corpo'
import RecuperarSenha from './pages/RecuperarSenha'
import RedefinirSenha from './pages/RedefinirSenha'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="recuperar-senha" element={<RecuperarSenha />} />
        <Route path="redefinir-senha" element={<RedefinirSenha />} />
        <Route element={<RotaProtegida />}>
          <Route path="onboarding" element={<Onboarding />} />
          <Route element={<RotaOnboardingCompleto />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="treino" element={<Treinos />} />
              <Route path="treino/nova" element={<RotinaEditor />} />
              <Route path="treino/:id/editar" element={<RotinaEditor />} />
              <Route path="treino/rapido" element={<SessaoTreino />} />
              <Route path="treino/:id/sessao" element={<SessaoTreino />} />
              <Route path="nutricao" element={<Nutricao />} />
              <Route path="social" element={<Social />} />
              <Route path="corpo" element={<Corpo />} />
              <Route path="social/usuario/:id" element={<PerfilPublico />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="perfil/configuracoes" element={<Configuracoes />} />
              <Route path="perfil/body-scan" element={<BodyScan />} />
              <Route path="treino/analisar/:exercicioId" element={<AnalisarMovimento />} />
              <Route path="planos" element={<Planos />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
