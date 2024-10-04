import { howToCutBoards1D, howToCutBoards2D, RequiredCuts2D, ResultCuts2D, StockSize2D } from "stock-cutting";
import * as util from "util";
import calculateNative from "./opcut/calculate-native.js";
import calculate from "./opcut/calculate";

/**
 * @description Taking the generated native module;`libopcut.dll` or `libopcut.so` and attempting to run via node.js.
 * Based of the native methods of generated from `opcut.c` found in https://github.com/bozokopic/opcut
 */
const testNativeOpcut = () => {
  const params = {
    cut_width: 0.3,
    min_initial_usage: true,
    panels: {
      Panel1: {
        width: 100,
        height: 100,
      },
    },
    items: {
      Item1: {
        width: 10,
        height: 10,
        can_rotate: true,
      },
    },
  };

  const method = "forward_greedy_native";

  console.log("testNativeOpcut Cutting results: ")
  calculateNative(method, params);
};

const testOpcut = () => {
  const params = {
    cutWidth: 0.3,
    minInitialUsage: true,
    panels: [
      {
        id: "0",
        width: 100,
        height: 100,
      },
    ],
    items: [
      {
        id: "0",
        width: 10,
        height: 10,
        canRotate: true,
      },
    ],
  };

  const method = "forward_greedy";

  console.log("testOpcut Cutting results: ")
  calculate(method, params);
};

function print(obj: any) {
  console.log(util.inspect(obj, false, null, true));
}

/**
 * @description Alternative solution
 * Assumes the board is square; hence 1D
 * Needs testing and a way to compare with opcut
 */
const test1DCutting = () => {
  const bladeSize = 0.3;

  const stockSizes = [{ size: 100, cost: 1 }];
  const requiredCuts = [{ size: 10, count: 1 }];

  const output = howToCutBoards1D({
    stockSizes: stockSizes,
    bladeSize: bladeSize,
    requiredCuts: requiredCuts,
  });

  console.log("test1DCutting Cutting results: ")
  print({ stockSizes, requiredCuts, output });
};

/**
 * @description Alternative solution
 * 2D - W x H
 * Needs testing and a way to compare with opcut
 * Fails to return anything - very weird
 */
const test2DCutting = () => {
  const params = {
    cut_width: 0.3,
    min_initial_usage: true,
    panels: [{ size: [100, 100], cost: 1 }] as StockSize2D[],
    items: [{ size: [10, 10], count: 1 }] as RequiredCuts2D,
  };

  const result = howToCutBoards2D({
    stockSizes: params.panels,
    bladeSize: params.cut_width,
    requiredCuts: params.items,
  });

  console.log("test2DCutting Cutting results:", result);
}

// testNativeOpcut();
// testOpcut();
test1DCutting();
test2DCutting();