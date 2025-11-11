/**
 * HomePage
 *
 * - 로그인 성공 후 진입하는 오늘의집 홈 화면을 표현하는 페이지 객체
 * - 테스트에서는 홈 진입 여부를 검증하는 역할만 수행
 */

import { BasePage } from './BasePage';
import { APP_PKG } from '../appConfig';

export class HomePage extends BasePage {
  /**
   * 홈 화면 진입 보장
   *
   * 1. 1순위: 하단 네비게이션 바 존재 여부로 홈 진입 여부 확인
   *    - resource-id: net.bucketplace:id/bottomNavigation
   * 2. 2순위: Compose 기반 화면(ComposeView) 존재 여부로 보조 확인
   *    - className: androidx.compose.ui.platform.ComposeView
   *
   * 위 두 요소 중 하나라도 정상적으로 노출되면
   * "홈 화면에 진입했다"고 판단한다.
   */
  async ensureOnHome() {
    const bottomNavSel = 'id=' + APP_PKG + ':id/bottomNavigation';

    // 1순위: 하단 네비게이션 바 감지 시 바로 반환
    try {
      await this.waitForDisplayed(bottomNavSel, 12000);
      console.log('홈 하단바 감지로 홈 화면 진입 확인');
      return;
    } catch {
      // 하단바를 찾지 못한 경우, ComposeView 기반으로 한 번 더 확인
    }

    // 2순위: ComposeView 존재 여부로 홈 화면 진입 보조 확인
    const composeViewUi =
      'android=new UiSelector().className("androidx.compose.ui.platform.ComposeView")';
    await this.waitForDisplayed(composeViewUi, 8000);
    console.log('ComposeView 감지로 홈 화면 진입 확인');
  }
}