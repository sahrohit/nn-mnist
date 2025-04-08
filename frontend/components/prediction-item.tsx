import { useEffect, useRef } from "react";
import { PredictionData } from "./types";
import { OPTIONS } from "@/lib/options";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { X } from "lucide-react";

const PredictionItem = ({ data }: { data: PredictionData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create ImageData from the pixel values
    const imageData = ctx.createImageData(28, 28);
    for (let i = 0; i < (data?.input_data?.length ?? 0); i++) {
      const value = data?.input_data?.[i] ?? 0; // Default to 0 if undefined
      // Set RGBA values (grayscale)
      imageData.data[i * 4] = value; // R
      imageData.data[i * 4 + 1] = value; // G
      imageData.data[i * 4 + 2] = value; // B
      imageData.data[i * 4 + 3] = 255; // A (fully opaque)
    }

    // Put the image data on the canvas
    ctx.putImageData(imageData, 0, 0);
  }, [data?.input_data]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex">
      <div className="mr-6">
        <canvas
          ref={canvasRef}
          width={28}
          height={28}
          className="border border-gray-300 w-28 h-28"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-xl font-bold">
          Predicted:{" "}
          <span className="text-indigo-600">{data?.predicted_label}</span>
        </div>
        <div className="text-gray-600">
          {/* {dayjs(data.timestamp.toDate()).format("MMMM DD YYYY")} */}
        </div>
        <div className="text-sm text-gray-500">
          Please select the correct label for the prediction. (Used to update
          the confusion matrix)
        </div>
        <div className="flex gap-2 flex-wrap">
          {OPTIONS.map((o) => (
            <Button
              className="cursor-pointer"
              variant={data?.actual_label === o ? "default" : "outline"}
              size="sm"
              key={o}
              onClick={() => {
                toast.promise(
                  updateDoc(doc(db, "predictions", data.id), {
                    actual_label: o,
                  }),
                  {
                    loading: "Updating...",
                    success: "Updated successfully!",
                    error: (err) => {
                      console.error("Error:", err);
                      return "Error updating.";
                    },
                  }
                );
              }}
            >
              {o}
            </Button>
          ))}
          <Button
            className="cursor-pointer"
            size="sm"
            variant="destructive"
            onDoubleClick={() => {
              toast.promise(deleteDoc(doc(db, "predictions", data.id)), {
                loading: "Deleting...",
                success: "Deleted successfully!",
                error: (err) => {
                  console.error("Error:", err);
                  return "Error deleting.";
                },
              });
            }}
          >
            <X className="text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PredictionItem;
