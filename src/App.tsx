import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RotaProtegida } from './components/RotaProtegida'
import { RotaOnboardingCompleto } from './components/RotaOnboardingCompleto'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Treinos = lazy(() => import('./pages/Treinos'))
const RotinaEditor = lazy(() => import('./pages/RotinaEditor'))
const SessaoTreino = lazy(() => import('./pages/SessaoTreino'))
const Nutricao = lazy(() => import('./pages/Nutricao'))
const Perfil = lazy(() => import('./pages/Perfil'))
const Configuracoes = lazy(() => import('./pages/Configuracoes'))
const BodyScan = lazy(() => import('./pages/BodyScan'))
const AnalisarMovimento = lazy(() => import('./pages/AnalisarMovimento'))
const Social = lazy(() => import('./pages/Social'))
const PerfilPublico = lazy(() => import('./pages/PerfilPublico'))
const ConexoesSociais = lazy(() => import('./pages/ConexoesSociais'))
const GrupoDetalhe = lazy(() => import('./pages/GrupoDetalhe'))
const Conversa = lazy(() => import('./pages/Conversa'))
const Planos = lazy(() => import('./pages/Planos'))
const Corpo = lazy(() => import('./pages/Corpo'))
const RecuperarSenha = lazy(() => import('./pages/RecuperarSenha'))
const RedefinirSenha = lazy(() => import('./pages/RedefinirSenha'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-app text-sm text-ink-2">Carregando...</div>}>
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
              <Route path="social/usuario/:id/conexoes" element={<ConexoesSociais />} />
              <Route path="social/grupo/:id" element={<GrupoDetalhe />} />
              <Route path="social/mensagem/:id" element={<Conversa />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="perfil/configuracoes" element={<Configuracoes />} />
              <Route path="perfil/body-scan" element={<BodyScan />} />
              <Route path="treino/analisar/:exercicioId" element={<AnalisarMovimento />} />
              <Route path="planos" element={<Planos />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
