/**
 * 앱 공통 설정 값 모음
 *
 * - Appium / WebdriverIO capabilities 에서 재사용되는 값들을 한 곳에 정의
 * - 오늘의집 앱 패키지명이나 런처 액티비티가 변경되더라도
 *   이 파일만 수정하면 전체 스크립트에서 자동으로 반영되도록 하기 위함
 *
 * 값 출처(예시):
 *   - 패키지명:    adb shell pm list packages | grep bucketplace
 *   - 런처 액티비티: adb shell cmd package resolve-activity --brief net.bucketplace
 *                    → net.bucketplace/se.ohou.screen.splash.SplashActivity
 *   - Intro 액티비티: Appium Inspector 로 현재 Activity 확인
 */

/** 오늘의집 안드로이드 패키지명 */
export const APP_PKG = 'net.bucketplace';

/**
 * 오늘의집 앱을 처음 실행할 때 사용하는 런처 액티비티
 * - Appium capabilities 의 appActivity 로 사용
 */
export const APP_LAUNCH_ACTIVITY = 'se.ohou.screen.splash.SplashActivity';

/**
 * 인트로(소셜/이메일 로그인 버튼이 존재하는) 화면의 액티비티
 * - Intro 화면 진입 여부를 확인할 때 사용
 */
export const INTRO_ACTIVITY = 'se.ohou.screen.intro.IntroActivity';