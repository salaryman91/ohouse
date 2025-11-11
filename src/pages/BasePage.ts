/**
 * BasePage
 *
 * - 모든 화면 객체(Page Object)의 공통 기반 클래스
 * - 공통 기다림/탐색 유틸을 모아 중복 코드를 줄이고, 각 Page 클래스가
 *   비즈니스 로직에만 집중할 수 있도록 돕는 역할
 */
export class BasePage {
  constructor(protected driver: WebdriverIO.Browser) {}

  /**
   * 지정한 셀렉터에 해당하는 요소가 화면에 표시될 때까지 대기한 뒤 반환
   *
   * - driver.$ 로 요소를 찾고, waitForDisplayed 로 표시 여부를 보장
   * - 요소가 timeout 내에 표시되지 않으면 WebdriverIO 에러가 발생
   *
   * @param selector WebdriverIO 셀렉터 (id=..., xpath=..., android=... 등)
   * @param timeout  최대 대기 시간(ms), 기본값 10초
   */
  protected async waitForDisplayed(selector: string, timeout = 10000) {
    const el = await this.driver.$(selector);
    await el.waitForDisplayed({ timeout });
    return el;
  }

  /**
   * 전달된 비동기 조건(predicate)이 true 가 될 때까지 주기적으로 재시도
   *
   * - WebdriverIO 의 waitUntil 을 thin wrapper 로 감싼 헬퍼 메서드
   * - 요소 상태(활성/비활성, 텍스트 변화 등)를 polling 하며 기다릴 때 사용
   *
   * @param predicate true 가 될 때까지 반복 평가할 비동기 조건 함수
   * @param timeout   최대 대기 시간(ms), 기본값 10초
   * @param interval  조건 재평가 간격(ms), 기본값 250ms
   * @param message   timeout 시 출력할 에러 메시지
   */
  protected async waitUntilTrue(
    predicate: () => Promise<boolean>,
    timeout = 10000,
    interval = 250,
    message = '조건이 충족되지 않았습니다.',
  ) {
    await this.driver.waitUntil(predicate, { timeout, interval, timeoutMsg: message });
  }

  /**
   * 주어진 셀렉터에 매칭되는 요소의 개수를 반환
   *
   * - WebdriverIO 의 $$ 는 타입이 복잡해 any[] 로 캐스팅 후 length 를 사용
   * - 팝업 여부, 버튼이 몇 개 노출되었는지 등의 정량 체크에 활용
   *
   * @param selector WebdriverIO 셀렉터
   * @returns        셀렉터에 매칭된 요소의 수
   */
  protected async countBySelector(selector: string): Promise<number> {
    const arr = (await this.driver.$$(selector)) as unknown as any[];
    return Array.isArray(arr) ? arr.length : 0;
  }
}