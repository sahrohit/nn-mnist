"use client";

import ConfusionMatrix from "@/components/confusion";
import PredictionItem from "@/components/prediction-item";
import { PredictionData } from "@/components/types";
import { db } from "@/lib/firebase";
import { collection, orderBy, query } from "firebase/firestore";
import { useCollectionData } from "react-firebase-hooks/firestore";

export default function ResultsPage() {
  const [values, loading, error] = useCollectionData<PredictionData>(
    // @ts-expect-error bal bla bal
    query(collection(db, "predictions"), orderBy("timestamp", "desc")),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Confusion Matrix</h1>

      {/* Confusion Matrix Section */}
      <section className="mb-12">
        {/* <h2 className="text-2xl font-semibold mb-4">Confusion Matrix</h2> */}
        <div className="flex justify-center">
          <ConfusionMatrix
            matrix={Array.from({ length: 10 }, (_, i) =>
              Array.from(
                { length: 10 },
                (_, j) =>
                  values?.filter(
                    (item) =>
                      item.predicted_label === j && item.actual_label === i
                  ).length ?? 0
              )
            )}
          />
        </div>
      </section>

      {/* Images Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Prediction Results</h2>
        <div className="space-y-6">
          {values?.map((item, index) => (
            <PredictionItem key={index} data={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
