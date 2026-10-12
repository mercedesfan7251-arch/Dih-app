# DIY Three-Day Dispenser Prototype — Android Bench-Test Controller

> **CRITICAL SAFETY NOTICE**
> **HARDWARE BENCH-TEST PROTOTYPE ONLY**
> This application is strictly an engineering tool for bench-testing an experimental DIY mechanical prototype with **inert items only** (e.g., plastic beads, dry beans, small plastic pellets).
> **NEVER LOAD OR TEST WITH REAL MEDICATIONS, PILLS, SUPPLEMENTS, OR INGESTIBLE CHEMICALS.**
> This system is NOT a medical device, is NOT safety-certified, has NO compliance with medical dosage standards, and contains NO hardware failsafes or redundant interlocks.

---

## 1. Hardware Architecture Overview

| Component | Role | Details |
|---|---|---|
| **ESP8266 Microcontroller** | System Master | Maintains local clock, controls 3 servos, drives OLED display, parses JSON Lines over serial. |
| **HC-05 Bluetooth Classic Module** | Wireless Serial Bridge | Connected to ESP8266 over UART (TX/RX). Operates in SLAVE mode using Bluetooth SPP/RFCOMM. |
| **3 Micro-Servos (SG90 / MG90S)** | Mechanical Actuators | Actuate 3 separate compartments/chutes for Day 1, Day 2, and Day 3. |
| **SSD1306 0.96" OLED Display** | Local Status Display | Connected via I2C (SDA/SCL) on ESP8266 to display current schedule, state, and last received command. |
| **Android Smartphone** | Bench Controller UI | Native Android app in Kotlin / Jetpack Compose / Material 3 communicating over Bluetooth SPP. |

---

## 2. Phone–Device Protocol Specification

All communication between the Android phone and the HC-05/ESP8266 is conducted in **UTF-8 JSON Lines** (one JSON object per line, terminated strictly with `\n`).

- **Protocol Version:** `v: 1`
- **Request Tracking:** Every request from the phone contains a unique alphanumeric ID (`id`). The ESP8266 **must echo** that exact `id` in its response.
- **SPP UUID:** `00001101-0000-1000-8000-00805F9B34FB`

### Canonical Slot IDs
The 9 slots across 3 test days are:
- Day 1: `D1_MORNING`, `D1_EVENING`, `D1_NIGHT`
- Day 2: `D2_MORNING`, `D2_EVENING`, `D2_NIGHT`
- Day 3: `D3_MORNING`, `D3_EVENING`, `D3_NIGHT`

### Message Formats

#### 1. Set Schedule Request
```json
{"v":1,"id":"a7c1","cmd":"set_schedule","slots":[{"slot":"D1_MORNING","time":"08:00"},{"slot":"D1_EVENING","time":"18:00"},{"slot":"D1_NIGHT","time":"22:00"},{"slot":"D2_MORNING","time":"08:00"},{"slot":"D2_EVENING","time":"18:00"},{"slot":"D2_NIGHT","time":"22:00"},{"slot":"D3_MORNING","time":"08:00"},{"slot":"D3_EVENING","time":"18:00"},{"slot":"D3_NIGHT","time":"22:00"}]}
```

#### 2. Set Schedule Acknowledgement (Success)
```json
{"v":1,"id":"a7c1","ok":true,"cmd":"set_schedule","revision":3}
```

#### 3. Set Schedule Rejection (Error)
```json
{"v":1,"id":"a7c1","ok":false,"error":"invalid_schedule"}
```

#### 4. Read-Back State Request
```json
{"v":1,"id":"a7c2","cmd":"get_state"}
```

#### 5. Read-Back State Response
```json
{"v":1,"id":"a7c2","ok":true,"cmd":"get_state","revision":3,"slots":[{"slot":"D1_MORNING","time":"08:00"},{"slot":"D1_EVENING","time":"18:00"},{"slot":"D1_NIGHT","time":"22:00"},{"slot":"D2_MORNING","time":"08:00"},{"slot":"D2_EVENING","time":"18:00"},{"slot":"D2_NIGHT","time":"22:00"},{"slot":"D3_MORNING","time":"08:00"},{"slot":"D3_EVENING","time":"18:00"},{"slot":"D3_NIGHT","time":"22:00"}]}
```

#### 6. Servo Bench-Test Request
```json
{"v":1,"id":"a7c3","cmd":"test_servo","slot":"D1_MORNING"}
```

#### 7. Servo Bench-Test Acknowledgement
```json
{"v":1,"id":"a7c3","ok":true,"cmd":"test_servo"}
```

---

## 3. ESP8266 Responsibilities & Architecture

1. **Atomic Validation & Storage:**
   - The ESP8266, not the Android phone, is the authoritative source for accepting the schedule.
   - If any of the 9 slot times is invalid or malformed, the ESP8266 **must reject the request** (`{"v":1,"id":"...","ok":false,"error":"invalid_schedule"}`) and retain its previous schedule in memory/EEPROM intact.
2. **Local Autonomous Execution:**
   - The ESP8266 is responsible for keeping the local clock (via internal `millis()`, NTP over Wi-Fi if enabled, or a dedicated DS3231 RTC).
   - Once a schedule is accepted, the phone may disconnect; the ESP8266 continues to run the test schedule locally.
   - The schedule covers a single 3-day test cycle. Do not assume repeating cycles beyond Day 3 without explicit re-triggering.
3. **Power Loss & Fault Recovery:**
   - On microcontroller power cycling, clock state will be lost unless backed by an external RTC. RTC integration and power-loss recovery must be tested separately.

---

## 4. Hardware Wiring & Baud Rate Configuration

### HC-05 Wiring to ESP8266 (e.g. NodeMCU / Wemos D1 Mini)
| HC-05 Pin | ESP8266 Pin | Notes |
|---|---|---|
| **VCC** | 5V (or 3.3V depending on breakout board) | Most HC-05 breakouts require 5V input to feed the on-board 3.3V LDO. |
| **GND** | GND | Common ground with ESP8266 and Servo power supply. |
| **TXD** | D7 (SoftwareSerial RX) or D9 (Serial RX) | Transmits serial data to ESP8266. 3.3V level. |
| **RXD** | D8 (SoftwareSerial TX) via Voltage Divider | **CRITICAL:** HC-05 RX is 3.3V logic. Use a 1kΩ / 2kΩ divider if ESP8266 GPIO output is 5V (ESP8266 is 3.3V native). |
| **STATE** | Unconnected / LED | High when connected. |
| **EN / KEY** | Float (LOW) | High only during AT configuration. |

### Baud Rate Matching
- Standard factory default for HC-05 transparent serial mode is **9600 baud** (or 38400 in AT command mode).
- Ensure your ESP8266 sketch matches the HC-05 configuration:
  ```cpp
  #include <SoftwareSerial.h>
  SoftwareSerial btSerial(D7, D8); // RX on D7, TX on D8
  btSerial.begin(9600); // MUST MATCH HC-05 CONFIGURATION!
  ```

### Servo & Power Supply Precautions
- **NEVER** power 3 servos directly from the ESP8266 3.3V rail.
- Use a dedicated external 5V / 2A power supply for the servos with a shared common ground to the ESP8266. Inrush servo current can brown out the ESP8266 and reset the HC-05.

---

## 5. Pairing the HC-05 in Android Settings

The app does **not** perform background scanning; it connects directly to bonded (already-paired) devices for maximum reliability and privacy (no location permission required).

1. Power on your hardware prototype. Confirm the HC-05 red LED is blinking rapidly (~5 times/sec).
2. Open Android **Settings** -> **Connected devices** -> **Pair new device** (or **Bluetooth**).
3. Tap **HC-05** in the available device list.
4. When prompted for a PIN code, enter **`1234`** (or **`0000`**).
5. Once paired, the HC-05 will appear in the paired devices list.
6. Open this **Dispenser Bench Test** app, navigate to the **Connect** tab, tap the refresh icon, select **HC-05**, and tap **Connect to HC-05**.

---

## 6. How to Build & Run in Android Studio

### Prerequisites
- Android Studio Hedgehog (2023.1.1) or newer / Ladybug (2024.2+)
- Android SDK 34 (compileSdk 34, minSdk 26)
- JDK 17 (set in Android Studio -> Settings -> Build, Execution, Deployment -> Build Tools -> Gradle -> Gradle JDK)

### Steps
1. Open Android Studio.
2. Select **File -> Open...** and navigate to the `android/` directory of this project.
3. Wait for Gradle sync to complete.
4. Connect an Android phone (running Android 8.0 to Android 14+) with USB Debugging enabled.
5. Click **Run 'app'** (`Shift + F10`).
6. On Android 12+, approve the runtime dialog for "Nearby devices / Bluetooth Connect".
