import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, PenLine, Type } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SignaturePadProps {
  value: string; // base64 data URL
  onChange: (value: string) => void;
  name?: string; // nom pour auto-generation et memoire
}

export function SignaturePad({ value, onChange, name }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<"draw" | "auto">(value ? "draw" : "auto");
  const lastLoadedName = useRef<string>("");

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Load existing signature into canvas
  useEffect(() => {
    if (!value || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      clearCanvas();
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = value;
  }, [value, clearCanvas]);

  // Auto-load saved signature when name changes
  useEffect(() => {
    const trimmed = name?.trim();
    if (!trimmed || trimmed.length < 2) return;
    if (trimmed === lastLoadedName.current) return;
    lastLoadedName.current = trimmed;

    const encoded = encodeURIComponent(trimmed);
    fetch(`/api/signatures/${encoded}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((sig) => {
        if (sig?.data) {
          onChange(sig.data);
          setMode("draw"); // show as manual since it's a loaded signature
        }
      })
      .catch(() => {}); // ignore errors silently
  }, [name, onChange]);

  // Save signature when it changes (debounced via stopDrawing / auto)
  const saveSignature = useCallback(
    (sigData: string) => {
      const trimmed = name?.trim();
      if (!trimmed || !sigData) return;
      const encoded = encodeURIComponent(trimmed);
      apiRequest("PUT", `/api/signatures/${encoded}`, { data: sigData }).catch(() => {});
    },
    [name],
  );

  const generateFromName = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !name) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    clearCanvas();

    ctx.font = "italic 32px 'Georgia', 'Times New Roman', serif";
    ctx.fillStyle = "#1a1a6e";
    ctx.textBaseline = "middle";

    const text = name;
    const x = 20;
    const y = canvas.height / 2;
    ctx.fillText(text, x, y);

    // underline
    const metrics = ctx.measureText(text);
    ctx.beginPath();
    ctx.strokeStyle = "#1a1a6e";
    ctx.lineWidth = 1;
    ctx.moveTo(x, y + 18);
    ctx.lineTo(x + metrics.width, y + 18);
    ctx.stroke();

    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
    saveSignature(dataUrl);
  }, [name, onChange, clearCanvas, saveSignature]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a6e";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      onChange(dataUrl);
      saveSignature(dataUrl);
    }
  };

  const handleClear = () => {
    clearCanvas();
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "draw" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("draw"); handleClear(); }}
        >
          <PenLine className="h-3 w-3 mr-1" />
          Dessiner
        </Button>
        <Button
          type="button"
          variant={mode === "auto" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("auto"); generateFromName(); }}
          disabled={!name}
        >
          <Type className="h-3 w-3 mr-1" />
          Auto
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
        >
          <Eraser className="h-3 w-3 mr-1" />
          Effacer
        </Button>
      </div>
      <div className="border rounded-lg bg-white overflow-hidden" style={{ touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={100}
          className="w-full cursor-crosshair"
          style={{ height: "80px" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
}
