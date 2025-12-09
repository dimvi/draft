import { createContext, useContext, useState, ReactNode } from 'react';
import { storageManager } from '../utils/storageManager';

interface FileSystemContextType {
  folderPath: string;
  files: string[];
  selectFolder: () => Promise<void>;
  isBrowserSupported: boolean;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export function FileSystemProvider({ children }: { children: ReactNode }) {
  const [folderPath, setFolderPath] = useState(() => storageManager.getProjectFolder());
  const [files, setFiles] = useState<string[]>(() => storageManager.getFileCache());

  // Check if File System Access API is supported
  const isBrowserSupported = 'showDirectoryPicker' in window;

  const scanDirectory = async (dirHandle: FileSystemDirectoryHandle, basePath = ''): Promise<string[]> => {
    const fileList: string[] = [];

    for await (const entry of (dirHandle as any).values()) {
      const path = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (entry.kind === 'file') {
        fileList.push(path);
      } else if (entry.kind === 'directory') {
        try {
          const subFiles = await scanDirectory(entry, path);
          fileList.push(...subFiles);
        } catch (error) {
          console.warn(`Could not access directory: ${path}`, error);
        }
      }
    }

    return fileList;
  };

  const selectFolder = async () => {
    if (!isBrowserSupported) {
      alert('이 브라우저는 폴더 선택을 지원하지 않습니다. Chrome, Edge, 또는 Safari를 사용해주세요.');
      return;
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      const path = dirHandle.name;

      setFolderPath(path);
      storageManager.setProjectFolder(path);

      // Scan directory
      const fileList = await scanDirectory(dirHandle);
      setFiles(fileList);
      storageManager.setFileCache(fileList);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to select folder:', error);
        alert('폴더를 선택하는 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <FileSystemContext.Provider value={{ folderPath, files, selectFolder, isBrowserSupported }}>
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystem() {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within FileSystemProvider');
  }
  return context;
}
