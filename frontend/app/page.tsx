"use client";

import PredictionItem from "@/components/prediction-item";
import { PredictionData } from "@/components/types";
import { db } from "@/lib/firebase";
import { collection, orderBy, query } from "firebase/firestore";
import type React from "react";

import { useEffect, useRef, useState } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { toast } from "sonner";

export default function DrawingCanvas() {
  const [values, loading] = useCollectionData<PredictionData>(
    // @ts-expect-error bal bla bal
    query(collection(db, "predictions"), orderBy("timestamp", "desc")),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  // const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to exactly 28x28 pixels
    canvas.width = 28;
    canvas.height = 28;

    // Reset canvas with white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set line width appropriate for small canvas
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
  }, []);

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(false);

    // Get position and scale to 28x28
    let x, y;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = e.nativeEvent.offsetX * scaleX;
      y = e.nativeEvent.offsetY * scaleY;
    }

    // Start new path
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get position and scale to 28x28
    let x, y;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = e.nativeEvent.offsetX * scaleX;
      y = e.nativeEvent.offsetY * scaleY;
    }

    // Draw line
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const endDrawing = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (hasDrawn) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Get base64 data
      const base64Data = canvas.toDataURL("image/png");

      // Log the base64 data
      console.log(base64Data);
      // setLogs((prev) => [...prev, base64Data.substring(0, 50) + "..."])

      // Get pixel data
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixelData = imageData.data;

        // Convert RGBA to grayscale values (0-255)
        const grayscaleValues = [];
        for (let i = 0; i < pixelData.length; i += 4) {
          // For grayscale, we can use any channel (R, G, or B) as they should be the same
          // Or use the standard grayscale formula: 0.299*R + 0.587*G + 0.114*B
          // Since we're drawing in black on white, we'll invert the values so 0 is white and 255 is black
          const r = pixelData[i];
          const g = pixelData[i + 1];
          const b = pixelData[i + 2];

          // Standard grayscale conversion
          const grayscale = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

          // Invert so 0 is white and 255 is black (common for ML datasets like MNIST)
          const invertedValue = 255 - grayscale;

          grayscaleValues.push(invertedValue);
        }

        // Log the array of 784 values (28x28)
        console.log("Pixel data (0-255, 784 values):", grayscaleValues);
        console.log("Array length:", grayscaleValues.length);
        console.log("process.env.API_URL:", process.env.NEXT_PUBLIC_API_URL);

        toast.promise(
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/predict`, {
            method: "POST",
            body: JSON.stringify({ data: grayscaleValues }),
            headers: {
              "Content-Type": "application/json",
            },
          }),
          {
            loading: "Loading...",
            success: async (data) => {
              const predictedLabel = (await data.json()).predicted_label;
              // setLogs((prev) => ["Prediction: " + predictedLabel, ...prev]);
              return `Guessed ${predictedLabel}!`;
            },
            error: (err) => {
              console.error("Error:", err);
              return `Error sending data.`;
            },
          }
        );
      }

      // Reset canvas
      const ctxReset = canvasRef.current?.getContext("2d");
      if (ctxReset) {
        ctxReset.fillStyle = "white";
        ctxReset.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  // Handle touch events
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    startDrawing(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    draw(e);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    endDrawing();
  };

  return (
    <div className="flex flex-col items-center p-4 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">
        Neural Network - MNIST Dataset
      </h1>
      <p className="mb-4 text-center text-gray-600">
        Draw a number (0-9) using single stroke on the canvas.
        <br />
        This will predict the value using a neural network model trained on
        MNIST dataset.
      </p>

      <div className="w-full max-w-2xl mb-4 flex flex-col items-center">
        <canvas
          ref={canvasRef}
          className="border-2 border-gray-300 rounded-md w-[280px] h-[280px] touch-none"
          style={{ imageRendering: "pixelated" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        <p className="mt-2 text-sm text-gray-500">
          Canvas size: 28×28 pixels (displayed at 10× scale)
        </p>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Prediction Results</h2>
          <div className="space-y-6">
            {values?.map((item, index) => (
              <PredictionItem key={index} data={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
