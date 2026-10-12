# How to Build and Install the Android APK

This document explains how to build the APK package (`.apk` file) and install it on your Android phone.

---

## Option 1: 1-Click Build in Android Studio (Recommended)

1. **Open the Project:**
   - Download the project zip (or open the `android/` directory).
   - In **Android Studio**, click **File &rarr; Open** and select the `android/` folder.
   - Wait 15–30 seconds for Gradle sync to complete.

2. **Generate the APK:**
   - In the top menu, click **Build &rarr; Build Bundle(s) / APK(s) &rarr; Build APK(s)**.
   - Android Studio will compile the app and show a popup notification:
     `Build APK(s): APK(s) generated successfully.`
   - Click **locate** inside the notification.
   - Your APK file is ready at:
     ```
     android/app/build/outputs/apk/debug/app-debug.apk
     ```

3. **Install on Phone:**
   - **Direct USB Run:** Plug your phone into your computer with USB Debugging enabled, and click the green **Run (Play)** button in Android Studio.
   - **Direct File Transfer:** Or copy `app-debug.apk` to your phone via USB cable, Google Drive, WhatsApp, or email, tap the file in your phone's File Manager, and tap **Install**.

---

## Option 2: Build APK via Terminal / Command Line

If you have Java (JDK 17) installed on your computer:

### On Windows (Command Prompt / PowerShell):
```cmd
cd android
gradlew.bat assembleDebug
```

### On Mac / Linux:
```bash
cd android
chmod +x gradlew
./gradlew assembleDebug
```

Once complete, the APK will be generated at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

To install directly onto a connected phone with ADB:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Option 3: APK Installation Settings on Your Android Phone

When installing an APK directly from a file:
1. Tap on `app-debug.apk` in your phone's files/downloads.
2. If Android displays *"For your security, your phone is not allowed to install unknown apps from this source"*:
   - Tap **Settings**.
   - Enable **Allow from this source**.
3. Tap **Install**.
4. Open **Dispenser Bench Test** and accept the Bluetooth permission when prompted.
