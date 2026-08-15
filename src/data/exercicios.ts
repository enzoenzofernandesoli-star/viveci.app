// Catálogo de exercícios. Espelha a tabela `exercicios` do Supabase — trocar por consulta ao banco na etapa de integração.
export type GrupoMuscular =
  | 'Peito'
  | 'Costas'
  | 'Ombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Quadríceps'
  | 'Posterior'
  | 'Glúteos'
  | 'Panturrilha'
  | 'Abdômen'

export type Equipamento = 'Barra' | 'Halter' | 'Cabo' | 'Máquina' | 'Peso corporal' | 'Elástico'

export type Exercicio = {
  id: number
  nome: string
  grupo_muscular: GrupoMuscular
  grupos_secundarios: GrupoMuscular[]
  nivel: 'iniciante' | 'intermediario' | 'avancado'
  equipamento: Equipamento
  is_composto: boolean
}

export const EXERCICIOS: Exercicio[] = [
  { id: 1, nome: 'Supino reto com barra', grupo_muscular: 'Peito', grupos_secundarios: ['Tríceps', 'Ombros'], nivel: 'iniciante', equipamento: 'Barra', is_composto: true },
  { id: 2, nome: 'Supino inclinado com halteres', grupo_muscular: 'Peito', grupos_secundarios: ['Tríceps', 'Ombros'], nivel: 'iniciante', equipamento: 'Halter', is_composto: true },
  { id: 3, nome: 'Supino declinado com barra', grupo_muscular: 'Peito', grupos_secundarios: ['Tríceps'], nivel: 'intermediario', equipamento: 'Barra', is_composto: true },
  { id: 4, nome: 'Crucifixo com halteres', grupo_muscular: 'Peito', grupos_secundarios: ['Ombros'], nivel: 'iniciante', equipamento: 'Halter', is_composto: false },
  { id: 5, nome: 'Crossover na polia', grupo_muscular: 'Peito', grupos_secundarios: [], nivel: 'intermediario', equipamento: 'Cabo', is_composto: false },
  { id: 6, nome: 'Voador na máquina', grupo_muscular: 'Peito', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Máquina', is_composto: false },
  { id: 7, nome: 'Flexão de braço', grupo_muscular: 'Peito', grupos_secundarios: ['Tríceps', 'Abdômen'], nivel: 'iniciante', equipamento: 'Peso corporal', is_composto: true },
  { id: 8, nome: 'Flexão inclinada', grupo_muscular: 'Peito', grupos_secundarios: ['Tríceps'], nivel: 'iniciante', equipamento: 'Peso corporal', is_composto: true },
  { id: 9, nome: 'Supino com elástico', grupo_muscular: 'Peito', grupos_secundarios: ['Tríceps'], nivel: 'iniciante', equipamento: 'Elástico', is_composto: true },
  { id: 10, nome: 'Puxada frontal na polia', grupo_muscular: 'Costas', grupos_secundarios: ['Bíceps'], nivel: 'iniciante', equipamento: 'Cabo', is_composto: true },
  { id: 11, nome: 'Remada curvada com barra', grupo_muscular: 'Costas', grupos_secundarios: ['Bíceps', 'Posterior'], nivel: 'intermediario', equipamento: 'Barra', is_composto: true },
  { id: 12, nome: 'Remada baixa na polia', grupo_muscular: 'Costas', grupos_secundarios: ['Bíceps'], nivel: 'iniciante', equipamento: 'Cabo', is_composto: true },
  { id: 13, nome: 'Remada unilateral com halter', grupo_muscular: 'Costas', grupos_secundarios: ['Bíceps'], nivel: 'iniciante', equipamento: 'Halter', is_composto: true },
  { id: 14, nome: 'Barra fixa', grupo_muscular: 'Costas', grupos_secundarios: ['Bíceps'], nivel: 'avancado', equipamento: 'Peso corporal', is_composto: true },
  { id: 15, nome: 'Pulldown com corda', grupo_muscular: 'Costas', grupos_secundarios: [], nivel: 'intermediario', equipamento: 'Cabo', is_composto: false },
  { id: 16, nome: 'Levantamento terra', grupo_muscular: 'Costas', grupos_secundarios: ['Posterior', 'Glúteos', 'Quadríceps'], nivel: 'avancado', equipamento: 'Barra', is_composto: true },
  { id: 17, nome: 'Remada com elástico', grupo_muscular: 'Costas', grupos_secundarios: ['Bíceps'], nivel: 'iniciante', equipamento: 'Elástico', is_composto: true },
  { id: 18, nome: 'Desenvolvimento com halteres', grupo_muscular: 'Ombros', grupos_secundarios: ['Tríceps'], nivel: 'iniciante', equipamento: 'Halter', is_composto: true },
  { id: 19, nome: 'Desenvolvimento militar com barra', grupo_muscular: 'Ombros', grupos_secundarios: ['Tríceps'], nivel: 'intermediario', equipamento: 'Barra', is_composto: true },
  { id: 20, nome: 'Elevação lateral', grupo_muscular: 'Ombros', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Halter', is_composto: false },
  { id: 21, nome: 'Elevação frontal', grupo_muscular: 'Ombros', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Halter', is_composto: false },
  { id: 22, nome: 'Crucifixo inverso', grupo_muscular: 'Ombros', grupos_secundarios: ['Costas'], nivel: 'intermediario', equipamento: 'Halter', is_composto: false },
  { id: 23, nome: 'Encolhimento de ombros', grupo_muscular: 'Ombros', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Halter', is_composto: false },
  { id: 24, nome: 'Elevação lateral com elástico', grupo_muscular: 'Ombros', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Elástico', is_composto: false },
  { id: 25, nome: 'Rosca direta com barra', grupo_muscular: 'Bíceps', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Barra', is_composto: false },
  { id: 26, nome: 'Rosca alternada com halteres', grupo_muscular: 'Bíceps', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Halter', is_composto: false },
  { id: 27, nome: 'Rosca martelo', grupo_muscular: 'Bíceps', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Halter', is_composto: false },
  { id: 28, nome: 'Rosca scott', grupo_muscular: 'Bíceps', grupos_secundarios: [], nivel: 'intermediario', equipamento: 'Máquina', is_composto: false },
  { id: 29, nome: 'Rosca concentrada', grupo_muscular: 'Bíceps', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Halter', is_composto: false },
  { id: 30, nome: 'Rosca com elástico', grupo_muscular: 'Bíceps', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Elástico', is_composto: false },
  { id: 31, nome: 'Tríceps na polia com barra', grupo_muscular: 'Tríceps', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Cabo', is_composto: false },
  { id: 32, nome: 'Tríceps corda', grupo_muscular: 'Tríceps', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Cabo', is_composto: false },
  { id: 33, nome: 'Tríceps testa', grupo_muscular: 'Tríceps', grupos_secundarios: [], nivel: 'intermediario', equipamento: 'Barra', is_composto: false },
  { id: 34, nome: 'Tríceps francês com halter', grupo_muscular: 'Tríceps', grupos_secundarios: [], nivel: 'intermediario', equipamento: 'Halter', is_composto: false },
  { id: 35, nome: 'Mergulho no banco', grupo_muscular: 'Tríceps', grupos_secundarios: ['Peito'], nivel: 'iniciante', equipamento: 'Peso corporal', is_composto: true },
  { id: 36, nome: 'Tríceps coice', grupo_muscular: 'Tríceps', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Halter', is_composto: false },
  { id: 37, nome: 'Agachamento livre', grupo_muscular: 'Quadríceps', grupos_secundarios: ['Glúteos', 'Posterior'], nivel: 'intermediario', equipamento: 'Barra', is_composto: true },
  { id: 38, nome: 'Leg press', grupo_muscular: 'Quadríceps', grupos_secundarios: ['Glúteos'], nivel: 'iniciante', equipamento: 'Máquina', is_composto: true },
  { id: 39, nome: 'Cadeira extensora', grupo_muscular: 'Quadríceps', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Máquina', is_composto: false },
  { id: 40, nome: 'Afundo com halteres', grupo_muscular: 'Quadríceps', grupos_secundarios: ['Glúteos'], nivel: 'iniciante', equipamento: 'Halter', is_composto: true },
  { id: 41, nome: 'Agachamento búlgaro', grupo_muscular: 'Quadríceps', grupos_secundarios: ['Glúteos'], nivel: 'intermediario', equipamento: 'Halter', is_composto: true },
  { id: 42, nome: 'Agachamento livre sem peso', grupo_muscular: 'Quadríceps', grupos_secundarios: ['Glúteos'], nivel: 'iniciante', equipamento: 'Peso corporal', is_composto: true },
  { id: 43, nome: 'Hack machine', grupo_muscular: 'Quadríceps', grupos_secundarios: ['Glúteos'], nivel: 'intermediario', equipamento: 'Máquina', is_composto: true },
  { id: 44, nome: 'Mesa flexora', grupo_muscular: 'Posterior', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Máquina', is_composto: false },
  { id: 45, nome: 'Stiff com barra', grupo_muscular: 'Posterior', grupos_secundarios: ['Glúteos'], nivel: 'intermediario', equipamento: 'Barra', is_composto: true },
  { id: 46, nome: 'Cadeira flexora', grupo_muscular: 'Posterior', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Máquina', is_composto: false },
  { id: 47, nome: 'Good morning', grupo_muscular: 'Posterior', grupos_secundarios: ['Glúteos'], nivel: 'avancado', equipamento: 'Barra', is_composto: true },
  { id: 48, nome: 'Elevação pélvica', grupo_muscular: 'Glúteos', grupos_secundarios: ['Posterior'], nivel: 'iniciante', equipamento: 'Barra', is_composto: true },
  { id: 49, nome: 'Cadeira abdutora', grupo_muscular: 'Glúteos', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Máquina', is_composto: false },
  { id: 50, nome: 'Coice na polia', grupo_muscular: 'Glúteos', grupos_secundarios: ['Posterior'], nivel: 'iniciante', equipamento: 'Cabo', is_composto: false },
  { id: 51, nome: 'Ponte de glúteo no solo', grupo_muscular: 'Glúteos', grupos_secundarios: ['Posterior'], nivel: 'iniciante', equipamento: 'Peso corporal', is_composto: false },
  { id: 52, nome: 'Panturrilha em pé', grupo_muscular: 'Panturrilha', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Máquina', is_composto: false },
  { id: 53, nome: 'Panturrilha sentado', grupo_muscular: 'Panturrilha', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Máquina', is_composto: false },
  { id: 54, nome: 'Panturrilha no step', grupo_muscular: 'Panturrilha', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Peso corporal', is_composto: false },
  { id: 55, nome: 'Abdominal supra', grupo_muscular: 'Abdômen', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Peso corporal', is_composto: false },
  { id: 56, nome: 'Prancha isométrica', grupo_muscular: 'Abdômen', grupos_secundarios: ['Ombros'], nivel: 'iniciante', equipamento: 'Peso corporal', is_composto: false },
  { id: 57, nome: 'Elevação de pernas', grupo_muscular: 'Abdômen', grupos_secundarios: [], nivel: 'intermediario', equipamento: 'Peso corporal', is_composto: false },
  { id: 58, nome: 'Abdominal remador', grupo_muscular: 'Abdômen', grupos_secundarios: [], nivel: 'intermediario', equipamento: 'Peso corporal', is_composto: false },
  { id: 59, nome: 'Prancha lateral', grupo_muscular: 'Abdômen', grupos_secundarios: [], nivel: 'iniciante', equipamento: 'Peso corporal', is_composto: false },
]
