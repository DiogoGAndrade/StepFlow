import type { Routine } from '../types'

export const sampleRoutines: Routine[] = [
  {
    id: 'routine-monday-push',
    name: 'Monday Push Workout',
    category: 'gym',
    timeOfDay: 'morning',
    days: ['monday'],
    estimatedDuration: 55,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-mp-1',
        type: 'timer',
        name: 'Warm Up',
        duration: 300,
        description: 'Light cardio and dynamic stretching',
        voiceText: 'Start your warm up. 5 minutes of light movement.'
      },
      {
        id: 'step-mp-2',
        type: 'reps',
        name: 'Bench Press',
        sets: 4,
        reps: 8,
        restDuration: 90,
        description: 'Flat bench, controlled descent',
        voiceText: 'Bench press. 4 sets of 8 reps. 90 seconds rest between sets.'
      },
      {
        id: 'step-mp-3',
        type: 'reps',
        name: 'Overhead Press',
        sets: 3,
        reps: 10,
        restDuration: 60,
        description: 'Standing barbell or dumbbell OHP',
        voiceText: 'Overhead press. 3 sets of 10. 60 seconds rest.'
      },
      {
        id: 'step-mp-4',
        type: 'reps',
        name: 'Tricep Dips',
        sets: 3,
        reps: 12,
        restDuration: 45,
        description: 'Bodyweight or weighted dips',
        voiceText: 'Tricep dips. 3 sets of 12. 45 seconds rest.'
      },
      {
        id: 'step-mp-5',
        type: 'timer',
        name: 'Cool Down',
        duration: 300,
        description: 'Chest and shoulder stretching',
        voiceText: 'Cool down. 5 minutes of stretching. Great work today!'
      }
    ]
  },
  {
    id: 'routine-morning-skincare',
    name: 'Morning Skincare',
    category: 'skincare',
    timeOfDay: 'morning',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    estimatedDuration: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-ms-1',
        type: 'check',
        name: 'Gentle Cleanser',
        product: 'CeraVe Hydrating Cleanser',
        description: 'Wet face, apply cleanser, rinse with lukewarm water'
      },
      {
        id: 'step-ms-2',
        type: 'check',
        name: 'Toner',
        product: 'Paula\'s Choice BHA Toner',
        description: 'Apply with cotton pad, avoid eye area'
      },
      {
        id: 'step-ms-3',
        type: 'check',
        name: 'Vitamin C Serum',
        product: 'Skinceuticals C E Ferulic',
        description: '3-4 drops, pat gently into skin'
      },
      {
        id: 'step-ms-4',
        type: 'check',
        name: 'Moisturizer',
        product: 'Neutrogena Hydro Boost',
        description: 'Apply evenly, let absorb 1-2 minutes'
      },
      {
        id: 'step-ms-5',
        type: 'check',
        name: 'Sunscreen',
        product: 'La Roche-Posay SPF 50+',
        description: 'Apply generously, last step of morning routine'
      }
    ]
  },
  {
    id: 'routine-evening-skincare',
    name: 'Evening Skincare',
    category: 'skincare',
    timeOfDay: 'evening',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    estimatedDuration: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-es-1',
        type: 'check',
        name: 'Makeup Remover / Cleansing Oil',
        product: 'DHC Deep Cleansing Oil',
        description: 'First cleanse — removes sunscreen and makeup',
        warning: 'Do not skip if you wore SPF today'
      },
      {
        id: 'step-es-2',
        type: 'check',
        name: 'Foaming Cleanser',
        product: 'CeraVe Foaming Cleanser',
        description: 'Second cleanse for thorough cleaning',
        warning: 'Avoid hot water — it strips the skin barrier'
      },
      {
        id: 'step-es-3',
        type: 'check',
        name: 'Retinol Serum',
        product: 'The Ordinary Retinol 0.5%',
        description: 'Pea-sized amount, avoid eye area',
        warning: 'Retinol makes skin photosensitive — evening only!'
      },
      {
        id: 'step-es-4',
        type: 'check',
        name: 'Eye Cream',
        product: 'Kiehl\'s Creamy Eye Treatment',
        description: 'Tap gently around orbital bone, never pull'
      },
      {
        id: 'step-es-5',
        type: 'check',
        name: 'Night Moisturizer',
        product: 'Weleda Skin Food',
        description: 'Heavier than daytime moisturizer, apply generously',
        warning: 'Let absorb before touching pillow'
      }
    ]
  },
  {
    id: 'routine-after-shaving',
    name: 'After Shaving Routine',
    category: 'skincare',
    timeOfDay: 'manual',
    days: [],
    isSpecialOccasion: true,
    estimatedDuration: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-as-1',
        type: 'check',
        name: 'Cold Water Rinse',
        description: 'Rinse with cold water to close pores and soothe skin'
      },
      {
        id: 'step-as-2',
        type: 'check',
        name: 'Alum Block',
        product: 'Razorock Alum Block',
        description: 'Wet block, glide over shaved areas, leave 30 seconds',
        warning: 'Will sting on cuts — that\'s normal'
      },
      {
        id: 'step-as-3',
        type: 'check',
        name: 'Alcohol-Free Toner',
        product: 'Thayers Witch Hazel',
        description: 'Pat on with cotton pad to calm inflammation'
      },
      {
        id: 'step-as-4',
        type: 'check',
        name: 'Aftershave Balm',
        product: 'Nivea Men Sensitive Post Shave Balm',
        description: 'Apply generous amount, massage in circular motion',
        warning: 'Avoid heavily fragranced products on freshly shaved skin'
      },
      {
        id: 'step-as-5',
        type: 'check',
        name: 'Moisturizer with SPF',
        product: 'La Roche-Posay Anthelios SPF 50',
        description: 'Even if not morning — freshly shaved skin burns easily',
        warning: 'Shaved skin is extra vulnerable to UV damage'
      }
    ]
  },
  {
    id: 'routine-deep-work',
    name: 'Weekly Deep Work Plan',
    category: 'study',
    timeOfDay: 'morning',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    estimatedDuration: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-dw-1',
        type: 'instruction',
        name: 'Set Intentions',
        description: 'Write down your 3 most important tasks for today. No phone.',
        voiceText: 'Set your intentions. Write down your three most important tasks. Put your phone face down.'
      },
      {
        id: 'step-dw-2',
        type: 'timer',
        name: 'Deep Work Block 1',
        duration: 2700,
        description: '45 minutes of focused work — no interruptions',
        voiceText: 'Deep work block one. 45 minutes. Close all notifications now.'
      },
      {
        id: 'step-dw-3',
        type: 'rest',
        name: 'Short Break',
        duration: 300,
        description: 'Stand up, stretch, water. No screens.',
        voiceText: 'Break time. Stand up and stretch. Avoid screens during this break.'
      },
      {
        id: 'step-dw-4',
        type: 'timer',
        name: 'Deep Work Block 2',
        duration: 2700,
        description: '45 minutes — tackle the hardest task',
        voiceText: 'Second deep work block. 45 minutes. Focus on your hardest task.'
      },
      {
        id: 'step-dw-5',
        type: 'rest',
        name: 'Long Break',
        duration: 900,
        description: 'Walk outside if possible. Hydrate. Light snack.',
        voiceText: 'Long break. 15 minutes. Go outside if you can. You are doing great.'
      },
      {
        id: 'step-dw-6',
        type: 'timer',
        name: 'Review & Plan Tomorrow',
        duration: 900,
        description: 'Review what you accomplished, plan tomorrow\'s top 3',
        voiceText: 'Review session. 15 minutes to consolidate your work and plan tomorrow.'
      }
    ]
  }
]
