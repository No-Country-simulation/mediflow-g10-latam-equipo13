import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '../components/ui';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6 bg-neutral-50">
      <Compass className="w-14 h-14 text-neutral-300" />
      <h1 className="text-2xl font-extrabold text-neutral-950">Página no encontrada</h1>
      <p className="text-neutral-500 max-w-sm">La dirección que abriste no existe o fue movida.</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
        <Button onClick={() => navigate('/')}>Ir al inicio</Button>
      </div>
    </div>
  );
}
