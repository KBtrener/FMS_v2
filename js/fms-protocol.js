(() => {
  const MAIN_TESTS = Object.freeze([
    { key: 'deepSquat', code: 'fms_deep_squat', title: 'Deep Squat', bilateral: false },
    { key: 'hurdleStep', code: 'fms_hurdle_step', title: 'Hurdle Step', bilateral: true },
    { key: 'inlineLunge', code: 'fms_inline_lunge', title: 'In-Line Lunge', bilateral: true },
    { key: 'shoulderMobility', code: 'fms_shoulder_mobility', title: 'Shoulder Mobility', bilateral: true, pain: true },
    { key: 'aslr', code: 'fms_aslr', title: 'ASLR', bilateral: true },
    { key: 'trunkStabilityPushUp', code: 'fms_trunk_stability_push_up', title: 'Trunk Stability Push-Up', bilateral: false, pain: true },
    { key: 'rotaryStability', code: 'fms_rotary_stability', title: 'Rotary Stability', bilateral: true, pain: true },
  ]);
  const ADDITIONAL_TESTS = Object.freeze([
    { key: 'ankleMobility', code: 'fms_ankle_mobility', title: 'Ankle Mobility' },
    { key: 'lowerBodyMcs', code: 'fms_lower_body_mcs', title: 'Lower Body MCS' },
    { key: 'upperBodyMcs', code: 'fms_upper_body_mcs', title: 'Upper Body MCS' },
  ]);

  function finalScore(test, result) {
    const score = test.bilateral
      ? result?.left == null || result?.right == null ? null : Math.min(result.left, result.right)
      : result?.score ?? null;
    if (score == null) return null;
    if (test.key === 'shoulderMobility' && (result.painLeft || result.painRight)) return 0;
    if (test.key === 'trunkStabilityPushUp' && result.pain) return 0;
    if (test.key === 'rotaryStability' && (result.painLeft || result.painRight)) return 0;
    return score;
  }

  function summarize(scores) {
    const tests = MAIN_TESTS.map(test => ({
      ...test,
      finalScore: finalScore(test, scores[test.key] || {}),
      asymmetric: test.bilateral && scores[test.key]?.left != null && scores[test.key]?.right != null && scores[test.key].left !== scores[test.key].right,
    }));
    const totalScore = tests.some(test => test.finalScore == null)
      ? null
      : tests.reduce((sum, test) => sum + test.finalScore, 0);
    return { tests, totalScore, maximum: 21, asymmetries: tests.filter(test => test.asymmetric).map(test => test.title) };
  }

  function mcs(length, left, right, unit) {
    if (length == null || left == null || right == null || length <= 0) return null;
    const tolerance = unit === 'cm' ? 4 : 1.5;
    return left > 2 * length && right > 2 * length && Math.abs(left - right) <= tolerance ? 'PASS' : 'FAIL';
  }

  function validateCompletion({ lowerSkipped, lowerLength, lowerLeft, lowerRight, upperSkipped, upperLength, upperLeft, upperRight }) {
    if (!lowerSkipped && !(lowerLength > 0 && lowerLeft != null && lowerRight != null)) return 'Uzupełnij Lower Body MCS albo oznacz test jako niewykonany.';
    const effectiveUpperLength = upperLength ?? lowerLength;
    if (!upperSkipped && !(effectiveUpperLength > 0 && upperLeft != null && upperRight != null)) return 'Uzupełnij Upper Body MCS albo oznacz test jako niewykonany.';
    return null;
  }

  const api = Object.freeze({ MAIN_TESTS, ADDITIONAL_TESTS, finalScore, summarize, mcs, validateCompletion });
  globalThis.FmsProtocol = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
