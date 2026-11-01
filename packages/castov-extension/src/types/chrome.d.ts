/**
 * Castov Secret Shield - Minimal Chrome Extension Typings
 */

interface ImportMeta {
  dirname?: string;
  url?: string;
}

declare namespace chrome {
  namespace storage {
    interface StorageArea {
      get(keys?: string | string[] | Record<string, any> | null): Promise<Record<string, any>>;
      set(items: Record<string, any>): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    }

    const local: StorageArea;
    const sync: StorageArea;
  }

  namespace runtime {
    const id: string;
    function getURL(path: string): string;
    function sendMessage(message: any): Promise<any>;
    const onInstalled: {
      addListener(callback: (details?: any) => void): void;
    };
    const onMessage: {
      addListener(callback: (message: any, sender: any, sendResponse: (response?: any) => void) => boolean | void): void;
      removeListener(callback: Function): void;
    };
  }

  namespace contextMenus {
    interface CreateProperties {
      id?: string;
      title?: string;
      contexts?: Array<"all" | "page" | "selection" | "link" | "editable" | "image">;
      onclick?: (info: any, tab: any) => void;
    }
    function create(createProperties: CreateProperties, callback?: () => void): string | number;
    function removeAll(callback?: () => void): void;
    const onClicked: {
      addListener(callback: (info: any, tab: any) => void): void;
    };
  }

  namespace tabs {
    function create(properties: { url: string; active?: boolean }): Promise<any>;
    function sendMessage(tabId: number, message: any): Promise<any>;
    function query(queryInfo: { active?: boolean; currentWindow?: boolean }): Promise<Array<{ id?: number; url?: string }>>;
  }
}
