import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Smartphone,
  Download,
  CheckCircle,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Package,
  Terminal,
  Cpu,
  Check,
  ExternalLink,
  FileDown
} from 'lucide-react';
import { ANDROID_PROJECT_FILES } from '../data/androidFiles';

export const ApkDownloadView: React.FC = () => {
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadZip = async () => {
    setIsZipping(true);
    setDownloadSuccess(false);
    try {
      const zip = new JSZip();

      // Add all Android Studio project files into the zip archive
      ANDROID_PROJECT_FILES.forEach(file => {
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
      a.download = 'DispenserBenchTest_Android_APK_Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 6000);
    } catch (err) {
      console.error('Failed to create APK project zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full text-xs text-blue-400 font-bold">
            <Package className="w-3.5 h-3.5" />
            <span>Android APK Package &amp; Build Center</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Get the Straight .APK File
          </h2>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            An Android <code>.apk</code> is a compiled binary package (DEX bytecode and binary XML). 
            This package includes everything configured to produce <strong>app-debug.apk</strong> immediately.
          </p>

          {/* Download Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-3.5 rounded-2xl flex items-center justify-center space-x-2.5 shadow-lg shadow-blue-600/30 cursor-pointer transition-all transform active:scale-98 disabled:opacity-50"
            >
              {isZipping ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Preparing Package...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-5 h-5 text-emerald-300" />
                  <span>Package Downloaded!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5" />
                  <span>Download APK Project Package (.ZIP)</span>
                </>
              )}
            </button>

            <div className="flex items-center space-x-2 text-xs text-slate-400 px-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Contains Gradle build scripts &amp; GitHub Actions cloud workflow</span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Methods to Generate the .APK */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-white">How to Get Your Straight .APK File:</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Method 1: Cloud Build with GitHub Actions (No setup on PC) */}
          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Fastest (Cloud Automated)
              </span>
              <span className="text-xs text-slate-400">Zero software needed on your PC</span>
            </div>

            <h4 className="font-bold text-base text-white">1. Automatic Cloud Build via GitHub Actions</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              This package includes a pre-configured GitHub Actions workflow (<code>.github/workflows/build-apk.yml</code>).
            </p>

            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <li>Upload or push this project to a free repository on GitHub.</li>
              <li>GitHub automatically compiles the Kotlin code in the cloud (~60 seconds).</li>
              <li>Click the <strong>Actions</strong> tab on your GitHub repository.</li>
              <li>Click the latest build run and download the straight <strong>app-debug.apk</strong> file directly to your phone!</li>
            </ol>
          </div>

          {/* Method 2: Local 1-Click Android Studio or Terminal Build */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Local Build
              </span>
              <span className="text-xs text-slate-400">1 Click in Android Studio</span>
            </div>

            <h4 className="font-bold text-base text-white">2. 1-Click Build in Android Studio</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Open the downloaded folder in Android Studio on your computer:
            </p>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <p>
                In the top menu, click <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.
              </p>
              <div className="text-[11px] font-mono text-emerald-400 pt-1">
                Output file: app/build/outputs/apk/debug/app-debug.apk
              </div>
              <p className="text-slate-400 text-[11px]">
                Or in terminal run: <code>./gradlew assembleDebug</code>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Bluetooth Note */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-200 text-xs">
        <div className="flex items-center space-x-2 font-bold text-amber-300 mb-1">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>BLUETOOTH HARDWARE REQUIREMENT</span>
        </div>
        <p className="text-amber-200/90 leading-relaxed text-xs">
          The HC-05 module uses <strong>Bluetooth Classic RFCOMM (SPP)</strong>. Android phones have built-in Bluetooth Classic hardware and support SPP serial sockets. 
          When you install <code>app-debug.apk</code> on your phone, pair with HC-05 in Android Settings (PIN: 1234), then open the app to bench-test your 3-day schedule and servos.
        </p>
      </div>

      {/* Package Specs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
        <h3 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
          <Smartphone className="w-4 h-4 text-blue-400" />
          <span>APK Package Specifications</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Application ID</span>
            <span className="font-bold text-slate-200 font-mono">com.prototype.dispenserbench</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Output APK Filename</span>
            <span className="font-bold text-emerald-400 font-mono">app-debug.apk</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Min SDK / Target SDK</span>
            <span className="font-bold text-slate-200">API 26 (8.0) / API 34 (14)</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Hardware Protocol</span>
            <span className="font-bold text-slate-200">Bluetooth Classic HC-05 SPP</span>
          </div>
        </div>
      </div>
    </div>
  );
};
