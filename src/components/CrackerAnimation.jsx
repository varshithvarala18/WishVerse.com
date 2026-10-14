import { memo } from 'react';
import FireworksAnimation from './FireworksAnimation.jsx';

/** Ground-level cracker bursts – reuses the fireworks engine with low, fast shells. */
function CrackerAnimation({ trigger = 0, rockets = 9, duration = 2200, colors }) {
  return <FireworksAnimation trigger={trigger} rockets={rockets} duration={duration} colors={colors} mode="crackers" />;
}

export default memo(CrackerAnimation);
