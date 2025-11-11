/**
 * login-pass-test
 *
 * 오늘의집 이메일/비밀번호 정상 로그인(E2E 해피 패스) 테스트 스크립트
 *
 * - dotenv 로 환경변수(UDID, OH_EMAIL, OH_PASSWORD, RESET_APP)를 로딩
 * - device 유틸과 Page Object(인트로/이메일로그인/홈/팝업)를 조합해 전체 플로우를 검증
 * - 시나리오: 앱 초기화 → Intro 진입 → 이메일 로그인 화면 진입 → 로그인 → 팝업 처리 → 홈 화면 진입 확인
 */

import 'dotenv/config';

import { APP_PKG } from '../src/appConfig';
import {
  printOhouseVersion,
  isAppInstalled,
  killAllBackgroundApps,
  forceStopAndClearApp,
  createDriverWithRetry,
} from '../src/utils/device';
import { IntroPage } from '../src/pages/IntroPage';
import { EmailLoginPage } from '../src/pages/EmailLoginPage';
import { HomePage } from '../src/pages/HomePage';
import { PopupHandler } from '../src/pages/PopupHandler';

async function main() {
  /**
   * 테스트 입력 값
   *
   * - udid      : adb devices 에서 확인한 디바이스/에뮬레이터 ID
   * - email     : 로그인에 사용할 이메일 (OH_EMAIL)
   * - password  : 로그인에 사용할 비밀번호 (OH_PASSWORD)
   * - resetApp  : true 일 때 테스트 시작 전 앱/프로세스 초기화
   */
  const udid = process.env.UDID ?? '';
  const email = process.env.OH_EMAIL ?? '';
  const password = process.env.OH_PASSWORD ?? '';
  const resetApp =
    (process.env.RESET_APP ?? 'true').toLowerCase() !== 'false';

  // 오늘의집 설치 버전 정보 출력 (디버깅 및 환경 확인용)
  printOhouseVersion(udid);

  // 오늘의집 앱이 설치되지 않은 경우 테스트를 건너뜀
  if (!isAppInstalled(udid)) {
    console.log(`패키지 ${APP_PKG} 이(가) 설치되어 있지 않아 테스트를 건너뜁니다.`);
    return;
  }

  // 필요 시 전체 앱/오늘의집 초기화 수행
  if (resetApp) {
    killAllBackgroundApps(udid);
    forceStopAndClearApp(udid);
  }

  // Appium(WebdriverIO) 드라이버 생성 (ENOBUFS 대비 재시도 포함)
  const driver = await createDriverWithRetry(udid);

  // Page Object 인스턴스 생성
  const introPage = new IntroPage(driver);
  const emailLoginPage = new EmailLoginPage(driver);
  const homePage = new HomePage(driver);
  const popupHandler = new PopupHandler(driver);

  try {
    // 1) Intro 화면 진입이 보장되도록 처리
    await introPage.ensureOnIntro();

    // 2) "이메일로 로그인" 버튼을 통해 이메일 로그인 화면으로 이동
    await introPage.gotoEmailLogin();

    // 3) 계정 정보가 없으면 로그인 자체는 수행하지 않고 화면 진입까지만 확인
    if (!email || !password) {
      console.log(
        '계정 정보 미지정: 로그인은 수행하지 않고 이메일 로그인 페이지 진입까지만 확인합니다.',
      );
      return;
    }

    // 4) 이메일/비밀번호 입력 후 로그인 버튼 클릭
    await emailLoginPage.login(email, password);

    // 5) 로그인 직후 노출될 수 있는 시스템/인앱 팝업 처리
    await popupHandler.dismissPasswordManagerIfPresent();
    await popupHandler.dismissInAppBottomSheetIfPresent();

    // 6) 홈 화면 진입 여부 확인 (하단바/ComposeView 기준)
    await homePage.ensureOnHome();
    console.log('테스트 완료');
  } finally {
    // 테스트 종료 후 Appium 세션 정리
    await driver.deleteSession();
  }
}

// 단독 실행 진입점
main().catch((err) => {
  console.error('테스트 실행 중 에러:', err);
});