import {ArrowLeft} from 'lucide-react'
import {useNavigate,useParams} from 'react-router-dom'
import {Chat} from '../components/Chat'
export default function Conversa(){const{id}=useParams(),navigate=useNavigate();if(!id)return null;return <div className="mx-auto max-w-[640px] pb-6"><header className="flex min-h-14 items-center gap-2 border-b border-line"><button onClick={()=>navigate('/social')} className="flex size-11 items-center justify-center" aria-label="Voltar"><ArrowLeft size={19}/></button><h1 className="text-lg font-semibold">Mensagens</h1></header><Chat conversaId={id}/></div>}
