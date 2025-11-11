/**
 * EmailLoginPage
 *
 * - 오늘의집 앱의 "이메일 로그인" 화면을 다루는 Page Object
 * - 올바른/잘못된 계정 정보 입력과 로그인 버튼 클릭 동작을 캡슐화
 * - 로그인 실패 시 노출되는 제한 안내 툴팁 감지/대기 기능 제공
 */
import { BasePage } from './BasePage';
import { APP_PKG } from '../appConfig';

export class EmailLoginPage extends BasePage {
  /**
   * 이메일 로그인 수행
   *
   * - 이메일 / 비밀번호 입력 필드를 찾은 뒤 값 입력
   * - 로그인 버튼이 활성화될 때까지 기다린 뒤 클릭
   * - OH_EMAIL / OH_PASSWORD 가 비어 있으면 입력 단계를 건너뜀
   *
   * @param email   로그인에 사용할 이메일
   * @param password 로그인에 사용할 비밀번호
   */
  async login(email: string, password: string) {
    if (!email || !password) {
      console.log(
        '계정 정보가 없어 입력 단계를 건너뜁니다. (OH_EMAIL / OH_PASSWORD 로 설정 가능)',
      );
      return;
    }

    const emailFieldSelector =
      `android=new UiSelector().resourceId("${APP_PKG}:id/inputField").text("이메일")`;
    const passwordFieldSelector =
      `android=new UiSelector().resourceId("${APP_PKG}:id/inputField").text("비밀번호")`;

    const emailField = await this.waitForDisplayed(emailFieldSelector, 8000);
    const passwordField = await this.waitForDisplayed(passwordFieldSelector, 8000);

    await emailField.click();
    await emailField.clearValue();
    await emailField.setValue(email);

    await passwordField.click();
    await passwordField.clearValue();
    await passwordField.setValue(password);

    const loginBtn = await this.driver.$('id=' + APP_PKG + ':id/loginButton');
    await this.waitUntilTrue(
      async () => (await loginBtn.isDisplayed()) && (await loginBtn.isEnabled()),
      10000,
      300,
      '로그인 버튼이 활성화되지 않았습니다.',
    );

    await loginBtn.click();
  }

  /**
   * 로그인 실패 시 노출되는 "로그인이 제한돼요" 툴팁 존재 여부 확인
   *
   * - 텍스트 전체가 아니라 "로그인이 제한돼요" 부분만 포함(textContains) 여부로 판단
   *   (시도 횟수 (1/10, 2/10 ...) 텍스트 변경에도 대응하기 위함)
   * - 찾기 실패나 에러가 발생하면 false 반환
   *
   * @param timeout 탐색 타임아웃(ms) – 현재 구현에서는 사용하지 않지만,
   *                필요 시 wait 로직 추가를 고려할 수 있음
   * @returns 툴팁이 하나 이상 존재하면 true, 그렇지 않으면 false
   */
  async isLoginFailTooltipVisible(timeout = 5000): Promise<boolean> {
    const selector =
      'android=new UiSelector().className("android.widget.TextView").textContains("로그인이 제한돼요")';

    try {
      const count = await this.countBySelector(selector);
      return count > 0;
    } catch {
      return false;
    }
  }

  /**
   * 로그인 실패 툴팁이 화면에 나타날 때까지 대기
   *
   * - "로그인이 제한돼요" 문구를 포함한 TextView 가 표시될 때까지 기다림
   * - 지정한 시간 내에 나타나지 않으면 waitForDisplayed 내부에서 예외 발생
   *
   * @param timeout 툴팁이 나타날 때까지 기다릴 최대 시간(ms)
   */
  async ensureLoginFailTooltipShown(timeout = 5000): Promise<void> {
    const selector =
      'android=new UiSelector().className("android.widget.TextView").textContains("로그인이 제한돼요")';

    await this.waitForDisplayed(selector, timeout);
  }
}