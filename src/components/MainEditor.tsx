import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Wand2, Settings2, Download, RefreshCw, Camera, Frame, ImagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, Preset, AspectRatio, CameraAngle, Framing } from '../types';
import { generateOptimizedPrompt, generateImage } from '../services/gemini';
import { cn } from '../lib/utils';

const PRESETS: Preset[] = ['None', 'Cinematic', 'TikTok Dramatic', 'Realistic Photo', 'Horror Tension'];
const ASPECT_RATIOS: AspectRatio[] = ['1:1', '3:4', '4:3', '9:16', '16:9'];
const CAMERA_ANGLES: CameraAngle[] = ['Auto', 'Eye-level', 'Low Angle', 'High Angle', 'Aerial View', 'Dutch Tilt'];
const FRAMING_OPTIONS: Framing[] = ['Auto', 'Close-up', 'Medium Shot', 'Full Body', 'Wide Shot'];

export function MainEditor() {
  const [state, setState] = useState<AppState>({
    subjectImages: [],
    backgroundImage: null,
    instruction: '',
    preset: 'None',
    aspectRatio: '16:9',
    cameraAngle: 'Auto',
    framing: 'Auto',
    isGeneratingPrompt: false,
    isGeneratingImage: false,
    generatedPrompt: null,
    generatedImageUrl: null,
    error: null,
  });

  const subjectInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setState(s => ({ ...s, subjectImages: [...s.subjectImages, ...Array.from(e.target.files!)] }));
    }
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setState(s => ({ ...s, backgroundImage: e.target.files![0] }));
    }
  };

  const removeSubjectImage = (index: number) => {
    setState(s => ({ ...s, subjectImages: s.subjectImages.filter((_, i) => i !== index) }));
  };

  const removeBackgroundImage = () => {
    setState(s => ({ ...s, backgroundImage: null }));
  };

  const handleGenerate = async () => {
    if (state.subjectImages.length === 0) {
      setState(s => ({ ...s, error: 'Please upload at least one subject reference image.' }));
      return;
    }
    if (!state.instruction.trim() && state.preset === 'None' && state.cameraAngle === 'Auto' && state.framing === 'Auto' && !state.backgroundImage) {
      setState(s => ({ ...s, error: 'Please provide an instruction or use the quick controls.' }));
      return;
    }

    setState(s => ({ ...s, error: null, isGeneratingPrompt: true, generatedPrompt: null, generatedImageUrl: null }));

    try {
      // Step 1: Generate Prompt
      const prompt = await generateOptimizedPrompt(
        state.instruction,
        state.preset,
        state.aspectRatio,
        state.cameraAngle,
        state.framing,
        state.subjectImages,
        state.backgroundImage
      );
      
      setState(s => ({ ...s, isGeneratingPrompt: false, generatedPrompt: prompt, isGeneratingImage: true }));

      // Step 2: Generate Image
      const imageUrl = await generateImage(
        prompt,
        state.aspectRatio,
        state.subjectImages,
        state.backgroundImage
      );

      setState(s => ({ ...s, isGeneratingImage: false, generatedImageUrl: imageUrl }));
    } catch (error: any) {
      setState(s => ({ 
        ...s, 
        isGeneratingPrompt: false, 
        isGeneratingImage: false, 
        error: error.message || 'An error occurred during generation.' 
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col md:flex-row font-sans">
      {/* Sidebar Controls */}
      <div className="w-full md:w-[450px] border-r border-white/10 bg-[#141414] p-6 flex flex-col h-screen overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center">
            <Wand2 className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Nano Banana Pro</h1>
        </div>

        <div className="space-y-8 flex-1">
          
          {/* Subject Images */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Subject References
            </label>
            <div className="grid grid-cols-4 gap-2">
              {state.subjectImages.map((file, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 group">
                  <img src={URL.createObjectURL(file)} alt="Subject" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeSubjectImage(i)}
                    className="absolute top-1 right-1 bg-black/60 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => subjectInputRef.current?.click()}
                className="aspect-square rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:text-white/80 hover:border-white/40 transition-colors cursor-pointer bg-white/5"
              >
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[9px] uppercase tracking-wider">Add</span>
              </button>
              <input type="file" ref={subjectInputRef} onChange={handleSubjectChange} multiple accept="image/*" className="hidden" />
            </div>
          </div>

          {/* Background Image */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2">
              <ImagePlus className="w-4 h-4" /> Background (Optional)
            </label>
            {state.backgroundImage ? (
              <div className="relative h-24 rounded-lg overflow-hidden bg-white/5 border border-white/10 group">
                <img src={URL.createObjectURL(state.backgroundImage)} alt="Background" className="w-full h-full object-cover" />
                <button 
                  onClick={removeBackgroundImage}
                  className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[10px] text-center uppercase tracking-widest backdrop-blur-sm">
                  Environment Set
                </div>
              </div>
            ) : (
              <button 
                onClick={() => backgroundInputRef.current?.click()}
                className="w-full h-20 rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:text-white/80 hover:border-white/40 transition-colors cursor-pointer bg-white/5"
              >
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[10px] uppercase tracking-wider">Upload Background Image</span>
              </button>
            )}
            <input type="file" ref={backgroundInputRef} onChange={handleBackgroundChange} accept="image/*" className="hidden" />
          </div>

          {/* Quick Controls: Framing */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2">
              <Frame className="w-4 h-4" /> Framing
            </label>
            <div className="flex flex-wrap gap-2">
              {FRAMING_OPTIONS.map(f => (
                <button
                  key={f}
                  onClick={() => setState(s => ({ ...s, framing: f }))}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border cursor-pointer",
                    state.framing === f
                      ? "bg-white text-black border-white"
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Controls: Camera Angle */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2">
              <Camera className="w-4 h-4" /> Camera Angle
            </label>
            <div className="flex flex-wrap gap-2">
              {CAMERA_ANGLES.map(a => (
                <button
                  key={a}
                  onClick={() => setState(s => ({ ...s, cameraAngle: a }))}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border cursor-pointer",
                    state.cameraAngle === a
                      ? "bg-white text-black border-white"
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Instruction */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Custom Instruction</label>
            <textarea 
              value={state.instruction}
              onChange={e => setState(s => ({ ...s, instruction: e.target.value }))}
              placeholder="e.g. Turn him into a cyberpunk hacker in a neon alley..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm min-h-[80px] focus:outline-none focus:border-white/30 resize-none placeholder:text-white/20"
            />
          </div>

          {/* Settings */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-white/50" />
              <h2 className="text-sm font-medium text-white/80">Settings</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <label className="text-xs text-white/50">UI Preset</label>
                <select 
                  value={state.preset}
                  onChange={e => setState(s => ({ ...s, preset: e.target.value as Preset }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-white/30 appearance-none cursor-pointer"
                >
                  {PRESETS.map(p => <option key={p} value={p} className="bg-[#141414]">{p}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-xs text-white/50">Aspect Ratio</label>
                <select 
                  value={state.aspectRatio}
                  onChange={e => setState(s => ({ ...s, aspectRatio: e.target.value as AspectRatio }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-white/30 appearance-none cursor-pointer"
                >
                  {ASPECT_RATIOS.map(p => <option key={p} value={p} className="bg-[#141414]">{p}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 mt-auto">
          {state.error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              {state.error}
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={state.isGeneratingPrompt || state.isGeneratingImage}
            className="w-full bg-white text-black font-medium py-3.5 px-4 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {(state.isGeneratingPrompt || state.isGeneratingImage) ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {state.isGeneratingPrompt ? 'Optimizing Prompt...' : 'Generating Image...'}
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 p-6 md:p-12 flex flex-col h-screen overflow-y-auto relative bg-[#050505]">
        <div className="max-w-5xl mx-auto w-full h-full flex flex-col">
          
          <div className="flex-1 bg-[#141414] border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden relative min-h-[400px] shadow-2xl">
            <AnimatePresence mode="wait">
              {state.generatedImageUrl ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full flex items-center justify-center p-4"
                >
                  <img 
                    src={state.generatedImageUrl} 
                    alt="Generated" 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                  <a 
                    href={state.generatedImageUrl} 
                    download="nano-banana-pro.png"
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </motion.div>
              ) : (state.isGeneratingPrompt || state.isGeneratingImage) ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center text-white/40"
                >
                  <div className="w-16 h-16 border-4 border-white/10 border-t-white/60 rounded-full animate-spin mb-6" />
                  <p className="text-sm tracking-widest uppercase">
                    {state.isGeneratingPrompt ? 'Analyzing references & optimizing prompt...' : 'Rendering final image...'}
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center text-white/20"
                >
                  <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-sm">Your generated image will appear here</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Prompt Output */}
          <div className={cn(
            "mt-6 bg-[#141414] border border-white/10 rounded-xl p-5 transition-all duration-500",
            state.generatedPrompt ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">Optimized Prompt</h3>
              <div className="px-2 py-1 bg-white/10 rounded text-[10px] text-white/70 uppercase tracking-widest">
                Nano Banana Pro
              </div>
            </div>
            <p className="text-sm text-white/80 leading-relaxed font-mono">
              {state.generatedPrompt}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
