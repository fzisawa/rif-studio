# RIF Intranet 데스크톱 앱

rif-studio.com/intranet/ 을 Windows · Mac 앱으로 띄워요. 이 가지(desktop-app)에 올리면 GitHub Actions가 설치 파일을 만들어 Release(desktop-v<버전>)에 올려요.

- Windows: `RIF-Intranet-Setup.exe`
- Mac: `RIF-Intranet-arm64.dmg`(M1 이후) · `RIF-Intranet-x64.dmg`(인텔)

기능은 사이트에서 고치면 앱에도 바로 반영돼서, 앱을 다시 만들 일은 거의 없어요. 앱 자체를 고쳤을 때만 package.json 의 version 을 올리고 올려 주세요.
