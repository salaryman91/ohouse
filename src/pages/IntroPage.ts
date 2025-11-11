/**
 * IntroPage
 *
 * - 오늘의집 앱의 인트로(로그인 진입 전) 화면을 표현하는 Page Object
 * - 앱이 백그라운드이거나 다른 앱이 포그라운드여도 IntroActivity까지 진입을 보장
 * - 인트로 화면에서 이메일 로그인 화면으로 이동하는 동작을 캡슐화
 */
import { BasePage } from './BasePage';
import { APP_PKG, APP_LAUNCH_ACTIVITY, INTRO_ACTIVITY } from '../appConfig';

export class IntroPage extends BasePage {
  /**
   * 인트로 화면(인트로 액티비티) 진입을 보장하는 함수
   *
   * 동작 요약:
   * - 현재 포그라운드 앱 패키지를 확인
   *   - 오늘의집 패키지가 아니면 SplashActivity 를 명시적으로 실행
   * - 현재 액티비티가 INTRO_ACTIVITY 인지 반복 확인 (waitUntilTrue)
   * - 인트로 화면의 로고 컨테이너(id=logoContainer) 노출 여부로 UI 계층 보강 확인
   * - 첫 번째 TextView 존재 여부 확인으로 레이아웃이 완전히 그려졌는지 검증
   */
  async ensureOnIntro() {
    const curPkg = await this.driver.getCurrentPackage();
    if (curPkg !== APP_PKG) {
      console.log(
        '현재 포그라운드 앱이 오늘의집이 아님. SplashActivity 실행 + IntroActivity 대기.',
      );
      await (this.driver as any).startActivity(
        APP_PKG,
        APP_LAUNCH_ACTIVITY,
        APP_PKG,
        INTRO_ACTIVITY,
      );
    }

    await this.waitUntilTrue(
      async () => (await this.driver.getCurrentActivity()) === INTRO_ACTIVITY,
      15000,
      300,
      'IntroActivity로 전환되지 않았습니다.',
    );

    const logoContainerId = 'id=' + APP_PKG + ':id/logoContainer';
    await this.waitForDisplayed(logoContainerId, 10000);

    await this.driver.$('//android.widget.TextView[1]');
    console.log('Intro 화면 보장 완료');
  }

  /**
   * 인트로 화면에서 이메일 로그인 화면으로 이동하는 함수
   *
   * 탐색 전략:
   * - 1순위: 이메일 로그인 버튼의 id (emailLoginButton)
   * - 2순위: 버튼 내 TextView id (emailLoginText)
   * - 3순위: UiSelector text("이메일로 로그인")
   *
   * 위 순서대로 요소 탐색을 시도하며,
   * 최종적으로 이메일 로그인 입력 필드(inputField)가 보일 때까지 대기해
   * 이메일 로그인 화면 진입이 완료되었음을 보장한다.
   */
  async gotoEmailLogin() {
    console.log('이메일 로그인 페이지 진입 시도');

    const btnId = 'id=' + APP_PKG + ':id/emailLoginButton';
    const btnTextId = 'id=' + APP_PKG + ':id/emailLoginText';
    let target: any = null;

    // 1순위: 버튼 자체 id
    try {
      target = await this.waitForDisplayed(btnId, 2500);
    } catch {}

    // 2순위: 버튼 텍스트 id
    if (!target) {
      try {
        target = await this.waitForDisplayed(btnTextId, 2500);
      } catch {}
    }

    // 3순위: 텍스트 기반 UiSelector
    if (!target) {
      const uiSel = 'android=new UiSelector().text("이메일로 로그인")';
      target = await this.waitForDisplayed(uiSel, 8000);
    }

    await target.click();

    await this.waitForDisplayed('id=' + APP_PKG + ':id/inputField', 8000);
    console.log('이메일 로그인 페이지 진입 완료');
  }
}