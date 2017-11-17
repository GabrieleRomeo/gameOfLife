// eslint-disable-next-line no-restricted-globals
self.addEventListener('message', event => {
  const { matrix, cols, rows } = event.data.buffer;
  const nextMatrix = new Float32Array(matrix.length);
  const newPixels = [];

  for (let x = 1; x < cols - 1; x += 1) {
    for (let y = 1; y < rows - 1; y += 1) {
      const coords = x + y * cols;
      const cell = matrix[coords];

      //
      //   ************** Game Of life Matrix **************
      //
      // |----------------|---------------|----------------|
      // | [1]  (x-1,y-1) | [2]  (x,y-1)  | [3] (x+1,y-1)  |
      // |----------------|---------------|----------------|
      // | [4]  (x-1,y)   |  cell  (x,y)  |  [5] (x+1,y)   |
      // |----------------|---------------|----------------|
      // | [6] (x-1,y+1)  | [7] (x,y+1)   |  [8] (x+1,y+1) |
      // |----------------|---------------|----------------|
      //

      const xPlusOne = x + 1;
      const xMinusOne = x - 1;
      const yPlusOne = (y + 1) * cols;
      const yMinusOne = (y - 1) * cols;
      const cell1 = matrix[xMinusOne + yMinusOne] || 0;
      const cell2 = matrix[x + yMinusOne] || 0;
      const cell3 = matrix[xPlusOne + yMinusOne] || 0;
      const cell4 = matrix[xMinusOne + y * cols] || 0;
      const cell5 = matrix[xPlusOne + y * cols] || 0;
      const cell6 = matrix[xMinusOne + yPlusOne] || 0;
      const cell7 = matrix[x + yPlusOne] || 0;
      const cell8 = matrix[xPlusOne + yPlusOne] || 0;

      const neighbors =
        cell1 + cell2 + cell3 + cell4 + cell5 + cell6 + cell7 + cell8;

      /*
         * The rules of life
         */
      if (cell === 1 && neighbors < 2) {
        // ** Loneliness **
        // If the cell has one or fewer alive neighbors, it dies.
        nextMatrix[coords] = 0;
      } else if (cell === 1 && neighbors > 3) {
        // ** Overpopulation **
        // If the cell has four or more alive neighbors, it dies.
        nextMatrix[coords] = 0;
      } else if (cell === 0 && neighbors === 3) {
        // ** Birth **
        // If a cell is dead (state = 0) it will come to life
        // (state = 1) if it has exactly three alive neighbors.
        nextMatrix[coords] = 1;
        newPixels.push({ x, y });
      } else {
        /*
         * ***************************** Stasis *******************************
         * Staying Alive:
         *    If a cell is alive and has exactly two or three live neighbors
         * Staying Dead:
         *    If a cell is dead and has anything other than three live neighbors
         */
        nextMatrix[coords] = cell;
        if (cell === 1) {
          newPixels.push({ x, y });
        }
      }
    }
  }

  // eslint-disable-next-line no-restricted-globals
  self.postMessage({
    matrix: nextMatrix,
    pixels: newPixels,
    cols,
    rows,
  });
});
