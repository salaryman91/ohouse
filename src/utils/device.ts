/**
 * 디바이스 / ADB / WebDriver 세션 유틸리티 모듈
 *
 * - adb(): 공통 ADB 명령 래퍼
 * - printOhouseVersion(): 오늘의집 앱 설치 버전 로그 출력
 * - isAppInstalled(): 오늘의집 앱 설치 여부 확인
 * - killAllBackgroundApps(): 전체 백그라운드 앱 정리 (am kill-all)
 * - forceStopAndClearApp(): 오늘의집 앱 강제 종료 + 데이터/캐시 초기화
 * - createDriverWithRetry(): ENOBUFS 등 일시적 오류를 고려한 WebDriver 세션 생성
 *
 * 테스트 스크립트에서는 이 모듈을 통해 디바이스 상태를 초기화하고,
 * Appium WebDriver 세션을 안정적으로 생성하는 공통 로직을 재사용
 */

import { remote } from 'webdriverio';
import { execSync } from 'node:child_process';
import { APP_PKG, APP_LAUNCH_ACTIVITY } from '../appConfig';

/**
 * 지정된 시간(ms) 동안 비동기 대기
 */
function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * ADB 공통 래퍼
 *
 * @param udid  대상 디바이스/에뮬레이터 UDID
 * @param args  adb 이후에 붙을 인자 배열 (예: ['shell', 'pm', 'list', 'packages'])
 * @param options stdio 설정 (기본: 'pipe')
 */
function adb(
  udid: string,
  args: string[],
  options: { stdio?: 'pipe' | 'inherit' } = { stdio: 'pipe' },
) {
  const cmd = ['adb', '-s', udid, ...args].join(' ');
  return execSync(cmd, { encoding: 'utf8', stdio: options.stdio });
}

/**
 * 오늘의집 앱의 설치 버전 정보 출력
 *
 * - dumpsys package net.bucketplace 결과에서 versionName / versionCode 파싱
 * - 실패 시 에러를 삼키고 경고 메시지만 출력
 */
export function printOhouseVersion(udid: string) {
  try {
    const dumpsys = adb(udid, ['shell', 'dumpsys', 'package', APP_PKG]);
    const versionName = (/versionName=(.+)/.exec(dumpsys)?.[1] || '').trim();
    const versionCode = (/versionCode=(\d+)/.exec(dumpsys)?.[1] || '').trim();

    if (versionName) console.log(`오늘의집 설치 버전 (versionName): ${versionName}`);
    if (versionCode) console.log(`오늘의집 설치 버전 코드 (versionCode): ${versionCode}`);
    if (!versionName && !versionCode) console.log('오늘의집 버전 정보를 찾지 못했습니다.');
  } catch (e) {
    console.log('오늘의집 버전 정보를 가져오지 못했습니다.', e);
  }
}

/**
 * 오늘의집 앱이 디바이스에 설치되어 있는지 여부 반환
 *
 * - pm path net.bucketplace 실행 결과에 "package:" 문자열 포함 여부로 판단
 * - adb 에러 시 false 반환
 */
export function isAppInstalled(udid: string): boolean {
  try {
    const out = adb(udid, ['shell', 'pm', 'path', APP_PKG]);
    return out.includes('package:');
  } catch {
    return false;
  }
}

/**
 * 전체 백그라운드 앱 정리
 *
 * - am kill-all 호출 시 백그라운드 프로세스를 정리
 * - 기기/이미지에 따라 지원되지 않을 수 있으므로 실패해도 테스트는 계속 진행
 */
export function killAllBackgroundApps(udid: string) {
  console.log('백그라운드 앱 정리 시도 (am kill-all)');
  try {
    adb(udid, ['shell', 'am', 'kill-all']);
  } catch (e) {
    console.log(
      'am kill-all 실행 중 오류 (무시 가능):',
      e instanceof Error ? e.message : String(e),
    );
  }
}

/**
 * 오늘의집 앱만 강제 종료 + 데이터/캐시 초기화
 *
 * - am force-stop net.bucketplace
 * - pm clear net.bucketplace
 * - 각 명령은 실패해도 테스트는 계속 진행
 */
export function forceStopAndClearApp(udid: string) {
  console.log('오늘의집 앱 상태 초기화 (force-stop + pm clear)');
  try {
    adb(udid, ['shell', 'am', 'force-stop', APP_PKG]);
  } catch {}
  try {
    adb(udid, ['shell', 'pm', 'clear', APP_PKG]);
  } catch {}
}

/**
 * WebdriverIO 세션 1회 생성
 *
 * - Appium 서버(127.0.0.1:4723)에 접속해 Android 세션 생성
 * - 오늘의집 패키지/런처 Activity 기준으로 세션을 시작
 */
async function createDriverOnce(udid: string) {
  const driver = await remote({
    protocol: 'http',
    hostname: '127.0.0.1',
    port: 4723,
    path: '/',
    logLevel: 'info',
    capabilities: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': udid,
      'appium:udid': udid,
      'appium:appPackage': APP_PKG,
      'appium:appActivity': APP_LAUNCH_ACTIVITY,
      'appium:noReset': true,
      'appium:newCommandTimeout': 300,
    },
  });
  return driver;
}

/**
 * WebdriverIO 세션 생성 (ENOBUFS / ADB 일시적 오류 대비 재시도 포함)
 *
 * - ENOBUFS, daemon not running, cannot connect to daemon 등의 메시지가 포함된 경우
 *   일정 시간 대기 후 최대 maxRetries 회까지 재시도
 * - 그 외 오류는 즉시 throw
 */
export async function createDriverWithRetry(
  udid: string,
  maxRetries = 3,
) {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`WebDriver 세션 재시도 ${attempt}/${maxRetries}`);
      }
      return await createDriverOnce(udid);
    } catch (err) {
      lastErr = err;
      const msg = String(err);

      if (
        msg.includes('ENOBUFS') ||
        msg.includes('daemon not running') ||
        msg.includes('cannot connect to daemon')
      ) {
        if (attempt < maxRetries) {
          console.log(
            '세션 생성 중 일시적인 오류 감지 (ENOBUFS 또는 ADB 문제 추정). 잠시 대기 후 재시도합니다.',
          );
          await sleep(2000);
          continue;
        }
      }

      throw err;
    }
  }

  // 타입 안전성을 위해 마지막 에러를 한 번 더 throw
  throw lastErr;
}