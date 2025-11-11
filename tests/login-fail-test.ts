/**
 * login-fail-test.ts
 *
 * 오늘의집 이메일 로그인 실패 시 노출되는 경고 툴팁을 검증하는 테스트 스크립트
 *
 * - dotenv 로 실패용 계정 정보를 환경변수에서 로딩(FAIL_EMAIL, FAIL_PASSWORD)
 * - Intro 화면 진입 → 이메일 로그인 화면 이동 → 잘못된 비밀번호로 로그인 → 실패 툴팁 노출 여부를 확인
 * - 메인 해피패스(login-pass-test.ts)와 동일한 방식으로 디바이스/앱 초기화 및 설치 여부를 검사
 */

import 'dotenv/config';
import { IntroPage } from '../src/pages/IntroPage';
import { EmailLoginPage } from '../src/pages/EmailLoginPage';
import {
  createDriverWithRetry,
  printOhouseVersion,
  isAppInstalled,
  killAllBackgroundApps,
  forceStopAndClearApp,
} from '../src/utils/device';
import { APP_PKG } from '../src/appConfig';

async function main() {
  /**
   * 테스트 입력 값
   *
   * - udid        : adb devices 에서 확인한 디바이스/에뮬레이터 ID
   * - resetApp    : true 일 때 테스트 시작 전 앱/프로세스를 초기화
   * - email       : 로그인 시 사용할 이메일 (실패 시나리오용, FAIL_EMAIL)
   * - wrongPassword : 의도적으로 잘못된 비밀번호 (FAIL_PASSWORD)
   *
   * 실제 계정 잠금을 방지하기 위해 전용 테스트 계정 또는 틀린 비밀번호를 환경변수로 지정하는 것을 권장
   */
  const udid = process.env.UDID || '';
  const resetApp = (process.env.RESET_APP ?? 'true').toLowerCase() !== 'false';

  // 실패 시나리오용 계정 정보
  const email = process.env.FAIL_EMAIL || '';
  const wrongPassword = process.env.FAIL_PASSWORD || '';

  // 오늘의집 설치 버전 정보 출력 (환경 및 디버깅용)
  printOhouseVersion(udid);

  // 오늘의집 앱이 설치되지 않은 경우, 실패 툴팁 시나리오 테스트를 건너뜀
  if (!isAppInstalled(udid)) {
    console.log(
      `패키지 ${APP_PKG} 이(가) 설치되어 있지 않아 로그인 실패 툴팁 테스트를 건너뜁니다.`,
    );
    return;
  }

  // 테스트 시작 전 초기화 (해피패스 테스트와 동일한 패턴 유지)
  if (resetApp) {
    killAllBackgroundApps(udid);
    forceStopAndClearApp(udid);
  }

  // Appium(WebdriverIO) 드라이버 생성 (ENOBUFS 대비 재시도 포함)
  const driver = await createDriverWithRetry(udid);

  try {
    // 1) Intro 화면 진입이 보장되도록 처리
    const introPage = new IntroPage(driver);
    await introPage.ensureOnIntro();

    // 2) "이메일로 로그인" 버튼을 통해 이메일 로그인 화면으로 이동
    await introPage.gotoEmailLogin();

    const emailLoginPage = new EmailLoginPage(driver);

    // 3) 의도적으로 잘못된 비밀번호로 로그인 시도
    await emailLoginPage.login(email, wrongPassword);

    // 4) 실패 툴팁 노출까지 대기
    //    (EmailLoginPage.ts 에 구현된 ensureLoginFailTooltipShown 사용)
    await emailLoginPage.ensureLoginFailTooltipShown(5000);

    console.log('로그인 실패 시 툴팝 노출 테스트 통과');
  } finally {
    // 테스트 종료 후 Appium 세션 정리
    await driver.deleteSession();
  }
}

// 단독 실행 진입점
main().catch((err) => {
  console.error('로그인 실패 툴팁 테스트 실행 중 에러:', err);
});
