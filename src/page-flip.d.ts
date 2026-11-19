declare module 'page-flip' {
  export type SizeType = 'fixed' | 'stretch';

  export interface PageFlipSettings {
    startPage?: number;
    size?: 'fixed' | 'stretch';
    width: number;
    height: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
  }

  export interface PageFlipEvent {
    data?: unknown;
    object?: PageFlip;
  }

  export class PageFlip {
    constructor(htmlElement: HTMLElement, setting: Partial<PageFlipSettings>);
    loadFromImages(imagesHref: string[]): void;
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    updateFromImages(imagesHref: string[]): void;
    updateFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    update(): void;
    destroy(): void;
    flipNext(corner?: 'top' | 'bottom'): void;
    flipPrev(corner?: 'top' | 'bottom'): void;
    flip(page: number, corner?: 'top' | 'bottom'): void;
    turnToPage(page: number): void;
    getPageCount(): number;
    getCurrentPageIndex(): number;
    getOrientation(): 'portrait' | 'landscape';
    on(eventName: 'flip', callback: (e: { data?: number }) => void): PageFlip;
    on(eventName: 'changeState', callback: (e: { data?: string }) => void): PageFlip;
    on(eventName: 'changeOrientation', callback: (e: { data?: 'portrait' | 'landscape' }) => void): PageFlip;
    on(eventName: string, callback: (e: PageFlipEvent) => void): PageFlip;
  }
}
