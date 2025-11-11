# 오늘의집 Android 앱 로그인 자동화 (Appium + WebdriverIO)

오늘의집(Android) 앱을 대상으로 한 로그인 플로우 자동화 스크립트입니다.  

- **주요 목표**
  - 앱 설치 여부 / 초기 상태를 보장한 뒤
  - 인트로 → 이메일 로그인 화면 진입
  - 이메일/비밀번호 로그인 성공 후 **홈 화면 진입 검증**
  - 이메일/비밀번호 실패 시 **로그인 실패 툴팁 노출 검증**
  - CI/CD 환경에서도 재실행 가능한 **안정적인 테스트 베이스** 제공

---

## 기술 스택

- **언어**: TypeScript (Node.js)
- **테스트 프레임워크/드라이버**
  - [WebdriverIO](https://webdriver.io/)
  - [Appium](https://appium.io/) + UiAutomator2 (Android)
- **런타임 도구**
  - `adb` (Android Debug Bridge)
  - `tsx` (TypeScript 실행)
  - `dotenv` (.env 기반 환경변수 로딩)

---

## 1. 폴더 구조

```text
ohouse/
├─ src/
│  ├─ appConfig.ts          # 앱 패키지/액티비티 공통 상수
│  ├─ utils/
│  │  └─ device.ts          # ADB 유틸 + Webdriver 세션 생성/재시도
│  └─ pages/
│     ├─ BasePage.ts        # 공통 대기/헬퍼를 가진 베이스 페이지
│     ├─ IntroPage.ts       # 인트로(온보딩) 화면 관련 동작
│     ├─ EmailLoginPage.ts  # 이메일 로그인 화면 동작 + 실패 툴팁 감지
│     ├─ HomePage.ts        # 로그인 후 메인 홈 화면 진입 확인
│     └─ PopupHandler.ts    # 패스워드 매니저 / 인앱 팝업 공통 처리
├─ tests/
│  ├─ login-pass-test.ts    # 정상 로그인 후 홈 진입까지 해피 패스 시나리오
│  └─ login-fail-test.ts    # 잘못된 비밀번호로 로그인 실패 툴팁 검증
├─ .env                     # (사용자 작성) 환경 변수 파일
├─ .env.sample              # 예시 환경 변수 템플릿
└─ package.json / tsconfig.json 등
```

---

## 2. 사전 준비

### 2-1. 필수 설치 프로그램

* Node.js (LTS 버전 권장)
* Android Studio + Android SDK
* Appium Server (Appium 2.x)
* Java JDK (Android SDK / Appium 구동용)

### 2-2. 안드로이드 가상 디바이스(AVD) 실행

1. Android Studio → **Device Manager** 에서 Pixel 계열 / Android 13+ 등의 에뮬레이터 생성

2. 에뮬레이터를 실행한 뒤, 터미널에서 아래 명령으로 연결 확인:

   ```bash
   adb devices
   ```

   예시:

   ```text
   List of devices attached
   emulator-5556   device
   ```

3. 이때 보이는 디바이스 ID (`emulator-5556` 등)를 `.env` 의 `UDID` 값으로 사용합니다.

---

## 3. 의존성 설치

프로젝트 루트(oh_app_test)에서 다음을 실행합니다.

```bash
# 기본 의존성 설치 (package.json 기준)
npm install

# dotenv 런타임 (이미 설치되어 있을 수 있지만 문서상 명시)
npm install dotenv

# TypeScript에서 dotenv 타입 지원을 위한 devDependency
npm install -D @types/dotenv
```

> **참고**  
> `.env` 를 `import 'dotenv/config';` 형태로 바로 사용하는 구조이기 때문에 `dotenv` 런타임 패키지와 `@types/dotenv`(타입 정의) 모두 설치하는 것을 명시했습니다.

---

## 4. 환경 변수 설정 (.env / .env.sample)

### 4-1. .env.sample 예시

레포에는 `.env.sample` 파일이 포함되어 있으며, 예시는 다음과 같습니다.

```bash
# 테스트에 사용할 안드로이드 디바이스/에뮬레이터 UDID (adb devices 에서 확인)
UDID=emulator-5556

# 정상 로그인 해피 패스용 계정 정보
# 실제 과제/실무에서는 기본값을 비워두고, 로컬에서만 설정하는 것을 권장
OH_EMAIL=sample_user@example.com
OH_PASSWORD=sample_password123!

# 앱 초기화 옵션
# - true  : 테스트 시작 전 전체 앱 정리 + 오늘의집 force-stop + pm clear
# - false : 앱 상태를 유지한 채로 테스트 수행
RESET_APP=true

# 로그인 실패/툴팁 테스트용 계정 정보
# - 실제 계정 잠금 방지를 위해 전용 테스트 계정을 사용하거나,
#   의도적으로 틀린 비밀번호를 넣어서 테스트하는 것을 추천
FAIL_EMAIL=sample_user@example.com
FAIL_PASSWORD=wrong_password
```

### 4-2. 실제 .env 생성

`.env.sample` 을 복사해서 `.env` 를 만든 뒤, 본인 환경에 맞게 수정합니다.

```bash
cp .env.sample .env
# 이후 .env 파일을 열어 UDID, OH_EMAIL, OH_PASSWORD 등을 수정
```

---

## 5. ADB 및 오늘의집 앱 설치 확인

1. 에뮬레이터가 켜진 상태에서

   ```bash
   adb devices
   ```

2. 오늘의집 앱이 설치되어 있어야 합니다. (패키지명: `net.bucketplace`)  
   설치 여부는 테스트 코드에서 `pm path net.bucketplace` 로 다시 한번 체크합니다.

---

## 6. 테스트 스크립트

### 6-1. 해피 패스: `tests/login-pass-test.ts`

**동작 요약:**

1. `.env` 에서 `UDID`, `OH_EMAIL`, `OH_PASSWORD`, `RESET_APP` 을 읽어옴
2. `printOhouseVersion` 으로 오늘의집 설치 버전 출력
3. 오늘의집 미설치 시 **테스트 skip**
4. `RESET_APP=true` 이면:
   * `killAllBackgroundApps` 로 백그라운드 앱 전체 정리
   * `forceStopAndClearApp` 으로 오늘의집 초기화
5. `createDriverWithRetry` 로 WebDriver 세션 생성
6. `IntroPage.ensureOnIntro()` 로 인트로 화면 보장
7. `IntroPage.gotoEmailLogin()` 으로 이메일 로그인 페이지 진입
8. 환경변수에 계정이 있으면 `EmailLoginPage.login(email, password)` 실행
9. 로그인 직후:
   * `PopupHandler.dismissPasswordManagerIfPresent()`
   * `PopupHandler.dismissInAppBottomSheetIfPresent()`
10. `HomePage.ensureOnHome()` 으로 메인 홈 화면 진입 확인

**실행 예:**

```bash
npx tsx tests/login-pass-test.ts
```

---

### 6-2. 예외 시나리오: `tests/login-fail-test.ts`

**목표:**  
의도적으로 잘못된 비밀번호로 로그인하여, "10번 실패하면 10분간 로그인이 제한돼요." 형식의 툴팁이 노출되는지 검증.

**동작 요약:**

1. `.env` 에서 `UDID`, `RESET_APP`, `FAIL_EMAIL`, `FAIL_PASSWORD` 읽기
2. 오늘의집 미설치 시 **로그인 실패 툴팁 테스트 skip**
3. `RESET_APP=true` 이면 다른 테스트와 동일하게 초기화 수행
4. `IntroPage.ensureOnIntro()` → `IntroPage.gotoEmailLogin()`
5. `EmailLoginPage.login(FAIL_EMAIL, FAIL_PASSWORD)` 로 잘못된 비밀번호 로그인 시도
6. `EmailLoginPage.ensureLoginFailTooltipShown(5000)` 으로 툴팁 노출 대기
7. 툴팁 검증 성공 시 `로그인 실패 시 툴팁 노출 테스트 통과` 로그 출력

**실행 예:**

```bash
npx tsx tests/login-fail-test.ts
```

> **주의사항**
>
> * 실제 유저 계정으로 10회 이상 연속 실패할 경우, 앱 정책에 따라 **일시적인 로그인 제한(10분)** 이 걸릴 수 있습니다.
> * 반드시 **전용 테스트 계정** 또는 **의도적으로 잠겨도 괜찮은 계정**으로 진행하는 것을 권장합니다.

---

## 7. 안정성 / 재실행을 위한 장치들

* **앱 미설치 시 skip 처리**: `isAppInstalled` 로 `pm path net.bucketplace` 결과 확인 후, 설치 안 되어 있으면 바로 종료 (fail 이 아니라 skip 취지)

* **테스트 전 환경 초기화**: 선택적으로 `RESET_APP=true` 일 때:
  * `killAllBackgroundApps` 로 다른 앱/프로세스 정리
  * `forceStopAndClearApp` 으로 오늘의집 앱만 깨끗하게 초기화

* **WebDriver 세션 생성 재시도**: `createDriverWithRetry` 에서 ENOBUFS / adb daemon 관련 오류 감지 시 일정 시간 대기 후 최대 3회까지 재시도

* **UI 동기화**: WDIO의 `waitForDisplayed`, `waitUntil` 헬퍼를 적극 사용해 타이밍 이슈로 인한 flakiness를 최소화

---

## License

이 프로젝트는 과제/학습 목적으로 작성되었습니다.
