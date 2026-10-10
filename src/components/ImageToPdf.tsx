import React, { useState, useCallback, useRef } from 'react';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Download, 
  Loader2, 
  Info, 
  Check, 
  Sliders, 
  RefreshCw, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  FileText,
  Eye,
  CheckCircle2,
  Settings2,
  FileImage
} from 'lucide-react';
import { cn } from '../lib/utils';

export type ImageToPdfPreset = 'all' | 'jpg' | 'png';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  width: number;
  height: number;
  type: string;
}

interface ImageToPdfProps {
  key?: React.Key;
  initialPreset?: ImageToPdfPreset;
}

type PageSizeOption = 'a4' | 'letter' | 'fit-image';
type OrientationOption = 'portrait' | 'landscape' | 'auto';
type MarginOption = 'none' | 'small' | 'normal';

export default function ImageToPdf({ initialPreset = 'all' }: ImageToPdfProps) {
  const [preset, setPreset] = useState<ImageToPdfPreset>(initialPreset);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputFileSize, setOutputFileSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // PDF Page Settings
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [orientation, setOrientation] = useState<OrientationOption>('auto');
  const [margin, setMargin] = useState<MarginOption>('none');
  const [imageFit, setImageFit] = useState<'contain' | 'cover'>('contain');
  const [outputFilename, setOutputFilename] = useState<string>('converted-document.pdf');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Accepted formats based on current preset
  const acceptTypes = preset === 'jpg' 
    ? 'image/jpeg,image/jpg' 
    : preset === 'png' 
      ? 'image/png' 
      : 'image/jpeg,image/jpg,image/png,image/webp';

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const validFiles: File[] = [];
    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      const type = file.type.toLowerCase();
      const name = file.name.toLowerCase();
      const isJpg = type === 'image/jpeg' || name.endsWith('.jpg') || name.endsWith('.jpeg');
      const isPng = type === 'image/png' || name.endsWith('.png');
      const isWebp = type === 'image/webp' || name.endsWith('.webp');

      if (preset === 'jpg' && !isJpg) {
        continue;
      }
      if (preset === 'png' && !isPng) {
        continue;
      }
      if (isJpg || isPng || isWebp) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      if (preset === 'jpg') {
        setError('Please select valid JPG / JPEG image files.');
      } else if (preset === 'png') {
        setError('Please select valid PNG image files.');
      } else {
        setError('Please select valid JPG, JPEG, or PNG image files.');
      }
      return;
    }

    setError(null);
    setOutputUrl(null);
    setOutputBlob(null);

    // Load image items with dimensions
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const newItem: ImageItem = {
            id: Math.random().toString(36).substring(2, 9),
            file,
            previewUrl: url,
            name: file.name,
            size: file.size,
            width: img.naturalWidth,
            height: img.naturalHeight,
            type: file.type || (file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg')
          };
          setImages((prev) => [...prev, newItem]);
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    });
  }, [preset]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setOutputUrl(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setOutputUrl(null);
  };

  const moveDown = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setOutputUrl(null);
  };

  const clearAll = () => {
    setImages([]);
    setOutputUrl(null);
    setOutputBlob(null);
    setError(null);
  };

  // Helper to convert Image to clean JPEG / PNG ArrayBuffer via Canvas if direct embedding needs fallback
  const getCleanImageBytes = async (item: ImageItem): Promise<{ bytes: Uint8Array; format: 'jpg' | 'png' }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        const isPng = item.type === 'image/png' || item.name.toLowerCase().endsWith('.png');

        if (!isPng) {
          // Fill white background for non-PNG or transparent JPG conversion
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        const mime = isPng ? 'image/png' : 'image/jpeg';
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            const buffer = reader.result as ArrayBuffer;
            resolve({
              bytes: new Uint8Array(buffer),
              format: isPng ? 'png' : 'jpg'
            });
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(blob);
        }, mime, 0.95);
      };
      img.onerror = () => reject(new Error('Failed to load image for rendering'));
      img.src = item.previewUrl;
    });
  };

  const convertToPdf = async () => {
    if (images.length === 0) {
      setError('Please add at least one image to convert.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStatusMessage('Generating high-resolution PDF...');

    try {
      const pdfDoc = await PDFDocument.create();

      // Margins in points (72 points = 1 inch)
      const marginPt = margin === 'none' ? 0 : margin === 'small' ? 20 : 36;

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        setStatusMessage(`Processing page ${i + 1} of ${images.length} (${item.name})...`);

        let embeddedImage;
        const arrayBuffer = await item.file.arrayBuffer();
        const rawBytes = new Uint8Array(arrayBuffer);

        const isRawPng = item.type === 'image/png' || item.name.toLowerCase().endsWith('.png');
        const isRawJpg = item.type === 'image/jpeg' || item.type === 'image/jpg' || item.name.toLowerCase().endsWith('.jpg') || item.name.toLowerCase().endsWith('.jpeg');

        // Attempt direct embedding first for maximum speed & original quality
        let embeddedSuccessfully = false;
        if (isRawJpg) {
          try {
            embeddedImage = await pdfDoc.embedJpg(rawBytes);
            embeddedSuccessfully = true;
          } catch {
            // Will fallback to canvas rendering
          }
        } else if (isRawPng) {
          try {
            embeddedImage = await pdfDoc.embedPng(rawBytes);
            embeddedSuccessfully = true;
          } catch {
            // Will fallback to canvas rendering
          }
        }

        // If direct embed failed (e.g. progressive jpeg, interlaced png, or webp), use canvas rendering
        if (!embeddedSuccessfully) {
          const clean = await getCleanImageBytes(item);
          if (clean.format === 'png') {
            embeddedImage = await pdfDoc.embedPng(clean.bytes);
          } else {
            embeddedImage = await pdfDoc.embedJpg(clean.bytes);
          }
        }

        if (!embeddedImage) {
          throw new Error(`Failed to embed image: ${item.name}`);
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;
        const imgAspectRatio = imgWidth / imgHeight;

        let pageWidth: number;
        let pageHeight: number;

        if (pageSize === 'fit-image') {
          // Exact dimensions matching the image + margins
          pageWidth = imgWidth + marginPt * 2;
          pageHeight = imgHeight + marginPt * 2;
        } else {
          // Standard A4 or Letter
          const baseDimensions = pageSize === 'a4' ? PageSizes.A4 : PageSizes.Letter;
          
          let isLandscape = false;
          if (orientation === 'auto') {
            isLandscape = imgAspectRatio > 1;
          } else if (orientation === 'landscape') {
            isLandscape = true;
          }

          if (isLandscape) {
            pageWidth = Math.max(baseDimensions[0], baseDimensions[1]);
            pageHeight = Math.min(baseDimensions[0], baseDimensions[1]);
          } else {
            pageWidth = Math.min(baseDimensions[0], baseDimensions[1]);
            pageHeight = Math.max(baseDimensions[0], baseDimensions[1]);
          }
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate available drawable box inside margins
        const printableWidth = Math.max(10, pageWidth - marginPt * 2);
        const printableHeight = Math.max(10, pageHeight - marginPt * 2);

        let drawWidth: number;
        let drawHeight: number;

        if (imageFit === 'contain' || pageSize === 'fit-image') {
          // Fit inside printable area maintaining aspect ratio
          const scale = Math.min(printableWidth / imgWidth, printableHeight / imgHeight);
          drawWidth = imgWidth * scale;
          drawHeight = imgHeight * scale;
        } else {
          // Cover or stretch
          drawWidth = printableWidth;
          drawHeight = printableHeight;
        }

        // Center within margins
        const drawX = marginPt + (printableWidth - drawWidth) / 2;
        const drawY = marginPt + (printableHeight - drawHeight) / 2;

        page.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: drawWidth,
          height: drawHeight,
        });
      }

      setStatusMessage('Finalizing PDF document...');
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setOutputUrl(url);
      setOutputBlob(blob);
      setOutputFileSize(blob.size);

      // Set default output filename based on first image name
      if (images.length === 1) {
        const baseName = images[0].name.substring(0, images[0].name.lastIndexOf('.')) || images[0].name;
        setOutputFilename(`${baseName}.pdf`);
      } else {
        setOutputFilename(`converted-images-${images.length}-pages.pdf`);
      }

      setStatusMessage('');
    } catch (err: unknown) {
      console.error(err);
      setError((err as Error)?.message || 'An error occurred while generating the PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputUrl) return;
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = outputFilename || 'converted-document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Preset Switcher */}
      <div className="bg-white rounded-2xl shadow-xs border border-neutral-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-red-100 text-red-700 rounded-lg">
                <FileImage size={20} />
              </span>
              <h2 className="text-xl font-bold text-neutral-800">
                {preset === 'jpg' ? 'JPG / JPEG to PDF Converter' : preset === 'png' ? 'PNG to PDF Converter' : 'Image to PDF Converter'}
              </h2>
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              Convert your photos, scanned forms, receipts, and images into clean, professional PDF documents.
            </p>
          </div>

          {/* Quick Preset Selector */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl self-stretch sm:self-auto">
            <button
              onClick={() => {
                setPreset('all');
                setError(null);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                preset === 'all' 
                  ? "bg-white text-neutral-900 shadow-xs" 
                  : "text-neutral-600 hover:text-neutral-900"
              )}
            >
              All Images
            </button>
            <button
              onClick={() => {
                setPreset('jpg');
                setError(null);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                preset === 'jpg' 
                  ? "bg-red-600 text-white shadow-xs" 
                  : "text-neutral-600 hover:text-neutral-900"
              )}
            >
              JPG / JPEG to PDF
            </button>
            <button
              onClick={() => {
                setPreset('png');
                setError(null);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                preset === 'png' 
                  ? "bg-red-600 text-white shadow-xs" 
                  : "text-neutral-600 hover:text-neutral-900"
              )}
            >
              PNG to PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload & Image List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dropzone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all bg-white",
              isDragging ? "border-red-500 bg-red-50/50" : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50/50"
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              accept={acceptTypes}
              multiple
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-4 bg-red-50 text-red-600 rounded-full">
                <UploadCloud size={32} />
              </div>
              <div>
                <p className="text-base font-semibold text-neutral-800">
                  {preset === 'jpg' 
                    ? 'Click to upload or drag & drop JPG / JPEG images' 
                    : preset === 'png'
                      ? 'Click to upload or drag & drop PNG images'
                      : 'Click to upload or drag & drop JPG, JPEG, or PNG images'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Upload single or multiple images to combine into one PDF document.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-medium text-neutral-700">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Supports high resolution, multi-page creation & reordering</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 flex items-start gap-3">
              <Info className="shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Selected Images List */}
          {images.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xs border border-neutral-200 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-neutral-800 flex items-center gap-2">
                    <span>Selected Images ({images.length})</span>
                    <span className="text-xs font-normal text-neutral-500">
                      Total: {formatFileSize(images.reduce((acc, curr) => acc + curr.size, 0))}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Images will appear in this order as pages in the final PDF. Use arrows to reorder.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 transition-colors"
                  >
                    + Add More
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-xs font-semibold text-neutral-600 hover:text-red-600 hover:bg-neutral-100 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="divide-y divide-neutral-100 max-h-[420px] overflow-y-auto pr-1">
                {images.map((item, index) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 hover:bg-neutral-50/80 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 text-center font-bold text-xs text-neutral-400">
                        #{index + 1}
                      </div>
                      <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-neutral-200 flex items-center justify-center">
                        <img 
                          src={item.previewUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-800 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                          <span>{item.width} × {item.height}px</span>
                          <span>•</span>
                          <span>{formatFileSize(item.size)}</span>
                          <span>•</span>
                          <span className="uppercase font-semibold text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">
                            {item.name.split('.').pop()}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        title="Move Up (earlier page)"
                        className="p-1.5 text-neutral-500 hover:text-neutral-800 disabled:opacity-30 disabled:hover:text-neutral-500 rounded-lg hover:bg-neutral-200 transition-colors"
                      >
                        <MoveUp size={16} />
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === images.length - 1}
                        title="Move Down (later page)"
                        className="p-1.5 text-neutral-500 hover:text-neutral-800 disabled:opacity-30 disabled:hover:text-neutral-500 rounded-lg hover:bg-neutral-200 transition-colors"
                      >
                        <MoveDown size={16} />
                      </button>
                      <button
                        onClick={() => removeImage(item.id)}
                        title="Remove image"
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: PDF Options & Generation */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xs border border-neutral-200 p-5 sm:p-6 space-y-5">
            <h3 className="text-base font-bold text-neutral-800 flex items-center gap-2">
              <Settings2 size={18} className="text-neutral-600" />
              <span>PDF Page & Layout Settings</span>
            </h3>

            {/* Page Size */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Page Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'a4', label: 'A4 (Standard)' },
                  { id: 'letter', label: 'US Letter' },
                  { id: 'fit-image', label: 'Fit to Image' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setPageSize(opt.id as PageSizeOption);
                      setOutputUrl(null);
                    }}
                    className={cn(
                      "py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all",
                      pageSize === opt.id
                        ? "bg-red-50 border-red-500 text-red-700"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1.5">
                {pageSize === 'fit-image' 
                  ? 'Each PDF page dynamically matches the exact resolution of the image.' 
                  : 'Standard office document size suitable for printing.'}
              </p>
            </div>

            {/* Orientation (only if not fit-image) */}
            {pageSize !== 'fit-image' && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Page Orientation
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'auto', label: 'Auto Detect' },
                    { id: 'portrait', label: 'Portrait' },
                    { id: 'landscape', label: 'Landscape' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setOrientation(opt.id as OrientationOption);
                        setOutputUrl(null);
                      }}
                      className={cn(
                        "py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all",
                        orientation === opt.id
                          ? "bg-red-50 border-red-500 text-red-700"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Margins */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Page Margins
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: 'No Margin (0)' },
                  { id: 'small', label: 'Small (7mm)' },
                  { id: 'normal', label: 'Normal (13mm)' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setMargin(opt.id as MarginOption);
                      setOutputUrl(null);
                    }}
                    className={cn(
                      "py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all",
                      margin === opt.id
                        ? "bg-red-50 border-red-500 text-red-700"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fit mode */}
            {pageSize !== 'fit-image' && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Image Fit
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImageFit('contain');
                      setOutputUrl(null);
                    }}
                    className={cn(
                      "py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all",
                      imageFit === 'contain'
                        ? "bg-red-50 border-red-500 text-red-700"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    )}
                  >
                    Fit Whole Image (Maintain Ratio)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFit('cover');
                      setOutputUrl(null);
                    }}
                    className={cn(
                      "py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all",
                      imageFit === 'cover'
                        ? "bg-red-50 border-red-500 text-red-700"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    )}
                  >
                    Stretch to Margins
                  </button>
                </div>
              </div>
            )}

            {/* Output filename */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Output File Name
              </label>
              <input
                type="text"
                value={outputFilename}
                onChange={(e) => setOutputFilename(e.target.value)}
                placeholder="converted-document.pdf"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={convertToPdf}
                disabled={images.length === 0 || isProcessing}
                className={cn(
                  "w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-sm transition-all",
                  images.length === 0 || isProcessing
                    ? "bg-neutral-300 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 active:scale-[0.99]"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Converting to PDF...</span>
                  </>
                ) : (
                  <>
                    <FileText size={18} />
                    <span>
                      Convert {images.length > 0 ? `${images.length} Image${images.length > 1 ? 's' : ''}` : ''} to PDF
                    </span>
                  </>
                )}
              </button>
              {isProcessing && statusMessage && (
                <p className="text-xs text-center text-neutral-500 mt-2 animate-pulse">
                  {statusMessage}
                </p>
              )}
            </div>
          </div>

          {/* Download Card */}
          {outputUrl && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">PDF Ready for Download!</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {images.length} page{images.length > 1 ? 's' : ''} • {formatFileSize(outputFileSize)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Download size={18} />
                  <span>Download PDF Document</span>
                </button>

                <a
                  href={outputUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 flex items-center justify-center gap-2 transition-colors"
                >
                  <Eye size={15} />
                  <span>Preview PDF in New Tab</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
