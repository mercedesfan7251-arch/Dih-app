import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  FileCode,
  Download,
  Copy,
  Check,
  Folder,
  Layers,
  FileText,
  Terminal,
  Cpu,
  Search
} from 'lucide-react';
import { ANDROID_PROJECT_FILES, ProjectFile } from '../data/androidFiles';

export const ProjectCodeViewer: React.FC = () => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>('android/app/src/main/java/com/prototype/dispenserbench/MainActivity.kt');
  const [copied, setCopied] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [isZipping, setIsZipping] = useState(false);

  const selectedFile =
    ANDROID_PROJECT_FILES.find(f => f.path === selectedFilePath) || ANDROID_PROJECT_FILES[0];

  const filteredFiles = ANDROID_PROJECT_FILES.filter(
    f =>
      f.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      f.path.toLowerCase().includes(filterQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add all project files into the zip archive
      ANDROID_PROJECT_FILES.forEach(file => {
        // Strip leading 'android/' prefix so it unzips neatly as an Android Studio root project
        const relativePath = file.path.startsWith('android/')
          ? file.path.substring('android/'.length)
          : file.path;
        zip.file(relativePath, file.content);
      });

      // Generate the zip blob
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'DispenserBenchTest_AndroidStudio_Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const getCategoryBadge = (category: ProjectFile['category']) => {
    switch (category) {
      case 'kotlin':
        return <span className="text-[10px] bg-purple-500/20 text-purple-400 font-bold px-1.5 py-0.5 rounded">KOTLIN</span>;
      case 'gradle':
        return <span className="text-[10px] bg-blue-500/20 text-blue-400 font-bold px-1.5 py-0.5 rounded">GRADLE</span>;
      case 'manifest':
        return <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded">MANIFEST</span>;
      case 'firmware':
        return <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded">ESP8266 INO</span>;
      default:
        return <span className="text-[10px] bg-slate-700 text-slate-300 font-bold px-1.5 py-0.5 rounded">DOC</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-xl space-y-4">
      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-bold text-base text-slate-100 flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-blue-400" />
            <span>Android APK Package &amp; Project Files</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete buildable Android Studio project configured to assemble <code>app-debug.apk</code>
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isZipping ? 'Creating Project ZIP...' : 'Download Project (.ZIP) to Build APK'}</span>
        </button>
      </div>

      {/* 3-Step APK Build Guide Card */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="font-bold text-sm text-white flex items-center space-x-2">
          <span>How to Get the APK on Your Android Phone</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-blue-400">Step 1: Download &amp; Open</div>
            <p className="text-slate-300">
              Click the blue button above to download the ZIP. Extract it and open the folder in <strong>Android Studio</strong>.
            </p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400">Step 2: 1-Click Build APK</div>
            <p className="text-slate-300">
              In Android Studio, click <strong>Build &rarr; Build Bundle(s) / APK(s) &rarr; Build APK(s)</strong> (or run <code>./gradlew assembleDebug</code>).
            </p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-amber-400">Step 3: Install on Phone</div>
            <p className="text-slate-300">
              Transfer <code>app-debug.apk</code> to your phone (via USB, Drive, or Email), tap to install, and test!
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[550px]">
        {/* Left Column: File Tree */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col space-y-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search project files..."
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[500px] pr-1">
            {filteredFiles.map(file => {
              const isSelected = file.path === selectedFilePath;
              return (
                <div
                  key={file.path}
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`p-2 rounded-xl border flex flex-col cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600/10 border-blue-500/60 text-blue-300'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs truncate mr-2">{file.name}</span>
                    {getCategoryBadge(file.category)}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                    {file.path}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {/* Code Viewer Header */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-slate-200 truncate">
                  {selectedFile.path}
                </span>
                {getCategoryBadge(selectedFile.category)}
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {selectedFile.description}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Content */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200 bg-slate-950 max-h-[500px]">
            <pre className="whitespace-pre">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
