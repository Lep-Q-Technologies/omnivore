import type { Article } from '@/types/article';

export const mockArticles: Article[] = [
  // TODAY'S DIGEST - Varied content types
  
  // Newsletter
  {
    id: '20',
    title: 'Dense Discovery #287: The Hidden Cost of Convenience',
    description: 'This week: how convenience culture is reshaping our cities, the rise of micro-factories, and why walking is the ultimate productivity hack.',
    sourceName: 'Dense Discovery',
    sourceUrl: 'https://densediscovery.com',
    author: 'Kai Brach',
    readingTime: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80',
    progress: 0,
    tags: [
      { id: 't50', label: 'Design', color: 'pink' },
      { id: 't51', label: 'Culture', color: 'purple' },
    ],
    flairs: [{ icon: 'mail', name: 'Newsletter' }],
    state: 'default',
    savedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1h ago
    contentType: 'newsletter',
  },
  
  // Podcast
  {
    id: '21',
    title: 'Lex Fridman Podcast #421: Yann LeCun on the Future of AI',
    description: 'A conversation with Meta\'s Chief AI Scientist about self-supervised learning, consciousness, and why current LLMs won\'t lead to AGI.',
    sourceName: 'Lex Fridman Podcast',
    sourceUrl: 'https://lexfridman.com/podcast',
    author: 'Lex Fridman',
    readingTime: 180,
    thumbnailUrl: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=400&q=80',
    progress: 0,
    tags: [
      { id: 't52', label: 'AI', color: 'purple' },
      { id: 't53', label: 'Machine Learning', color: 'blue' },
    ],
    flairs: [],
    state: 'default',
    savedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
    contentType: 'podcast',
  },
  
  // YouTube
  {
    id: '22',
    title: 'How Transformers Really Work - Visual Guide',
    description: 'A visual explanation of attention mechanisms, self-attention, and why transformers revolutionized machine learning.',
    sourceName: '3Blue1Brown',
    sourceUrl: 'https://youtube.com/3blue1brown',
    author: 'Grant Sanderson',
    readingTime: 25,
    thumbnailUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80',
    progress: 0,
    tags: [
      { id: 't54', label: 'Machine Learning', color: 'blue' },
      { id: 't55', label: 'Math', color: 'green' },
    ],
    flairs: [],
    state: 'default',
    savedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3h ago
    contentType: 'youtube',
  },
  
  // RSS - Hacker News
  {
    id: '23',
    title: 'Show HN: I built a local-first Notion alternative in Rust',
    description: 'After 2 years of development, I\'m releasing an open-source, privacy-focused note-taking app with real-time collaboration.',
    sourceName: 'Hacker News',
    sourceUrl: 'https://news.ycombinator.com',
    author: 'rustdev2024',
    readingTime: 5,
    thumbnailUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80',
    progress: 0,
    tags: [
      { id: 't56', label: 'Rust', color: 'red' },
      { id: 't57', label: 'Open Source', color: 'green' },
    ],
    flairs: [{ icon: 'rss', name: 'RSS' }],
    state: 'default',
    savedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4h ago
    contentType: 'rss',
  },
  
  // Newsletter - Morning Brew
  {
    id: '24',
    title: 'Morning Brew: Fed Signals More Rate Cuts, Tesla Surges',
    description: 'Good morning! Markets rally on Fed commentary, Tesla hits all-time high, and why everyone\'s talking about the creator economy.',
    sourceName: 'Morning Brew',
    sourceUrl: 'https://morningbrew.com',
    author: 'Morning Brew Team',
    readingTime: 6,
    thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80',
    progress: 0,
    tags: [
      { id: 't58', label: 'Finance', color: 'green' },
      { id: 't59', label: 'Markets', color: 'blue' },
    ],
    flairs: [{ icon: 'mail', name: 'Newsletter' }],
    state: 'default',
    savedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5h ago
    contentType: 'newsletter',
  },
  
  // Article - Saved via extension
  {
    id: '25',
    title: 'The State of JavaScript 2024: TypeScript Dominates',
    description: 'Annual survey results are in: TypeScript adoption hits 90%, React remains king, and Bun is the runtime to watch.',
    sourceName: 'State of JS',
    sourceUrl: 'https://stateofjs.com',
    author: 'Sacha Greif',
    readingTime: 15,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&q=80',
    progress: 0,
    tags: [
      { id: 't60', label: 'JavaScript', color: 'yellow' },
      { id: 't61', label: 'TypeScript', color: 'blue' },
    ],
    flairs: [],
    state: 'default',
    savedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6h ago
    contentType: 'article',
  },
  
  // Podcast - Huberman
  {
    id: '26',
    title: 'Huberman Lab: Sleep Toolkit - Science-Based Protocols',
    description: 'Dr. Andrew Huberman shares the neuroscience of sleep and practical tools for falling asleep faster, staying asleep, and feeling more rested.',
    sourceName: 'Huberman Lab',
    sourceUrl: 'https://hubermanlab.com',
    author: 'Andrew Huberman',
    readingTime: 120,
    thumbnailUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&q=80',
    progress: 0,
    tags: [
      { id: 't62', label: 'Health', color: 'green' },
      { id: 't63', label: 'Neuroscience', color: 'purple' },
    ],
    flairs: [],
    state: 'default',
    savedAt: new Date(Date.now() - 7 * 60 * 60 * 1000), // 7h ago
    contentType: 'podcast',
  },
  
  // YouTube - Fireship
  {
    id: '27',
    title: 'Bun 1.0 is Here - 100 Second Overview',
    description: 'Bun just hit 1.0! Here\'s everything you need to know about the new JavaScript runtime that\'s faster than Node.',
    sourceName: 'Fireship',
    sourceUrl: 'https://youtube.com/fireship',
    author: 'Jeff Delaney',
    readingTime: 2,
    thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80',
    progress: 0,
    tags: [
      { id: 't64', label: 'JavaScript', color: 'yellow' },
      { id: 't65', label: 'Bun', color: 'orange' },
    ],
    flairs: [],
    state: 'default',
    savedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8h ago
    contentType: 'youtube',
  },
  
  // RSS - TechCrunch
  {
    id: '28',
    title: 'OpenAI Announces GPT-5: What We Know So Far',
    description: 'OpenAI teases next-generation model with improved reasoning, multimodal capabilities, and reduced hallucinations.',
    sourceName: 'TechCrunch',
    sourceUrl: 'https://techcrunch.com',
    author: 'Kyle Wiggers',
    readingTime: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80',
    progress: 0,
    tags: [
      { id: 't66', label: 'AI', color: 'purple' },
      { id: 't67', label: 'OpenAI', color: 'green' },
    ],
    flairs: [{ icon: 'rss', name: 'RSS' }],
    state: 'default',
    savedAt: new Date(Date.now() - 9 * 60 * 60 * 1000), // 9h ago
    contentType: 'rss',
  },
  
  // Newsletter - TLDR
  {
    id: '29',
    title: 'TLDR: Apple Vision Pro Sales Disappoint, Google I/O Preview',
    description: 'Your daily dose of tech news: Vision Pro struggles at retail, what to expect from Google I/O, and a new CSS feature lands in all browsers.',
    sourceName: 'TLDR Newsletter',
    sourceUrl: 'https://tldr.tech',
    author: 'Dan Ni',
    readingTime: 4,
    thumbnailUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80',
    progress: 0,
    tags: [
      { id: 't68', label: 'Tech News', color: 'blue' },
    ],
    flairs: [{ icon: 'mail', name: 'Newsletter' }],
    state: 'default',
    savedAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10h ago
    contentType: 'newsletter',
  },
  
  // YouTube - Veritasium
  {
    id: '30',
    title: 'The Surprising Truth About Creativity',
    description: 'Why constraints make you more creative, and how the best ideas often come from limitations rather than freedom.',
    sourceName: 'Veritasium',
    sourceUrl: 'https://youtube.com/veritasium',
    author: 'Derek Muller',
    readingTime: 18,
    thumbnailUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&q=80',
    progress: 0,
    tags: [
      { id: 't69', label: 'Science', color: 'blue' },
      { id: 't70', label: 'Creativity', color: 'pink' },
    ],
    flairs: [],
    state: 'default',
    savedAt: new Date(Date.now() - 11 * 60 * 60 * 1000), // 11h ago
    contentType: 'youtube',
  },
  
  // Article - CSS Tricks
  {
    id: '31',
    title: 'A Complete Guide to CSS Container Queries',
    description: 'Container queries are finally here! Learn how to use them for truly responsive component-based design.',
    sourceName: 'CSS-Tricks',
    sourceUrl: 'https://css-tricks.com',
    author: 'Una Kravets',
    readingTime: 12,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    progress: 0,
    tags: [
      { id: 't71', label: 'CSS', color: 'blue' },
      { id: 't72', label: 'Frontend', color: 'green' },
    ],
    flairs: [{ icon: 'rss', name: 'RSS' }],
    state: 'default',
    savedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12h ago
    contentType: 'rss',
  },

  // UPLOADED DOCUMENTS - PDF, EPUB, HTML examples
  
  // PDF - Research Paper
  {
    id: '32',
    title: 'Attention Is All You Need',
    description: 'The original transformer paper that revolutionized NLP and became the foundation for GPT, BERT, and modern LLMs.',
    sourceName: 'arXiv',
    sourceUrl: '',
    author: 'Vaswani et al.',
    readingTime: 45,
    thumbnailUrl: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400&q=80',
    progress: 68,
    tags: [
      { id: 't73', label: 'Machine Learning', color: 'blue' },
      { id: 't74', label: 'Research', color: 'purple' },
    ],
    flairs: [{ icon: 'star', name: 'Favorited' }],
    state: 'default',
    savedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    contentType: 'pdf',
  },
  
  // PDF - Book
  {
    id: '33',
    title: 'Deep Learning with Python (2nd Edition)',
    description: 'François Chollet\'s comprehensive guide to deep learning using Keras and TensorFlow.',
    sourceName: 'Manning Publications',
    sourceUrl: '',
    author: 'François Chollet',
    readingTime: 480,
    thumbnailUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    progress: 23,
    tags: [
      { id: 't75', label: 'Python', color: 'yellow' },
      { id: 't76', label: 'Deep Learning', color: 'purple' },
      { id: 't77', label: 'Books', color: 'orange' },
    ],
    flairs: [{ icon: 'pin', name: 'Pinned' }],
    state: 'default',
    savedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    contentType: 'pdf',
  },
  
  // EPUB - Fiction
  {
    id: '34',
    title: 'Project Hail Mary',
    description: 'A lone astronaut must save humanity from extinction in this gripping sci-fi novel by the author of The Martian.',
    sourceName: 'Ballantine Books',
    sourceUrl: '',
    author: 'Andy Weir',
    readingTime: 600,
    thumbnailUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80',
    progress: 87,
    tags: [
      { id: 't78', label: 'Sci-Fi', color: 'blue' },
      { id: 't79', label: 'Fiction', color: 'pink' },
      { id: 't80', label: 'Books', color: 'orange' },
    ],
    flairs: [{ icon: 'star', name: 'Favorited' }],
    state: 'default',
    savedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    contentType: 'epub',
  },
  
  // EPUB - Non-fiction
  {
    id: '35',
    title: 'Thinking, Fast and Slow',
    description: 'Daniel Kahneman explores the two systems that drive the way we think and make decisions.',
    sourceName: 'Farrar, Straus and Giroux',
    sourceUrl: '',
    author: 'Daniel Kahneman',
    readingTime: 720,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    progress: 42,
    tags: [
      { id: 't81', label: 'Psychology', color: 'purple' },
      { id: 't82', label: 'Behavioral Economics', color: 'green' },
      { id: 't83', label: 'Books', color: 'orange' },
    ],
    flairs: [],
    state: 'default',
    savedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    contentType: 'epub',
  },
  
  // HTML - Saved webpage
  {
    id: '36',
    title: 'The Twelve-Factor App',
    description: 'A methodology for building modern, scalable, maintainable software-as-a-service applications.',
    sourceName: 'Local Save',
    sourceUrl: '',
    author: 'Adam Wiggins',
    readingTime: 20,
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
    progress: 100,
    tags: [
      { id: 't84', label: 'DevOps', color: 'blue' },
      { id: 't85', label: 'Architecture', color: 'gray' },
    ],
    flairs: [],
    state: 'archived',
    savedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    contentType: 'html',
  },
  
  // HTML - Documentation
  {
    id: '37',
    title: 'React Documentation - Hooks Reference',
    description: 'Complete reference for all built-in React Hooks including useState, useEffect, useContext, and more.',
    sourceName: 'Local Save',
    sourceUrl: '',
    author: 'React Team',
    readingTime: 35,
    thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80',
    progress: 55,
    tags: [
      { id: 't86', label: 'React', color: 'blue' },
      { id: 't87', label: 'Documentation', color: 'gray' },
    ],
    flairs: [{ icon: 'pin', name: 'Pinned' }],
    state: 'default',
    savedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    contentType: 'html',
  },

  // Original articles kept for other pages
  {
    id: '11',
    title: 'The Future of AI: How Large Language Models Are Reshaping Software...',
    description: 'An exploration of how LLMs are fundamentally changing the way we build and interact with software systems.',
    sourceName: 'Hacker News',
    sourceUrl: 'https://news.ycombinator.com',
    author: 'Paul Graham',
    readingTime: 12,
    thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80',
    progress: 45,
    tags: [
      { id: 't30', label: 'AI', color: 'purple' },
      { id: 't31', label: 'Programming', color: 'blue' },
    ],
    flairs: [{ icon: 'star', name: 'Favorited' }],
    state: 'default',
    savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2d ago
    contentType: 'rss',
  },
  {
    id: '12',
    title: 'Understanding React Server Components: A Deep Dive',
    description: 'A comprehensive guide to React Server Components and how they change the way we build web applications.',
    sourceName: "Dan Abramov's Blog",
    sourceUrl: 'https://overreacted.io',
    author: 'Dan Abramov',
    readingTime: 15,
    thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80',
    progress: 0,
    tags: [
      { id: 't32', label: 'React', color: 'blue' },
      { id: 't33', label: 'Frontend', color: 'green' },
    ],
    flairs: [],
    state: 'default',
    savedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 15 * 60 * 60 * 1000), // 1.5d ago
    contentType: 'article',
  },
  {
    id: '6',
    title: 'The Aesthetic-Usability Effect: Why Beautiful Design Feels Easier to Use',
    description: 'Users perceive aesthetically pleasing designs as more usable. This cognitive bias explains why investing in visual design improves user satisfaction.',
    sourceName: 'Nielsen Norman Group',
    sourceUrl: 'https://nngroup.com/articles/aesthetic-usability-effect',
    author: 'Kate Moran',
    readingTime: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80',
    progress: 72,
    tags: [
      { id: 't4', label: 'Design', color: 'pink' },
      { id: 't18', label: 'UX Research', color: 'purple' },
      { id: 't19', label: 'Psychology', color: 'orange' },
    ],
    flairs: [{ icon: 'star', name: 'Favorited' }],
    state: 'default',
    savedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    contentType: 'article',
  },
  {
    id: '9',
    title: 'The Case for Slow Productivity',
    description: 'In a world obsessed with hustle culture, what if doing less could actually help you achieve more meaningful work?',
    sourceName: 'Cal Newport',
    sourceUrl: 'https://calnewport.com',
    author: 'Cal Newport',
    readingTime: 15,
    thumbnailUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&q=80',
    progress: 10,
    tags: [
      { id: 't22', label: 'Productivity', color: 'yellow' },
      { id: 't23', label: 'Work', color: 'gray' },
      { id: 't24', label: 'Books', color: 'orange' },
    ],
    flairs: [{ icon: 'pin', name: 'Pinned' }],
    state: 'default',
    savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    contentType: 'newsletter',
  },
  {
    id: '8',
    title: 'JPMorgan Chase Q4 Earnings Analysis',
    description: 'Latest financial news and analysis from Wall Street. Breaking down the numbers behind the biggest bank in America.',
    sourceName: 'Bloomberg',
    sourceUrl: 'https://bloomberg.com',
    author: 'Matt Levine',
    readingTime: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80',
    progress: 100,
    tags: [
      { id: 't6', label: 'Finance', color: 'green' },
      { id: 't21', label: 'Markets', color: 'blue' },
    ],
    flairs: [],
    state: 'archived',
    savedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    contentType: 'newsletter',
  },
];