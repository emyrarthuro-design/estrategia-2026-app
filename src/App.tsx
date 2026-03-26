/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  BarChart3, 
  BrainCircuit, 
  Target, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  RefreshCcw,
  MessageSquare,
  Users,
  Briefcase,
  AlertCircle,
  Loader2,
  Activity,
  LogIn,
  LogOut
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { QUESTIONS } from './constants';
import { getGeminiDiagnostic } from './services/geminiService';
import { DiagnosticResults } from './types';
import { auth, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [errorState, setErrorState] = useState<ErrorBoundaryState>({ hasError: false, error: null });

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setErrorState({ hasError: true, error: event.error });
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (errorState.hasError) {
    let errorMessage = "Algo salió mal.";
    try {
      const parsed = JSON.parse(errorState.error?.message || "");
      if (parsed.error) errorMessage = `Error de Firestore: ${parsed.error}`;
    } catch {
      errorMessage = errorState.error?.message || errorMessage;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="max-w-md w-full bg-rose-50 p-8 rounded-3xl border border-rose-100 text-center">
          <AlertCircle size={48} className="text-rose-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Ups! Hubo un error</h2>
          <p className="text-rose-700 mb-6">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all"
          >
            Recargar Aplicación
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// --- Components ---

const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const progress = (current / total) * 100;
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-8">
      <motion.div 
        className="h-full bg-indigo-600"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
};

const WelcomeScreen = ({ onStart }: { onStart: () => void; key?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="max-w-2xl mx-auto text-center py-12 px-4"
  >
    <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-6 text-indigo-600">
      <BrainCircuit size={48} />
    </div>
    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
      Diagnóstico Estratégico de IA para tu Negocio
    </h1>
    <p className="text-lg text-gray-600 mb-10 leading-relaxed">
      Descubre qué tan preparado está tu negocio para la era de la inteligencia artificial. 
      Recibe un análisis personalizado de tu madurez operativa y una hoja de ruta estratégica para automatizar y crecer.
    </p>
    <button 
      onClick={onStart}
      className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 group"
    >
      Comenzar Diagnóstico Gratis
      <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
    </button>
    <p className="mt-6 text-sm text-gray-400">
      Toma menos de 3 minutos. Sin tecnicismos, orientado a resultados.
    </p>
  </motion.div>
);

const QuestionStep = ({ 
  question, 
  onAnswer, 
  onBack, 
  isFirst, 
  currentValue 
}: { 
  question: any; 
  onAnswer: (value: string) => void; 
  onBack: () => void;
  isFirst: boolean;
  currentValue?: string;
}) => (
  <motion.div 
    key={question.id}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="max-w-2xl mx-auto py-8 px-4"
  >
    <div className="mb-8">
      <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
        {question.category}
      </span>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        {question.text}
      </h2>
      {question.description && (
        <p className="text-gray-500">{question.description}</p>
      )}
    </div>

    <div className="space-y-4 mb-10">
      {question.options.map((option: any) => (
        <button
          key={option.value}
          onClick={() => onAnswer(option.value)}
          className={`w-full text-left p-5 rounded-xl border-2 transition-all group flex items-center justify-between ${
            currentValue === option.value 
              ? 'border-indigo-600 bg-indigo-50 text-indigo-900' 
              : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50 text-gray-700'
          }`}
        >
          <span className="font-medium text-lg">{option.label}</span>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            currentValue === option.value ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
          }`}>
            {currentValue === option.value && <CheckCircle2 size={16} className="text-white" />}
          </div>
        </button>
      ))}
    </div>

    <div className="flex items-center justify-between">
      <button 
        onClick={onBack}
        disabled={isFirst}
        className={`flex items-center text-gray-500 hover:text-gray-900 transition-colors ${isFirst ? 'opacity-0 pointer-events-none' : ''}`}
      >
        <ChevronLeft size={20} className="mr-1" />
        Anterior
      </button>
    </div>
  </motion.div>
);

const LoginStep = ({ onLogin, error }: { onLogin: () => void; error: string | null; key?: string }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="max-w-md mx-auto text-center py-16 px-4"
  >
    <div className="bg-indigo-50 p-6 rounded-3xl mb-8 inline-block">
      <BrainCircuit size={48} className="text-indigo-600" />
    </div>
    <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Casi listo!</h2>
    <p className="text-gray-600 mb-10">
      Para generar y guardar tu diagnóstico personalizado, por favor inicia sesión con Google. 
      Esto nos permite asociar tus resultados a tu cuenta de forma segura.
    </p>
    
    {error && (
      <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-3 text-sm">
        <AlertCircle size={18} />
        <p className="font-medium">{error}</p>
      </div>
    )}

    <button 
      onClick={onLogin}
      className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-indigo-100 transition-all shadow-sm group"
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
      Continuar con Google
      <ArrowRight className="ml-auto w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </button>
    
    <p className="mt-6 text-xs text-gray-400">
      Tus datos están protegidos y solo se usarán para tu diagnóstico.
    </p>
  </motion.div>
);

const ScoreCard = ({ label, score, scoreName, icon: Icon, color }: { label: string; score: number; scoreName: string; icon: any; color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} />
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className={`w-2 h-6 rounded-full ${i <= score ? color : 'bg-gray-100'}`}
          />
        ))}
      </div>
    </div>
    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">{label}</p>
    <div className="flex items-baseline gap-2">
      <p className="text-3xl font-bold text-gray-900">{score}/5</p>
      <p className={`text-sm font-semibold ${color.replace('bg-', 'text-')}`}>{scoreName}</p>
    </div>
  </div>
);

const LoadingScreen = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="max-w-2xl mx-auto text-center py-24 px-4"
  >
    <div className="relative inline-block mb-8">
      <Loader2 size={64} className="text-indigo-600 animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <BrainCircuit size={24} className="text-indigo-600" />
      </div>
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Analizando tu Negocio...</h2>
    <div className="space-y-3 max-w-sm mx-auto">
      <p className="text-gray-500 animate-pulse">Evaluando madurez operativa...</p>
      <p className="text-gray-500 animate-pulse delay-75">Detectando cuellos de botella...</p>
      <p className="text-gray-500 animate-pulse delay-150">Diseñando hoja de ruta estratégica...</p>
    </div>
  </motion.div>
);

const ResultsDashboard = ({ results, onReset }: { results: DiagnosticResults; onReset: () => void; key?: string }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="max-w-5xl mx-auto py-8 px-4"
  >
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Tu Diagnóstico Estratégico</h2>
      <div className="max-w-3xl mx-auto bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
        <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2">Resumen Ejecutivo</h3>
        <p className="text-lg text-gray-700 leading-relaxed">{results.resumen_ejecutivo}</p>
      </div>
    </div>

    {/* Madurez Scores */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <ScoreCard 
        label="Madurez en IA" 
        score={results.madurez_ia_nivel} 
        scoreName={results.madurez_ia_nombre}
        icon={BrainCircuit} 
        color="bg-indigo-600" 
      />
      <ScoreCard 
        label="Madurez Operativa" 
        score={results.madurez_operativa_nivel} 
        scoreName={results.madurez_operativa_nombre}
        icon={BarChart3} 
        color="bg-emerald-500" 
      />
    </div>

    {/* Main Diagnostic Card */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Target size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Diagnóstico Principal</h3>
            <p className="text-gray-600 leading-relaxed">{results.diagnostico_principal}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
              <Activity size={14} className="mr-2 text-rose-500" />
              Cuellos de Botella
            </h4>
            <ul className="space-y-3">
              {results.cuellos_de_botella.map((cb, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700 text-sm">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-rose-400 rounded-full flex-shrink-0" />
                  <span className="font-medium">{cb}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
              <Zap size={14} className="mr-2 text-amber-500" />
              Oportunidades Prioritarias
            </h4>
            <ul className="space-y-3">
              {results.oportunidades_prioritarias.map((op, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="mt-1 flex-shrink-0 w-4 h-4 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {i + 1}
                  </div>
                  <span className="text-gray-700 font-medium">{op}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Prioridad Recomendada</h4>
          <div className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-md">
            {results.prioridad_recomendada}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Preparación EstrategIA 2026</h4>
          <p className="text-gray-700 font-medium italic text-sm leading-relaxed">"{results.preparacion_para_evento}"</p>
        </div>

        <div className="bg-indigo-900 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100">
          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Siguiente Paso Sugerido</h4>
          <p className="text-lg font-bold mb-4">{results.siguiente_paso_sugerido}</p>
          <button className="w-full py-3 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center group text-sm">
            Quiero mi Sesión
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>

    {/* EstrategIA 2026 Alignment Section */}
    <div className="mb-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
          <BrainCircuit size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">EstrategIA 2026: Tu Hoja de Ruta</h3>
          <p className="text-gray-500">Análisis de compatibilidad y preparación estratégica</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Viabilidad */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Viabilidad</span>
            <div className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
              results.viabilidad_estrategia_2026_nivel === 'alta' ? 'bg-emerald-100 text-emerald-700' :
              results.viabilidad_estrategia_2026_nivel === 'media' ? 'bg-amber-100 text-amber-700' :
              'bg-rose-100 text-rose-700'
            }`}>
              {results.viabilidad_estrategia_2026_nivel}
            </div>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed flex-grow">
            {results.viabilidad_estrategia_2026_explicacion}
          </p>
        </div>

        {/* Card 2: Cómo aprovecharlo */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Zap size={16} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preparación</span>
          </div>
          <h4 className="text-sm font-bold text-gray-900 mb-2">Cómo aprovechar el evento</h4>
          <p className="text-gray-600 text-sm italic leading-relaxed">
            "{results.como_aprovechar_mejor_estrategia_2026}"
          </p>
        </div>

        {/* Card 3: Continuidad */}
        <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-white/20 text-white rounded-lg">
              <ArrowRight size={16} />
            </div>
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Post-Evento</span>
          </div>
          <h4 className="text-sm font-bold mb-2">Continuidad Lógica</h4>
          <p className="text-indigo-50 text-sm font-medium leading-tight">
            {results.siguiente_paso_despues_del_evento}
          </p>
          <div className="mt-auto pt-4">
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-white" />
            </div>
          </div>
        </div>

        {/* Card 4: Preparación Previa (Original field but fits here) */}
        <div className="bg-gray-900 p-6 rounded-3xl text-white shadow-xl flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-indigo-500 text-white rounded-lg">
              <Target size={16} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enfoque 2026</span>
          </div>
          <h4 className="text-sm font-bold mb-2">Tu Preparación</h4>
          <p className="text-gray-300 text-sm italic leading-relaxed">
            "{results.preparacion_para_evento}"
          </p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
      <button className="p-4 bg-white border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
        <Users size={18} className="text-indigo-500" />
        Comunidad MAPS
      </button>
      <button className="p-4 bg-white border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
        <Briefcase size={18} className="text-indigo-500" />
        EstrategIA 2026
      </button>
      <button 
        onClick={onReset}
        className="p-4 bg-white border border-gray-200 rounded-xl text-gray-500 font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
      >
        <RefreshCcw size={18} />
        Repetir Diagnóstico
      </button>
    </div>
  </motion.div>
);

// --- Main App ---

export default function App() {
  const [step, setStep] = useState<'welcome' | 'form' | 'login' | 'loading' | 'results'>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleStart = () => {
    setStep('form');
  };

  const handleAnswer = (value: string) => {
    const questionId = QUESTIONS[currentQuestionIndex].id;
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      if (user) {
        processDiagnostic(newAnswers);
      } else {
        setStep('login');
      }
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle setting the user
      // We need to trigger processing after login if we were at the login step
      if (step === 'login') {
        processDiagnostic(answers);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("No pudimos iniciar sesión. Por favor intenta de nuevo.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      handleReset();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const processDiagnostic = async (finalAnswers: Record<string, string>) => {
    setStep('loading');
    setError(null);
    try {
      const data = await getGeminiDiagnostic(finalAnswers);
      setResults(data);
      setStep('results');
      toast.success('Diagnóstico guardado con éxito');
    } catch (err) {
      console.error(err);
      setError("Hubo un error al procesar tu diagnóstico. Por favor intenta de nuevo.");
      setStep('form');
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      setStep('welcome');
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setResults(null);
    setError(null);
    setStep('welcome');
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
        {/* Header */}
        <header className="border-b border-gray-50 py-6 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                E
              </div>
              <span className="font-bold text-xl tracking-tight">EstrategIA</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500 mr-4">
                <a href="#" className="hover:text-indigo-600 transition-colors">Metodología</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Comunidad</a>
              </div>
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-bold text-gray-900 leading-none">{user.displayName}</span>
                    <span className="text-xs text-gray-400">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-9 h-9 rounded-full border border-gray-100 shadow-sm" />
                    <button 
                      onClick={handleLogout}
                      className="p-2 text-gray-400 hover:text-rose-600 transition-colors bg-gray-50 rounded-lg"
                      title="Cerrar Sesión"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all text-sm font-bold flex items-center gap-2"
                >
                  <LogIn size={16} />
                  Ingresar
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="py-12">
          {error && (
            <div className="max-w-2xl mx-auto mb-8 px-4">
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 'welcome' && (
              <WelcomeScreen key="welcome" onStart={handleStart} />
            )}

            {step === 'form' && (
              <div key="form" className="max-w-3xl mx-auto px-4">
                <ProgressBar 
                  current={currentQuestionIndex + 1} 
                  total={QUESTIONS.length} 
                />
                <QuestionStep 
                  question={QUESTIONS[currentQuestionIndex]}
                  onAnswer={handleAnswer}
                  onBack={handleBack}
                  isFirst={currentQuestionIndex === 0}
                  currentValue={answers[QUESTIONS[currentQuestionIndex].id]}
                />
              </div>
            )}

            {step === 'login' && (
              <LoginStep key="login" onLogin={handleLogin} error={error} />
            )}

            {step === 'loading' && (
              <LoadingScreen key="loading" />
            )}

            {step === 'results' && results && (
              <ResultsDashboard 
                key="results" 
                results={results} 
                onReset={handleReset} 
              />
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="py-12 border-t border-gray-50 text-center">
          <p className="text-gray-400 text-sm">
            © 2026 EstrategIA. Todos los derechos reservados.
            <br />
            Panamá & Latinoamérica.
          </p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
