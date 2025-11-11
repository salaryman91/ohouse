/**
 * PopupHandler
 *
 * - 공통 팝업(패스워드 매니저 / 오늘의집 인앱 Bottom Sheet 등)을 처리하는 Page Object
 * - 로그인 직후나 주요 화면 진입 시 불규칙하게 노출되는 팝업을 정리
 *   메인 플로우(로그인, 홈 진입 등)가 최대한 일정하게 동작하도록 보조
 */

import { BasePage } from './BasePage';
import { APP_PKG } from '../appConfig';

export class PopupHandler extends BasePage {
  /**
   * 구글 Password Manager / Autofill 저장 팝업이 있을 경우 "Not now" 버튼을 클릭해 닫음
   *
   * - id: android:id/autofill_save_no
   * - 텍스트는 OS/언어 설정에 따라 바뀔 수 있으므로 resource-id 기준으로만 탐지
   * - 팝업이 없는 경우에도 예외를 던지지 않고 무시
   */
  async dismissPasswordManagerIfPresent() {
    try {
      const notNowBtn = await this.driver.$('id=android:id/autofill_save_no');
      if (await notNowBtn.isDisplayed()) {
        console.log('Password Manager 팝업 감지: Not now 클릭');
        await notNowBtn.click();
        await this.driver.pause(500);
      }
    } catch {
      // 팝업이 없거나 탐지 실패 시 무시
    }
  }

  /**
   * 오늘의집 앱 내부 Bottom Sheet 형태의 팝업이 노출되어 있을 것으로 추정되는 경우,
   * 안드로이드 백키를 한 번 보내 팝업을 닫음
   *
   * - 패키지: net.bucketplace (APP_PKG)
   * - className: android.widget.Button
   * - 위 조건을 만족하는 버튼이 일정 개수(예: 2개 이상) 이상 모여 있으면
   *   하단에서 올라오는 Bottom Sheet 팝업일 가능성이 크다고 보고 처리
   * - 팝업이 없거나, 탐지에 실패한 경우에도 예외를 던지지 않고 무시
   */
  async dismissInAppBottomSheetIfPresent() {
    try {
      const selector =
        'android=new UiSelector().className("android.widget.Button").packageName("' +
        APP_PKG +
        '")';
      const btnCount = await this.countBySelector(selector);

      if (btnCount >= 2) {
        console.log('오늘의집 내부 Bottom Sheet 팝업 추정: 백키로 닫기');
        await this.driver.back();
        await this.driver.pause(500);
      }
    } catch {
      // 팝업이 없거나, 탐지 실패 시 무시
    }
  }
}