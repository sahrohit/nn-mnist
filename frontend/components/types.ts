import { Timestamp } from "firebase/firestore";

export type PredictionData = {
  id: string;
  input_data?: number[];
  predicted_label?: number;
  actual_label?: number;
  timestamp?: Timestamp;
};
