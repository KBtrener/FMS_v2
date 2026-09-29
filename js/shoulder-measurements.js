(() => {
  function score(handLengthCm, distanceCm) {
    if (handLengthCm === '' || handLengthCm === null || handLengthCm === undefined || distanceCm === '' || distanceCm === null || distanceCm === undefined) return null;
    const handLength = Number(handLengthCm);
    const distance = Number(distanceCm);
    if (!Number.isFinite(handLength) || handLength <= 0 || !Number.isFinite(distance) || distance < 0) return null;
    if (distance <= handLength + Number.EPSILON * handLength * 4) return 3;
    if (distance <= handLength * 1.5 + Number.EPSILON * handLength * 8) return 2;
    return 1;
  }

  window.QuickScreenShoulderMeasurements = { score };
})();
