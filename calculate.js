import os from "os";
import ffi from "ffi-rs";
import ref from "ref-napi";

import {
  OPCUT_SUCCESS,
  OPCUT_ERROR,
  OPCUT_UNSOLVABLE,
  OPCUT_METHOD_GREEDY,
  OPCUT_METHOD_FORWARD_GREEDY,
  opcutPanelT,
  opcutItemT,
  opcutParamsT,
  opcutUsedT,
  opcutUnusedT,
  voidPtr,
} from "./constants.js";

const platform = os.platform();

const dynamicLib =
  platform === "win32" ? "./output/libopcut.dll" : "./output/libopcut.so";

ffi.open({
  library: "libopcut",
  path: dynamicLib,
});

const lib = ffi.define({
  opcut_allocator_create: {
    library: "libopcut",
    paramsType: [voidPtr, [voidPtr, voidPtr]],
    retType: ffi.PointerType.CPointer
  },
  opcut_allocator_destroy: {
    library: "libopcut",
    paramsType: ["void", [voidPtr]],
    retType: ffi.DataType.Void
  },
  opcut_calculate: {
    library: "libopcut",
    paramsType: [
      "int",
      [
        voidPtr,
        "int",
        // opcutParamsT.ref(),
        ref.refType(opcutParamsT),
        ref.refType(opcutUsedT),
        ref.refType(opcutUnusedT),
      ],
    ],
    retType: ffi.DataType.BigInt
  },
});

function encodeParams(params) {
  const panels = new Array(params.panels.length);
  for (let i = 0; i < params.panels.length; i++) {
    panels[i] = new opcutPanelT({
      width: params.panels[i].width,
      height: params.panels[i].height,
      area: params.panels[i].width * params.panels[i].height,
    });
  }

  const items = new Array(params.items.length);
  for (let i = 0; i < params.items.length; i++) {
    items[i] = new opcutItemT({
      width: params.items[i].width,
      height: params.items[i].height,
      can_rotate: params.items[i].can_rotate,
      area: params.items[i].width * params.items[i].height,
    });
  }

  return new opcutParamsT({
    cut_width: params.cut_width,
    min_initial_usage: params.min_initial_usage,
    panels: ref.allocArray(opcutPanelT, panels),
    panels_len: panels.length,
    items: ref.allocArray(opcutItemT, items),
    items_len: items.length,
    panels_area: params.panels.reduce((acc, p) => acc + p.width * p.height, 0),
  });
}

// Decode functions will need to traverse linked lists
function decodeUsed(params, used) {
  const result = [];
  let current = used.deref();
  while (current) {
    result.push({
      panel: params.panels[current.panel_id],
      item: params.items[current.item_id],
      x: current.x,
      y: current.y,
      rotate: current.rotate,
    });
    current = current.next.deref();
  }
  return result;
}

function decodeUnused(params, unused) {
  const result = [];
  let current = unused.deref();
  while (current) {
    result.push({
      panel: params.panels[current.panel_id],
      width: current.width,
      height: current.height,
      x: current.x,
      y: current.y,
    });
    current = current.next.deref();
  }
  return result;
}

function encodeMethod(method) {
  if (method === "greedy_native") return OPCUT_METHOD_GREEDY;
  if (method === "forward_greedy_native") return OPCUT_METHOD_FORWARD_GREEDY;

  throw new Error("unsupported method");
}

export default function calculate(method, params) {
  const allocator = lib.opcut_allocator_create([ref.NULL, [ref.NULL, ref.NULL]]);
  if (allocator.isNull()) {
    throw new Error("Allocation error");
  }

  try {
    const native_method = encodeMethod(method);
    const encodedParams = encodeParams(params);
    const used = ref.alloc(opcutUsedT.pointer);
    const unused = ref.alloc(opcutUnusedT.pointer);

    console.log("Allocator: ", allocator);
    console.log("Method: ", native_method);
    console.log("Params: ", encodedParams);
    console.log("Used: ", used);
    console.log("Unused: ", unused);

    const result = lib.opcut_calculate(
      allocator,
      native_method,
      encodedParams,
      used,
      unused
    );


    if (result === OPCUT_UNSOLVABLE) {
      throw new Error("Unresolvable error");
    }

    if (result !== OPCUT_SUCCESS) {
      throw new Error("Calculation error");
    }

    return {
      used: decodeUsed(params, used),
      unused: decodeUnused(params, unused),
    };
  } finally {
    lib.opcut_allocator_destroy(allocator);
  }
}