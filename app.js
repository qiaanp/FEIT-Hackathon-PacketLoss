const composer = document.querySelector("#composer");
const promptCard = document.querySelector("#promptCard");
const attachButton = document.querySelector("#attachButton");
const submitButton = document.querySelector("#submitButton");
const toast = document.querySelector("#toast");
const toastMessage = document.querySelector("#toastMessage");
const promptView = document.querySelector("#promptView");
const loadingView = document.querySelector("#loadingView");
const enterHint = document.querySelector("#enterHint");
const mindmapView = document.querySelector("#mindmapView");
const mindmapCanvas = document.querySelector("#mindmapCanvas");
const mindmapWorld = document.querySelector("#mindmapWorld");
const mindmapEdges = document.querySelector("#mindmapEdges");
const mindmapNodes = document.querySelector("#mindmapNodes");
const notesPanel = document.querySelector("#notesPanel");
const notesCloseButton = document.querySelector("#notesCloseButton");
const mapHomeButton = document.querySelector("#mapHomeButton");
const generateBranchesButton = document.querySelector("#generateBranchesButton");
const topicCount = document.querySelector("#topicCount");
const branchToggleButton = document.querySelector("#branchToggleButton");
const notesScore = document.querySelector("#notesScore");
const quizSection = document.querySelector("#quizSection");
const quizContent = document.querySelector("#quizContent");
const quizLength = document.querySelector("#quizLength");

const steps = [
  {
    prefix: "I want to learn ",
    suggestions: ["quantum mechanics", "the French Revolution", "calculus fundamentals", "human anatomy"],
  },
  {
    prefix: ". My goal for learning this topic is ",
    suggestions: ["an upcoming exam", "a university assignment", "personal interest", "a career change"],
  },
  {
    prefix: ". My current level is ",
    suggestions: ["beginner", "intermediate", "advanced"],
  },
  {
    prefix: ". I can commit ",
    suggestions: ["5", "2", "10"],
    timeStep: true,
  },
  {
    prefix: " for ",
    suggestions: ["3 months", "6 weeks", "one semester"],
  },
];

const state = {
  currentStep: 0,
  values: [],
  acceptedSuffixes: [],
  prefixVisible: steps.map(() => true),
  suggestionVisible: steps.map(() => true),
  suggestionIndexes: steps.map(() => 0),
  timeUnitIndex: 0,
  freeform: "",
  reviewText: "",
};

const timeUnits = ["week", "fortnight", "month"];
let toastTimer;
let isSubmitting = false;

function currentSuggestion() {
  const step = steps[state.currentStep];
  if (!step) return "";
  return step.suggestions[state.suggestionIndexes[state.currentStep] % step.suggestions.length];
}

function makeSpan(className, text) {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

function buildCompletedStep(index) {
  const step = steps[index];
  const fragment = document.createDocumentFragment();
  if (state.prefixVisible[index]) fragment.append(makeSpan("prompt-prefix", step.prefix));
  fragment.append(makeSpan("prompt-value", state.values[index] || ""));
  if (state.acceptedSuffixes[index]) {
    fragment.append(makeSpan("prompt-prefix", state.acceptedSuffixes[index]));
  }
  return fragment;
}

function buildReviewText() {
  return steps.map((step, index) => {
    const prefix = state.prefixVisible[index] ? step.prefix : "";
    return `${prefix}${state.values[index] || ""}${state.acceptedSuffixes[index] || ""}`;
  }).join("");
}

function getActiveText() {
  const active = composer.querySelector(".active-input");
  return active ? active.textContent.replace(/\u00a0/g, " ") : "";
}

function getTimeSuffix(value) {
  if (!/^\s*\d+(?:\.\d+)?\s*$/.test(value)) return "";
  const number = Number.parseFloat(value.trim());
  const hourWord = number === 1 ? " hour per " : " hours per ";
  return `${hourWord}${timeUnits[state.timeUnitIndex]}`;
}

function updateLiveSuggestion() {
  const active = composer.querySelector(".active-input");
  const suggestion = composer.querySelector(".prompt-suggestion");
  if (!active || !suggestion) return;

  const value = getActiveText();
  const step = steps[state.currentStep];
  if (!step) return;

  if (step.timeStep && value.trim()) {
    suggestion.textContent = getTimeSuffix(value);
    suggestion.classList.toggle("is-tabbed", Boolean(suggestion.textContent));
    return;
  }

  suggestion.textContent = value || !state.suggestionVisible[state.currentStep] ? "" : currentSuggestion();
  suggestion.classList.toggle("is-tabbed", !value && Boolean(suggestion.textContent));
}

function placeCaretAtEnd(element) {
  const range = document.createRange();
  const selection = window.getSelection();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function focusActive() {
  requestAnimationFrame(() => {
    const active = composer.querySelector(".active-input");
    if (!active) return;
    active.focus();
    placeCaretAtEnd(active);
  });
}

function renderComposer({ focus = true } = {}) {
  composer.replaceChildren();
  enterHint.textContent = state.currentStep >= steps.length ? "to build your map" : "to continue";

  const completedStepCount = state.currentStep < steps.length ? state.currentStep : 0;
  for (let index = 0; index < completedStepCount; index += 1) {
    composer.append(buildCompletedStep(index));
  }

  if (state.currentStep < steps.length) {
    const step = steps[state.currentStep];
    if (state.prefixVisible[state.currentStep]) {
      composer.append(makeSpan("prompt-prefix", step.prefix));
    }

    const active = makeSpan("active-input", "");
    active.contentEditable = "true";
    active.spellcheck = true;
    active.setAttribute("role", "textbox");
    active.setAttribute("aria-label", `Prompt response ${state.currentStep + 1} of ${steps.length}`);
    composer.append(active);

    const suggestion = makeSpan(
      "prompt-suggestion is-tabbed",
      state.suggestionVisible[state.currentStep] ? currentSuggestion() : "",
    );
    suggestion.classList.toggle("is-tabbed", state.suggestionVisible[state.currentStep]);
    suggestion.setAttribute("aria-hidden", "true");
    composer.append(suggestion);
  } else {
    const active = makeSpan("active-input review-input", state.reviewText || state.freeform);
    active.contentEditable = "true";
    active.spellcheck = true;
    active.setAttribute("role", "textbox");
    active.setAttribute("aria-label", "Prompt complete. Press Enter to build your study map, or add anything else first.");
    composer.append(active);
  }

  if (focus) focusActive();
}

function acceptCurrentStep() {
  if (state.currentStep >= steps.length) return;
  const isFinalStep = state.currentStep === steps.length - 1;
  const step = steps[state.currentStep];
  let value = getActiveText().trim();
  if (!value && state.suggestionVisible[state.currentStep]) value = currentSuggestion();

  state.values[state.currentStep] = value;
  if (step.timeStep) state.acceptedSuffixes[state.currentStep] = getTimeSuffix(value);
  if (isFinalStep) state.acceptedSuffixes[state.currentStep] = ".";
  state.currentStep += 1;
  if (isFinalStep) state.reviewText = buildReviewText();
  renderComposer();
}

function cycleSuggestion(direction) {
  const step = steps[state.currentStep];
  if (!step) return;
  const value = getActiveText();

  state.suggestionVisible[state.currentStep] = true;

  if (step.timeStep && value.trim()) {
    state.timeUnitIndex = (state.timeUnitIndex + direction + timeUnits.length) % timeUnits.length;
  } else {
    const count = step.suggestions.length;
    state.suggestionIndexes[state.currentStep] =
      (state.suggestionIndexes[state.currentStep] + direction + count) % count;
  }
  updateLiveSuggestion();
}

function removeSuggestionOrPrefix(event) {
  if (getActiveText().length > 0 || state.currentStep >= steps.length) return false;
  const suggestion = composer.querySelector(".prompt-suggestion");

  if (suggestion && suggestion.textContent) {
    state.suggestionVisible[state.currentStep] = false;
    suggestion.textContent = "";
    suggestion.classList.remove("is-tabbed");
    event.preventDefault();
    return true;
  }

  if (state.prefixVisible[state.currentStep]) {
    state.prefixVisible[state.currentStep] = false;
    renderComposer();
    event.preventDefault();
    return true;
  }
  return false;
}

composer.addEventListener("click", () => {
  const active = composer.querySelector(".active-input");
  if (active && document.activeElement !== active) focusActive();
});

composer.addEventListener("input", (event) => {
  if (!event.target.classList.contains("active-input")) return;
  if (state.currentStep >= steps.length) {
    state.reviewText = getActiveText();
    state.freeform = state.reviewText;
  }
  updateLiveSuggestion();
});

composer.addEventListener("keydown", (event) => {
  if (!event.target.classList.contains("active-input")) return;

  if (event.key === "Tab" && state.currentStep < steps.length) {
    event.preventDefault();
    if (!getActiveText().trim() && (!state.prefixVisible[state.currentStep] || !state.suggestionVisible[state.currentStep])) {
      state.prefixVisible[state.currentStep] = true;
      state.suggestionVisible[state.currentStep] = true;
      renderComposer();
      return;
    }
    cycleSuggestion(event.shiftKey ? -1 : 1);
    return;
  }

  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    if (state.currentStep >= steps.length) submitPrompt();
    else acceptCurrentStep();
    return;
  }

  if (event.key === "Backspace") removeSuggestionOrPrefix(event);
});

promptCard.addEventListener("click", (event) => {
  if (event.target.closest("button")) return;
  focusActive();
});

function showToast(message) {
  window.clearTimeout(toastTimer);
  toastMessage.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

attachButton.addEventListener("click", () => {
  showToast("Attachments are coming soon");
});

function submitPrompt() {
  if (isSubmitting) return;
  isSubmitting = true;
  promptView.classList.add("is-leaving");
  loadingView.classList.add("is-visible");
  loadingView.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    promptView.hidden = true;
  }, 460);
  window.setTimeout(showMindmap, 2600);
}

submitButton.addEventListener("click", submitPrompt);

document.querySelectorAll(".profile-menu button").forEach((button) => {
  button.addEventListener("click", () => {
    button.blur();
  });
});

renderComposer({ focus: false });

const mapTopics = [
  {
    id: "calculus", label: "University Calculus", parent: null, x: 800, y: 500, type: "root",
    summary: "A visual path through change, accumulation, limits, and infinite processes.",
    ideas: ["Limits describe local behaviour", "Derivatives measure instantaneous change", "Integrals accumulate continuous quantities", "Series represent functions with infinite sums"],
    formula: "Change ↔ accumulation",
    prompt: "Pick the branch that feels least familiar and explain its central idea in one sentence."
  },
  {
    id: "limits", label: "Limits", parent: "calculus", x: 480, y: 270, type: "branch",
    summary: "Understand what a function approaches near a point or at infinity.",
    ideas: ["Read limits graphically and algebraically", "Distinguish a limit from the function value", "Use limit laws to simplify expressions"],
    formula: "limₓ→a f(x) = L",
    prompt: "Can a limit exist when f(a) is undefined? Sketch an example."
  },
  {
    id: "continuity", label: "Continuity", parent: "limits", x: 225, y: 115, type: "leaf",
    summary: "Connect limits to functions without jumps, gaps, or breaks.",
    ideas: ["f(a) must be defined", "The limit at a must exist", "The limit must equal f(a)"],
    formula: "limₓ→a f(x) = f(a)",
    prompt: "Find where a piecewise function must be adjusted to become continuous."
  },
  {
    id: "lhopital", label: "L’Hôpital’s Rule", parent: "limits", x: 485, y: 70, type: "leaf",
    summary: "Resolve certain indeterminate limits using derivatives.",
    ideas: ["Confirm the form is 0/0 or ∞/∞", "Differentiate numerator and denominator separately", "Recheck the resulting limit"],
    formula: "lim f/g = lim f′/g′",
    prompt: "Evaluate limₓ→0 (eˣ − 1)/x and justify every step."
  },
  {
    id: "asymptotes", label: "Asymptotes", parent: "limits", x: 705, y: 155, type: "leaf",
    summary: "Use limits to describe long-run and near-discontinuity behaviour.",
    ideas: ["Vertical asymptotes come from infinite one-sided limits", "Horizontal asymptotes describe end behaviour", "A graph can cross a horizontal asymptote"],
    formula: "limₓ→∞ f(x) = L",
    prompt: "Identify every asymptote of a rational function before graphing it."
  },
  {
    id: "derivatives", label: "Derivatives", parent: "calculus", x: 1120, y: 260, type: "branch",
    summary: "Measure instantaneous rates of change and local slope.",
    ideas: ["A derivative is a limit of average rates", "Derivative signs reveal increasing and decreasing intervals", "Units are output units per input unit"],
    formula: "f′(x) = limₕ→0 [f(x+h)−f(x)]/h",
    prompt: "Explain what f′(3) means in the context of position over time."
  },
  {
    id: "rules", label: "Differentiation Rules", parent: "derivatives", x: 960, y: 75, type: "leaf",
    summary: "Differentiate complex expressions efficiently and accurately.",
    ideas: ["Power, product, and quotient rules", "Chain rule for nested functions", "Implicit differentiation for linked variables"],
    formula: "(f∘g)′ = f′(g(x))g′(x)",
    prompt: "Differentiate x²sin(3x) and label every rule you use."
  },
  {
    id: "applications", label: "Optimisation", parent: "derivatives", x: 1220, y: 80, type: "leaf",
    summary: "Turn real constraints into maxima, minima, and useful decisions.",
    ideas: ["Define the objective quantity", "Use constraints to reduce variables", "Test critical points and endpoints"],
    formula: "f′(c) = 0",
    prompt: "Design the largest-area rectangle possible with a fixed perimeter."
  },
  {
    id: "related-rates", label: "Related Rates", parent: "derivatives", x: 1425, y: 225, type: "leaf",
    summary: "Relate changing quantities through a shared equation.",
    ideas: ["Draw and label the situation", "Differentiate with respect to time", "Substitute values after differentiating"],
    formula: "dV/dt = (dV/dr)(dr/dt)",
    prompt: "How fast does a balloon’s volume change as its radius grows?"
  },
  {
    id: "integrals", label: "Integrals", parent: "calculus", x: 485, y: 745, type: "branch",
    summary: "Accumulate tiny contributions to find totals, areas, and net change.",
    ideas: ["Antiderivatives reverse differentiation", "Definite integrals give signed accumulation", "The Fundamental Theorem links slopes and totals"],
    formula: "∫ₐᵇ f(x)dx = F(b) − F(a)",
    prompt: "Describe the difference between total area and signed area."
  },
  {
    id: "antiderivatives", label: "Antiderivatives", parent: "integrals", x: 230, y: 870, type: "leaf",
    summary: "Find whole families of functions with a given derivative.",
    ideas: ["Reverse familiar derivative rules", "Include the constant of integration", "Use initial conditions to determine C"],
    formula: "∫f(x)dx = F(x) + C",
    prompt: "Recover position from a velocity function and one known position."
  },
  {
    id: "definite", label: "Definite Integrals", parent: "integrals", x: 500, y: 930, type: "leaf",
    summary: "Calculate net accumulation over a fixed interval.",
    ideas: ["Riemann sums motivate integration", "Bounds define the interval", "Orientation changes the sign"],
    formula: "∫ₐᵇ f(x)dx",
    prompt: "Estimate an integral with rectangles, then compare with the exact value."
  },
  {
    id: "techniques", label: "Integration Techniques", parent: "integrals", x: 735, y: 850, type: "leaf",
    summary: "Choose substitutions or transformations for harder integrals.",
    ideas: ["Substitution reverses the chain rule", "Integration by parts reverses the product rule", "Partial fractions simplify rational functions"],
    formula: "∫u dv = uv − ∫v du",
    prompt: "What feature tells you to try substitution rather than integration by parts?"
  },
  {
    id: "series", label: "Sequences & Series", parent: "calculus", x: 1110, y: 750, type: "branch",
    summary: "Study infinite patterns, convergence, and polynomial approximations.",
    ideas: ["Sequences are ordered lists", "Series sum sequence terms", "Convergence determines whether an infinite process settles"],
    formula: "Σₙ₌₁∞ aₙ",
    prompt: "Explain why terms approaching zero is necessary but not sufficient for a series to converge."
  },
  {
    id: "sequences", label: "Sequences", parent: "series", x: 950, y: 920, type: "leaf",
    summary: "Track how ordered values behave as the index grows.",
    ideas: ["Compute terms from explicit and recursive rules", "Use limits to test convergence", "Recognise monotone and bounded sequences"],
    formula: "limₙ→∞ aₙ = L",
    prompt: "Decide whether a recursively defined sequence is increasing and bounded."
  },
  {
    id: "taylor", label: "Taylor Series", parent: "series", x: 1215, y: 925, type: "leaf",
    summary: "Approximate smooth functions with polynomials near a centre.",
    ideas: ["Coefficients come from derivatives", "More terms usually improve local accuracy", "A remainder estimates the error"],
    formula: "f(x)=Σ f⁽ⁿ⁾(a)(x−a)ⁿ/n!",
    prompt: "Approximate sin(x) near zero and identify the first omitted term."
  },
  {
    id: "convergence", label: "Convergence Tests", parent: "series", x: 1430, y: 810, type: "leaf",
    summary: "Select an efficient test to determine whether a series settles.",
    ideas: ["Comparison tests use known benchmarks", "Ratio and root tests suit exponential structure", "Alternating series need shrinking terms"],
    formula: "lim |aₙ₊₁/aₙ| = L",
    prompt: "Choose a convergence test before calculating anything, and explain why it fits."
  }
];

const topicById = new Map(mapTopics.map((topic) => [topic.id, topic]));
mapTopics.forEach((topic) => {
  topic.baseX = topic.x;
  topic.baseY = topic.y;
});
const mapState = { x: 0, y: 0, scale: 1, dragging: false, startX: 0, startY: 0, pointerStartX: 0, pointerStartY: 0, dragMoved: false, selected: null, noteTimer: null, reminderTimer: null, expansionNumber: 0, generating: false, collapsed: new Set(), folding: false };
const QUIZ_STORAGE_KEY = "stoodu.quiz-progress.v1";

function loadQuizStore() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(QUIZ_STORAGE_KEY));
    if (stored && typeof stored === "object") {
      return {
        results: stored.results && typeof stored.results === "object" ? stored.results : {},
        sessions: stored.sessions && typeof stored.sessions === "object" ? stored.sessions : {},
      };
    }
  } catch (error) {
    console.warn("Quiz progress could not be restored.", error);
  }
  return { results: {}, sessions: {} };
}

const quizStore = loadQuizStore();
const quizRuntime = { topicId: null, loading: false, completedTopicId: null };

function saveQuizStore() {
  try {
    window.localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(quizStore));
  } catch (error) {
    console.warn("Quiz progress could not be saved.", error);
  }
}

function shuffled(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function quizQuestionCount(topic) {
  if (!topic.parent) return 8;
  if (topicChildren(topic.id).length) return 6;
  return 4;
}

function fallbackQuestionsForTopic(topic) {
  const parent = topic.parent ? topicById.get(topic.parent) : null;
  const alternatives = mapTopics
    .filter((entry) => entry.id !== topic.id && entry.formula !== topic.formula)
    .slice(0, 3);
  const siblingLabels = topic.parent
    ? mapTopics.filter((entry) => entry.parent === topic.parent && entry.id !== topic.id).map((entry) => entry.label)
    : [];
  const parentOptions = shuffled([parent?.label || "University Calculus", ...siblingLabels, "None of these"])
    .filter((label, index, values) => label && values.indexOf(label) === index)
    .slice(0, 4);
  const correctParent = parentOptions.indexOf(parent?.label || "University Calculus");
  const formulaOptions = shuffled([topic.formula, ...alternatives.map((entry) => entry.formula)])
    .filter((formula, index, values) => formula && values.indexOf(formula) === index)
    .slice(0, 4);
  const correctFormula = formulaOptions.indexOf(topic.formula);
  return [
    {
      id: `${topic.id}-generated-parent`,
      topicId: topic.id,
      type: "choice",
      prompt: `Which branch contains ${topic.label}?`,
      options: parentOptions,
      answer: Math.max(0, correctParent),
      explanation: `${topic.label} belongs beneath ${parent?.label || "University Calculus"} in this study map.`,
    },
    {
      id: `${topic.id}-generated-idea`,
      topicId: topic.id,
      type: "choice",
      prompt: `Which statement is a key idea in ${topic.label}?`,
      options: shuffled([topic.ideas[0], "Ignore the conditions and use any rule", "Memorise the final value without checking", "The topic is unrelated to its parent branch"]),
      answer: 0,
      explanation: topic.ideas[0],
      correctText: topic.ideas[0],
    },
    {
      id: `${topic.id}-generated-formula`,
      topicId: topic.id,
      type: "choice",
      prompt: `Which expression is associated with ${topic.label} in these notes?`,
      options: formulaOptions,
      answer: Math.max(0, correctFormula),
      explanation: `The notes connect ${topic.label} with ${topic.formula}.`,
    },
    {
      id: `${topic.id}-generated-practice`,
      topicId: topic.id,
      type: "choice",
      prompt: `What is the strongest next study step for ${topic.label}?`,
      options: shuffled([topic.prompt, "Skip examples and only reread the title", "Avoid connecting it to earlier concepts", "Assume every problem uses the same method"]),
      answer: 0,
      explanation: topic.prompt,
      correctText: topic.prompt,
    },
  ].map((question) => {
    if (!question.correctText) return question;
    return { ...question, answer: question.options.indexOf(question.correctText) };
  });
}

function shuffleQuestionOptions(question) {
  const clone = { ...question, options: question.options ? [...question.options] : undefined };
  if (clone.type !== "choice") return clone;
  const correctText = clone.options[clone.answer];
  clone.options = shuffled(clone.options);
  clone.answer = clone.options.indexOf(correctText);
  return clone;
}

class HardcodedQuizProvider {
  async createQuiz({ topic, scopeTopics, count }) {
    const terminalTopics = scopeTopics.filter((entry) => topicChildren(entry.id).length === 0);
    const groups = shuffled(terminalTopics.map((entry) => {
      const stored = window.STOODU_QUIZ_QUESTION_BANK?.[entry.id];
      return shuffled(stored?.length ? stored : fallbackQuestionsForTopic(entry));
    }));
    const selected = [];
    let round = 0;
    while (selected.length < count && groups.some((group) => round < group.length)) {
      groups.forEach((group) => {
        if (selected.length < count && group[round]) selected.push(shuffleQuestionOptions(group[round]));
      });
      round += 1;
    }
    const candidates = groups.flat();
    ["choice", "numeric"].forEach((type) => {
      if (selected.some((question) => question.type === type)) return;
      const replacement = candidates.find((question) => question.type === type && !selected.some((entry) => entry.id === question.id));
      if (replacement) selected[selected.length - 1] = shuffleQuestionOptions(replacement);
    });
    return {
      id: `local-${topic.id}-${Date.now()}`,
      source: "hardcoded",
      topicId: topic.id,
      questions: selected,
    };
  }
}

// Replace this provider with an AI-backed provider later. The quiz UI only
// depends on createQuiz({ topic, scopeTopics, count }) returning this schema.
const quizProvider = new HardcodedQuizProvider();

const expansionPresets = {
  continuity: [
    ["Types of Discontinuity", "Classify removable, jump, and infinite breaks in a graph."],
    ["Intermediate Value Theorem", "Use continuity to guarantee that a function reaches a value."],
    ["Piecewise Functions", "Choose parameters that join separate rules continuously."]
  ],
  lhopital: [
    ["Indeterminate Forms", "Recognise when a limit needs more work before evaluation."],
    ["Repeated Application", "Apply the rule again when the new ratio remains indeterminate."],
    ["When Not to Use It", "Choose algebra, identities, or comparison when the conditions fail."]
  ],
  rules: [
    ["Chain Rule", "Differentiate nested functions from the outside inward."],
    ["Implicit Differentiation", "Differentiate relationships where y is not isolated."],
    ["Logarithmic Differentiation", "Simplify products, powers, and variable exponents with logs."]
  ],
  applications: [
    ["Critical Points", "Find the candidates where an optimum may occur."],
    ["First Derivative Test", "Use sign changes to classify local extrema."],
    ["Constraint Modelling", "Translate a real restriction into a usable equation."]
  ],
  techniques: [
    ["u-Substitution", "Reverse the chain rule by introducing a simpler variable."],
    ["Integration by Parts", "Reverse the product rule to redistribute complexity."],
    ["Partial Fractions", "Split rational expressions into simpler integrals."]
  ],
  taylor: [
    ["Maclaurin Series", "Centre a Taylor expansion at zero."],
    ["Remainder & Error", "Estimate how accurate a finite polynomial approximation is."],
    ["Radius of Convergence", "Find the interval where the infinite expansion is valid."]
  ],
  convergence: [
    ["Comparison Tests", "Compare an unfamiliar series with a known benchmark."],
    ["Ratio & Root Tests", "Recognise convergence through exponential growth rates."],
    ["Alternating Series", "Use changing signs and shrinking terms to prove convergence."]
  ]
};

const expansionThemes = [
  ["Core intuition", "Build a visual and conceptual explanation of this idea."],
  ["Worked example", "Follow a representative problem from setup to solution."],
  ["Common mistakes", "Spot the assumptions and algebra errors learners often miss."]
];

function topicChildren(id) {
  return mapTopics.filter((topic) => topic.parent === id);
}

function descendantsOf(id) {
  const found = new Set([id]);
  const queue = [id];
  while (queue.length) {
    const parent = queue.shift();
    topicChildren(parent).forEach((child) => {
      found.add(child.id);
      queue.push(child.id);
    });
  }
  return found;
}

function isTopicHidden(topic) {
  let current = topic;
  while (current && current.parent) {
    if (mapState.collapsed.has(current.parent)) return true;
    current = topicById.get(current.parent);
  }
  return false;
}

function visibleTopics() {
  return mapTopics.filter((topic) => !isTopicHidden(topic));
}

function hiddenDescendantCount(id) {
  return Math.max(0, descendantsOf(id).size - 1);
}

function nodeSize(topic) {
  if (topic.type === "root") return { width: 226, height: 76 };
  if (topic.type === "branch") return { width: 172, height: 62 };
  return { width: 154, height: 54 };
}

function ellipseBoundaryPoint(from, toward, width, height) {
  const dx = toward.x - from.x;
  const dy = toward.y - from.y;
  if (!dx && !dy) return { x: from.x, y: from.y };
  const radiusX = width / 2;
  const radiusY = height / 2;
  const distance = 1 / Math.sqrt((dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY));
  return { x: from.x + dx * distance, y: from.y + dy * distance };
}

function boundaryPoint(from, toward) {
  const { width, height } = nodeSize(from);
  return ellipseBoundaryPoint(from, toward, width, height);
}

function growControlBoundaryPoint(position, toward) {
  return ellipseBoundaryPoint(position, toward, 140, 48);
}

function rectangleBoundaryPoint(from, toward, width, height) {
  const dx = toward.x - from.x;
  const dy = toward.y - from.y;
  if (!dx && !dy) return { x: from.x, y: from.y };
  const scale = 1 / Math.max(Math.abs(dx) / (width / 2), Math.abs(dy) / (height / 2));
  return { x: from.x + dx * scale, y: from.y + dy * scale };
}

function edgePath(parent, topic) {
  const horizontal = Math.abs(topic.x - parent.x) > Math.abs(topic.y - parent.y);
  return horizontal
    ? `M ${parent.x} ${parent.y} C ${(parent.x + topic.x) / 2} ${parent.y}, ${(parent.x + topic.x) / 2} ${topic.y}, ${topic.x} ${topic.y}`
    : `M ${parent.x} ${parent.y} C ${parent.x} ${(parent.y + topic.y) / 2}, ${topic.x} ${(parent.y + topic.y) / 2}, ${topic.x} ${topic.y}`;
}

function selectedTerminalEdgePath(parent, topic, node) {
  const end = rectangleBoundaryPoint(topic, parent, node.offsetWidth, node.offsetHeight);
  const horizontal = Math.abs(topic.x - parent.x) > Math.abs(topic.y - parent.y);
  return horizontal
    ? `M ${parent.x} ${parent.y} C ${(parent.x + topic.x) / 2} ${parent.y}, ${(parent.x + topic.x) / 2} ${end.y}, ${end.x} ${end.y}`
    : `M ${parent.x} ${parent.y} C ${parent.x} ${(parent.y + topic.y) / 2}, ${end.x} ${(parent.y + topic.y) / 2}, ${end.x} ${end.y}`;
}

function syncMapGeometry() {
  mapTopics.forEach((topic) => {
    const node = mindmapNodes.querySelector(`[data-topic="${topic.id}"]`);
    if (node) {
      node.style.left = `${topic.x}px`;
      node.style.top = `${topic.y}px`;
    }
    if (topic.parent) {
      const edge = mindmapEdges.querySelector(`path[data-to="${topic.id}"]`);
      const parent = topicById.get(topic.parent);
      if (edge && parent) edge.setAttribute("d", edgePath(parent, topic));
    }
    const control = mindmapNodes.querySelector(`.grow-branch-control[data-grow-topic="${topic.id}"]`);
    const connector = mindmapEdges.querySelector(`.grow-control-edge[data-grow-topic="${topic.id}"]`);
    if (control || connector) {
      const position = growthControlPosition(topic);
      if (control) {
        control.style.left = `${position.x}px`;
        control.style.top = `${position.y}px`;
      }
      if (connector) {
        const start = boundaryPoint(topic, position);
        const end = growControlBoundaryPoint(position, topic);
        const midX = (start.x + end.x) / 2;
        connector.setAttribute("d", `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`);
      }
    }
  });
}

function reflowVisibleTopics() {
  const topics = visibleTopics();
  topics.forEach((topic) => {
    topic.x = topic.baseX;
    topic.y = topic.baseY;
  });

  const movementWeight = (topic) => topic.type === "root" ? 0 : topic.type === "branch" ? .48 : 1;
  for (let iteration = 0; iteration < 54; iteration += 1) {
    topics.forEach((topic) => {
      if (topic.type === "root") return;
      topic.x += (topic.baseX - topic.x) * .018;
      topic.y += (topic.baseY - topic.y) * .018;
    });

    for (let first = 0; first < topics.length; first += 1) {
      for (let second = first + 1; second < topics.length; second += 1) {
        const a = topics[first];
        const b = topics[second];
        const aSize = nodeSize(a);
        const bSize = nodeSize(b);
        let dx = b.x - a.x;
        const dy = b.y - a.y;
        if (!dx && !dy) dx = first % 2 ? 1 : -1;
        const requiredX = (aSize.width + bSize.width) / 2 + 54;
        const requiredY = (aSize.height + bSize.height) / 2 + 46;
        const overlapX = requiredX - Math.abs(dx);
        const overlapY = requiredY - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        const weightA = movementWeight(a);
        const weightB = movementWeight(b);
        const totalWeight = weightA + weightB || 1;
        if (overlapX / requiredX < overlapY / requiredY) {
          const push = overlapX * .54 * Math.sign(dx || 1);
          a.x -= push * weightA / totalWeight;
          b.x += push * weightB / totalWeight;
        } else {
          const push = overlapY * .58 * Math.sign(dy || 1);
          a.y -= push * weightA / totalWeight;
          b.y += push * weightB / totalWeight;
        }
      }
    }

    topics.forEach((topic) => {
      if (topic.type === "root") return;
      const limit = topic.type === "branch" ? 170 : 300;
      topic.x = Math.max(topic.baseX - limit, Math.min(topic.baseX + limit, topic.x));
      topic.y = Math.max(topic.baseY - limit, Math.min(topic.baseY + limit, topic.y));
    });
  }
  syncMapGeometry();
}

function createEdge(topic, generated = false) {
  const svgNamespace = "http://www.w3.org/2000/svg";
  if (!topic.parent) return;
  const parent = topicById.get(topic.parent);
  const path = document.createElementNS(svgNamespace, "path");
  path.setAttribute("d", edgePath(parent, topic));
  path.dataset.from = parent.id;
  path.dataset.to = topic.id;
  if (generated) path.classList.add("is-generated");
  mindmapEdges.append(path);
}

function growthControlPosition(topic) {
  const root = topicById.get("calculus");
  const angle = Math.atan2(topic.y - root.y, topic.x - root.x);
  const clearDistance = 220;
  return {
    x: topic.x + Math.cos(angle) * clearDistance,
    y: topic.y + Math.sin(angle) * clearDistance,
  };
}

function addGrowthControl(topic, generated = false) {
  const position = growthControlPosition(topic);
  const svgNamespace = "http://www.w3.org/2000/svg";
  const connector = document.createElementNS(svgNamespace, "path");
  connector.classList.add("grow-control-edge");
  connector.dataset.growTopic = topic.id;
  const start = boundaryPoint(topic, position);
  const end = growControlBoundaryPoint(position, topic);
  const midX = (start.x + end.x) / 2;
  connector.setAttribute("d", `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`);
  mindmapEdges.append(connector);

  const button = document.createElement("button");
  button.type = "button";
  button.className = `grow-branch-control${generated ? " is-new" : ""}`;
  button.dataset.growTopic = topic.id;
  button.style.left = `${position.x}px`;
  button.style.top = `${position.y}px`;
  button.setAttribute("aria-label", `Generate more branches for ${topic.label}`);
  button.innerHTML = `<span class="grow-branch-mark" aria-hidden="true">+</span><span>Grow branch</span>`;
  button.addEventListener("mouseenter", () => connector.classList.add("is-hovered"));
  button.addEventListener("mouseleave", () => connector.classList.remove("is-hovered"));
  button.addEventListener("focus", () => connector.classList.add("is-hovered"));
  button.addEventListener("blur", () => connector.classList.remove("is-hovered"));
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    generateBranches(topic.id);
  });
  mindmapNodes.append(button);
}

function createTopicElement(topic, index, generated = false) {
  createEdge(topic, generated);
  const node = document.createElement("button");
  node.type = "button";
  node.className = `map-node map-node-${topic.type}${generated ? " is-generated" : ""}`;
  if (topicChildren(topic.id).length) node.classList.add("has-children");
  node.dataset.topic = topic.id;
  node.style.left = `${topic.x}px`;
  node.style.top = `${topic.y}px`;
  node.style.setProperty("--node-delay", `${generated ? index * 90 : index * 35}ms`);
  node.setAttribute("aria-label", `${topic.label}: ${topic.summary}`);
  node.innerHTML = `<span class="node-dot"></span><span class="node-copy"><strong>${topic.label}</strong><small>${topic.summary}</small></span>`;
  node.addEventListener("animationend", (event) => {
    if (event.animationName === "map-node-enter") node.classList.add("has-entered");
  }, { once: true });
  node.addEventListener("click", (event) => {
    event.stopPropagation();
    if (event.target.closest(".collapsed-count")) {
      expandBranch(topic.id, { preserveView: true });
      return;
    }
    if (mapState.selected === topic.id && notesPanel.classList.contains("is-visible")) {
      showToast(`${topic.label} is centred — its notes are already open`);
      window.clearTimeout(mapState.reminderTimer);
      notesPanel.classList.remove("is-reminding");
      void notesPanel.offsetWidth;
      notesPanel.classList.add("is-reminding");
      mapState.reminderTimer = window.setTimeout(() => notesPanel.classList.remove("is-reminding"), 520);
      focusTopic(topic.id, { preservePanel: true });
      return;
    }
    focusTopic(topic.id);
  });
  node.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!topicChildren(topic.id).length) return;
    if (mapState.collapsed.has(topic.id)) expandBranch(topic.id, { preserveView: true });
    else collapseBranch(topic.id, { preserveView: true });
  });
  mindmapNodes.append(node);
  updateNodeQuizBadge(topic.id);
  if (topic.type === "leaf") addGrowthControl(topic, generated);
}

function createMindmap() {
  mapTopics.forEach((topic, index) => createTopicElement(topic, index));
  reflowVisibleTopics();
}

function applyMapTransform(animated = false) {
  mindmapWorld.classList.toggle("is-animating", animated);
  mindmapWorld.style.transform = `translate(${mapState.x}px, ${mapState.y}px) scale(${mapState.scale})`;
  if (animated) window.setTimeout(() => mindmapWorld.classList.remove("is-animating"), 900);
}

function topicDepth(topic) {
  let depth = 0;
  let current = topic;
  while (current && current.parent) {
    depth += 1;
    current = topicById.get(current.parent);
  }
  return depth;
}

function generatedTopicContent(parent, preset, index) {
  const fallback = expansionThemes[(mapState.expansionNumber + index) % expansionThemes.length];
  const [label, summary] = preset || fallback;
  return {
    label,
    summary,
    ideas: [
      `Connect ${label.toLowerCase()} to the main idea in ${parent.label}`,
      "Write the process as a sequence of small, checkable steps",
      "Test your understanding with a fresh example"
    ],
    formula: parent.formula,
    prompt: `Explain ${label.toLowerCase()} in your own words, then create one example connected to ${parent.label}.`
  };
}

function pointToSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(point.x - start.x, point.y - start.y);
  const progress = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  const closestX = start.x + progress * dx;
  const closestY = start.y + progress * dy;
  return Math.hypot(point.x - closestX, point.y - closestY);
}

function segmentsIntersect(a, b, c, d) {
  const cross = (first, second, third) =>
    (second.x - first.x) * (third.y - first.y) - (second.y - first.y) * (third.x - first.x);
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  return abC * abD < 0 && cdA * cdB < 0;
}

function layoutCollisionScore(points, parentId) {
  const parent = topicById.get(parentId);
  const existing = visibleTopics().filter((topic) => topic.id !== parentId);
  let score = 0;
  points.forEach((point) => {
    existing.forEach((topic) => {
      const dx = Math.abs(point.x - topic.x);
      const dy = Math.abs(point.y - topic.y);
      if (dx < 250 && dy < 135) {
        score += (250 - dx) * 5 + (135 - dy) * 8;
      }
      const connectorDistance = pointToSegmentDistance(topic, parent, point);
      if (connectorDistance < 78) score += (78 - connectorDistance) * 18;
    });
    visibleTopics().forEach((topic) => {
      if (!topic.parent || topic.id === parentId || topic.parent === parentId) return;
      const edgeParent = topicById.get(topic.parent);
      if (edgeParent && segmentsIntersect(parent, point, edgeParent, topic)) score += 1800;
    });
  });
  for (let first = 0; first < points.length; first += 1) {
    for (let second = first + 1; second < points.length; second += 1) {
      const dx = Math.abs(points[first].x - points[second].x);
      const dy = Math.abs(points[first].y - points[second].y);
      if (dx < 245 && dy < 130) score += 5000 + (245 - dx) * 10 + (130 - dy) * 10;
    }
  }
  return score;
}

function findExpansionPositions(parent) {
  const grandparent = topicById.get(parent.parent);
  const root = topicById.get("calculus");
  const reference = grandparent || root;
  const outwardAngle = Math.atan2(parent.y - reference.y, parent.x - reference.x);
  const radii = [260, 310, 365, 425];
  const spreads = [.72, .9, 1.08];
  const rotations = [0, .34, -.34, .68, -.68, 1.02, -1.02];
  let best = null;

  radii.forEach((radius) => {
    spreads.forEach((spread) => {
      rotations.forEach((rotation) => {
        const points = [-spread, 0, spread].map((offset) => {
          const angle = outwardAngle + rotation + offset;
          return {
            x: parent.x + Math.cos(angle) * radius,
            y: parent.y + Math.sin(angle) * radius,
          };
        });
        const score = layoutCollisionScore(points, parent.id) + Math.abs(rotation) * 35 + radius * .04;
        if (!best || score < best.score) best = { score, points };
      });
    });
  });
  return best.points;
}

function generateBranches(parentId) {
  if (mapState.generating || topicChildren(parentId).length) return;
  const parent = topicById.get(parentId);
  if (!parent) return;
  mapState.generating = true;
  mapState.expansionNumber += 1;
  const parentNode = mindmapNodes.querySelector(`[data-topic="${parentId}"]`);
  const growControl = mindmapNodes.querySelector(`[data-grow-topic="${parentId}"]`);
  parentNode?.classList.add("is-generating");
  growControl?.classList.add("is-generating");
  generateBranchesButton.classList.add("is-generating");
  generateBranchesButton.querySelector("strong").textContent = "Generating subtopics";
  generateBranchesButton.querySelector("small").textContent = "Following this branch…";

  window.setTimeout(() => {
    const positions = findExpansionPositions(parent);
    const presets = expansionPresets[parent.id] || [];

    parent.type = "branch";
    parentNode?.classList.remove("map-node-leaf", "is-generating");
    parentNode?.classList.add("map-node-branch", "was-expanded", "has-children");
    growControl?.remove();
    mindmapEdges.querySelector(`[data-grow-topic="${parentId}"]`)?.remove();

    positions.forEach((position, index) => {
      const content = generatedTopicContent(parent, presets[index], index);
      const id = `${parent.id}-generated-${mapState.expansionNumber}-${index + 1}`;
      const child = {
        id,
        parent: parent.id,
        x: position.x,
        y: position.y,
        type: "leaf",
        generated: true,
        baseX: position.x,
        baseY: position.y,
        ...content
      };
      mapTopics.push(child);
      topicById.set(id, child);
      createTopicElement(child, index, true);
    });

    topicCount.textContent = `${mapTopics.length} topics`;
    mapState.generating = false;
    generateBranchesButton.classList.remove("is-generating");
    reflowVisibleTopics();
    focusTopic(parentId, { preservePanel: true });
  }, 1050);
}

function updateCollapsedBadge(topic) {
  const node = mindmapNodes.querySelector(`[data-topic="${topic.id}"]`);
  if (!node) return;
  node.querySelector(".collapsed-count")?.remove();
  if (!mapState.collapsed.has(topic.id)) {
    node.classList.remove("is-collapsed");
    return;
  }
  const count = hiddenDescendantCount(topic.id);
  const badge = document.createElement("span");
  badge.className = "collapsed-count";
  badge.textContent = `+${count}`;
  badge.setAttribute("aria-label", `Expand ${count} hidden topics`);
  node.append(badge);
  node.classList.add("is-collapsed");
}

function currentFocusIds() {
  if (!mapState.selected) return new Set(visibleTopics().map((topic) => topic.id));
  const selected = topicById.get(mapState.selected);
  if (!selected || isTopicHidden(selected)) return new Set(visibleTopics().map((topic) => topic.id));
  const activeIds = new Set([...descendantsOf(selected.id)].filter((topicId) => {
    const topic = topicById.get(topicId);
    return topic && !isTopicHidden(topic);
  }));
  if (selected.parent) activeIds.add(selected.parent);
  return activeIds;
}

function collapseBranch(id, { preserveView = false, preservePanel = false } = {}) {
  if (mapState.folding || mapState.collapsed.has(id) || !topicChildren(id).length) return;
  const topic = topicById.get(id);
  if (!topic) return;
  const previouslySelected = mapState.selected;
  mapState.folding = true;
  const descendantIds = descendantsOf(id);
  descendantIds.delete(id);

  descendantIds.forEach((descendantId) => {
    const descendant = topicById.get(descendantId);
    if (!descendant || isTopicHidden(descendant)) return;
    const node = mindmapNodes.querySelector(`[data-topic="${descendantId}"]`);
    node?.style.setProperty("--fold-x", `${topic.x - descendant.x}px`);
    node?.style.setProperty("--fold-y", `${topic.y - descendant.y}px`);
    node?.classList.add("is-collapsing");
  });
  mindmapEdges.querySelectorAll("path:not(.grow-control-edge)").forEach((edge) => {
    if (descendantIds.has(edge.dataset.to)) edge.classList.add("is-collapsing");
  });
  mindmapNodes.querySelectorAll(".grow-branch-control").forEach((control) => control.classList.remove("is-visible"));
  mindmapEdges.querySelectorAll(".grow-control-edge").forEach((edge) => edge.classList.remove("is-visible", "is-hovered"));

  window.setTimeout(() => {
    mapState.collapsed.add(id);
    updateCollapsedBadge(topic);
    mindmapNodes.querySelectorAll(".map-node.is-collapsing").forEach((node) => node.classList.remove("is-collapsing"));
    mindmapEdges.querySelectorAll("path.is-collapsing").forEach((edge) => edge.classList.remove("is-collapsing"));
    mapState.folding = false;
    reflowVisibleTopics();
    if (preserveView) {
      if (previouslySelected && descendantIds.has(previouslySelected)) {
        mapState.selected = id;
        populateNotes(topic);
      } else if (previouslySelected === id) {
        populateNotes(topic);
      }
      setMapFocus(currentFocusIds());
    } else {
      focusTopic(id, { preservePanel });
    }
  }, 360);
}

function expandBranch(id, { preserveView = false, preservePanel = false } = {}) {
  if (mapState.folding || !mapState.collapsed.has(id)) return;
  const topic = topicById.get(id);
  if (!topic) return;
  mapState.folding = true;
  mapState.collapsed.delete(id);
  updateCollapsedBadge(topic);
  if (preserveView && mapState.selected === id) populateNotes(topic);
  const revealedIds = descendantsOf(id);
  revealedIds.delete(id);
  const revealedTopics = mapTopics.filter((entry) => revealedIds.has(entry.id) && !isTopicHidden(entry));
  reflowVisibleTopics();
  const expandedFocus = new Set([id, ...revealedTopics.map((entry) => entry.id), ...(topic.parent ? [topic.parent] : [])]);
  setMapFocus(preserveView ? currentFocusIds() : expandedFocus);

  revealedTopics.forEach((entry) => {
    const node = mindmapNodes.querySelector(`[data-topic="${entry.id}"]`);
    node?.style.setProperty("--fold-x", `${topic.x - entry.x}px`);
    node?.style.setProperty("--fold-y", `${topic.y - entry.y}px`);
    node?.classList.add("is-expanding");
  });
  mindmapEdges.querySelectorAll("path:not(.grow-control-edge)").forEach((edge) => {
    if (revealedIds.has(edge.dataset.to) && !isTopicHidden(topicById.get(edge.dataset.to))) edge.classList.add("is-expanding");
  });
  if (!preserveView) focusTopic(id, { preservePanel });
  window.setTimeout(() => {
    mindmapNodes.querySelectorAll(".map-node.is-expanding").forEach((node) => node.classList.remove("is-expanding"));
    mindmapEdges.querySelectorAll("path.is-expanding").forEach((edge) => edge.classList.remove("is-expanding"));
    mapState.folding = false;
  }, 620);
}

function fitBounds(bounds, availableWidth, animated = true) {
  const rect = mindmapCanvas.getBoundingClientRect();
  const width = Math.max(bounds.maxX - bounds.minX, 260);
  const height = Math.max(bounds.maxY - bounds.minY, 190);
  const padding = 110;
  const targetWidth = availableWidth || rect.width;
  const scale = Math.min((targetWidth - padding * 2) / width, (rect.height - padding * 2) / height, 1.38);
  mapState.scale = Math.max(.38, scale);
  mapState.x = (targetWidth - width * mapState.scale) / 2 - bounds.minX * mapState.scale;
  mapState.y = (rect.height - height * mapState.scale) / 2 - bounds.minY * mapState.scale;
  applyMapTransform(animated);
}

function fitWholeMap(animated = true) {
  const topics = visibleTopics();
  const bounds = {
    minX: Math.min(...topics.map((topic) => topic.x)) - 115,
    minY: Math.min(...topics.map((topic) => topic.y)) - 105,
    maxX: Math.max(...topics.map((topic) => topic.x)) + 115,
    maxY: Math.max(...topics.map((topic) => topic.y)) + 105,
  };
  fitBounds(bounds, null, animated);
}

function setMapFocus(activeIds) {
  mindmapNodes.querySelectorAll(".map-node").forEach((node) => {
    const topic = topicById.get(node.dataset.topic);
    const hidden = topic ? isTopicHidden(topic) : false;
    node.classList.toggle("is-collapsed-hidden", hidden);
    node.classList.toggle("is-muted", !activeIds.has(node.dataset.topic));
    node.classList.toggle("is-selected", node.dataset.topic === mapState.selected);
  });
  mindmapEdges.querySelectorAll("path:not(.grow-control-edge)").forEach((path) => {
    const toTopic = topicById.get(path.dataset.to);
    const fromTopic = topicById.get(path.dataset.from);
    const hidden = toTopic ? isTopicHidden(toTopic) : false;
    path.classList.toggle("is-collapsed-hidden", hidden);
    path.classList.toggle("is-muted", !hidden && !(activeIds.has(path.dataset.from) && activeIds.has(path.dataset.to)));
    path.classList.toggle("is-active", !hidden && activeIds.has(path.dataset.from) && activeIds.has(path.dataset.to));
    const selectedNode = toTopic?.id === mapState.selected
      ? mindmapNodes.querySelector(`[data-topic="${toTopic.id}"]`)
      : null;
    const isSelectedTerminal = selectedNode && topicChildren(toTopic.id).length === 0;
    if (fromTopic && toTopic) {
      path.setAttribute("d", isSelectedTerminal
        ? selectedTerminalEdgePath(fromTopic, toTopic, selectedNode)
        : edgePath(fromTopic, toTopic));
    }
  });
  mindmapNodes.querySelectorAll(".grow-branch-control").forEach((control) => {
    const controlTopic = topicById.get(control.dataset.growTopic);
    const hidden = controlTopic ? isTopicHidden(controlTopic) : false;
    control.classList.toggle("is-collapsed-hidden", hidden);
    const visible = !hidden && control.dataset.growTopic === mapState.selected && topicChildren(control.dataset.growTopic).length === 0;
    control.classList.toggle("is-visible", visible);
    control.classList.remove("is-muted");
  });
  mindmapEdges.querySelectorAll(".grow-control-edge").forEach((edge) => {
    const edgeTopic = topicById.get(edge.dataset.growTopic);
    const hidden = edgeTopic ? isTopicHidden(edgeTopic) : false;
    edge.classList.toggle("is-collapsed-hidden", hidden);
    const visible = !hidden && edge.dataset.growTopic === mapState.selected && topicChildren(edge.dataset.growTopic).length === 0;
    edge.classList.toggle("is-visible", visible);
    if (!visible) edge.classList.remove("is-hovered");
  });
}

function breadcrumbFor(topic) {
  const names = [];
  let current = topic;
  while (current) {
    names.unshift(current.label);
    current = current.parent ? topicById.get(current.parent) : null;
  }
  return names.join("  /  ");
}

function quizElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function quizScopeTopics(topic) {
  return [...descendantsOf(topic.id)].map((id) => topicById.get(id)).filter(Boolean);
}

function quizCoverageLabel(topic) {
  const terminalCount = quizScopeTopics(topic).filter((entry) => topicChildren(entry.id).length === 0).length;
  if (!topic.parent) return `Drawn across the complete map · ${terminalCount} end topics`;
  if (topicChildren(topic.id).length) return `Drawn across this branch · ${terminalCount} end topics`;
  return "Focused on this topic";
}

function updateNodeQuizBadge(topicId) {
  const node = mindmapNodes.querySelector(`[data-topic="${topicId}"]`);
  if (!node) return;
  node.querySelector(".quiz-score-badge")?.remove();
  const result = quizStore.results[topicId];
  if (!result) return;
  const badge = quizElement("span", "quiz-score-badge", `${result.best}%`);
  badge.setAttribute("aria-label", `Best quiz score ${result.best} percent`);
  node.append(badge);
}

function updateNotesScore(topic) {
  const result = quizStore.results[topic.id];
  notesScore.hidden = !result;
  if (!result) {
    notesScore.textContent = "";
    return;
  }
  notesScore.textContent = `Best ${result.best}% · ${result.attempts} ${result.attempts === 1 ? "attempt" : "attempts"}`;
}

function parseNumericAnswer(value) {
  const clean = String(value).trim().replace(/,/g, "");
  const fraction = clean.match(/^([-+]?(?:\d+(?:\.\d*)?|\.\d+))\s*\/\s*([-+]?(?:\d+(?:\.\d*)?|\.\d+))$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator === 0 ? Number.NaN : Number(fraction[1]) / denominator;
  }
  if (!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(clean)) return Number.NaN;
  return Number(clean);
}

function checkQuizAnswer(question, value) {
  if (question.type === "choice") return Number(value) === question.answer;
  const parsed = parseNumericAnswer(value);
  return Number.isFinite(parsed) && Math.abs(parsed - question.answer) <= question.tolerance;
}

function saveQuizDraft(topicId, questionId, value) {
  const session = quizStore.sessions[topicId];
  if (!session || session.responses[questionId]) return;
  session.drafts[questionId] = value;
  session.error = "";
  saveQuizStore();
}

function renderQuizOverview(topic) {
  const result = quizStore.results[topic.id];
  quizContent.replaceChildren();
  quizLength.textContent = `${quizQuestionCount(topic)} questions`;

  const intro = quizElement(
    "p",
    "quiz-intro",
    result
      ? "Revisit this material with a fresh mix of questions."
      : "Check what you understand, then use the explanations to close any gaps."
  );
  quizContent.append(intro);

  if (result) {
    const stats = quizElement("div", "quiz-stats");
    [
      ["Latest", `${result.latest}%`],
      ["Best", `${result.best}%`],
      ["Attempts", String(result.attempts)],
    ].forEach(([label, value]) => {
      const item = quizElement("div", "quiz-stat");
      item.append(quizElement("span", "", label), quizElement("strong", "", value));
      stats.append(item);
    });
    quizContent.append(stats);
  }

  const details = quizElement("div", "quiz-details");
  details.append(
    quizElement("span", "", quizCoverageLabel(topic)),
    quizElement("span", "", "Multiple choice + numerical")
  );
  quizContent.append(details);

  const startButton = quizElement("button", "quiz-primary-button", result ? "Retake quiz" : "Start quiz");
  startButton.type = "button";
  startButton.addEventListener("click", () => startQuiz(topic));
  quizContent.append(startButton);
}

async function startQuiz(topic) {
  if (quizRuntime.loading) return;
  quizRuntime.loading = true;
  quizContent.replaceChildren();
  const loading = quizElement("div", "quiz-building");
  loading.append(quizElement("span", "quiz-building-mark", "•••"), quizElement("p", "", "Preparing a balanced question set…"));
  quizContent.append(loading);

  try {
    const scopeTopics = quizScopeTopics(topic);
    const quiz = await quizProvider.createQuiz({
      topic,
      scopeTopics,
      count: quizQuestionCount(topic),
    });
    quizStore.sessions[topic.id] = {
      quizId: quiz.id,
      source: quiz.source,
      questions: quiz.questions,
      index: 0,
      drafts: {},
      responses: {},
      error: "",
      startedAt: Date.now(),
    };
    quizRuntime.completedTopicId = null;
    saveQuizStore();
    if (quizRuntime.topicId === topic.id) renderQuizQuestion(topic);
  } finally {
    quizRuntime.loading = false;
  }
}

function renderQuizChoice(question, session, response) {
  const group = quizElement("div", "quiz-options");
  group.setAttribute("role", "radiogroup");
  const draft = session.drafts[question.id];
  question.options.forEach((option, index) => {
    const label = quizElement("label", "quiz-option");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `quiz-${session.quizId}-${session.index}`;
    input.value = String(index);
    input.checked = response ? Number(response.value) === index : String(draft) === String(index);
    input.disabled = Boolean(response);
    const marker = quizElement("span", "quiz-option-marker", String.fromCharCode(65 + index));
    const copy = quizElement("span", "quiz-option-copy", option);
    label.append(input, marker, copy);
    if (response && index === question.answer) label.classList.add("is-correct-answer");
    if (response && Number(response.value) === index && !response.correct) label.classList.add("is-wrong-answer");
    input.addEventListener("change", () => saveQuizDraft(quizRuntime.topicId, question.id, input.value));
    group.append(label);
  });
  return group;
}

function renderQuizNumeric(question, session, response) {
  const wrapper = quizElement("div", "quiz-numeric");
  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "decimal";
  input.autocomplete = "off";
  input.placeholder = "Enter a number or fraction";
  input.setAttribute("aria-label", "Numerical answer");
  input.value = response?.value ?? session.drafts[question.id] ?? "";
  input.disabled = Boolean(response);
  input.classList.toggle("is-correct-answer", Boolean(response?.correct));
  input.classList.toggle("is-wrong-answer", Boolean(response && !response.correct));
  input.addEventListener("input", () => saveQuizDraft(quizRuntime.topicId, question.id, input.value));
  const tolerance = quizElement(
    "p",
    "quiz-tolerance",
    `Decimals and fractions accepted · answers within ±${question.tolerance} are correct`
  );
  wrapper.append(input, tolerance);
  return wrapper;
}

function renderQuizFeedback(question, response) {
  const feedback = quizElement("div", `quiz-feedback ${response.correct ? "is-correct" : "is-incorrect"}`);
  const heading = quizElement("strong", "", response.correct ? "Correct" : "Not quite");
  const explanation = quizElement("p", "", question.explanation);
  feedback.append(heading, explanation);
  if (!response.correct) {
    const answer = question.type === "choice" ? question.options[question.answer] : String(question.answer);
    feedback.append(quizElement("small", "", `Correct answer: ${answer}`));
  }
  return feedback;
}

function renderQuizQuestion(topic) {
  const session = quizStore.sessions[topic.id];
  if (!session) {
    renderQuizOverview(topic);
    return;
  }
  const question = session.questions[session.index];
  if (!question) {
    finishQuiz(topic);
    return;
  }
  const response = session.responses[question.id];
  quizContent.replaceChildren();
  quizLength.textContent = `${session.index + 1} of ${session.questions.length}`;

  const progress = quizElement("div", "quiz-progress");
  const progressCopy = quizElement("div", "quiz-progress-copy");
  const coveredTopic = topicById.get(question.topicId);
  progressCopy.append(
    quizElement("span", "", `Question ${session.index + 1}`),
    quizElement("span", "", coveredTopic?.label || topic.label)
  );
  const track = quizElement("div", "quiz-progress-track");
  const fill = quizElement("span", "quiz-progress-fill");
  fill.style.width = `${((session.index + (response ? 1 : 0)) / session.questions.length) * 100}%`;
  track.append(fill);
  progress.append(progressCopy, track);

  const prompt = quizElement("h4", "quiz-question", question.prompt);
  const answerControl = question.type === "choice"
    ? renderQuizChoice(question, session, response)
    : renderQuizNumeric(question, session, response);
  quizContent.append(progress, prompt, answerControl);

  if (session.error && !response) quizContent.append(quizElement("p", "quiz-input-error", session.error));

  if (response) {
    quizContent.append(renderQuizFeedback(question, response));
    const nextButton = quizElement(
      "button",
      "quiz-primary-button",
      session.index === session.questions.length - 1 ? "See results" : "Next question"
    );
    nextButton.type = "button";
    nextButton.addEventListener("click", () => nextQuizQuestion(topic));
    quizContent.append(nextButton);
  } else {
    const checkButton = quizElement("button", "quiz-primary-button", "Check answer");
    checkButton.type = "button";
    checkButton.addEventListener("click", () => submitQuizAnswer(topic));
    quizContent.append(checkButton);
  }
}

function submitQuizAnswer(topic) {
  const session = quizStore.sessions[topic.id];
  const question = session?.questions[session.index];
  if (!session || !question) return;
  const value = session.drafts[question.id];
  if (value === undefined || String(value).trim() === "") {
    session.error = question.type === "numeric" ? "Enter a numerical answer before checking." : "Choose an answer before checking.";
    saveQuizStore();
    renderQuizQuestion(topic);
    return;
  }
  if (question.type === "numeric" && !Number.isFinite(parseNumericAnswer(value))) {
    session.error = "Use a number, decimal, or fraction such as 1/2.";
    saveQuizStore();
    renderQuizQuestion(topic);
    return;
  }
  session.responses[question.id] = { value, correct: checkQuizAnswer(question, value) };
  session.error = "";
  saveQuizStore();
  renderQuizQuestion(topic);
}

function nextQuizQuestion(topic) {
  const session = quizStore.sessions[topic.id];
  if (!session) return;
  if (session.index >= session.questions.length - 1) {
    finishQuiz(topic);
    return;
  }
  session.index += 1;
  session.error = "";
  saveQuizStore();
  renderQuizQuestion(topic);
}

function finishQuiz(topic) {
  const session = quizStore.sessions[topic.id];
  if (!session) return;
  const correct = Object.values(session.responses).filter((response) => response.correct).length;
  const total = session.questions.length;
  const percentage = Math.round((correct / total) * 100);
  const previous = quizStore.results[topic.id];
  const result = {
    latest: percentage,
    best: Math.max(previous?.best || 0, percentage),
    attempts: (previous?.attempts || 0) + 1,
    correct,
    total,
    completedAt: Date.now(),
  };
  quizStore.results[topic.id] = result;
  delete quizStore.sessions[topic.id];
  quizRuntime.completedTopicId = topic.id;
  saveQuizStore();
  updateNodeQuizBadge(topic.id);
  updateNotesScore(topic);
  renderQuizResult(topic, result);
}

function renderQuizResult(topic, result) {
  quizContent.replaceChildren();
  quizLength.textContent = "Complete";
  const resultWrap = quizElement("div", "quiz-result");
  const ring = quizElement("div", "quiz-score-ring");
  ring.style.setProperty("--quiz-score", `${result.latest * 3.6}deg`);
  ring.append(quizElement("strong", "", `${result.latest}%`), quizElement("span", "", "score"));
  const copy = quizElement("div", "quiz-result-copy");
  copy.append(
    quizElement("h4", "", result.latest >= 75 ? "Strong work" : result.latest >= 50 ? "Good foundation" : "Keep building"),
    quizElement("p", "", `${result.correct} of ${result.total} correct. Your best score for this topic is ${result.best}%.`)
  );
  resultWrap.append(ring, copy);
  quizContent.append(resultWrap);

  const retake = quizElement("button", "quiz-primary-button", "Try another set");
  retake.type = "button";
  retake.addEventListener("click", () => startQuiz(topic));
  quizContent.append(retake);
}

function renderQuizForTopic(topic) {
  quizRuntime.topicId = topic.id;
  updateNotesScore(topic);
  if (quizStore.sessions[topic.id]) {
    renderQuizQuestion(topic);
    return;
  }
  if (quizRuntime.completedTopicId === topic.id && quizStore.results[topic.id]) {
    renderQuizResult(topic, quizStore.results[topic.id]);
    return;
  }
  renderQuizOverview(topic);
}

function populateNotes(topic) {
  document.querySelector("#notesIndex").textContent = String(mapTopics.indexOf(topic) + 1).padStart(2, "0");
  document.querySelector("#notesBreadcrumb").textContent = breadcrumbFor(topic);
  document.querySelector("#notesTitle").textContent = topic.label;
  document.querySelector("#notesSummary").textContent = topic.summary;
  document.querySelector("#notesFormula").textContent = topic.formula;
  document.querySelector("#notesPrompt").textContent = topic.prompt;
  const list = document.querySelector("#notesKeyIdeas");
  list.replaceChildren(...topic.ideas.map((idea) => {
    const item = document.createElement("li");
    item.textContent = idea;
    return item;
  }));
  const canGrow = topicChildren(topic.id).length === 0;
  generateBranchesButton.hidden = !canGrow;
  generateBranchesButton.dataset.topic = topic.id;
  generateBranchesButton.querySelector("strong").textContent = "Generate more branches";
  generateBranchesButton.querySelector("small").textContent = "Expand this topic with AI";
  const hasChildren = topicChildren(topic.id).length > 0;
  const isCollapsed = mapState.collapsed.has(topic.id);
  branchToggleButton.hidden = !hasChildren;
  branchToggleButton.dataset.topic = topic.id;
  branchToggleButton.dataset.action = isCollapsed ? "expand" : "collapse";
  branchToggleButton.querySelector("strong").textContent = isCollapsed ? "Expand branch" : "Collapse branch";
  branchToggleButton.querySelector("small").textContent = isCollapsed
    ? `Restore ${hiddenDescendantCount(topic.id)} hidden topics`
    : "Hide its subtopics without deleting them";
  branchToggleButton.classList.toggle("is-expand", isCollapsed);
  renderQuizForTopic(topic);
}

function focusTopic(id, { preservePanel = false } = {}) {
  const topic = topicById.get(id);
  if (!topic) return;
  window.clearTimeout(mapState.noteTimer);
  if (!preservePanel) {
    notesPanel.classList.remove("is-visible");
    notesPanel.setAttribute("aria-hidden", "true");
  }
  mapState.selected = id;
  const activeIds = new Set([...descendantsOf(id)].filter((topicId) => {
    const entry = topicById.get(topicId);
    return entry && !isTopicHidden(entry);
  }));
  if (topic.parent) activeIds.add(topic.parent);
  setMapFocus(activeIds);
  const focusTopics = mapTopics.filter((entry) => activeIds.has(entry.id) && !isTopicHidden(entry));
  const bounds = {
    minX: Math.min(...focusTopics.map((entry) => entry.x)) - 90,
    minY: Math.min(...focusTopics.map((entry) => entry.y)) - 80,
    maxX: Math.max(...focusTopics.map((entry) => entry.x)) + 90,
    maxY: Math.max(...focusTopics.map((entry) => entry.y)) + 80,
  };
  if (topicChildren(topic.id).length === 0 && !mapState.collapsed.has(topic.id)) {
    const growPosition = growthControlPosition(topic);
    bounds.minX = Math.min(bounds.minX, growPosition.x - 85);
    bounds.minY = Math.min(bounds.minY, growPosition.y - 45);
    bounds.maxX = Math.max(bounds.maxX, growPosition.x + 85);
    bounds.maxY = Math.max(bounds.maxY, growPosition.y + 45);
  }
  const availableWidth = mindmapCanvas.clientWidth * .62;
  fitBounds(bounds, availableWidth, true);
  populateNotes(topic);
  if (preservePanel) {
    notesPanel.classList.add("is-visible");
    notesPanel.setAttribute("aria-hidden", "false");
    return;
  }
  mapState.noteTimer = window.setTimeout(() => {
    notesPanel.classList.add("is-visible");
    notesPanel.setAttribute("aria-hidden", "false");
  }, 360);
}

function closeNotes() {
  window.clearTimeout(mapState.noteTimer);
  window.clearTimeout(mapState.reminderTimer);
  notesPanel.classList.remove("is-reminding");
  notesPanel.classList.remove("is-visible");
  notesPanel.setAttribute("aria-hidden", "true");
  mapState.selected = null;
  setMapFocus(new Set(mapTopics.map((topic) => topic.id)));
  window.setTimeout(() => fitWholeMap(true), 90);
}

function showMindmap() {
  loadingView.classList.remove("is-visible");
  loadingView.setAttribute("aria-hidden", "true");
  mindmapView.classList.add("is-visible");
  mindmapView.setAttribute("aria-hidden", "false");
  window.setTimeout(() => fitWholeMap(false), 40);
}

function zoomAt(factor, clientX, clientY) {
  const rect = mindmapCanvas.getBoundingClientRect();
  const px = (clientX ?? (rect.left + rect.width / 2)) - rect.left;
  const py = (clientY ?? (rect.top + rect.height / 2)) - rect.top;
  const worldX = (px - mapState.x) / mapState.scale;
  const worldY = (py - mapState.y) / mapState.scale;
  const next = Math.min(2.25, Math.max(.34, mapState.scale * factor));
  mapState.x = px - worldX * next;
  mapState.y = py - worldY * next;
  mapState.scale = next;
  applyMapTransform(false);
}

mindmapCanvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  zoomAt(Math.exp(-event.deltaY * .00255), event.clientX, event.clientY);
}, { passive: false });

mindmapCanvas.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".map-node, .grow-branch-control")) return;
  event.preventDefault();
  mapState.dragging = true;
  mapState.startX = event.clientX - mapState.x;
  mapState.startY = event.clientY - mapState.y;
  mapState.pointerStartX = event.clientX;
  mapState.pointerStartY = event.clientY;
  mapState.dragMoved = false;
  mindmapCanvas.classList.add("is-dragging");
  mindmapCanvas.setPointerCapture(event.pointerId);
});

mindmapCanvas.addEventListener("pointermove", (event) => {
  if (!mapState.dragging) return;
  if (Math.hypot(event.clientX - mapState.pointerStartX, event.clientY - mapState.pointerStartY) > 5) {
    mapState.dragMoved = true;
  }
  mapState.x = event.clientX - mapState.startX;
  mapState.y = event.clientY - mapState.startY;
  applyMapTransform(false);
});

function finishDragging(event) {
  if (!mapState.dragging) return;
  const shouldCloseNotes = event.type === "pointerup" && !mapState.dragMoved && Boolean(mapState.selected);
  mapState.dragging = false;
  mindmapCanvas.classList.remove("is-dragging");
  if (mindmapCanvas.hasPointerCapture(event.pointerId)) mindmapCanvas.releasePointerCapture(event.pointerId);
  if (shouldCloseNotes) closeNotes();
}

mindmapCanvas.addEventListener("pointerup", finishDragging);
mindmapCanvas.addEventListener("pointercancel", finishDragging);
mindmapCanvas.addEventListener("selectstart", (event) => event.preventDefault());
mindmapCanvas.addEventListener("dragstart", (event) => event.preventDefault());
document.querySelector("#zoomInButton").addEventListener("click", () => zoomAt(1.42));
document.querySelector("#zoomOutButton").addEventListener("click", () => zoomAt(1 / 1.42));
document.querySelector("#fitMapButton").addEventListener("click", closeNotes);
notesCloseButton.addEventListener("click", closeNotes);
generateBranchesButton.addEventListener("click", () => {
  const id = generateBranchesButton.dataset.topic;
  if (id) generateBranches(id);
});
branchToggleButton.addEventListener("click", () => {
  const id = branchToggleButton.dataset.topic;
  if (!id) return;
  if (branchToggleButton.dataset.action === "expand") expandBranch(id, { preservePanel: true });
  else collapseBranch(id, { preservePanel: true });
});

quizSection.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target.closest(".quiz-primary-button")) return;
  const topic = topicById.get(quizRuntime.topicId);
  const session = topic ? quizStore.sessions[topic.id] : null;
  const question = session?.questions[session.index];
  if (!topic || !session || !question || session.responses[question.id]) return;
  event.preventDefault();
  submitQuizAnswer(topic);
});

mapHomeButton.addEventListener("click", () => {
  window.clearTimeout(mapState.noteTimer);
  mindmapView.classList.remove("is-visible");
  mindmapView.setAttribute("aria-hidden", "true");
  promptView.hidden = false;
  promptView.classList.remove("is-leaving");
  isSubmitting = false;
  closeNotes();
});

window.addEventListener("resize", () => {
  if (!mindmapView.classList.contains("is-visible")) return;
  if (mapState.selected) focusTopic(mapState.selected, { preservePanel: true });
  else fitWholeMap(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && notesPanel.classList.contains("is-visible")) {
    event.preventDefault();
    closeNotes();
  }
  if (event.key === "Alt" && mindmapView.classList.contains("is-visible")) {
    mindmapView.classList.add("is-peeking-summaries");
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "Alt") mindmapView.classList.remove("is-peeking-summaries");
});

window.addEventListener("blur", () => mindmapView.classList.remove("is-peeking-summaries"));

createMindmap();
