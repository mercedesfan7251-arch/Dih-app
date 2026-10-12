import React, { useState } from 'react';
import {
  Cpu,
  Radio,
  Monitor,
  Zap,
  RotateCw,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Play
} from 'lucide-react';

interface HardwareSimulatorProps {
  isConnected: boolean;
  deviceRevision: number;
  lastCommand: string;
  deviceSlots: { slot: string; time: string }[];
  activeActuatingServo: number | null;
  baudRate: number;
  onSetBaudRate: (baud: number) => void;
  onSimulateFault: (faultType: 'drop' | 'reject' | 'alien_id' | 'disconnect') => void;
}

export const HardwareSimulator: React.FC<HardwareSimulatorProps> = ({
  isConnected,
  deviceRevision,
  lastCommand,
  deviceSlots,
  activeActuatingServo,
  baudRate,
  onSetBaudRate,
  onSimulateFault
}) => {
  // Group slots by Day 1, Day 2, Day 3
  const d1Slots = deviceSlots.filter(s => s.slot.startsWith('D1_'));
  const d2Slots = deviceSlots.filter(s => s.slot.startsWith('D2_'));
  const d3Slots = deviceSlots.filter(s => s.slot.startsWith('D3_'));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-5">
      {/* Friendly Hardware Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">
              ESP8266 Hardware Board Simulation
            </h2>
            <p className="text-xs text-slate-400">
              Shows how the physical OLED screen and 3 servos respond on your workbench
            </p>
          </div>
        </div>

        {/* Power Status */}
        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span className="text-slate-300 font-medium">5V Power ON</span>
        </div>
      </div>

      {/* Grid: OLED Display & HC-05 Module */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SSD1306 128x64 OLED Display */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-300">0.96" OLED Display</span>
            </div>
            <span className="text-xs text-slate-500">I2C Screen</span>
          </div>

          {/* Virtual OLED Glass Screen */}
          <div className="w-full bg-[#050b14] border-2 border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 tracking-wider shadow-[inset_0_0_12px_rgba(6,182,212,0.15)] min-h-[130px] flex flex-col justify-between select-none">
            <div className="flex justify-between border-b border-cyan-800/40 pb-1 text-xs font-bold">
              <span>DISPENSER BENCH</span>
              <span className="text-amber-300">Rev {deviceRevision}</span>
            </div>

            <div className="py-1 text-xs text-cyan-200">
              <span className="text-slate-400">Status: </span>
              <span className="font-bold text-cyan-300">{lastCommand || 'Ready'}</span>
            </div>

            <div className="space-y-0.5 text-xs text-cyan-100 bg-cyan-950/20 p-2 rounded-lg border border-cyan-900/40">
              <div className="flex justify-between">
                <span className="text-cyan-400 font-bold">Day 1:</span>
                <span>{d1Slots.map(s => s.time).join('  ') || '08:00  18:00  22:00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400 font-bold">Day 2:</span>
                <span>{d2Slots.map(s => s.time).join('  ') || '08:00  18:00  22:00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400 font-bold">Day 3:</span>
                <span>{d3Slots.map(s => s.time).join('  ') || '08:00  18:00  22:00'}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-right pt-1">
              Local Clock Running
            </div>
          </div>
        </div>

        {/* HC-05 Bluetooth Module Breakdown */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200">HC-05 Bluetooth Module</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected
                      ? 'bg-blue-400 animate-pulse shadow-[0_0_8px_#60a5fa]'
                      : 'bg-red-500 animate-ping'
                  }`}
                />
                <span className="text-xs text-slate-400">
                  {isConnected ? 'Connected' : 'Waiting for phone'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Device Name:</span>
                <span className="text-slate-200 font-bold">HC-05</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Pairing PIN:</span>
                <span className="text-blue-300 font-mono font-bold">1234 (or 0000)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Wires to ESP8266:</span>
                <span className="text-slate-200">TX to Pin D7 &bull; RX to Pin D8</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Serial Speed:</span>
                <span className="text-slate-200 font-mono">9600 Baud (Standard)</span>
              </div>
            </div>
          </div>

          <div className="mt-3 p-2.5 bg-slate-900 rounded-xl text-xs text-slate-400 leading-normal border border-slate-800">
            Ensure your ESP8266 sketch uses 9600 baud to match the HC-05 factory default.
          </div>
        </div>
      </div>

      {/* 3 Mechanical Micro-Servos (Day 1, Day 2, Day 3) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-xs text-slate-200">
              3 Servos (One for Each Test Day)
            </h3>
          </div>
          <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
            Inert Test Items Only
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map(servoNum => {
            const isActuating = activeActuatingServo === servoNum;
            return (
              <div
                key={servoNum}
                className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                  isActuating
                    ? 'bg-blue-950/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex justify-between w-full text-xs text-slate-400 mb-2">
                  <span className="font-bold">Servo {servoNum}</span>
                  <span className={isActuating ? 'text-blue-400 font-bold animate-pulse' : 'text-slate-500'}>
                    {isActuating ? 'Moving (90°)' : 'Parked (0°)'}
                  </span>
                </div>

                {/* Animated Mechanical Servo Representation */}
                <div className="relative w-24 h-24 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center mb-2 overflow-hidden shadow-inner">
                  {/* Servo Gear Hub */}
                  <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-slate-300 shadow-md flex items-center justify-center z-10">
                    <div className="w-3 h-3 rounded-full bg-slate-900 border border-blue-400" />
                  </div>

                  {/* Rotating Servo Horn Arm */}
                  <div
                    className={`absolute w-14 h-3 bg-amber-400 rounded-full origin-left left-12 shadow transition-transform duration-500 ${
                      isActuating ? 'rotate-90' : 'rotate-0'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-slate-900 ml-auto mr-1 my-0.5" />
                  </div>

                  {/* Inert Load Marker */}
                  <div className="absolute bottom-1 right-2 flex space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" title="Inert bead" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" title="Inert bead" />
                  </div>
                </div>

                <div className="font-bold text-xs text-slate-200">Day {servoNum} Dispenser</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Connected to Pin {servoNum === 1 ? 'D5' : servoNum === 2 ? 'D6' : 'D2'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
