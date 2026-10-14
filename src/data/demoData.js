import { defaultCelebrations } from '../utils/storage.js';

/*
 * Built-in demo surprise. Images are original SVG illustrations shipped in
 * /public/demo and referenced with the "demo:" media prefix, so the demo works
 * offline and never touches localStorage / IndexedDB.
 */
export const demoData = {
  id: 'demo',
  slug: 'demo',
  createdAt: '2026-10-14T13:37:00Z',
  updatedAt: '2026-10-14T13:37:00Z',
  name: 'Priya',
  birthdayDate: '2000-10-20',
  senderName: 'Your Friends',
  message:
    'Happy Birthday Priya! Wishing you a beautiful year filled with happiness, success, laughter and unforgettable memories. Keep smiling and keep shining! ❤️',
  theme: 'cinematic',
  photos: [
    { mediaId: 'demo:sunset.svg', caption: 'Golden hour on the terrace 🌅' },
    { mediaId: 'demo:friends.svg', caption: 'The whole gang, finally in one photo 🫶' },
  ],
  memories: [
    {
      id: 'demo-m1',
      mediaId: 'demo:beach.svg',
      caption: 'Our first unforgettable trip ❤️',
      date: '2021-05-14',
      description: 'Sand everywhere, sunburnt noses and the best laughs of the whole year.',
    },
    {
      id: 'demo-m2',
      mediaId: 'demo:cake.svg',
      caption: 'That midnight cake disaster 😂',
      date: '2022-10-20',
      description: 'We dropped it on the stairs. We still ate it. Absolutely worth it.',
    },
    {
      id: 'demo-m3',
      mediaId: 'demo:graduation.svg',
      caption: 'Graduation day 🎓',
      date: '2023-06-30',
      description: 'All those late nights finally paid off. So proud of you!',
    },
    {
      id: 'demo-m4',
      mediaId: 'demo:mountains.svg',
      caption: 'Sunrise at the summit ⛰️',
      date: '2023-12-02',
      description: '4 a.m. alarm, zero complaints (okay, a few). The view was everything.',
    },
    {
      id: 'demo-m5',
      mediaId: 'demo:city.svg',
      caption: 'City lights & late-night chai ✨',
      date: '2024-03-09',
      description: 'Talking about life until the café kicked us out.',
    },
    {
      id: 'demo-m6',
      mediaId: 'demo:picnic.svg',
      caption: 'The perfect lazy Sunday 🧺',
      date: '2025-04-27',
      description: 'Sandwiches, sunshine and your terrible (amazing) playlist.',
    },
  ],
  videos: [],
  music: null,
  celebrations: defaultCelebrations(true),
  extras: {
    hiddenSurprises: [
      {
        type: 'photo',
        mediaId: 'demo:stars.svg',
        text: 'We named a star after you. Okay, not officially… but in our hearts, it’s yours ⭐',
      },
      {
        type: 'message',
        mediaId: null,
        text: 'Your real present is waiting at dinner tonight. Dress up, birthday girl! 🎁',
      },
    ],
    quiz: {
      enabled: true,
      question: 'What is Priya’s favorite color?',
      options: ['Pink', 'Blue', 'Red', 'Green'],
      correctIndex: 0,
      rewardText: 'Of course it’s pink! 💖 You know her best.',
    },
    memoryLock: {
      enabled: true,
      secretWord: 'sunshine',
      hint: 'What does she bring into every room? ☀️ (psst… it’s “sunshine”)',
      mediaId: 'demo:sunshine.svg',
      text: 'You are the sunshine of our group. Never stop glowing! ☀️',
    },
    friendshipMeter: { enabled: true, label: 'Friendship Level' },
  },
};

export default demoData;
