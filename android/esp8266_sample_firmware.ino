/**
 * @file esp8266_sample_firmware.ino
 * @brief Reference firmware for ESP8266 Three-Day Dispenser Bench-Test Prototype
 *
 * HARDWARE BENCH-TEST PROTOTYPE ONLY:
 * TEST STRICTLY WITH INERT ITEMS (e.g. plastic beads, dry beans).
 * NEVER LOAD WITH REAL MEDICATIONS OR CHEMICALS.
 *
 * HARDWARE SETUP:
 * - ESP8266 (e.g. NodeMCU v3 / Wemos D1 Mini)
 * - HC-05 Bluetooth Classic module on SoftwareSerial (RX: D7, TX: D8) at 9600 baud
 * - SSD1306 128x64 I2C OLED (SDA: D2, SCL: D1)
 * - 3x Servos:
 *     Servo 1 (Day 1 slots) -> GPIO 14 (D5)
 *     Servo 2 (Day 2 slots) -> GPIO 12 (D6)
 *     Servo 3 (Day 3 slots) -> GPIO 13 (D7 alternate or D0 / RX / GPIO 15)
 *
 * PROTOCOL: UTF-8 JSON Lines over UART.
 */

#include <Arduino.h>
#include <SoftwareSerial.h>
#include <Wire.h>
#include <Servo.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// SoftwareSerial for HC-05 Bluetooth module
// Note: HC-05 TX connects to ESP8266 RX (D7 / GPIO 13)
//       HC-05 RX connects to ESP8266 TX (D8 / GPIO 15) via 1k/2k voltage divider
SoftwareSerial btSerial(13, 15); // RX, TX

// 3 Servos corresponding to Day 1, Day 2, Day 3
Servo servoDay1;
Servo servoDay2;
Servo servoDay3;

const int PIN_SERVO_DAY1 = 14; // D5
const int PIN_SERVO_DAY2 = 12; // D6
const int PIN_SERVO_DAY3 = 4;  // D2 (or GPIO4)

// 9 Canonical generic slot times stored in RAM (or EEPROM)
struct SlotTime {
  const char* slot;
  char time[6]; // "HH:mm\0"
};

SlotTime currentSchedule[9] = {
  {"D1_MORNING", "08:00"},
  {"D1_EVENING", "18:00"},
  {"D1_NIGHT",   "22:00"},
  {"D2_MORNING", "08:00"},
  {"D2_EVENING", "18:00"},
  {"D2_NIGHT",   "22:00"},
  {"D3_MORNING", "08:00"},
  {"D3_EVENING", "18:00"},
  {"D3_NIGHT",   "22:00"}
};

int scheduleRevision = 1;
String lastStatusMessage = "Ready for test";

// Serial input buffer
String inputBuffer = "";

void updateOledDisplay();
void processCommand(String jsonLine);
void actuateServoForSlot(String slotId);

void setup() {
  Serial.begin(115200);
  delay(200);

  // HC-05 UART: baud rate MUST match your HC-05 configuration (default 9600)
  btSerial.begin(9600);

  // Initialize OLED
  Wire.begin(4, 5); // SDA, SCL (adjust pins for your board)
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println(F("DISPENSER BENCH TEST"));
    display.println(F("INERT ITEMS ONLY!"));
    display.println(F("HC-05 9600 Baud"));
    display.display();
  }

  // Attach servos
  servoDay1.attach(PIN_SERVO_DAY1);
  servoDay2.attach(PIN_SERVO_DAY2);
  servoDay3.attach(PIN_SERVO_DAY3);

  // Initial park position
  servoDay1.write(0);
  servoDay2.write(0);
  servoDay3.write(0);

  Serial.println(F("[ESP8266] Bench test firmware initialized."));
  updateOledDisplay();
}

void loop() {
  // Read incoming characters from HC-05 over SoftwareSerial
  while (btSerial.available() > 0) {
    char c = (char)btSerial.read();
    if (c == '\n' || c == '\r') {
      if (inputBuffer.length() > 0) {
        inputBuffer.trim();
        if (inputBuffer.length() > 0) {
          processCommand(inputBuffer);
        }
        inputBuffer = "";
      }
    } else {
      if (inputBuffer.length() < 1024) {
        inputBuffer += c;
      }
    }
  }

  // Check hardware clock / schedule execution locally here
  // (In production, read from external DS3231 RTC module)
  delay(10);
}

void processCommand(String json) {
  Serial.print(F("[RX from Phone]: "));
  Serial.println(json);

  // Extract ID ("id":"XXXX")
  int idIdx = json.indexOf("\"id\":\"");
  String reqId = "unknown";
  if (idIdx != -1) {
    int start = idIdx + 6;
    int end = json.indexOf("\"", start);
    if (end != -1) {
      reqId = json.substring(start, end);
    }
  }

  // Check command
  if (json.indexOf("\"set_schedule\"") != -1) {
    // Validate atomic schedule
    bool valid = true;
    for (int i = 0; i < 9; i++) {
      String key = String("\"slot\":\"") + currentSchedule[i].slot + "\"";
      if (json.indexOf(key) == -1) {
        valid = false;
        break;
      }
    }

    if (!valid) {
      // Rejection response
      String reject = String("{\"v\":1,\"id\":\"") + reqId + "\",\"ok\":false,\"error\":\"invalid_schedule\"}\n";
      btSerial.print(reject);
      lastStatusMessage = "Rejected bad sched";
      updateOledDisplay();
      return;
    }

    // Atomic update
    scheduleRevision++;
    for (int i = 0; i < 9; i++) {
      String key = String("\"slot\":\"") + currentSchedule[i].slot + "\"";
      int pos = json.indexOf(key);
      if (pos != -1) {
        int timePos = json.indexOf("\"time\":\"", pos);
        if (timePos != -1) {
          int tStart = timePos + 8;
          int tEnd = json.indexOf("\"", tStart);
          if (tEnd != -1 && (tEnd - tStart) == 5) {
            String newT = json.substring(tStart, tEnd);
            strncpy(currentSchedule[i].time, newT.c_str(), 5);
            currentSchedule[i].time[5] = '\0';
          }
        }
      }
    }

    // Send successful acknowledgement
    String ack = String("{\"v\":1,\"id\":\"") + reqId + "\",\"ok\":true,\"cmd\":\"set_schedule\",\"revision\":" + scheduleRevision + "}\n";
    btSerial.print(ack);
    lastStatusMessage = String("Sched saved rev ") + scheduleRevision;
    updateOledDisplay();

  } else if (json.indexOf("\"get_state\"") != -1) {
    // Send read-back response
    String stateResp = String("{\"v\":1,\"id\":\"") + reqId + "\",\"ok\":true,\"cmd\":\"get_state\",\"revision\":" + scheduleRevision + ",\"slots\":[";
    for (int i = 0; i < 9; i++) {
      stateResp += String("{\"slot\":\"") + currentSchedule[i].slot + "\",\"time\":\"" + currentSchedule[i].time + "\"}";
      if (i < 8) stateResp += ",";
    }
    stateResp += "]}\n";
    btSerial.print(stateResp);
    lastStatusMessage = "State read back";
    updateOledDisplay();

  } else if (json.indexOf("\"test_servo\"") != -1) {
    // Extract slot
    int slotIdx = json.indexOf("\"slot\":\"");
    String targetSlot = "";
    if (slotIdx != -1) {
      int sStart = slotIdx + 8;
      int sEnd = json.indexOf("\"", sStart);
      if (sEnd != -1) {
        targetSlot = json.substring(sStart, sEnd);
      }
    }

    // Actuate the hardware servo for that slot
    actuateServoForSlot(targetSlot);

    // Send acknowledgement
    String ack = String("{\"v\":1,\"id\":\"") + reqId + "\",\"ok\":true,\"cmd\":\"test_servo\"}\n";
    btSerial.print(ack);
    lastStatusMessage = String("Tested ") + targetSlot;
    updateOledDisplay();

  } else {
    // Unknown command
    String err = String("{\"v\":1,\"id\":\"") + reqId + "\",\"ok\":false,\"error\":\"unknown_command\"}\n";
    btSerial.print(err);
  }
}

void actuateServoForSlot(String slotId) {
  Servo* targetServo = nullptr;
  int servoNum = 1;

  if (slotId.startsWith("D1_")) {
    targetServo = &servoDay1;
    servoNum = 1;
  } else if (slotId.startsWith("D2_")) {
    targetServo = &servoDay2;
    servoNum = 2;
  } else if (slotId.startsWith("D3_")) {
    targetServo = &servoDay3;
    servoNum = 3;
  }

  if (targetServo != nullptr) {
    Serial.print(F("[BENCH TEST] Actuating Servo "));
    Serial.print(servoNum);
    Serial.print(F(" for slot "));
    Serial.println(slotId);

    // Bench test motion: 0 -> 90 degrees -> hold -> return to 0
    targetServo->write(90);
    delay(600);
    targetServo->write(0);
    delay(400);
  }
}

void updateOledDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  // Header
  display.setCursor(0, 0);
  display.print(F("BENCH PROTOTYPE R:"));
  display.println(scheduleRevision);

  // Status
  display.setCursor(0, 12);
  display.print(F("Status: "));
  display.println(lastStatusMessage);

  // Sample slots preview
  display.setCursor(0, 24);
  display.print(F("D1: "));
  display.print(currentSchedule[0].time);
  display.print(F(" "));
  display.print(currentSchedule[1].time);
  display.print(F(" "));
  display.println(currentSchedule[2].time);

  display.setCursor(0, 36);
  display.print(F("D2: "));
  display.print(currentSchedule[3].time);
  display.print(F(" "));
  display.print(currentSchedule[4].time);
  display.print(F(" "));
  display.println(currentSchedule[5].time);

  display.setCursor(0, 48);
  display.print(F("D3: "));
  display.print(currentSchedule[6].time);
  display.print(F(" "));
  display.print(currentSchedule[7].time);
  display.print(F(" "));
  display.println(currentSchedule[8].time);

  display.display();
}
