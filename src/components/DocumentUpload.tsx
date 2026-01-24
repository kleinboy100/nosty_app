import { useState, useRef } from 'react';
import { Upload, X, FileText, Camera, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  label: string;
  description?: string;
  accept?: string;
  onChange: (file: File | null) => void;
  value: File | null;
  icon?: 'document' | 'camera' | 'image';
  required?: boolean;
}

export function DocumentUpload({
  label,
  description,
  accept = 'image/*,.pdf',
  onChange,
  value,
  icon = 'document',
  required = false
}: DocumentUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const IconComponent = icon === 'camera' ? Camera : icon === 'image' ? ImageIcon : FileText;

  const handleFileChange = (file: File | null) => {
    onChange(file);
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    handleFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all",
          dragActive ? "border-primary bg-primary/5" : "border-border",
          value ? "p-2" : "p-6"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {value ? (
          <div className="flex items-center gap-3">
            {preview ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="text-muted-foreground" size={24} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{value.name}</p>
              <p className="text-xs text-muted-foreground">
                {(value.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="flex-shrink-0"
            >
              <X size={18} />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <IconComponent className="text-muted-foreground" size={24} />
            </div>
            <p className="font-medium text-foreground mb-1">
              {icon === 'camera' ? 'Take or upload a selfie' : 'Drop your file here'}
            </p>
            <p className="text-sm text-muted-foreground">
              or <span className="text-primary">browse</span> to upload
            </p>
          </div>
        )}
      </div>
    </div>
  );
}