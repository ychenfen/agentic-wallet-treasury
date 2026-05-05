/**
 * Minimal ambient declaration for "playwright". Exposed only because we
 * dynamically import it; the real package is an opt-in devDependency that
 * can be installed by anyone who wants to record the walkthrough.
 *
 * If the package is installed, its real types take precedence.
 */
declare module "playwright" {
  export interface ScreenshotOptions {
    path?: string;
    fullPage?: boolean;
    animations?: "disabled" | "allow";
  }

  export interface ViewportSize {
    width: number;
    height: number;
  }

  export interface RecordVideoOptions {
    dir: string;
    size?: ViewportSize;
  }

  export interface BrowserContextOptions {
    viewport?: ViewportSize | null;
    deviceScaleFactor?: number;
    recordVideo?: RecordVideoOptions;
  }

  export interface Locator {
    scrollIntoViewIfNeeded(options?: { timeout?: number }): Promise<void>;
    screenshot(options?: ScreenshotOptions): Promise<Buffer>;
  }

  export interface Mouse {
    wheel(deltaX: number, deltaY: number): Promise<void>;
  }

  export interface Video {
    path(): Promise<string>;
  }

  export interface Page {
    goto(url: string, options?: { waitUntil?: string }): Promise<unknown>;
    waitForTimeout(ms: number): Promise<void>;
    locator(selector: string): Locator;
    screenshot(options?: ScreenshotOptions): Promise<Buffer>;
    mouse: Mouse;
    evaluate<R>(pageFunction: () => R): Promise<R>;
    close(): Promise<void>;
    video(): Video | null;
  }

  export interface BrowserContext {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }

  export interface Browser {
    newContext(options?: BrowserContextOptions): Promise<BrowserContext>;
    close(): Promise<void>;
  }

  export interface BrowserType {
    launch(options?: { headless?: boolean }): Promise<Browser>;
  }

  export const chromium: BrowserType;
}
