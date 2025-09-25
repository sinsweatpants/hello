import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlignLeft, Undo, Redo, Upload } from "lucide-react";
import { parseAndFormat } from "@/lib/screenplay-parser";
import { useToast } from "@/hooks/use-toast";
import mammoth from 'mammoth/mammoth.browser';

interface ScreenplayEditorProps {
  content: string;
  onContentChange: (content: string) => void;
}

export default function ScreenplayEditor({ content, onContentChange }: ScreenplayEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const { toast } = useToast();

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      // Extract text content with proper line breaks
      const newContent = extractTextFromDiv(editorRef.current);
      onContentChange(newContent);

      // Add to undo stack
      setUndoStack(prev => [...prev.slice(-19), newContent]);
      setRedoStack([]);

      // Apply real-time formatting with debounce
      setTimeout(() => {
        if (editorRef.current) {
          const textToFormat = extractTextFromDiv(editorRef.current);
          console.log('Text to format:', JSON.stringify(textToFormat));
          const formatted = parseAndFormat(textToFormat);
          console.log('Formatted HTML:', formatted);

          if (editorRef.current.innerHTML !== formatted) {
            // Save cursor position
            const selection = window.getSelection();
            const range = selection?.getRangeAt(0);
            const startOffset = range?.startOffset || 0;

            editorRef.current.innerHTML = formatted;

            // Try to restore cursor position
            try {
              if (selection && editorRef.current.lastChild) {
                const newRange = document.createRange();
                const lastNode = editorRef.current.lastChild;
                newRange.setStartAfter(lastNode);
                newRange.setEndAfter(lastNode);
                selection.removeAllRanges();
                selection.addRange(newRange);
              }
            } catch (e) {
              // Ignore cursor positioning errors
            }
          }
        }
      }, 500);
    }
  }, [onContentChange]);

  // Helper function to extract text with proper line breaks
  const extractTextFromDiv = (div: HTMLDivElement): string => {
    const extractTextRecursively = (node: Node): string => {
      let text = '';

      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        // Block elements should create new lines
        const isBlockElement = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName);

        if (tagName === 'br') {
          return '\n';
        }

        // For block elements, add newline before content if needed
        if (isBlockElement && text && !text.endsWith('\n')) {
          text += '\n';
        }

        // Process child nodes
        for (const child of Array.from(node.childNodes)) {
          text += extractTextRecursively(child);
        }

        // For block elements, add newline after content
        if (isBlockElement && !text.endsWith('\n')) {
          text += '\n';
        }
      }

      return text;
    };

    let result = '';
    for (const child of Array.from(div.childNodes)) {
      result += extractTextRecursively(child);
    }

    // Clean up extra newlines but preserve intentional line breaks
    return result.replace(/\n{3,}/g, '\n\n').trim();
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const formatted = parseAndFormat(text);

    if (editorRef.current) {
      // Clear existing content and insert formatted content
      editorRef.current.innerHTML = formatted;
      onContentChange(text);

      toast({
        title: "تم اللصق",
        description: "تم تنسيق النص تلقائياً",
      });
    }
  }, [onContentChange, toast]);

  const handleUndo = () => {
    if (undoStack.length > 1) {
      const current = undoStack[undoStack.length - 1];
      const previous = undoStack[undoStack.length - 2];

      setRedoStack(prev => [...prev, current]);
      setUndoStack(prev => prev.slice(0, -1));

      if (editorRef.current) {
        const formatted = parseAndFormat(previous);
        editorRef.current.innerHTML = formatted;
        onContentChange(previous);
      }
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const next = redoStack[redoStack.length - 1];

      setUndoStack(prev => [...prev, next]);
      setRedoStack(prev => prev.slice(0, -1));

      if (editorRef.current) {
        const formatted = parseAndFormat(next);
        editorRef.current.innerHTML = formatted;
        onContentChange(next);
      }
    }
  };

  const handleFormat = () => {
    if (editorRef.current) {
      const text = editorRef.current.textContent || "";
      const formatted = parseAndFormat(text);
      editorRef.current.innerHTML = formatted;

      toast({
        title: "تم التنسيق",
        description: "تم إعادة تنسيق النص بنجاح",
      });
    }
  };

  // Real-time formatting with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editorRef.current && content) {
        const formatted = parseAndFormat(content);
        if (editorRef.current.innerHTML !== formatted) {
          editorRef.current.innerHTML = formatted;
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content]);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    try {
      let textContent = '';
      if (fileExtension === 'txt') {
        textContent = await file.text();
      } else if (fileExtension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        textContent = result.value;
      } else {
        toast({
          title: "خطأ في نوع الملف",
          description: "الرجاء رفع ملف .txt أو .docx فقط.",
          variant: "destructive",
        });
        return;
      }

      const formatted = parseAndFormat(textContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = formatted;
        onContentChange(textContent);
        toast({
          title: "تم تحميل الملف بنجاح",
          description: `تم تحميل وتنسيق ${file.name} تلقائياً.`,
        });
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "خطأ في معالجة الملف",
        description: "حدث خطأ أثناء قراءة الملف أو تنسيقه.",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="toolbar flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="ghost" size="sm" onClick={handleFormat} data-testid="button-format">
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleUndo} disabled={undoStack.length <= 1} data-testid="button-undo">
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRedo} disabled={redoStack.length === 0} data-testid="button-redo">
            <Redo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="button-upload">
            <Upload className="w-4 h-4" />
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".txt,.docx" style={{ display: 'none' }} />
        </div>
        <div className="text-sm text-muted-foreground">
          تنسيق تلقائي مُفعَّل
        </div>
      </div>

      {/* File Drop Zone & Editor */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`editor-container screenplay-container ${isDragging ? 'drag-over' : ''}`}
        data-testid="editor-drop-zone"
      >
        <div
          ref={editorRef}
          contentEditable="true"
          onInput={handleInput}
          onPaste={handlePaste}
          data-testid="editor-main"
          suppressContentEditableWarning={true}
          dangerouslySetInnerHTML={{ __html: parseAndFormat(``) }} // Start empty
        />
        {isDragging && (
          <div className="file-drop-zone-overlay">
            <Upload className="w-12 h-12 text-primary" />
            <p>أفلت الملف هنا (.txt, .docx)</p>
          </div>
        )}
      </div>
    </>
  );
}