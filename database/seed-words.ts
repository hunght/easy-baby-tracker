import { db } from '@/database/db';
import { words } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface SeedWord {
  word: string;
  definition: string;
  partOfSpeech?: string;
  pronunciation?: string;
  etymology?: string;
  exampleSentence?: string;
  difficulty: number;
  syllableCount?: number;
}

const SAMPLE_WORDS: SeedWord[] = [
  // Easy words (difficulty < 800)
  {
    word: 'apple',
    definition: 'A round fruit with red, yellow, or green skin and crisp white flesh.',
    partOfSpeech: 'noun',
    pronunciation: '/ˈæp.əl/',
    etymology: 'From Old English æppel, from Proto-Germanic *aplaz.',
    exampleSentence: 'She ate a delicious red apple for lunch.',
    difficulty: 400,
    syllableCount: 2,
  },
  {
    word: 'book',
    definition: 'A written or printed work consisting of pages bound together.',
    partOfSpeech: 'noun',
    pronunciation: '/bʊk/',
    etymology: 'From Old English bōc, from Proto-Germanic *bōkō.',
    exampleSentence: 'I love reading a good book before bed.',
    difficulty: 350,
    syllableCount: 1,
  },
  {
    word: 'friend',
    definition: 'A person with whom one has a bond of mutual affection.',
    partOfSpeech: 'noun',
    pronunciation: '/frend/',
    etymology: 'From Old English frēond, present participle of frēon "to love".',
    exampleSentence: 'My best friend and I have known each other since childhood.',
    difficulty: 500,
    syllableCount: 1,
  },
  {
    word: 'happy',
    definition: 'Feeling or showing pleasure or contentment.',
    partOfSpeech: 'adjective',
    pronunciation: '/ˈhæp.i/',
    etymology: 'From Middle English happy "lucky, favored by fortune".',
    exampleSentence: 'She felt happy when she received the good news.',
    difficulty: 450,
    syllableCount: 2,
  },
  {
    word: 'water',
    definition: 'A colorless, transparent, odorless liquid that forms seas and rivers.',
    partOfSpeech: 'noun',
    pronunciation: '/ˈwɔː.tər/',
    etymology: 'From Old English wæter, from Proto-Germanic *watōr.',
    exampleSentence: 'Please drink plenty of water to stay hydrated.',
    difficulty: 380,
    syllableCount: 2,
  },
  {
    word: 'school',
    definition: 'An institution for educating children.',
    partOfSpeech: 'noun',
    pronunciation: '/skuːl/',
    etymology: 'From Latin schola, from Greek skholē "leisure, philosophy".',
    exampleSentence: 'The children walk to school every morning.',
    difficulty: 550,
    syllableCount: 1,
  },
  {
    word: 'family',
    definition: 'A group of people related to one another by blood or marriage.',
    partOfSpeech: 'noun',
    pronunciation: '/ˈfæm.əl.i/',
    etymology: 'From Latin familia "household servants, household".',
    exampleSentence: 'Our family gathers for dinner every Sunday.',
    difficulty: 580,
    syllableCount: 3,
  },

  // Medium words (difficulty 800-1200)
  {
    word: 'beautiful',
    definition: 'Pleasing the senses or mind aesthetically.',
    partOfSpeech: 'adjective',
    pronunciation: '/ˈbjuː.tɪ.fəl/',
    etymology: 'From beauty + -ful, from Old French biauté.',
    exampleSentence: 'The sunset over the ocean was absolutely beautiful.',
    difficulty: 850,
    syllableCount: 3,
  },
  {
    word: 'necessary',
    definition: 'Required to be done, achieved, or present; needed.',
    partOfSpeech: 'adjective',
    pronunciation: '/ˈnes.ə.ser.i/',
    etymology: 'From Latin necessarius "unavoidable, indispensable".',
    exampleSentence: 'It is necessary to wear a seatbelt while driving.',
    difficulty: 950,
    syllableCount: 4,
  },
  {
    word: 'separate',
    definition: 'Cause to move or be apart; forming a unit apart from others.',
    partOfSpeech: 'verb',
    pronunciation: '/ˈsep.ər.eɪt/',
    etymology: 'From Latin separatus, past participle of separare.',
    exampleSentence: 'Please separate the white clothes from the colored ones.',
    difficulty: 900,
    syllableCount: 3,
  },
  {
    word: 'rhythm',
    definition: 'A strong, regular, repeated pattern of movement or sound.',
    partOfSpeech: 'noun',
    pronunciation: '/ˈrɪð.əm/',
    etymology: 'From Greek rhythmos "measured flow or movement".',
    exampleSentence: 'The drummer kept a steady rhythm throughout the song.',
    difficulty: 1050,
    syllableCount: 2,
  },
  {
    word: 'occurred',
    definition: 'Happened; took place.',
    partOfSpeech: 'verb',
    pronunciation: '/əˈkɜːrd/',
    etymology: 'From Latin occurrere "run to meet, run against".',
    exampleSentence: 'The accident occurred at the intersection.',
    difficulty: 1000,
    syllableCount: 2,
  },
  {
    word: 'embarrass',
    definition: 'Cause someone to feel awkward, self-conscious, or ashamed.',
    partOfSpeech: 'verb',
    pronunciation: '/ɪmˈbær.əs/',
    etymology: 'From French embarrasser "to block, obstruct".',
    exampleSentence: "I didn't mean to embarrass you in front of everyone.",
    difficulty: 1100,
    syllableCount: 3,
  },
  {
    word: 'conscience',
    definition: "A person's moral sense of right and wrong.",
    partOfSpeech: 'noun',
    pronunciation: '/ˈkɒn.ʃəns/',
    etymology: 'From Latin conscientia "knowledge within oneself".',
    exampleSentence: 'His conscience would not let him cheat on the test.',
    difficulty: 1150,
    syllableCount: 2,
  },

  // Hard words (difficulty > 1200)
  {
    word: 'bureaucracy',
    definition: 'A system of government with many complicated rules and processes.',
    partOfSpeech: 'noun',
    pronunciation: '/bjʊˈrɒk.rə.si/',
    etymology: 'From French bureaucratie, from bureau "desk" + Greek kratia "rule".',
    exampleSentence: 'The bureaucracy made it difficult to get the permit approved.',
    difficulty: 1350,
    syllableCount: 4,
  },
  {
    word: 'onomatopoeia',
    definition: 'The formation of a word that phonetically imitates a sound.',
    partOfSpeech: 'noun',
    pronunciation: '/ˌɒn.ə.mæt.əˈpiː.ə/',
    etymology: 'From Greek onomatopoiia "the making of a name or word".',
    exampleSentence: '"Buzz" and "hiss" are examples of onomatopoeia.',
    difficulty: 1500,
    syllableCount: 6,
  },
  {
    word: 'accommodate',
    definition: 'Provide lodging or sufficient space for; fit in with wishes or needs.',
    partOfSpeech: 'verb',
    pronunciation: '/əˈkɒm.ə.deɪt/',
    etymology: 'From Latin accommodare "make fit, adapt".',
    exampleSentence: 'The hotel can accommodate up to 500 guests.',
    difficulty: 1280,
    syllableCount: 4,
  },
  {
    word: 'maintenance',
    definition: 'The process of maintaining or preserving something.',
    partOfSpeech: 'noun',
    pronunciation: '/ˈmeɪn.tən.əns/',
    etymology: 'From Old French maintenance "upholding, support".',
    exampleSentence: 'Regular maintenance keeps the car running smoothly.',
    difficulty: 1250,
    syllableCount: 3,
  },
  {
    word: 'mischievous',
    definition: 'Causing or showing a fondness for causing trouble in a playful way.',
    partOfSpeech: 'adjective',
    pronunciation: '/ˈmɪs.tʃɪ.vəs/',
    etymology: 'From Old French meschief "misfortune, harm".',
    exampleSentence: 'The mischievous kitten knocked over the vase.',
    difficulty: 1300,
    syllableCount: 3,
  },
  {
    word: 'pneumonia',
    definition: 'Lung inflammation caused by bacterial or viral infection.',
    partOfSpeech: 'noun',
    pronunciation: '/njuːˈməʊ.ni.ə/',
    etymology: 'From Greek pneumonia "lung disease", from pneumon "lung".',
    exampleSentence: 'She was hospitalized with a severe case of pneumonia.',
    difficulty: 1400,
    syllableCount: 4,
  },
  {
    word: 'acquiesce',
    definition: 'Accept something reluctantly but without protest.',
    partOfSpeech: 'verb',
    pronunciation: '/ˌæk.wiˈes/',
    etymology: 'From Latin acquiescere "to find rest in".',
    exampleSentence: 'She decided to acquiesce to her parents\' wishes.',
    difficulty: 1450,
    syllableCount: 3,
  },
];

/**
 * Seed the database with sample words
 * @returns The number of words inserted
 */
export async function seedWords(): Promise<number> {
  let insertedCount = 0;

  for (const seedWord of SAMPLE_WORDS) {
    // Check if word already exists
    const existing = await db.select().from(words).where(eq(words.word, seedWord.word)).limit(1);

    if (existing.length === 0) {
      await db.insert(words).values({
        word: seedWord.word,
        definition: seedWord.definition,
        partOfSpeech: seedWord.partOfSpeech ?? null,
        pronunciation: seedWord.pronunciation ?? null,
        audioUrl: null, // Will use TTS fallback
        etymology: seedWord.etymology ?? null,
        exampleSentence: seedWord.exampleSentence ?? null,
        difficulty: seedWord.difficulty,
        syllableCount: seedWord.syllableCount ?? null,
      });
      insertedCount++;
    }
  }

  return insertedCount;
}

/**
 * Get the count of words in the database
 */
export async function getWordCount(): Promise<number> {
  const result = await db.select().from(words);
  return result.length;
}

/**
 * Check if database has been seeded with words
 */
export async function hasWords(): Promise<boolean> {
  const count = await getWordCount();
  return count > 0;
}
