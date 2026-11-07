import React, { useState } from "react";
import {
  X,
  Key,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Check
} from "lucide-react";

export function ApiKeyModal({ isOpen, onClose, currentKey, onSaveKey }) {
  const [keyInput, setKeyInput] = useState(currentKey || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKey(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    setKeyInput("");
    onSaveKey("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-white">
              Gemini AI Engine Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          IncidentX is designed with a hybrid architecture:
          <br />
          • If an API key is provided, it uses <strong>Gemini 3.8 Flash</strong> for rich natural language synthesis.
          <br />
          • If no key is set, the system transparently executes using its built-in <strong>Deterministic SRE Expert Engine</strong>. No external API key is required to demo or test!
        </p>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Google Gemini API Key (Optional)
          </label>
          <div className="relative">
            <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <span className="text-[10px] text-slate-500">
            Stored locally in your browser session for this demo.
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Current Engine:{" "}
            <strong className="text-slate-200">
              {keyInput.trim() ? "Gemini 3.8 Flash (AI Model)" : "Deterministic Rule Engine (Active)"}
            </strong>
          </span>
        </div>

        <div className="flex items-center justify-between pt-2">
          {keyInput ? (
            <button
              onClick={handleClear}
              className="text-xs text-red-400 hover:underline"
            >
              Clear Key (Use Fallback)
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Apply Settings</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
