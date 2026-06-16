// Brevity metric: counts non-blank lines inside fenced code blocks (```), as a proxy
// for "net added LOC". Smaller = better. Returns a graded score in [0,1] plus the raw
// count so the eval table shows it. This is a model-free, deterministic check —
// llm-rubric judges quality; this judges size.
// ponytail: code-fence LOC proxy, not a real git diff — these are generation tasks with no
//   repo to diff against. Swap for `git diff --numstat` if you wire these into a real workspace.
function codeLines(output) {
  const lines = String(output).split('\n');
  let inFence = false;
  let count = 0;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue; // fence markers themselves don't count
    }
    if (inFence && line.trim() !== '') count++;
  }
  return count;
}

// Grading band: <=20 LOC is excellent (1.0), >=120 LOC is poor (0.0), linear between.
// Bands are deliberate and adjustable — they encode "smaller diff wins" without being
// so strict that a legitimately larger task always fails.
const GOOD = 20;
const BAD = 120;

module.exports = (output) => {
  const loc = codeLines(output);
  let score;
  if (loc <= GOOD) score = 1;
  else if (loc >= BAD) score = 0;
  else score = 1 - (loc - GOOD) / (BAD - GOOD);
  return {
    pass: loc <= BAD, // hard ceiling: anything past BAD fails outright
    score,
    reason: `brevity: ${loc} code LOC (good<=${GOOD}, fail>${BAD}) -> score ${score.toFixed(2)}`,
  };
};
