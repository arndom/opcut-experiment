import ref from "ref-napi";
import StructType from "ref-struct-napi";

const OPCUT_SUCCESS = 0;
const OPCUT_ERROR = 1;
const OPCUT_UNSOLVABLE = 42;
const OPCUT_METHOD_GREEDY = 0;
const OPCUT_METHOD_FORWARD_GREEDY = 1;


const size_t = ref.types.size_t;
const double = ref.types.double;
const bool = ref.types.bool;
const voidPtr = ref.types.void.pointer;

const opcutPanelT = StructType({
  width: double,
  height: double,
  area: double,
});

const opcutItemT = StructType({
  width: double,
  height: double,
  can_rotate: bool,
  area: double,
});

const opcutParamsT = StructType({
  cut_width: double,
  min_initial_usage: bool,
  // panels: opcutPanelT.pointer,
  panels: ref.refType(opcutPanelT),
  panels_len: size_t,
  // items: opcutItemT.pointer,
  items: ref.refType(opcutItemT),
  items_len: size_t,
  panels_area: double,
});

const opcutUsedT = StructType({
  panel_id: size_t,
  item_id: size_t,
  x: double,
  y: double,
  rotate: bool,
  // next: opcutUsedT.pointer
  next: ref.refType("void"), // Placeholder for linked list pointer
});

const opcutUnusedT = StructType({
  panel_id: size_t,
  width: double,
  height: double,
  x: double,
  y: double,
  // next: opcutUnusedT.pointer,
  next: ref.refType("void"), // Placeholder for linked list pointer
  area: double,
  initial: bool,
});

export {
  OPCUT_SUCCESS,
  OPCUT_ERROR,
  OPCUT_UNSOLVABLE,
  OPCUT_METHOD_GREEDY,
  OPCUT_METHOD_FORWARD_GREEDY,

  voidPtr,

  opcutPanelT,
  opcutItemT,
  opcutParamsT,
  opcutUsedT,
  opcutUnusedT
};
