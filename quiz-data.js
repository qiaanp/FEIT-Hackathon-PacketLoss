(() => {
  const choice = (prompt, options, answer, explanation) => ({
    type: "choice",
    prompt,
    options,
    answer,
    explanation,
  });

  const numeric = (prompt, answer, tolerance, explanation) => ({
    type: "numeric",
    prompt,
    answer,
    tolerance,
    explanation,
  });

  const bank = {
    continuity: [
      choice(
        "Which three conditions make f continuous at x = a?",
        [
          "f(a) exists, the limit exists, and the limit equals f(a)",
          "f(a) is positive, differentiable, and increasing",
          "Both one-sided derivatives are zero",
          "The graph has no horizontal tangent",
        ],
        0,
        "Continuity requires a defined function value, an existing two-sided limit, and agreement between them."
      ),
      numeric(
        "For f(x) = 2x + k when x < 1 and f(1) = 5, what value of k makes f continuous at x = 1?",
        3,
        0.01,
        "The left-hand limit is 2(1) + k. Setting 2 + k = 5 gives k = 3."
      ),
      choice(
        "Can a limit exist at x = a when f(a) is undefined?",
        ["Yes", "No", "Only for polynomial functions", "Only when the limit is zero"],
        0,
        "A limit describes nearby behaviour. The function value at the point can be missing while the limit still exists."
      ),
      numeric(
        "Evaluate lim x→2 of (x² − 4)/(x − 2).",
        4,
        0.01,
        "Factor the numerator as (x − 2)(x + 2), cancel, and evaluate x + 2 at x = 2."
      ),
    ],
    lhopital: [
      choice(
        "Which forms allow a direct first use of L’Hôpital’s Rule?",
        ["0/0 and ∞/∞", "0·∞ and ∞−∞", "1∞ and 0⁰", "Any fraction containing a limit"],
        0,
        "The rule applies directly to quotient limits with the indeterminate forms 0/0 or ∞/∞."
      ),
      numeric(
        "Evaluate lim x→0 of (eˣ − 1)/x.",
        1,
        0.01,
        "The form is 0/0. Differentiating numerator and denominator gives eˣ/1, which tends to 1."
      ),
      numeric(
        "Evaluate lim x→0 of sin(x)/x.",
        1,
        0.01,
        "Using L’Hôpital’s Rule gives cos(x)/1, which approaches 1."
      ),
      choice(
        "When applying L’Hôpital’s Rule, what do you differentiate?",
        [
          "The numerator and denominator separately",
          "The quotient using the quotient rule",
          "Only the denominator",
          "The entire limit as one expression",
        ],
        0,
        "Differentiate the numerator and denominator independently; do not use the quotient rule."
      ),
    ],
    asymptotes: [
      choice(
        "What is the vertical asymptote of f(x) = 1/(x − 2)?",
        ["x = 2", "y = 2", "x = 0", "y = 0"],
        0,
        "The denominator vanishes at x = 2 and the function grows without bound nearby."
      ),
      numeric(
        "For f(x) = (3x + 1)/(x − 4), enter the y-value of the horizontal asymptote.",
        3,
        0.01,
        "The numerator and denominator have equal degree, so the horizontal asymptote is the ratio 3/1."
      ),
      choice(
        "May a graph cross a horizontal asymptote?",
        ["Yes", "No", "Only at x = 0", "Only if it has no vertical asymptote"],
        0,
        "A horizontal asymptote describes end behaviour, so the graph may cross it at finite x-values."
      ),
      numeric(
        "Evaluate lim x→∞ of (2x² + 1)/(x² − 3).",
        2,
        0.01,
        "Divide by x². The lower-order terms vanish and the ratio of leading coefficients is 2."
      ),
    ],
    rules: [
      choice(
        "What is d/dx[sin(x²)]?",
        ["2x cos(x²)", "cos(2x)", "x² cos(x)", "2 sin(x)"],
        0,
        "The chain rule multiplies the outer derivative cos(x²) by the inner derivative 2x."
      ),
      numeric(
        "If f(x) = x³, what is f′(2)?",
        12,
        0.01,
        "f′(x) = 3x², so f′(2) = 3·4 = 12."
      ),
      numeric(
        "For f(x) = 3x² + 4x, evaluate f′(1).",
        10,
        0.01,
        "f′(x) = 6x + 4, giving 10 at x = 1."
      ),
      choice(
        "Which rule differentiates f(x)g(x)?",
        [
          "f′(x)g(x) + f(x)g′(x)",
          "f′(x)g′(x)",
          "f′(x)/g′(x)",
          "f(x)g′(x) only",
        ],
        0,
        "The product rule accounts for the change in each factor."
      ),
    ],
    applications: [
      choice(
        "Which values should be checked for an absolute optimum on a closed interval?",
        [
          "Critical points and endpoints",
          "Only points where f′(x) = 1",
          "Only the midpoint",
          "Only vertical asymptotes",
        ],
        0,
        "Absolute extrema can occur at interior critical points or at either endpoint."
      ),
      numeric(
        "A rectangle has perimeter 20. What is its maximum possible area?",
        25,
        0.01,
        "The maximum occurs for a square with side length 5, so the area is 25."
      ),
      numeric(
        "At what x-value does f(x) = −x² + 6x + 1 reach its maximum?",
        3,
        0.01,
        "f′(x) = −2x + 6. Setting it to zero gives x = 3, and the parabola opens downward."
      ),
      choice(
        "What should be defined first in an optimisation problem?",
        ["The objective quantity", "A random derivative", "The final decimal precision", "A Taylor polynomial"],
        0,
        "The objective identifies exactly what is being maximised or minimised."
      ),
    ],
    "related-rates": [
      numeric(
        "A circle has radius 3 and dr/dt = 2. Using π = 3.14159, approximate dA/dt.",
        37.6991,
        0.02,
        "Since A = πr², dA/dt = 2πr·dr/dt = 12π ≈ 37.70."
      ),
      numeric(
        "A sphere has radius 2 and dr/dt = 1. Using π = 3.14159, approximate dV/dt.",
        50.2654,
        0.02,
        "From V = 4πr³/3, dV/dt = 4πr²·dr/dt = 16π ≈ 50.27."
      ),
      choice(
        "When should known numerical values usually be substituted in a related-rates problem?",
        ["After differentiating with respect to time", "Before writing an equation", "Before differentiating", "Only after solving for time"],
        0,
        "Keeping quantities variable until after differentiation preserves all required rates."
      ),
      choice(
        "If position is measured in metres and time in seconds, what are the units of dx/dt?",
        ["metres per second", "square metres", "seconds per metre", "metres"],
        0,
        "A derivative with respect to time has output units divided by time units."
      ),
    ],
    antiderivatives: [
      numeric(
        "In ∫3x² dx = ax³ + C, what is a?",
        1,
        0.01,
        "Because d(x³)/dx = 3x², the coefficient is 1."
      ),
      choice(
        "Why is +C included in an indefinite integral?",
        [
          "All constant shifts have the same derivative",
          "It makes every integral positive",
          "It records the lower integration bound",
          "It changes x into a constant",
        ],
        0,
        "Differentiation removes constants, so an antiderivative represents a family of constant shifts."
      ),
      numeric(
        "If F′(x) = 2x and F(0) = 3, what is F(2)?",
        7,
        0.01,
        "F(x) = x² + C. The initial condition gives C = 3, so F(2) = 7."
      ),
      choice(
        "What information determines the constant C?",
        ["An initial or boundary condition", "The power rule alone", "The variable name", "The graph colour"],
        0,
        "A known function value selects one member from the family of antiderivatives."
      ),
    ],
    definite: [
      numeric(
        "Evaluate ∫ from 0 to 2 of x dx.",
        2,
        0.01,
        "An antiderivative is x²/2. Evaluating at 2 and 0 gives 2."
      ),
      choice(
        "What does a definite integral represent directly?",
        ["Signed accumulation", "Always positive geometric area", "A single derivative", "Only the function maximum"],
        0,
        "Contributions below the axis are negative, so a definite integral gives net or signed accumulation."
      ),
      numeric(
        "Evaluate ∫ from 1 to 3 of 2 dx.",
        4,
        0.01,
        "A constant height of 2 over an interval of width 2 accumulates to 4."
      ),
      choice(
        "What happens when the bounds of a definite integral are reversed?",
        ["The sign changes", "The value is squared", "Nothing changes", "The integral becomes undefined"],
        0,
        "Reversing the direction of accumulation multiplies the integral by −1."
      ),
    ],
    techniques: [
      choice(
        "Which technique best fits ∫2x cos(x²) dx?",
        ["u-substitution", "Integration by parts", "Partial fractions", "A convergence test"],
        0,
        "The factor 2x is the derivative of the inner expression x²."
      ),
      numeric(
        "Evaluate ∫ from 0 to 1 of 2x dx.",
        1,
        0.01,
        "An antiderivative is x², and x² evaluated from 0 to 1 equals 1."
      ),
      choice(
        "Which technique is a natural first choice for ∫x eˣ dx?",
        ["Integration by parts", "Partial fractions", "The ratio test", "L’Hôpital’s Rule"],
        0,
        "The integrand is a product where differentiating x makes it simpler."
      ),
      choice(
        "Partial fractions is primarily used for which kind of integrand?",
        ["A rational function", "A single sine function", "An irrational constant", "A finite sequence"],
        0,
        "Partial fractions decomposes a rational expression into simpler rational terms."
      ),
    ],
    sequences: [
      numeric(
        "For aₙ = 1/n, what is a₅?",
        0.2,
        0.001,
        "Substitute n = 5: a₅ = 1/5 = 0.2."
      ),
      choice(
        "What is lim n→∞ of 1/n?",
        ["0", "1", "∞", "The limit does not exist"],
        0,
        "The denominator grows without bound, so the fraction approaches zero."
      ),
      numeric(
        "For aₙ = 3(1/2)ⁿ⁻¹, what is a₄?",
        0.375,
        0.001,
        "a₄ = 3(1/2)³ = 3/8 = 0.375."
      ),
      choice(
        "A real sequence that is monotone and bounded must be:",
        ["Convergent", "Periodic", "Constant", "Unbounded"],
        0,
        "The monotone convergence theorem guarantees convergence."
      ),
    ],
    taylor: [
      choice(
        "Where is a Maclaurin series centred?",
        ["x = 0", "x = 1", "x = −1", "At infinity"],
        0,
        "A Maclaurin series is the special Taylor series centred at zero."
      ),
      numeric(
        "What is the coefficient of x² in the Maclaurin series for eˣ?",
        0.5,
        0.001,
        "eˣ = 1 + x + x²/2! + ⋯, so the coefficient is 1/2."
      ),
      numeric(
        "Using x − x³/6, approximate sin(0.1).",
        0.0998333,
        0.0001,
        "Substitution gives 0.1 − 0.001/6 = 0.0998333…"
      ),
      choice(
        "Near the centre, what usually happens when more Taylor terms are included?",
        ["The approximation improves", "The function becomes discontinuous", "The radius is always zero", "Every coefficient becomes one"],
        0,
        "Additional terms capture more local derivative information and usually reduce truncation error."
      ),
    ],
    convergence: [
      choice(
        "Why does the harmonic series show that aₙ → 0 is not enough for convergence?",
        [
          "Its terms approach zero but its sum diverges",
          "Its terms do not approach zero",
          "It is a finite sum",
          "Every term is negative",
        ],
        0,
        "The harmonic terms shrink to zero too slowly for their infinite sum to settle."
      ),
      numeric(
        "For the geometric series Σ(1/3)ⁿ, what is the ratio between consecutive terms?",
        0.333333,
        0.001,
        "Each term is obtained by multiplying the previous term by 1/3."
      ),
      choice(
        "Which conditions support the alternating-series test?",
        [
          "Magnitudes decrease to zero",
          "Terms are always positive",
          "The ratio is greater than one",
          "Partial sums are unbounded",
        ],
        0,
        "An alternating series converges when the term magnitudes decrease and approach zero."
      ),
      numeric(
        "Find the first three-term sum 1/2 + 1/4 + 1/8.",
        0.875,
        0.001,
        "The sum is 4/8 + 2/8 + 1/8 = 7/8 = 0.875."
      ),
    ],
  };

  Object.entries(bank).forEach(([topicId, questions]) => {
    questions.forEach((question, index) => {
      question.id = `${topicId}-${index + 1}`;
      question.topicId = topicId;
    });
  });

  window.STOODU_QUIZ_QUESTION_BANK = bank;
})();
