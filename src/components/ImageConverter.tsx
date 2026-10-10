import React, { useState, useCallback, useRef } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Download, 
  Loader2, 
  Info, 
  Check, 
  Sliders, 
  RefreshCw, 
  ArrowRight,
  Trash2,
  FileImage
} from 'lucide-react';
import { cn } from '../lib/utils';

type TargetFormat = 'image/jpeg' | 'image/png';
type ExtensionFormat = 'jpg' | 'jpeg' | 'png';

interface ConvertedItem {
  id: string;
  originalFile: File;
  originalUrl: string;
  originalSize: number;
  width: number;
  height: number;
  convertedUrl: string;
  convertedBlob: Blob;
  convertedSize: number;
  targetFormat: ExtensionFormat;
}

export default function ImageConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [convertedItems, setConvertedItems] = useState<ConvertedItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings
  const [selectedPreset, setSelectedPreset] = useState<'png2jpg' | 'png2jpeg' | 'jpg2jpeg' | 'custom'>('png2jpg');
  const [targetExt, setTargetExt] = useState<ExtensionFormat>('jpg');
  const [quality, setQuality] = useState<number>(0.92);
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyPreset = (preset: 'png2jpg' | 'png2jpeg' | 'jpg2jpeg') => {
    setSelectedPreset(preset);
    if (preset === 'png2jpg') {
      setTargetExt('jpg');
    } else if (preset === 'png2jpeg') {
      setTargetExt('jpeg');
    } else if (preset === 'jpg2jpeg') {
      setTargetExt('jpeg');
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFiles = (incomingFiles: FileList | File[]) => {
    const list = Array.from(incomingFiles);
    const valid = list.filter(f => f.type.startsWith('image/'));
    
    if (valid.length === 0) {
      setError('Please upload valid PNG or JPG/JPEG images.');
      return;
    }

    if (valid.length !== list.length) {
      setError('Some non-image files were skipped.');
    } else {
      setError(null);
    }

    setFiles(prev => [...prev, ...valid]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setConvertedItems([]);
    setError(null);
  };

  const convertSingleImage = (file: File): Promise<ConvertedItem> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // If converting to JPEG / JPG, fill transparent backgrounds with bgColor
          if (targetExt === 'jpg' || targetExt === 'jpeg') {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0);

          const mimeType = targetExt === 'png' ? 'image/png' : 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to convert image to blob'));
                return;
              }
              const convertedUrl = URL.createObjectURL(blob);
              const originalUrl = e.target?.result as string;
              resolve({
                id: Math.random().toString(36).substring(7),
                originalFile: file,
                originalUrl,
                originalSize: file.size,
                width: img.width,
                height: img.height,
                convertedUrl,
                convertedBlob: blob,
                convertedSize: blob.size,
                targetFormat: targetExt
              });
            },
            mimeType,
            quality
          );
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      setError('Please upload at least one image to convert.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const results: ConvertedItem[] = [];
      for (const file of files) {
        const converted = await convertSingleImage(file);
        results.push(converted);
      }
      setConvertedItems(results);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during image conversion.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTargetFileName = (originalName: string, ext: ExtensionFormat) => {
    const base = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    return `${base}.${ext}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Upload & Configuration */}
      <div className="lg:col-span-5 space-y-6">
        {/* Presets Bar */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3 block">
            Popular Conversion Presets
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => applyPreset('png2jpg')}
              className={cn(
                "py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center flex flex-col items-center justify-center gap-1",
                selectedPreset === 'png2jpg'
                  ? "bg-red-50 border-red-500 text-red-700 shadow-xs"
                  : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100"
              )}
            >
              <span className="font-bold">PNG → JPG</span>
              <span className="text-[10px] text-neutral-500 font-normal">Standard JPG</span>
            </button>
            <button
              onClick={() => applyPreset('png2jpeg')}
              className={cn(
                "py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center flex flex-col items-center justify-center gap-1",
                selectedPreset === 'png2jpeg'
                  ? "bg-red-50 border-red-500 text-red-700 shadow-xs"
                  : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100"
              )}
            >
              <span className="font-bold">PNG → JPEG</span>
              <span className="text-[10px] text-neutral-500 font-normal">.jpeg format</span>
            </button>
            <button
              onClick={() => applyPreset('jpg2jpeg')}
              className={cn(
                "py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center flex flex-col items-center justify-center gap-1",
                selectedPreset === 'jpg2jpeg'
                  ? "bg-red-50 border-red-500 text-red-700 shadow-xs"
                  : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100"
              )}
            >
              <span className="font-bold">JPG → JPEG</span>
              <span className="text-[10px] text-neutral-500 font-normal">Standardize</span>
            </button>
          </div>
        </section>

        {/* Upload Zone */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <UploadCloud size={20} className="text-red-500" />
            Upload Images
          </h2>

          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
              isDragging ? "border-red-500 bg-red-50" : "border-neutral-300 hover:border-neutral-400 bg-neutral-50/50 hover:bg-neutral-50"
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              multiple
              className="hidden"
              onChange={handleInputChange}
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 bg-white shadow-sm border border-neutral-200 text-red-500 rounded-full flex items-center justify-center mb-1">
                <FileImage size={26} />
              </div>
              <p className="font-medium text-neutral-800 text-sm">
                Click or drag & drop PNG, JPG, or JPEG images
              </p>
              <p className="text-xs text-neutral-500">
                Supports single or batch processing • 100% Client-Side Privacy
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-start gap-2">
              <Info size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </section>

        {/* Conversion Settings */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2 text-neutral-800">
            <Sliders size={18} className="text-red-500" />
            Conversion Settings
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Target Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['jpg', 'jpeg', 'png'] as ExtensionFormat[]).map(ext => (
                  <button
                    key={ext}
                    type="button"
                    onClick={() => {
                      setTargetExt(ext);
                      setSelectedPreset('custom');
                    }}
                    className={cn(
                      "py-2 px-3 rounded-lg text-xs font-semibold uppercase border transition-colors",
                      targetExt === ext
                        ? "bg-red-600 text-white border-red-600 shadow-xs"
                        : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                    )}
                  >
                    .{ext}
                  </button>
                ))}
              </div>
            </div>

            {targetExt !== 'png' && (
              <>
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-medium text-neutral-700">JPEG Quality</span>
                    <span className="font-bold text-red-600">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.02"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full accent-red-600 h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                    <span>Smaller file</span>
                    <span>High clarity (Recommended 92%)</span>
                    <span>Max Quality</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Background Color for Transparent PNGs
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-neutral-200 cursor-pointer p-0.5"
                      title="Choose background color for transparent pixels"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBgColor('#ffffff')}
                        className={cn(
                          "px-2.5 py-1 text-xs rounded-md border text-neutral-700",
                          bgColor === '#ffffff' ? "border-red-500 bg-red-50 text-red-700 font-semibold" : "border-neutral-200"
                        )}
                      >
                        White
                      </button>
                      <button
                        type="button"
                        onClick={() => setBgColor('#000000')}
                        className={cn(
                          "px-2.5 py-1 text-xs rounded-md border text-neutral-700",
                          bgColor === '#000000' ? "border-red-500 bg-red-50 text-red-700 font-semibold" : "border-neutral-200"
                        )}
                      >
                        Black
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    JPG/JPEG doesn't support transparency. Transparent areas will become this color.
                  </p>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleConvert}
            disabled={files.length === 0 || isProcessing}
            className="w-full mt-4 py-3.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Converting {files.length} Image{files.length > 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Convert to .{targetExt.toUpperCase()} ({files.length} Image{files.length > 1 ? 's' : ''})
              </>
            )}
          </button>
        </section>

        {/* Selected Files List */}
        {files.length > 0 && (
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-neutral-800">
                Selected Files ({files.length})
              </span>
              <button
                onClick={clearAll}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileImage size={16} className="text-red-500 shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-neutral-800 truncate">{file.name}</p>
                      <p className="text-[10px] text-neutral-500">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Right Column: Preview & Converted Results */}
      <div className="lg:col-span-7">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 h-full flex flex-col min-h-[520px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon size={20} className="text-red-500" />
              Converted Images
            </h2>
            {convertedItems.length > 1 && (
              <button
                onClick={() => {
                  convertedItems.forEach(item => {
                    const link = document.createElement('a');
                    link.href = item.convertedUrl;
                    link.download = getTargetFileName(item.originalFile.name, item.targetFormat);
                    link.click();
                  });
                }}
                className="text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download size={14} />
                Download All ({convertedItems.length})
              </button>
            )}
          </div>

          <div className="flex-1">
            {convertedItems.length > 0 ? (
              <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2">
                {convertedItems.map((item) => {
                  const sizeDiffPercent = Math.round(
                    ((item.convertedSize - item.originalSize) / item.originalSize) * 100
                  );
                  const isSmaller = sizeDiffPercent <= 0;

                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between"
                    >
                      {/* Image Thumbnail with checkerboard background */}
                      <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-neutral-300 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px] shrink-0 flex items-center justify-center">
                        <img
                          src={item.convertedUrl}
                          alt="Converted Preview"
                          className="w-full h-full object-contain"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white font-mono text-[9px] px-1.5 py-0.5 rounded uppercase">
                          .{item.targetFormat}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-1.5 text-center sm:text-left min-w-0">
                        <p className="font-semibold text-neutral-800 text-sm truncate">
                          {getTargetFileName(item.originalFile.name, item.targetFormat)}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-neutral-500 justify-center sm:justify-start flex-wrap">
                          <span>{item.width} × {item.height} px</span>
                          <span>•</span>
                          <span>Original: {formatBytes(item.originalSize)}</span>
                          <span>→</span>
                          <span className="font-semibold text-neutral-900">
                            {formatBytes(item.convertedSize)}
                          </span>
                        </div>

                        <div className="pt-1">
                          <span
                            className={cn(
                              "inline-block text-[11px] font-medium px-2 py-0.5 rounded-full",
                              isSmaller
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                            )}
                          >
                            {isSmaller
                              ? `${Math.abs(sizeDiffPercent)}% reduction in size`
                              : `Quality adjusted (+${sizeDiffPercent}%)`}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                        <a
                          href={item.convertedUrl}
                          download={getTargetFileName(item.originalFile.name, item.targetFormat)}
                          className="flex-1 sm:flex-none py-2 px-3.5 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                        >
                          <Download size={14} />
                          Download
                        </a>
                        <a
                          href={item.convertedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 sm:flex-none py-2 px-3.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 font-medium text-xs rounded-lg flex items-center justify-center gap-1.5"
                        >
                          View Full
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200 min-h-[440px]">
                <div className="w-16 h-16 bg-neutral-200 text-neutral-400 rounded-full flex items-center justify-center mb-4">
                  <ImageIcon size={32} />
                </div>
                <h3 className="font-semibold text-neutral-800 mb-1">
                  Ready to Convert Images
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mb-4">
                  Upload PNG, JPG, or JPEG images on the left. Pick your desired target format (JPG, JPEG, or PNG) and click Convert.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-neutral-600 font-medium bg-white py-2 px-4 rounded-full border border-neutral-200 shadow-2xs">
                  <span className="flex items-center gap-1"><Check size={12} className="text-emerald-600" /> PNG to JPG</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Check size={12} className="text-emerald-600" /> PNG to JPEG</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Check size={12} className="text-emerald-600" /> JPG to JPEG</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
