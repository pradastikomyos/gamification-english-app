import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCw, Download, X } from 'lucide-react';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  title?: string;
}

export function ImageZoom({ src, alt, className = "", title }: ImageZoomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'image';
    link.click();
  };

  const resetTransform = () => {
    setZoom(100);
    setRotation(0);
  };

  // Check if src is a placeholder
  const isPlaceholder = src.startsWith('placeholder-');
  const displaySrc = isPlaceholder ? '/placeholder.svg' : src;

  return (
    <>
      {/* Thumbnail image that opens zoom dialog */}
      <img
        src={displaySrc}
        alt={alt}
        className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
        onClick={() => setIsOpen(true)}
        title={title || "Klik untuk memperbesar"}
      />

      {/* Zoom dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>{title || alt}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {zoom}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 300}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                {!isPlaceholder && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTransform}
                >
                  Reset
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {/* Image container with scroll */}
          <div className="flex-1 overflow-auto bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center min-h-full">
              {isPlaceholder ? (
                <div className="flex flex-col items-center gap-4 text-gray-500">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-sm">Image Preview</span>
                  </div>
                  <p className="text-center">
                    File: {src.replace('placeholder-', '')}<br/>
                    <span className="text-xs">Gambar belum ter-upload dengan benar</span>
                  </p>
                </div>
              ) : (
                <img
                  src={src}
                  alt={alt}
                  className="max-w-none transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'center'
                  }}
                />
              )}
            </div>
          </div>
          
          {/* Footer with shortcuts */}
          <div className="flex-shrink-0 text-xs text-muted-foreground border-t pt-2">
            <p>Shortcut: Scroll untuk zoom, Klik dan drag untuk pan</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ImageZoom;
