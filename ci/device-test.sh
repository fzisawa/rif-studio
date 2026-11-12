#!/bin/bash
# 서명된 APK 를 에뮬레이터(안드로이드 14)에 실제로 설치하고 실행해 보는 검사
set -x
mkdir -p out
APK=signed/rif-intranet.apk
PKG=com.rifstudio.intranet
adb wait-for-device
{ echo "android $(adb shell getprop ro.build.version.release) sdk $(adb shell getprop ro.build.version.sdk)"; adb shell pm list packages | grep -iE "chrome|webview|browser"; adb shell dumpsys package com.android.chrome | grep -m1 versionName; } > out/device.txt 2>&1
# 크롬 첫 실행 안내 화면 건너뛰기
adb shell 'echo "chrome --disable-fre --no-default-browser-check --no-first-run" > /data/local/tmp/chrome-command-line'
adb shell am set-debug-app --persistent com.android.chrome
adb install -r "$APK" > out/install.txt 2>&1; echo "install exit=$?" >> out/install.txt
adb shell pm list packages | grep rifstudio >> out/install.txt
adb shell dumpsys package $PKG | grep -E "versionName|targetSdk|minSdk|apkSigningVersion|signatures" >> out/install.txt
adb logcat -c
adb shell am start -W -n $PKG/com.google.androidbrowserhelper.trusted.LauncherActivity > out/start.txt 2>&1
sleep 25
adb exec-out screencap -p > out/screen-1.png
sleep 25
adb exec-out screencap -p > out/screen-2.png
adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 && adb pull /sdcard/ui.xml out/ui.xml >/dev/null 2>&1
{ adb shell dumpsys activity activities | grep -E "ResumedActivity"; adb shell dumpsys window | grep -E "mCurrentFocus|mFocusedApp"; } > out/top.txt 2>&1
adb shell pm get-app-links $PKG > out/applinks.txt 2>&1
adb logcat -d -v brief | grep -iE "AndroidRuntime|FATAL EXCEPTION|rifstudio|TWA|TrustedWeb|OriginVerif|DigitalAssetLink|assetlinks|customtabs|browserhelper" | tail -250 > out/logcat.txt
# 홈으로 나갔다가 아이콘(런처) 화면 확인
adb shell input keyevent KEYCODE_HOME; sleep 3
adb exec-out screencap -p > out/screen-home.png
exit 0
