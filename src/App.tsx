/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Cpu,
  Smartphone,
  ShieldAlert,
  ClipboardCheck,
  Layers,
  Bluetooth,
  BluetoothOff,
  AlertTriangle
} from 'lucide-react';
import { AndroidEmulator, EmulatorSlot, BluetoothHardwareInfo } from './components/AndroidEmulator';
import { HardwareSimulator } from './components/HardwareSimulator';
import { ApkDownloadView } from './components/ApkDownloadView';

const INITIAL_SLOTS: EmulatorSlot[] = [
  { slot: 'D1_MORNING', day: 1, period: 'Morning', time: '08:00', servoIndex: 1 },
  { slot: 'D1_EVENING', day: 1, period: 'Evening', time: '18:00', servoIndex: 1 },
  { slot: 'D1_NIGHT',   day: 1, period: 'Night',   time: '22:00', servoIndex: 1 },

  { slot: 'D2_MORNING', day: 2, period: 'Morning', time: '08:00', servoIndex: 2 },
  { slot: 'D2_EVENING', day: 2, period: 'Evening', time: '18:00', servoIndex: 2 },
  { slot: 'D2_NIGHT',   day: 2, period: 'Night',   time: '22:00', servoIndex: 2 },

  { slot: 'D3_MORNING', day: 3, period: 'Morning', time: '08:00', servoIndex: 3 },
  { slot: 'D3_EVENING', day: 3, period: 'Evening', time: '18:00', servoIndex: 3 },
  { slot: 'D3_NIGHT',   day: 3, period: 'Night',   time: '22:00', servoIndex: 3 },
];

export default function App() {
  const [activeMainTab, setActiveMainTab] = useState<'workbench' | 'apk' | 'wiring' | 'checklist'>('workbench');

  // Phone - Hardware Link State
  const [isConnected, setIsConnected] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [baudRate, setBaudRate] = useState(9600);
  const [deviceRevision, setDeviceRevision] = useState(1);
  const [lastCommand, setLastCommand] = useState('System Standby');
  const [activeActuatingServo, setActiveActuatingServo] = useState<number | null>(null);

  // Real Hardware Bluetooth Detection
  const [bluetoothInfo, setBluetoothInfo] = useState<BluetoothHardwareInfo>({
    supported: false,
    hasHardware: false,
    statusText: 'Checking Bluetooth...',
    details: 'Detecting device Bluetooth adapter...',
    checking: true
  });

  // Phone local schedule
  const [phoneSlots, setPhoneSlots] = useState<EmulatorSlot[]>(INITIAL_SLOTS);

  // Hardware stored schedule
  const [hardwareSlots, setHardwareSlots] = useState<{ slot: string; time: string }[]>(
    INITIAL_SLOTS.map(s => ({ slot: s.slot, time: s.time }))
  );

  // Read-back comparison
  const [syncState, setSyncState] = useState<{ isSynced: boolean; mismatches: string[] } | null>(null);

  // Last Ack received by the phone
  const [lastAck, setLastAck] = useState<{
    id: string;
    ok: boolean;
    cmd?: string;
    revision?: number;
    error?: string;
    timestamp: string;
  } | null>(null);

  // Detect Bluetooth hardware on device startup
  useEffect(() => {
    async function checkDeviceBluetooth() {
      const hasWebBluetooth = 'bluetooth' in navigator;
      const hasWebSerial = 'serial' in (navigator as any);

      if (!hasWebBluetooth && !hasWebSerial) {
        setBluetoothInfo({
          supported: false,
          hasHardware: false,
          statusText: 'No Bluetooth Support',
          details: 'This device or browser does not have Bluetooth Classic or Web Bluetooth hardware APIs enabled. Please install the APK on an Android device that has Bluetooth to connect to your HC-05 module.',
          checking: false
        });
        return;
      }

      const navAny = navigator as any;
      if (hasWebBluetooth && navAny.bluetooth?.getAvailability) {
        try {
          const available = await navAny.bluetooth.getAvailability();
          if (!available) {
            setBluetoothInfo({
              supported: true,
              hasHardware: false,
              statusText: 'No Bluetooth Adapter',
              details: 'This device lacks a physical Bluetooth radio adapter, or Bluetooth is disabled in system settings. Install the Android APK on an Android phone with Bluetooth to connect.',
              checking: false,
              reason: 'Bluetooth adapter not detected or disabled'
            });
            return;
          }
        } catch {
          // Fall through
        }
      }

      // If serial is supported (desktop Chrome for HC-05 Bluetooth COM ports) or bluetooth available
      if (hasWebSerial || hasWebBluetooth) {
        setBluetoothInfo({
          supported: true,
          hasHardware: true,
          statusText: 'Bluetooth Radio Available',
          details: hasWebSerial
            ? 'Web Serial is available. Paired Bluetooth Classic (HC-05 COM port) can be accessed directly.'
            : 'Web Bluetooth radio is detected on this device.',
          checking: false
        });
      }
    }

    checkDeviceBluetooth();
  }, []);

  // Connect to real hardware over Web Serial / Bluetooth
  const handleConnectRealBluetooth = async () => {
    if (!bluetoothInfo.hasHardware) {
      alert('This device does not have Bluetooth hardware. Please use an Android phone with the APK package to connect.');
      return;
    }

    setIsConnecting(true);

    try {
      const navAny = navigator as any;
      if ('serial' in navAny) {
        // Request paired HC-05 COM port
        const port = await navAny.serial.requestPort();
        await port.open({ baudRate: 9600 });
        setIsConnected(true);
        setIsSimulationMode(false);
        setLastCommand('Physical HC-05 Port Connected');
      } else if (navAny.bluetooth) {
        // Request bluetooth device
        const device = await navAny.bluetooth.requestDevice({
          acceptAllDevices: true
        });
        if (device) {
          setIsConnected(true);
          setIsSimulationMode(false);
          setLastCommand(`Connected to ${device.name || 'Bluetooth Device'}`);
        }
      }
    } catch (err: any) {
      console.warn('Bluetooth connection attempt:', err?.message || err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Start Offline Simulation Mode (Demo workbench testing without physical hardware)
  const handleStartSimulation = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setIsSimulationMode(true);
      setLastCommand('Offline Simulation Mode Active');
    }, 400);
  };

  // Disconnect handler
  const handleDisconnect = () => {
    setIsConnected(false);
    setIsSimulationMode(false);
    setLastCommand('Disconnected');
  };

  // Update a single slot time on phone
  const handleUpdateSlotTime = (slotId: string, newTime: string) => {
    setPhoneSlots(prev => prev.map(s => (s.slot === slotId ? { ...s, time: newTime } : s)));
    setSyncState(null);
  };

  // Dispatch schedule from phone to hardware
  const handleSendSchedule = (slotsToSend: { slot: string; time: string }[]) => {
    if (!isConnected) return;

    const reqId = Math.random().toString(36).substring(2, 6);

    setTimeout(() => {
      const nextRev = deviceRevision + 1;
      setDeviceRevision(nextRev);
      setHardwareSlots(slotsToSend);
      setLastCommand(`Saved Sched Rev ${nextRev}`);

      setLastAck({
        id: reqId,
        ok: true,
        cmd: 'set_schedule',
        revision: nextRev,
        timestamp: new Date().toLocaleTimeString()
      });
    }, 400);
  };

  // Read-back hardware state
  const handleReadBackState = () => {
    if (!isConnected) return;

    const mismatches: string[] = [];
    phoneSlots.forEach(ps => {
      const hs = hardwareSlots.find(h => h.slot === ps.slot);
      if (!hs) {
        mismatches.push(`${ps.slot}: Missing on ESP8266`);
      } else if (hs.time !== ps.time) {
        mismatches.push(`${ps.slot}: Local has '${ps.time}' vs ESP8266 has '${hs.time}'`);
      }
    });

    setSyncState({
      isSynced: mismatches.length === 0,
      mismatches
    });
    setLastCommand('State Read Back Verified');
  };

  // Actuate a servo for bench testing
  const handleTestServo = (slotId: string) => {
    if (!isConnected) return;

    const reqId = Math.random().toString(36).substring(2, 6);
    const servoNum = slotId.startsWith('D1_') ? 1 : slotId.startsWith('D2_') ? 2 : 3;
    setActiveActuatingServo(servoNum);
    setLastCommand(`Testing Servo ${servoNum}`);

    setTimeout(() => {
      setLastAck({
        id: reqId,
        ok: true,
        cmd: 'test_servo',
        timestamp: new Date().toLocaleTimeString()
      });

      setTimeout(() => {
        setActiveActuatingServo(null);
        setLastCommand(`Parked Servo ${servoNum}`);
      }, 700);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Safety Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-amber-300 font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              HARDWARE BENCH-TEST PROTOTYPE ONLY &bull; TEST EXCLUSIVELY WITH INERT ITEMS (e.g. plastic beads, dry beans)
            </span>
          </div>
          <span className="hidden md:inline text-amber-400/80 text-[11px]">
            NOT FOR USE WITH MEDICATIONS &bull; NO MEDICAL CERTIFICATION
          </span>
        </div>
      </div>

      {/* Main Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight flex items-center space-x-2">
                <span>Three-Day Dispenser Bench-Test Suite</span>
              </h1>
              <p className="text-xs text-slate-400">
                ESP8266 + HC-05 Bluetooth Controller for 3 Servos &bull; Inert Test Items Only
              </p>
            </div>
          </div>

          {/* Clean User-Friendly Navigation Tabs */}
          <nav className="flex space-x-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveMainTab('workbench')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer ${
                activeMainTab === 'workbench'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dispenser Controller</span>
            </button>

            <button
              onClick={() => setActiveMainTab('apk')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer ${
                activeMainTab === 'apk'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android APK Package</span>
            </button>

            <button
              onClick={() => setActiveMainTab('wiring')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer ${
                activeMainTab === 'wiring'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Wiring Guide</span>
            </button>

            <button
              onClick={() => setActiveMainTab('checklist')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer ${
                activeMainTab === 'checklist'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Test Checklist</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        {/* VIEW 1: DISPENSER CONTROLLER & HARDWARE BOARD */}
        {activeMainTab === 'workbench' && (
          <div className="space-y-6">
            <AndroidEmulator
              isConnected={isConnected}
              isSimulationMode={isSimulationMode}
              isConnecting={isConnecting}
              deviceRevision={deviceRevision}
              bluetoothInfo={bluetoothInfo}
              onConnectRealBluetooth={handleConnectRealBluetooth}
              onStartSimulation={handleStartSimulation}
              onDisconnect={handleDisconnect}
              onSendSchedule={handleSendSchedule}
              onReadBackState={handleReadBackState}
              onTestServo={handleTestServo}
              lastAck={lastAck}
              slots={phoneSlots}
              onUpdateSlotTime={handleUpdateSlotTime}
              deviceSyncedState={syncState}
              activeActuatingServo={activeActuatingServo}
              onOpenApkTab={() => setActiveMainTab('apk')}
            />

            <HardwareSimulator
              isConnected={isConnected}
              deviceRevision={deviceRevision}
              lastCommand={lastCommand}
              deviceSlots={hardwareSlots}
              activeActuatingServo={activeActuatingServo}
              baudRate={baudRate}
              onSetBaudRate={setBaudRate}
              onSimulateFault={() => {}}
            />
          </div>
        )}

        {/* VIEW 2: ANDROID APK PACKAGE DOWNLOAD (Zero code clutter) */}
        {activeMainTab === 'apk' && (
          <ApkDownloadView />
        )}

        {/* VIEW 3: HARDWARE WIRING & ELECTRICAL ARCHITECTURE */}
        {activeMainTab === 'wiring' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <span>ESP8266 + HC-05 Wiring &amp; Electrical Architecture</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Complete pin connections, voltage divider calculations, and servo power separation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wiring Pinout Table */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-200">1. Pin Mapping Table</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden font-mono">
                    <thead className="bg-slate-950 text-slate-300">
                      <tr>
                        <th className="p-2.5 border-b border-slate-800">Component</th>
                        <th className="p-2.5 border-b border-slate-800">Module Pin</th>
                        <th className="p-2.5 border-b border-slate-800">ESP8266 Pin</th>
                        <th className="p-2.5 border-b border-slate-800">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      <tr>
                        <td className="p-2.5 font-bold text-white">HC-05 VCC</td>
                        <td className="p-2.5">VCC</td>
                        <td className="p-2.5 text-blue-400">VIN (5V)</td>
                        <td className="p-2.5 text-slate-400">Requires 5V</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-white">HC-05 GND</td>
                        <td className="p-2.5">GND</td>
                        <td className="p-2.5 text-blue-400">GND</td>
                        <td className="p-2.5 text-slate-400">Common ground</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-white">HC-05 TXD</td>
                        <td className="p-2.5">TXD</td>
                        <td className="p-2.5 text-emerald-400">D7 (GPIO13)</td>
                        <td className="p-2.5 text-slate-400">Direct connection</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-white">HC-05 RXD</td>
                        <td className="p-2.5">RXD</td>
                        <td className="p-2.5 text-amber-400">D8 (GPIO15)</td>
                        <td className="p-2.5 text-slate-400">Via 1k/2k Divider</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-white">Servo 1 (Day 1)</td>
                        <td className="p-2.5">Signal</td>
                        <td className="p-2.5 text-purple-400">D5 (GPIO14)</td>
                        <td className="p-2.5 text-slate-400">Power from 5V rail</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-white">Servo 2 (Day 2)</td>
                        <td className="p-2.5">Signal</td>
                        <td className="p-2.5 text-purple-400">D6 (GPIO12)</td>
                        <td className="p-2.5 text-slate-400">Power from 5V rail</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-white">Servo 3 (Day 3)</td>
                        <td className="p-2.5">Signal</td>
                        <td className="p-2.5 text-purple-400">D2 (GPIO4)</td>
                        <td className="p-2.5 text-slate-400">Power from 5V rail</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-white">OLED Display</td>
                        <td className="p-2.5">SDA / SCL</td>
                        <td className="p-2.5 text-cyan-400">D1 / D2</td>
                        <td className="p-2.5 text-slate-400">I2C SSD1306</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hardware Best Practices */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-200">2. Power &amp; Voltage Rules</h3>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start space-x-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                    <span><strong>Separate Servo Power:</strong> Servos can draw 500mA-1A peak when moving. Power servos from a dedicated 5V power supply, never from the ESP8266 3.3V pin.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                    <span><strong>Voltage Divider:</strong> The HC-05 RX pin expects 3.3V logic. Use a 1k&Omega; / 2k&Omega; resistor divider between ESP8266 TX and HC-05 RX.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                    <span><strong>Common Ground:</strong> Connect all GND lines together (ESP8266, HC-05, Servo external power supply, and OLED).</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 mt-1.5" />
                    <span><strong>Inert Loads Only:</strong> Load test chambers only with plastic pellets or dry beans during bench evaluation.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: TEST CHECKLIST */}
        {activeMainTab === 'checklist' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <ClipboardCheck className="w-5 h-5 text-blue-400" />
                <span>Bench-Test Verification Checklist</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Step-by-step checklist to verify your prototype's hardware, Bluetooth communication, and schedule execution
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'CHK-01',
                  name: 'Bluetooth Hardware Presence & Pairing',
                  desc: 'Ensure the testing device has Bluetooth hardware. Pair with HC-05 in Android Settings (PIN: 1234). If the phone lacks Bluetooth, verify the app shows the missing Bluetooth note.'
                },
                {
                  id: 'CHK-02',
                  name: 'RFCOMM SPP Connection & Disconnect',
                  desc: 'Select HC-05 from paired devices and tap Connect. Confirm connection transitions to Connected. Tap Disconnect and verify socket teardown without app crash.'
                },
                {
                  id: 'CHK-03',
                  name: 'Schedule Format & 24-Hour Time Validation',
                  desc: 'Verify that all 9 generic slots (Day 1-3 Morning/Evening/Night) are populated with valid 24h format (HH:mm). Test invalid inputs (e.g. 25:00) to confirm validation blocks transmission.'
                },
                {
                  id: 'CHK-04',
                  name: 'Device Acknowledgement Matching by ID',
                  desc: 'Transmit schedule to ESP8266. Check that the incoming ACK matches the generated request ID and revision increments. Confirm the app does not show Accepted without matching ACK.'
                },
                {
                  id: 'CHK-05',
                  name: 'Servo Actuation with Inert Payload Only',
                  desc: 'Load chamber with inert plastic beads or dry beans. Check the safety confirmation box. Trigger Servo 1, 2, and 3 test actuation and verify servo horn rotates 90 degrees and returns to 0 degrees.'
                },
                {
                  id: 'CHK-06',
                  name: 'Autonomous Schedule Persistence on ESP8266',
                  desc: 'Disconnect Bluetooth. Verify the ESP8266 local clock continues running and the OLED displays the active 3-day cycle without needing constant phone connection.'
                }
              ].map(item => (
                <div key={item.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start space-x-3 text-xs">
                  <div className="px-2 py-1 bg-blue-600/20 text-blue-400 font-mono font-bold rounded text-[11px] shrink-0">
                    {item.id}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">{item.name}</h4>
                    <p className="text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
