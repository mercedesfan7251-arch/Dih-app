import React, { useState, useEffect } from 'react';
import {
  Bluetooth,
  BluetoothOff,
  Calendar,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Clock,
  Edit2,
  Send,
  Save,
  RotateCw,
  Play,
  Download,
  Info,
  Radio,
  XCircle,
  HelpCircle
} from 'lucide-react';

export interface EmulatorSlot {
  slot: string;
  day: number;
  period: string;
  time: string;
  servoIndex: number;
}

export interface BluetoothHardwareInfo {
  supported: boolean;
  hasHardware: boolean;
  statusText: string;
  details: string;
  checking: boolean;
  reason?: string;
}

interface AndroidEmulatorProps {
  isConnected: boolean;
  isSimulationMode: boolean;
  isConnecting: boolean;
  deviceRevision: number;
  bluetoothInfo: BluetoothHardwareInfo;
  onConnectRealBluetooth: () => Promise<void>;
  onStartSimulation: () => void;
  onDisconnect: () => void;
  onSendSchedule: (slots: { slot: string; time: string }[]) => void;
  onReadBackState: () => void;
  onTestServo: (slot: string) => void;
  lastAck: { id: string; ok: boolean; cmd?: string; revision?: number; error?: string; timestamp: string } | null;
  slots: EmulatorSlot[];
  onUpdateSlotTime: (slotId: string, newTime: string) => void;
  deviceSyncedState: { isSynced: boolean; mismatches: string[] } | null;
  activeActuatingServo: number | null;
  onOpenApkTab: () => void;
}

export const AndroidEmulator: React.FC<AndroidEmulatorProps> = ({
  isConnected,
  isSimulationMode,
  isConnecting,
  deviceRevision,
  bluetoothInfo,
  onConnectRealBluetooth,
  onStartSimulation,
  onDisconnect,
  onSendSchedule,
  onReadBackState,
  onTestServo,
  lastAck,
  slots,
  onUpdateSlotTime,
  deviceSyncedState,
  activeActuatingServo,
  onOpenApkTab
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'bench' | 'connect'>('schedule');
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [editingSlot, setEditingSlot] = useState<EmulatorSlot | null>(null);
  const [editHour, setEditHour] = useState('08');
  const [editMin, setEditMin] = useState('00');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showNoBluetoothModal, setShowNoBluetoothModal] = useState(false);

  const handleOpenEdit = (slot: EmulatorSlot) => {
    setEditingSlot(slot);
    const parts = slot.time.split(':');
    setEditHour(parts[0] || '08');
    setEditMin(parts[1] || '00');
  };

  const handleSaveEdit = () => {
    const h = editHour.padStart(2, '0');
    const m = editMin.padStart(2, '0');
    const timeStr = `${h}:${m}`;
    const regex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!regex.test(timeStr)) {
      setStatusMessage('Please enter a valid time between 00:00 and 23:59');
      return;
    }
    if (editingSlot) {
      onUpdateSlotTime(editingSlot.slot, timeStr);
      setEditingSlot(null);
      setStatusMessage(`Updated ${editingSlot.period} time to ${timeStr}`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const adjustHour = (slot: EmulatorSlot, amount: number) => {
    const [hStr, mStr] = slot.time.split(':');
    let h = parseInt(hStr, 10);
    h = (h + amount + 24) % 24;
    const newTime = `${String(h).padStart(2, '0')}:${mStr || '00'}`;
    onUpdateSlotTime(slot.slot, newTime);
  };

  const applyPreset = (type: 'default' | 'even') => {
    slots.forEach(slot => {
      let t = '08:00';
      if (type === 'default') {
        t = slot.period === 'Morning' ? '08:00' : slot.period === 'Evening' ? '18:00' : '22:00';
      } else {
        t = slot.period === 'Morning' ? '06:00' : slot.period === 'Evening' ? '14:00' : '22:00';
      }
      onUpdateSlotTime(slot.slot, t);
    });
    setStatusMessage('Schedule preset applied!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleLocalSave = () => {
    const now = new Date().toLocaleTimeString();
    setStatusMessage(`Schedule saved locally at ${now} (ready to send to dispenser)`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSendToDevice = () => {
    const payload = slots.map(s => ({ slot: s.slot, time: s.time }));
    onSendSchedule(payload);
  };

  const handleConnectClick = async () => {
    if (!bluetoothInfo.hasHardware) {
      setShowNoBluetoothModal(true);
      return;
    }
    await onConnectRealBluetooth();
  };

  const getSlotForServo = (servoNum: number) => {
    if (servoNum === 1) return 'D1_MORNING';
    if (servoNum === 2) return 'D2_MORNING';
    return 'D3_MORNING';
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 text-white shadow-xl space-y-5">
      {/* Friendly Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="font-bold text-lg text-white">
            Dispenser Bench-Test Controller
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure 9 generic test slots (3 days &times; 3 periods) and test dispenser servos with inert items
          </p>
        </div>

        {/* Clean, Simple Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-blue-600 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('bench')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'bench'
                ? 'bg-blue-600 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Test Servos</span>
          </button>

          <button
            onClick={() => setActiveTab('connect')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'connect'
                ? 'bg-blue-600 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bluetooth className="w-4 h-4" />
            <span>Bluetooth Setup</span>
          </button>
        </div>
      </div>

      {/* CRITICAL NOTE: Device Lacks Bluetooth Note */}
      {!bluetoothInfo.hasHardware && (
        <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 text-xs text-red-200">
          <div className="flex items-start space-x-3">
            <BluetoothOff className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-red-300">
                NOTE: This Device Lacks Bluetooth Hardware
              </div>
              <p className="text-red-200/90 leading-relaxed">
                {bluetoothInfo.reason || 'No Bluetooth adapter or Bluetooth Classic serial support detected on this device.'}
                {' '}The HC-05 hardware module communicates over <strong>Bluetooth Classic RFCOMM (SPP)</strong>. 
                To test with physical hardware, download the <strong>Android APK package</strong> and install it on an Android phone that has Bluetooth.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={onOpenApkTab}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Get Android APK Package</span>
                </button>
                {!isConnected && (
                  <button
                    onClick={onStartSimulation}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Try Offline Simulation Mode
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status Banner */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div
            className={`w-3.5 h-3.5 rounded-full shrink-0 ${
              isConnected
                ? isSimulationMode
                  ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                  : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : isConnecting
                ? 'bg-blue-400 animate-pulse'
                : 'bg-slate-600'
            }`}
          />
          <div>
            <div className="font-bold text-sm text-slate-200 flex items-center space-x-2">
              <span>
                {isConnected
                  ? isSimulationMode
                    ? 'Offline Simulation Mode (Virtual Hardware)'
                    : 'Physical Bluetooth Connected (HC-05)'
                  : isConnecting
                  ? 'Connecting to Bluetooth...'
                  : bluetoothInfo.hasHardware
                  ? 'Bluetooth Disconnected • No Device Linked'
                  : 'Disconnected • Device Lacks Bluetooth'}
              </span>
              {isSimulationMode && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  SIMULATION
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {isConnected
                ? isSimulationMode
                  ? 'Actions are simulated in software. No physical Bluetooth is currently linked.'
                  : 'Connected to physical HC-05 module over Bluetooth Classic Serial.'
                : bluetoothInfo.hasHardware
                ? 'Bluetooth radio detected on this device. Click Connect to link with your HC-05.'
                : 'This device does not have Bluetooth. Use the Android APK on a phone to connect.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {!isConnected ? (
            <>
              {bluetoothInfo.hasHardware ? (
                <button
                  onClick={handleConnectClick}
                  disabled={isConnecting}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-md cursor-pointer transition-colors"
                >
                  <Bluetooth className="w-4 h-4" />
                  <span>{isConnecting ? 'Connecting...' : 'Connect HC-05 Device'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowNoBluetoothModal(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3.5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <BluetoothOff className="w-4 h-4 text-red-400" />
                  <span>Connect Device (Check BT)</span>
                </button>
              )}

              <button
                onClick={onStartSimulation}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl font-medium text-xs cursor-pointer transition-colors"
                title="Test controls in software without hardware"
              >
                Offline Demo
              </button>
            </>
          ) : (
            <button
              onClick={onDisconnect}
              className="border border-slate-700 hover:bg-slate-900 text-slate-300 px-4 py-2 rounded-xl font-bold text-xs cursor-pointer transition-colors"
            >
              Disconnect
            </button>
          )}

          <button
            onClick={onOpenApkTab}
            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-3.5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download APK</span>
          </button>
        </div>
      </div>

      {/* Safety Reminder */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-amber-200 text-xs">
        <div className="flex items-center space-x-2 font-bold text-amber-300 mb-1">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>PROTOTYPE TEST BENCH &bull; BENCH TEST ONLY WITH INERT ITEMS (PLASTIC BEADS OR DRY BEANS)</span>
        </div>
        <p className="text-[11px] text-amber-200/80 leading-relaxed">
          This hardware prototype is strictly for engineering bench testing. Never load real medication, pills, or chemicals into this device. Keep fingers clear of servo moving parts during actuation.
        </p>
      </div>

      {/* Status Toast */}
      {statusMessage && (
        <div className="bg-blue-950/80 border border-blue-500/40 text-blue-200 px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* TAB 1: SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* Quick Presets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Quick Presets:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => applyPreset('default')}
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                Standard (08:00, 18:00, 22:00)
              </button>
              <button
                onClick={() => applyPreset('even')}
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                Even Spread (06:00, 14:00, 22:00)
              </button>
            </div>
          </div>

          {/* 3 Days Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(dayNum => {
              const daySlots = slots.filter(s => s.day === dayNum);
              return (
                <div
                  key={dayNum}
                  className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-sm text-white">Day {dayNum}</span>
                    <span className="text-xs bg-slate-900 text-blue-400 border border-slate-800 px-2.5 py-0.5 rounded-full font-medium">
                      Controls Servo {dayNum}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {daySlots.map(slot => (
                      <div
                        key={slot.slot}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-xs text-white">{slot.period}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{slot.slot}</div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => adjustHour(slot, -1)}
                            className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                            title="Subtract 1 hour"
                          >
                            -1h
                          </button>

                          <button
                            onClick={() => handleOpenEdit(slot)}
                            className="bg-slate-950 hover:bg-slate-800 text-blue-400 hover:text-white font-mono font-bold text-sm px-3 py-1 rounded-lg border border-slate-700 flex items-center space-x-1.5 cursor-pointer transition-colors"
                            title="Click to edit exact time"
                          >
                            <span>{slot.time}</span>
                            <Edit2 className="w-3 h-3 text-slate-400" />
                          </button>

                          <button
                            onClick={() => adjustHour(slot, 1)}
                            className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                            title="Add 1 hour"
                          >
                            +1h
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              {isConnected
                ? 'Ready to transmit 9 time slots to dispenser microcontroller.'
                : 'Connect Bluetooth or run offline demo to transmit schedule.'}
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={handleLocalSave}
                className="flex-1 sm:flex-none border border-slate-700 hover:bg-slate-850 text-slate-300 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Locally</span>
              </button>

              <button
                onClick={handleSendToDevice}
                disabled={!isConnected}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                  !isConnected
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Dispenser</span>
              </button>
            </div>
          </div>

          {/* Device Response Banner */}
          {lastAck && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                lastAck.ok
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                {lastAck.ok ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>
                  <strong>{lastAck.ok ? 'Device Accepted Schedule:' : 'Device Rejected Request:'}</strong>{' '}
                  {lastAck.ok
                    ? `Revision #${lastAck.revision || deviceRevision} saved on ESP8266 memory at ${lastAck.timestamp}.`
                    : `Error: ${lastAck.error || 'Failed'}`}
                </span>
              </div>

              {isConnected && (
                <button
                  onClick={onReadBackState}
                  className="underline hover:text-white text-xs cursor-pointer ml-3 font-semibold shrink-0"
                >
                  Verify Read-Back
                </button>
              )}
            </div>
          )}

          {/* Sync Comparison Status */}
          {deviceSyncedState && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center space-x-2 ${
                deviceSyncedState.isSynced
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
              }`}
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>
                {deviceSyncedState.isSynced
                  ? 'ESP8266 memory is in sync with phone schedule.'
                  : `Mismatched slots: ${deviceSyncedState.mismatches.join(', ')}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BENCH TEST (SERVOS) */}
      {activeTab === 'bench' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <div>
              <h3 className="font-bold text-sm text-white">
                Servo Actuation Bench Test
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Deliberately actuate one servo at a time to test mechanical movement and alignment
              </p>
            </div>

            {/* Safety Checkbox */}
            <label className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={safetyConfirmed}
                onChange={e => setSafetyConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-700 bg-slate-950 focus:ring-0 cursor-pointer"
              />
              <span className="text-slate-300 text-xs leading-relaxed">
                <strong>Safety Confirmation:</strong> I confirm this is a bench-test prototype loaded only with inert test materials (e.g. plastic pellets or dry beans). Hands and fingers are clear of moving gears.
              </span>
            </label>

            {/* 3 Dedicated Servo Test Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map(servoNum => {
                const isActuating = activeActuatingServo === servoNum;
                return (
                  <div
                    key={servoNum}
                    className={`bg-slate-900 p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                      isActuating
                        ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">Servo {servoNum}</span>
                        <span className="text-xs text-blue-400 bg-slate-950 px-2 py-0.5 rounded">
                          Day {servoNum}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Status: {isActuating ? 'Moving (90°)...' : 'Parked (0°)'}
                      </p>
                    </div>

                    <button
                      onClick={() => onTestServo(getSlotForServo(servoNum))}
                      disabled={!isConnected || !safetyConfirmed || activeActuatingServo !== null}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                        !isConnected || !safetyConfirmed || activeActuatingServo !== null
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          : isActuating
                          ? 'bg-amber-500 text-slate-950 animate-pulse'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isActuating ? 'Moving...' : `Test Servo ${servoNum}`}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {!isConnected && (
              <p className="text-xs text-slate-500 text-center">
                Connect your Bluetooth hardware or start offline demo to actuate servos.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BLUETOOTH SETUP & HARDWARE DETECTION */}
      {activeTab === 'connect' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <div>
              <h3 className="font-bold text-sm text-white">
                Bluetooth Hardware Status &amp; Connection
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Live detection of your device's Bluetooth radio capabilities
              </p>
            </div>

            {/* Live Hardware Report */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Device Bluetooth Status:</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                    bluetoothInfo.hasHardware
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {bluetoothInfo.hasHardware ? 'Hardware Available' : 'No Bluetooth Hardware'}
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed text-xs">
                {bluetoothInfo.details}
              </p>
            </div>

            {/* HC-05 Connection Instructions */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-slate-300 leading-relaxed">
              <h4 className="font-bold text-white text-xs">How to connect to HC-05:</h4>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300">
                <li>Power on your ESP8266 and HC-05 board (red LED blinks rapidly).</li>
                <li>On your phone, go to <strong>Android Settings &rarr; Bluetooth</strong> and pair with <strong>HC-05</strong> (PIN: <code>1234</code>).</li>
                <li>Open the <strong>Dispenser Bench Test Android App</strong> on your phone.</li>
                <li>Select HC-05 from the paired device list and tap <strong>Connect</strong>.</li>
              </ol>
            </div>

            <button
              onClick={onOpenApkTab}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center space-x-2 cursor-pointer shadow-md transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Android APK Package</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Device Lacks Bluetooth */}
      {showNoBluetoothModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-red-500/20 rounded-xl text-red-400 shrink-0">
                <BluetoothOff className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-white">This Device Lacks Bluetooth</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bluetooth hardware was not detected on this machine. You cannot establish a Bluetooth connection to the HC-05 module from this device.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5 leading-relaxed">
              <p>
                <strong>Solution:</strong> Download the <strong>Android APK package</strong> and install it on an Android phone that has Bluetooth. The phone connects directly to the HC-05 over Bluetooth Classic.
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowNoBluetoothModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowNoBluetoothModal(false);
                  onOpenApkTab();
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Get APK Package</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Editor Modal */}
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-xs shadow-2xl space-y-4">
            <div>
              <h3 className="font-bold text-white text-sm">Edit Slot Time</h3>
              <p className="text-xs text-slate-400">
                Day {editingSlot.day} • {editingSlot.period}
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 py-2">
              <div className="text-center">
                <label className="text-[10px] text-slate-400 block mb-1">Hour (00-23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={editHour}
                  onChange={e => setEditHour(e.target.value.slice(0, 2))}
                  className="w-16 h-12 text-center text-xl font-bold bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
              <span className="text-2xl font-bold text-slate-400 mt-5">:</span>
              <div className="text-center">
                <label className="text-[10px] text-slate-400 block mb-1">Minute (00-59)</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={editMin}
                  onChange={e => setEditMin(e.target.value.slice(0, 2))}
                  className="w-16 h-12 text-center text-xl font-bold bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setEditingSlot(null)}
                className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Set Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
