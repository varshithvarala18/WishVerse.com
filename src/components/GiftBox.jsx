import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * CSS gift box with a gentle wobble. Clicking OPEN sends the lid flying,
 * bursts light, and calls onOpen (a real user gesture – safe to start audio).
 */
export default function GiftBox({ onOpen, size = 'lg', label = 'OPEN 🎁', hint }) {
  const [opened, setOpened] = useState(false);

  function open() {
    if (opened) return;
    setOpened(true);
    onOpen?.();
  }

  return (
    <div className={`giftbox giftbox-${size}${opened ? ' opened' : ''}`}>
      <div className="giftbox-stage" onClick={open} aria-hidden="true">
        {opened && (
          <motion.div
            className="gift-burst"
            initial={{ scale: 0.2, opacity: 1 }}
            animate={{ scale: 5, opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
        )}
        {opened && (
          <motion.div className="gift-rays" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0, 1, 0.6], scale: 1.4, rotate: 40 }} transition={{ duration: 1.6 }} />
        )}
        <motion.div
          className="gift-lid"
          animate={opened ? { y: -320, x: 120, rotate: 40, opacity: 0 } : { y: 0, x: 0, rotate: 0, opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.3, 0.7, 0.4, 1] }}
        >
          <div className="gift-bow">
            <span />
            <span />
            <i />
          </div>
          <div className="gift-ribbon-v" />
        </motion.div>
        <motion.div className="gift-body" animate={opened ? { scale: [1, 1.08, 0.96, 1] } : {}} transition={{ duration: 0.6 }}>
          <div className="gift-ribbon-v" />
          <div className="gift-shine" />
        </motion.div>
        <div className="gift-shadow" />
      </div>
      {hint && !opened && <p className="gift-hint muted">{hint}</p>}
      <motion.button
        type="button"
        className="btn btn-primary btn-xl gift-open-btn"
        onClick={open}
        disabled={opened}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        animate={opened ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
      >
        {label}
      </motion.button>
    </div>
  );
}
