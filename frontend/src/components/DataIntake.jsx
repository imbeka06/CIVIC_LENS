import React, { useState } from 'react';

const DataIntake = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setAiResult(null);
    setError(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process document. Please check the backend.");
      }

      const data = await response.json();
      setAiResult(data.extracted_data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-l-4 border-blue-600 pl-4">
        <h2 className="text-2xl font-bold text-slate-800">Data Intake Pipeline</h2>
        <p className="text-slate-500 text-sm italic">AI-Powered Entity Extraction for Raw Financial Documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Upload Zone */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Upload Raw Document</h3>
          <p className="text-sm text-slate-500 mb-6">
            Upload an unstructured text file (e.g., a news article or scanned declaration). 
            The AI Engine will extract Candidates, Donors, and Amounts automatically.
          </p>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
              <input 
                type="file" 
                accept=".txt" 
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={!file || isLoading}
              className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${!file || isLoading ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isLoading ? 'AI is processing document...' : 'Extract Data via LLM'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Right Column: AI Visual Verification */}
        <div className="bg-slate-900 rounded-xl shadow-sm p-8 flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-4">
            <h3 className="text-lg font-bold text-white">AI Extraction Preview</h3>
            <span className="px-3 py-1 bg-slate-800 text-green-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-700">
              Visual Verification Step
            </span>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-lg font-mono text-sm text-blue-300 border border-slate-800">
            {isLoading ? (
              <div className="flex items-center gap-3 text-slate-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                Analyzing linguistic structures...
              </div>
            ) : aiResult ? (
              <pre>{JSON.stringify(aiResult, null, 2)}</pre>
            ) : (
              <span className="text-slate-600">Awaiting document upload...</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DataIntake;