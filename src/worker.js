const { parentPort, workerData } = require("node:worker_threads");
require("./multiformat")
  .formatEdits(workerData.source, workerData.options, workerData.range)
  .then(
    (edits) => parentPort.postMessage({ edits }),
    (error) => parentPort.postMessage({ error: error.message }),
  );
