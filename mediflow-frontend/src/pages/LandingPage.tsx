import { useNavigate } from "react-router-dom";
import { ScanSearch, Route, Database, ArrowRight, Building2 } from "lucide-react";
import Logo from "../components/Logo";

const features = [
  { icon: ScanSearch, text: "Clasifica automáticamente" },
  { icon: Database, text: "Extrae datos con precisión" },
  { icon: Route, text: "Enruta al destino correcto" },
  { icon: Building2, text: "En OCI Object Storage" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-ink relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(47,111,237,0.25),transparent_55%)]" />
      <div className="relative max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <span className="w-2 h-2 rounded-full bg-brand-500" />
          ONE G10 · Hackathon
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-8 pb-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
            Documentos clínicos que se procesan solos.
          </h1>
          <p className="mt-5 text-white/60 text-lg max-w-md">
            Clasificación, extracción y enrutamiento inteligente de documentos clínicos con IA multimodal.
          </p>

          <div className="mt-8 space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-white/80">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-[15px]">{text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/inicio")}
            className="mt-9 inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 transition-colors text-white font-semibold px-5 py-3 rounded-xl"
          >
            Comenzar <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative hidden md:block">
          <div className="aspect-square rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center mb-4">
                <ScanSearch className="w-11 h-11 text-brand-500" />
              </div>
              <p className="text-white/40 text-sm">Vista previa del agente disponible en /inicio</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
