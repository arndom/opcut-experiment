enum Cut {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
}

class Panel {
  constructor(public id: string, public width: number, public height: number) {}
}

class Item {
  constructor(public id: string, public width: number, public height: number, public canRotate: boolean) {}
}

class Params {
  constructor(public cutWidth: number, public minInitialUsage: boolean, public panels: Panel[], public items: Item[]) {}
}

class Used {
  constructor(public panel: Panel, public item: Item, public x: number, public y: number, public rotate: boolean) {}
}

class Unused {
  constructor(public panel: Panel, public width: number, public height: number, public x: number, public y: number) {}
}

class Result {
  constructor(public params: Params, public used: Used[], public unused: Unused[], public cuts: Cut[] | null) {}
}

class UnresolvableError extends Error {
  constructor() {
      super("The result is not solvable");
  }
}

const fitnessK = 0.03;

export default function calculate(method: 'greedy' | 'forward_greedy', params: Params): Result {
  if (method === 'greedy') {
      return calculateGreedy(createInitialResult(params));
  }

  if (method === 'forward_greedy') {
      return calculateForwardGreedy(createInitialResult(params));
  }

  throw new Error('unsupported method');
}

function createInitialResult(params: Params): Result {
  return new Result(
      params,
      [],
      params.panels.map(panel => new Unused(panel, panel.width, panel.height, 0, 0)),
      []
  );
}

function calculateGreedy(result: Result): Result {
  while (!isDone(result)) {
      let newResult: Result | null = null;
      let newFitness: number | null = null;

      for (const nextResult of getNextResults(result)) {
          const nextResultFitness = fitness(nextResult);
          if (newFitness === null || nextResultFitness < newFitness) {
              newResult = nextResult;
              newFitness = nextResultFitness;
          }
      }

      if (!newResult) {
          throw new UnresolvableError();
      }
      result = newResult;
  }
  return result;
}

function calculateForwardGreedy(result: Result): Result {
  while (!isDone(result)) {
      let newResult: Result | null = null;
      let newFitness: number | null = null;

      for (const nextResult of getNextResults(result)) {
          try {
              const nextResultFitness = fitness(calculateGreedy(nextResult));
              if (newFitness === null || nextResultFitness < newFitness) {
                  newResult = nextResult;
                  newFitness = nextResultFitness;
              }
          } catch (error) {
              if (error instanceof UnresolvableError) {
                  continue;
              }
              throw error; // rethrow if it's a different error
          }
      }

      if (!newResult) {
          throw new UnresolvableError();
      }

      result = newResult;
  }
  return result;
}


function getNextResults(result: Result): Result[] {
  let selectedItem: Item | null = null;
  const usedItems = new Set(result.used.map(used => used.item.id));

  for (const item of result.params.items) {
      if (usedItems.has(item.id)) {
          continue;
      }
      if (!selectedItem || Math.max(item.width, item.height) > Math.max(selectedItem.width, selectedItem.height)) {
          selectedItem = item;
      }
  }

  if (!selectedItem) {
      throw new Error('result is done');
  }

  return getNextResultsForItem(result, selectedItem);
}

function getNextResultsForItem(result: Result, item: Item): Result[] {
  const ret: Result[] = [];
  const loopIter: [boolean, number, Unused][] = [];

  // First loop over unused items without rotation
  result.unused.forEach((unused, index) => {
      loopIter.push([false, index, unused]);
  });

  // If the item can rotate, add the rotated items as well
  if (item.canRotate) {
      result.unused.forEach((unused, index) => {
          loopIter.push([true, index, unused]);
      });
  }

  for (const [rotate, index, unused] of loopIter) {
      for (const vertical of [true, false]) {
          const [newUsed, newUnused] = cutItemFromUnused(unused, item, rotate, result.params.cutWidth, vertical);
          if (!newUsed) {
              continue; // Skip if no new used item was created
          }
          const cut = vertical ? Cut.VERTICAL : Cut.HORIZONTAL;
          ret.push({
              ...result,
              used: [...result.used, newUsed],
              unused: [
                  ...result.unused.slice(0, index),
                  ...newUnused,
                  ...result.unused.slice(index + 1)
              ],
              cuts: [...(result.cuts || []), cut]
          });
      }
  }

  return ret;
}


function cutItemFromUnused(unused: Unused, item: Item, rotate: boolean, cutWidth: number, vertical: boolean): [Used | null, Unused[]] {
  const itemWidth = rotate ? item.height : item.width;
  const itemHeight = rotate ? item.width : item.height;

  if (unused.height < itemHeight || unused.width < itemWidth) {
      return [null, []];
  }

  const used = new Used(unused.panel, item, unused.x, unused.y, rotate);
  const newUnused: Unused[] = [];

  let width = unused.width - itemWidth - cutWidth;
  let height = unused.height;

  if (vertical) {
      if (height > 0) {
          newUnused.push(new Unused(unused.panel, width, height, unused.x + itemWidth + cutWidth, unused.y));
      }
  } else {
      height -= itemHeight + cutWidth;
      if (height > 0) {
          newUnused.push(new Unused(unused.panel, itemWidth, height, unused.x, unused.y + itemHeight + cutWidth));
      }
  }

  return [used, newUnused];
}

function isDone(result: Result): boolean {
  return result.params.items.length === result.used.length;
}

function fitness(result: Result): number {
  const totalArea = result.params.panels.reduce((sum, panel) => sum + panel.width * panel.height, 0);
  let fitness = 0;

  for (const panel of result.params.panels) {
      const usedAreas = result.used
          .filter(used => used.panel === panel)
          .map(used => used.item.width * used.item.height);

      const unusedAreas = result.unused
          .filter(unused => unused.panel === panel)
          .map(unused => unused.width * unused.height);

      fitness += (panel.width * panel.height - usedAreas.reduce((sum, area) => sum + area, 0)) / totalArea;
      fitness -= (fitnessK * Math.min(...usedAreas, 0) * Math.max(...unusedAreas, 0)) / (totalArea * totalArea);
  }

  if (!result.params.minInitialUsage) {
      return fitness;
  }

  const unusedInitialCount = result.unused.filter(unused => isUnusedInitial(unused)).length;
  return (-unusedInitialCount) + fitness;
}

function isUnusedInitial(unused: Unused): boolean {
  return (unused.x === 0 && unused.y === 0 && unused.width === unused.panel.width && unused.height === unused.panel.height);
}
