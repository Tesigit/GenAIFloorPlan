import { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import InputForm, { FormData } from './components/InputForm';
import OutputSection from './components/OutputSection';
import FullscreenViewer from './components/FullscreenViewer';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import MyPlansHistory from './components/MyPlansHistory';
import { Plan } from './types/plan';

interface AuthUser {
  name: string;
  email: string;
  token: string;
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    length: '',
    width: '',
    floors: '1',
    floorDetails: [
      { bedrooms: '3', bathrooms: '2', kitchens: '1', livingRooms: '1', balconies: '1', parking: false, hasLift: false }
    ],
    specialRequirements: [],
    stylePreference: 'modern',
    prompt: '',
  });

  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [messages, setMessages] = useState<string[] | undefined>(undefined);
  const [promptSent, setPromptSent] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [plotDims, setPlotDims] = useState({ length: 10, width: 8 });

  const mainSectionRef = useRef<HTMLElement>(null);
  const outputSectionRef = useRef<HTMLDivElement>(null);

  // Restore auth from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('gplan_token');
    const userStr = localStorage.getItem('gplan_user');
    if (token && userStr) {
      try {
        const u = JSON.parse(userStr);
        setUser({ ...u, token });
      } catch {
        localStorage.removeItem('gplan_token');
        localStorage.removeItem('gplan_user');
      }
    }
  }, []);

  const showOutput = isGenerating || plan || floorPlanImage || (messages && messages.length > 0);

  const handleGenerate = async () => {
    if (!formData.length || !formData.width) {
      alert('Please enter plot dimensions (Length and Width).');
      return;
    }
    setIsGenerating(true);
    setMessages(undefined);
    setPlan(null);
    setFloorPlanImage(null);

    const dims = { length: Number(formData.length), width: Number(formData.width) };
    setPlotDims(dims);

    setTimeout(() => {
      outputSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    const reqBody = {
      length: dims.length,
      width: dims.width,
      floors: Number(formData.floors || 1),
      floorDetails: formData.floorDetails.map(fd => ({
        bedrooms: Number(fd.bedrooms),
        bathrooms: Number(fd.bathrooms),
        kitchens: Number(fd.kitchens),
        livingRooms: Number(fd.livingRooms),
        balconies: Number(fd.balconies),
        parking: Boolean(fd.parking),
        hasLift: Boolean(fd.hasLift)
      })),
      specialRequirements: formData.specialRequirements,
      stylePreference: formData.stylePreference,
      prompt: formData.prompt,
      units: 'meters',
    };
    // setLastRequest(reqBody);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify(reqBody),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      setPlan(data.plan);
      setMessages(data.messages);
      setPromptSent(data.prompt_sent || '');
    } catch (e) {
      console.error(e);
      setMessages([`⚠️ Failed: ${(e as Error).message}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const canvases = document.querySelectorAll('canvas');
    const canvasEl = canvases[canvases.length - 1] as HTMLCanvasElement;
    if (canvasEl) {
      const dataUrl = canvasEl.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'gplan-floor-plan.png';
      link.click();
    }
  };

  const handleAuthSuccess = (u: AuthUser) => {
    setUser(u);
    setIsAuthOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gplan_token');
    localStorage.removeItem('gplan_user');
  };

  const handleLoadSavedPlan = (loadedPlan: Plan, constraints: any) => {
    setPlan(loadedPlan);
    setMessages(['📂 Loaded from your saved plans']);
    if (constraints) {
      setFormData(prev => ({
        ...prev,
        length: String(constraints.length || prev.length),
        width: String(constraints.width || prev.width),
        floors: String(constraints.floors || prev.floors || '1'),
        floorDetails: constraints.floorDetails || prev.floorDetails || [{ bedrooms: '3', bathrooms: '2', kitchens: '1', livingRooms: '1', balconies: '1', parking: false, hasLift: false }],
        stylePreference: constraints.stylePreference || prev.stylePreference,
      }));
      setPlotDims({
        length: Number(constraints.length || 10),
        width: Number(constraints.width || 8),
      });
    }
    setTimeout(() => {
      outputSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="min-h-screen mb-0 bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-white selection:bg-blue-500/30 font-sans">
      <Header
        onToggleSidebar={() => { }}
        onToggleHistory={() => {
          if (!user) { setIsAuthOpen(true); return; }
          setIsHistoryOpen(true);
        }}
        user={user}
        onLogin={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {!showOutput && <HeroSection onStartDesigning={() => mainSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} />}

      {!showOutput && (
        <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-10 shadow-2xl overflow-hidden relative group hover:bg-white/[0.07] transition-all duration-500">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-500" />
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">About this app</h2>
                <p className="text-slate-300 leading-relaxed text-lg mb-8">
                  Experience the future of architectural design. GPlan uses advanced AI to instantly generate tailored floor plans based on your specific needs and lot dimensions.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <main
        id="generate"
        ref={mainSectionRef}
        className={`relative z-10 transition-all duration-500 ${showOutput ? 'fixed inset-0 top-16 h-[calc(100vh-64px)] flex flex-col lg:flex-row overflow-hidden bg-[#0a0f1d]' : 'max-w-7xl mx-auto px-4 py-16'}`}
      >
        <div className={`transition-all duration-500 ${showOutput ? 'w-full lg:w-64 xl:w-72 border-r border-white/[0.04] bg-slate-950/40 backdrop-blur-xl z-20 flex-shrink-0 h-full scrollbar-thin' : 'w-full max-w-4xl mx-auto'}`}>
          <InputForm
            formData={formData}
            onChange={setFormData}
            isSidebarMode={!!showOutput}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>
        {showOutput && (
          <div ref={outputSectionRef} className="flex-1 relative overflow-hidden bg-[#0c1222]">
            <OutputSection
              floorPlanImage={floorPlanImage}
              isGenerating={isGenerating}
              onRegenerate={handleGenerate}
              onDownload={handleDownload}
              onFullscreen={() => plan && setIsFullscreen(true)}
              plan={plan || undefined}
              messages={messages}
              promptSent={promptSent}
              plotWidth={plotDims.width}
              plotLength={plotDims.length}
            />
          </div>
        )}
      </main>

      {!showOutput && (
        <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-white/10 p-10 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">Get in Touch</h2>
                <p className="text-slate-400 mb-8 max-w-sm">Have feedback on our AI generations? We'd love to hear from you.</p>
              </div>
              <div className="bg-black/20 rounded-2xl border border-white/10 p-8">
                <form className="space-y-5">
                  <input className="w-full px-4 py-3 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-600 transition-all outline-none" placeholder="Your name" />
                  <input type="email" className="w-full px-4 py-3 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-600 transition-all outline-none" placeholder="you@example.com" />
                  <textarea rows={3} className="w-full px-4 py-3 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-600 transition-all outline-none" placeholder="Your message..." />
                  <button type="button" className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg">Send Message</button>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {!showOutput && <Footer />}

      {/* Auth Modal */}
      {isAuthOpen && (
        <AuthModal onClose={() => setIsAuthOpen(false)} onSuccess={handleAuthSuccess} />
      )}

      {/* My Plans History (from DB) */}
      {user && (
        <MyPlansHistory
          token={user.token}
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onLoad={handleLoadSavedPlan}
        />
      )}

      {/* Fullscreen Plan Viewer */}
      {isFullscreen && plan && (
        <FullscreenViewer
          plan={plan}
          plotWidth={plotDims.width}
          plotLength={plotDims.length}
          onClose={() => setIsFullscreen(false)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}

export default App;