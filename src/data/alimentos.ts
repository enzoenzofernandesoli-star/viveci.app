// Tabela nutricional base. Valores por 100 g.
// Espelha a tabela `alimentos` do Supabase — trocar por consulta ao banco na etapa de integração.
export type Alimento = {
  id: number
  nome: string
  kcal_100: number
  prot_100: number
  carb_100: number
  gord_100: number
  categoria: string
}

export const ALIMENTOS: Alimento[] = [
  { id: 1, nome: 'Arroz branco cozido', kcal_100: 128, prot_100: 2.5, carb_100: 28.1, gord_100: 0.2, categoria: 'Carboidrato' },
  { id: 2, nome: 'Arroz integral cozido', kcal_100: 124, prot_100: 2.6, carb_100: 25.8, gord_100: 1.0, categoria: 'Carboidrato' },
  { id: 3, nome: 'Feijão carioca cozido', kcal_100: 76, prot_100: 4.8, carb_100: 13.6, gord_100: 0.5, categoria: 'Leguminosa' },
  { id: 4, nome: 'Feijão preto cozido', kcal_100: 77, prot_100: 4.5, carb_100: 14.0, gord_100: 0.5, categoria: 'Leguminosa' },
  { id: 5, nome: 'Peito de frango grelhado', kcal_100: 159, prot_100: 32.0, carb_100: 0.0, gord_100: 2.5, categoria: 'Proteína' },
  { id: 6, nome: 'Coxa de frango assada', kcal_100: 215, prot_100: 26.0, carb_100: 0.0, gord_100: 12.0, categoria: 'Proteína' },
  { id: 7, nome: 'Patinho bovino grelhado', kcal_100: 219, prot_100: 35.9, carb_100: 0.0, gord_100: 7.3, categoria: 'Proteína' },
  { id: 8, nome: 'Alcatra grelhada', kcal_100: 241, prot_100: 32.0, carb_100: 0.0, gord_100: 12.0, categoria: 'Proteína' },
  { id: 9, nome: 'Tilápia grelhada', kcal_100: 129, prot_100: 26.0, carb_100: 0.0, gord_100: 2.6, categoria: 'Proteína' },
  { id: 10, nome: 'Salmão grelhado', kcal_100: 208, prot_100: 22.0, carb_100: 0.0, gord_100: 13.0, categoria: 'Proteína' },
  { id: 11, nome: 'Atum em água', kcal_100: 116, prot_100: 26.0, carb_100: 0.0, gord_100: 1.0, categoria: 'Proteína' },
  { id: 12, nome: 'Ovo cozido', kcal_100: 146, prot_100: 13.3, carb_100: 0.6, gord_100: 9.5, categoria: 'Proteína' },
  { id: 13, nome: 'Clara de ovo', kcal_100: 52, prot_100: 10.9, carb_100: 0.7, gord_100: 0.2, categoria: 'Proteína' },
  { id: 14, nome: 'Whey protein concentrado', kcal_100: 400, prot_100: 80.0, carb_100: 8.0, gord_100: 6.0, categoria: 'Suplemento' },
  { id: 15, nome: 'Caseína', kcal_100: 370, prot_100: 78.0, carb_100: 5.0, gord_100: 3.0, categoria: 'Suplemento' },
  { id: 16, nome: 'Batata doce cozida', kcal_100: 77, prot_100: 0.6, carb_100: 18.4, gord_100: 0.1, categoria: 'Carboidrato' },
  { id: 17, nome: 'Batata inglesa cozida', kcal_100: 52, prot_100: 1.2, carb_100: 11.9, gord_100: 0.1, categoria: 'Carboidrato' },
  { id: 18, nome: 'Mandioca cozida', kcal_100: 125, prot_100: 0.6, carb_100: 30.1, gord_100: 0.3, categoria: 'Carboidrato' },
  { id: 19, nome: 'Macarrão cozido', kcal_100: 158, prot_100: 5.8, carb_100: 30.9, gord_100: 1.1, categoria: 'Carboidrato' },
  { id: 20, nome: 'Pão francês', kcal_100: 300, prot_100: 8.0, carb_100: 58.6, gord_100: 3.1, categoria: 'Carboidrato' },
  { id: 21, nome: 'Pão integral', kcal_100: 253, prot_100: 9.4, carb_100: 49.9, gord_100: 3.5, categoria: 'Carboidrato' },
  { id: 22, nome: 'Tapioca', kcal_100: 240, prot_100: 0.0, carb_100: 60.0, gord_100: 0.0, categoria: 'Carboidrato' },
  { id: 23, nome: 'Aveia em flocos', kcal_100: 394, prot_100: 13.9, carb_100: 66.6, gord_100: 8.5, categoria: 'Carboidrato' },
  { id: 24, nome: 'Granola', kcal_100: 471, prot_100: 8.0, carb_100: 66.0, gord_100: 18.0, categoria: 'Carboidrato' },
  { id: 25, nome: 'Cuscuz de milho', kcal_100: 113, prot_100: 2.2, carb_100: 25.3, gord_100: 0.4, categoria: 'Carboidrato' },
  { id: 26, nome: 'Banana prata', kcal_100: 98, prot_100: 1.3, carb_100: 26.0, gord_100: 0.1, categoria: 'Fruta' },
  { id: 27, nome: 'Maçã', kcal_100: 56, prot_100: 0.3, carb_100: 15.2, gord_100: 0.0, categoria: 'Fruta' },
  { id: 28, nome: 'Mamão', kcal_100: 40, prot_100: 0.5, carb_100: 10.4, gord_100: 0.1, categoria: 'Fruta' },
  { id: 29, nome: 'Laranja', kcal_100: 45, prot_100: 1.0, carb_100: 11.5, gord_100: 0.1, categoria: 'Fruta' },
  { id: 30, nome: 'Abacate', kcal_100: 96, prot_100: 1.2, carb_100: 6.0, gord_100: 8.4, categoria: 'Fruta' },
  { id: 31, nome: 'Morango', kcal_100: 30, prot_100: 0.9, carb_100: 6.8, gord_100: 0.3, categoria: 'Fruta' },
  { id: 32, nome: 'Leite integral', kcal_100: 61, prot_100: 2.9, carb_100: 4.3, gord_100: 3.2, categoria: 'Laticínio' },
  { id: 33, nome: 'Leite desnatado', kcal_100: 35, prot_100: 3.4, carb_100: 5.0, gord_100: 0.2, categoria: 'Laticínio' },
  { id: 34, nome: 'Iogurte natural integral', kcal_100: 61, prot_100: 3.5, carb_100: 4.7, gord_100: 3.3, categoria: 'Laticínio' },
  { id: 35, nome: 'Iogurte grego zero', kcal_100: 59, prot_100: 10.0, carb_100: 4.0, gord_100: 0.0, categoria: 'Laticínio' },
  { id: 36, nome: 'Queijo minas frescal', kcal_100: 264, prot_100: 17.4, carb_100: 3.2, gord_100: 20.2, categoria: 'Laticínio' },
  { id: 37, nome: 'Requeijão light', kcal_100: 175, prot_100: 10.0, carb_100: 4.0, gord_100: 13.0, categoria: 'Laticínio' },
  { id: 38, nome: 'Brócolis cozido', kcal_100: 25, prot_100: 2.1, carb_100: 4.4, gord_100: 0.5, categoria: 'Vegetal' },
  { id: 39, nome: 'Alface', kcal_100: 15, prot_100: 1.4, carb_100: 2.4, gord_100: 0.2, categoria: 'Vegetal' },
  { id: 40, nome: 'Tomate', kcal_100: 15, prot_100: 1.1, carb_100: 3.1, gord_100: 0.2, categoria: 'Vegetal' },
  { id: 41, nome: 'Cenoura cozida', kcal_100: 30, prot_100: 0.8, carb_100: 6.7, gord_100: 0.2, categoria: 'Vegetal' },
  { id: 42, nome: 'Abobrinha refogada', kcal_100: 23, prot_100: 1.1, carb_100: 3.0, gord_100: 1.0, categoria: 'Vegetal' },
  { id: 43, nome: 'Azeite de oliva', kcal_100: 884, prot_100: 0.0, carb_100: 0.0, gord_100: 100.0, categoria: 'Gordura' },
  { id: 44, nome: 'Óleo de coco', kcal_100: 862, prot_100: 0.0, carb_100: 0.0, gord_100: 100.0, categoria: 'Gordura' },
  { id: 45, nome: 'Castanha de caju', kcal_100: 570, prot_100: 18.5, carb_100: 29.1, gord_100: 43.8, categoria: 'Gordura' },
  { id: 46, nome: 'Castanha do Pará', kcal_100: 643, prot_100: 14.5, carb_100: 15.1, gord_100: 63.5, categoria: 'Gordura' },
  { id: 47, nome: 'Amendoim torrado', kcal_100: 544, prot_100: 27.2, carb_100: 20.3, gord_100: 43.9, categoria: 'Gordura' },
  { id: 48, nome: 'Pasta de amendoim integral', kcal_100: 588, prot_100: 25.0, carb_100: 20.0, gord_100: 50.0, categoria: 'Gordura' },
  { id: 49, nome: 'Chocolate 70 por cento', kcal_100: 560, prot_100: 7.8, carb_100: 45.9, gord_100: 38.3, categoria: 'Outro' },
  { id: 50, nome: 'Mel', kcal_100: 309, prot_100: 0.0, carb_100: 84.0, gord_100: 0.0, categoria: 'Outro' },
]
