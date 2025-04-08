const ConfusionMatrix = ({ matrix }: { matrix: number[][] }) => {
  const maxValue = Math.max(...matrix.flat());

  return (
    <div className="overflow-x-auto">
      <div className="mb-2 text-center text-gray-600">
        Actual (rows) vs Predicted (columns)
      </div>
      <div className="flex">
        {/* Y-axis labels */}
        <div className="flex flex-col mr-2">
          <div className="h-12 flex items-center justify-center font-semibold">
            Actual
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-12 w-12 flex items-center justify-center font-medium text-lg"
            >
              {i}
            </div>
          ))}
        </div>

        <div>
          {/* X-axis labels */}
          <div className="flex h-12">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-12 flex items-center justify-center font-medium text-lg"
              >
                {i}
              </div>
            ))}
          </div>

          {/* Matrix cells */}
          {matrix.map((row, i) => (
            <div key={i} className="flex">
              {row.map((value, j) => {
                const intensity = value / maxValue;
                const bgColor = `rgba(79, 70, 229, ${intensity.toFixed(2)})`;
                return (
                  <div
                    key={j}
                    className="w-12 h-12 flex items-center justify-center text-lg border border-gray-200"
                    style={{
                      backgroundColor: bgColor,
                      color: intensity > 0.5 ? "white" : "black",
                    }}
                  >
                    {value}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-center text-gray-600">Predicted (columns)</div>
    </div>
  );
};

export default ConfusionMatrix;
