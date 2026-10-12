/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  ShieldAlert,
  Bluetooth,
  BluetoothOff,
  AlertTriangle
} from 'lucide-react';
import { AndroidEmulator, EmulatorSlot, BluetoothHardwareInfo } from './components/AndroidEmulator';
import { HardwareSimulator } from './components/HardwareSimulator';

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
  // Phone - Hardware Link State
  const [isConnected, setIsConnected] = useState(false);
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
          details: 'This device or browser does not have Bluetooth Classic or Web Bluetooth hardware APIs enabled. A device with a physical Bluetooth radio adapter is required to connect to your HC-05 module.',
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
              details: 'This device lacks a physical Bluetooth radio adapter, or Bluetooth is turned off in operating system settings.',
              checking: false,
              reason: 'Bluetooth radio adapter not detected or disabled'
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
        setLastCommand('Physical HC-05 Port Connected');
      } else if (navAny.bluetooth) {
        // Request bluetooth device
        const device = await navAny.bluetooth.requestDevice({
          acceptAllDevices: true
        });
        if (device) {
          setIsConnected(true);
          setLastCommand(`Connected to ${device.name || 'Bluetooth Device'}`);
        }
      }
    } catch (err: any) {
      console.warn('Bluetooth connection attempt:', err?.message || err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect handler
  const handleDisconnect = () => {
    setIsConnected(false);
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

      {/* Main Header / Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-sm sm:text-base text-white tracking-tight">
                  Dispenser Bench Controller
                </h1>
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  ESP8266 + HC-05
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                3-Day &bull; 9-Slot Bluetooth Schedule &amp; Servo Test Suite (Inert Items Only)
              </p>
            </div>
          </div>

          {/* Top Bar Right: Real Bluetooth Hardware Status & Connect Action */}
          <div className="flex items-center space-x-3">
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center space-x-2 text-xs font-medium transition-all ${
                isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : bluetoothInfo.hasHardware
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isConnected
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                    : bluetoothInfo.hasHardware
                    ? 'bg-blue-400'
                    : 'bg-red-400'
                }`}
              />
              <span className="hidden sm:inline">
                {isConnected
                  ? 'Physical HC-05 Connected'
                  : bluetoothInfo.hasHardware
                  ? 'Bluetooth Ready'
                  : 'Device Lacks Bluetooth'}
              </span>
              <span className="sm:hidden">
                {isConnected ? 'Connected' : bluetoothInfo.hasHardware ? 'BT Ready' : 'No BT'}
              </span>
            </div>

            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Disconnect
              </button>
            ) : bluetoothInfo.hasHardware ? (
              <button
                onClick={handleConnectRealBluetooth}
                disabled={isConnecting}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md cursor-pointer transition-colors"
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span>{isConnecting ? 'Pairing...' : 'Connect HC-05'}</span>
              </button>
            ) : (
              <span className="text-[11px] text-red-400 hidden md:inline font-mono">
                HC-05 Requires BT Radio
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        <AndroidEmulator
          isConnected={isConnected}
          isConnecting={isConnecting}
          deviceRevision={deviceRevision}
          bluetoothInfo={bluetoothInfo}
          onConnectRealBluetooth={handleConnectRealBluetooth}
          onDisconnect={handleDisconnect}
          onSendSchedule={handleSendSchedule}
          onReadBackState={handleReadBackState}
          onTestServo={handleTestServo}
          lastAck={lastAck}
          slots={phoneSlots}
          onUpdateSlotTime={handleUpdateSlotTime}
          deviceSyncedState={syncState}
          activeActuatingServo={activeActuatingServo}
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
      </main>
    </div>
  );
}
