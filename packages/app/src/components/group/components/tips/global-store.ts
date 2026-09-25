/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

const STORAGE_KEY = 'workflow-move-into-group-tip-visible';
const STORAGE_VALUE = 'false';

export class TipsGlobalStore {
  private static _instance?: TipsGlobalStore;

  public static get instance(): TipsGlobalStore {
    if (!this._instance) {
      this._instance = new TipsGlobalStore();
    }
    return this._instance;
  }

  private closed = false;

  public isClosed(): boolean {
    return this.isCloseForever() || this.closed;
  }

  public close(): void {
    this.closed = true;
  }

  public isCloseForever(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === STORAGE_VALUE;
    } catch {
      // 离线 HTML（file:// 协议）下部分浏览器会禁用 localStorage
      return false;
    }
  }

  public closeForever(): void {
    try {
      localStorage.setItem(STORAGE_KEY, STORAGE_VALUE);
    } catch {
      // 忽略写入失败
    }
  }
}
