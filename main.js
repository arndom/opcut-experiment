import calculate from "./calculate.js";

const test = () => {
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

  calculate(method, params);
};

test()