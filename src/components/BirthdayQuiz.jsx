import { useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useEffects } from '../context/EffectsContext.jsx';

/** Stage 10a – one playful question; the right answer unlocks a reward. */
export default function BirthdayQuiz({ quiz, onNext }) {
  const { fire } = useEffects();
  const controls = useAnimationControls();
  const [wrong, setWrong] = useState(null);
  const [solved, setSolved] = useState(false);

  function answer(i) {
    if (solved) return;
    if (i === quiz.correctIndex) {
      setSolved(true);
      setWrong(null);
      fire('confetti', { count: 180 });
      fire('hearts', { count: 14 });
    } else {
      setWrong(i);
      controls.start({ x: [0, -14, 14, -10, 10, -4, 0], transition: { duration: 0.5 } });
    }
  }

  return (
    <div className="stage-inner quiz-stage">
      <p className="eyebrow">Birthday quiz 🧠</p>
      <h2 className="quiz-question">{quiz.question}</h2>
      <motion.div className="quiz-options" animate={controls} role="group" aria-label="Answers">
        {quiz.options.map((opt, i) => {
          const state = solved && i === quiz.correctIndex ? 'correct' : wrong === i ? 'wrong' : '';
          return (
            <motion.button
              key={i}
              type="button"
              className={`quiz-option glass ${state}`}
              onClick={() => answer(i)}
              disabled={solved}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="quiz-letter" aria-hidden="true">
                {'ABCD'[i]}
              </span>
              {opt}
            </motion.button>
          );
        })}
      </motion.div>
      <div aria-live="polite" className="quiz-feedback">
        <AnimatePresence mode="wait">
          {wrong !== null && !solved && (
            <motion.p key={`w${wrong}`} className="quiz-wrong" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              Try again 😄
            </motion.p>
          )}
          {solved && (
            <motion.div
              key="reward"
              className="quiz-reward glass"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            >
              <p className="quiz-correct">Correct! 🎉</p>
              <p>{quiz.rewardText}</p>
              <button type="button" className="btn btn-primary" onClick={onNext}>
                Continue →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
