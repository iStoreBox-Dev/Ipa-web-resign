import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';

interface FileDropzoneProps {
  onDrop: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onDrop,
  accept,
  maxSize,
  disabled,
  children,
  className,
}) => {
  const handleDrop = useCallback((acceptedFiles: File[]) => {
    onDrop(acceptedFiles);
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: handleDrop,
    accept,
    maxSize,
    disabled,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
        isDragActive && !isDragReject && 'border-brand-500 bg-brand-50 dark:bg-brand-500/10',
        isDragReject && 'border-red-500 bg-red-50 dark:bg-red-500/10',
        !isDragActive && 'border-gray-200 dark:border-zinc-700 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-gray-50 dark:hover:bg-zinc-800/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />
      {children || (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-brand-50 dark:bg-brand-500/10 rounded-2xl flex items-center justify-center">
            <svg className="w-7 h-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
              {isDragActive ? 'Drop your file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
              IPA files up to 500MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
