import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bmehxrasbjwnqotxjroc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZWh4cmFzYmp3bnFvdHhqcm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDE2OTgsImV4cCI6MjA4NjU3NzY5OH0.tUK14D8GdVSVSbWaOq8Lz9i0Y0D08IZLfEr9ES28Ukc'
);

const workouts = [
  {
    date: '2026-02-09', // Lundi
    type: 'swim',
    title: 'Endurance Aérobie & Technique',
    duration: '1h15',
    duration_min: 75,
    tss: 65,
    status: 'completed',
    warmup: '400m souple crawl + 4x50m éducatifs (rattrapé, finger drag, poing fermé)',
    main_set: '3x(400m allure CSS r=30") + 6x100m rapide (r=20")',
    cooldown: '200m dos souple + 100m brasse récup',
    focus: 'Endurance',
    equipment: ['Pull-buoy', 'Plaquettes', 'Chrono mural'],
    target_zones: '1:45-1:50/100m',
    coach_tip: 'Concentre-toi sur ton roulis et ta prise d\'eau. Garde un coude haut à chaque traction. Les 100m rapides doivent être à 90% max.',
    purpose: 'Développer ton endurance de base en natation et ancrer une mécanique de nage efficace avant le bloc intensif de mars.',
    nutrition: 'Petit-déjeuner léger 1h30 avant (porridge + banane). Hydrate-toi bien pendant l\'échauffement.',
    feel_legs: 3,
    feel_cardio: 5,
    feel_mental: 4,
    intensity_blocks: [
      { zone: 'Z1', duration: 15 },
      { zone: 'Z2', duration: 10 },
      { zone: 'Z3', duration: 12 },
      { zone: 'Z3', duration: 12 },
      { zone: 'Z3', duration: 12 },
      { zone: 'Z4', duration: 3 },
      { zone: 'Z4', duration: 3 },
      { zone: 'Z4', duration: 3 },
      { zone: 'Z4', duration: 3 },
      { zone: 'Z4', duration: 3 },
      { zone: 'Z4', duration: 3 },
      { zone: 'Z1', duration: 8 },
    ],
  },
  {
    date: '2026-02-10', // Mardi
    type: 'bike',
    title: 'Intervalles Seuil FTP',
    duration: '1h30',
    duration_min: 90,
    tss: 95,
    status: 'completed',
    warmup: '20\' progressif Z1→Z2 avec 3x30" accélérations',
    main_set: '4x(8\' Z4 @ 190-210W / 4\' Z2 récup moulinette)',
    cooldown: '15\' retour souple Z1, cadence > 90rpm',
    focus: 'Seuil',
    equipment: ['Vélo de route', 'Capteur de puissance', 'Home trainer'],
    target_zones: '190-210W / 155-165bpm',
    coach_tip: 'Ne pars pas trop fort sur le premier intervalle. Vise le bas de la fourchette (190W) pour les 2 premiers, puis monte progressivement. La 4ème répétition doit être la plus dure mais tu dois la finir.',
    purpose: 'Augmenter ta capacité à maintenir un effort au seuil lactique. C\'est le type de puissance que tu devras tenir pendant 180km à Nice.',
    nutrition: 'Barre énergétique 45min avant. 1 bidon de maltodextrine (40g/500ml) pendant la séance. Gel si besoin au 3ème intervalle.',
    feel_legs: 7,
    feel_cardio: 8,
    feel_mental: 7,
    intensity_blocks: [
      { zone: 'Z1', duration: 10 },
      { zone: 'Z2', duration: 10 },
      { zone: 'Z4', duration: 8 },
      { zone: 'Z2', duration: 4 },
      { zone: 'Z4', duration: 8 },
      { zone: 'Z2', duration: 4 },
      { zone: 'Z4', duration: 8 },
      { zone: 'Z2', duration: 4 },
      { zone: 'Z4', duration: 8 },
      { zone: 'Z2', duration: 4 },
      { zone: 'Z1', duration: 15 },
    ],
  },
  {
    date: '2026-02-11', // Mercredi
    type: 'run',
    title: 'Sortie Longue Endurance',
    duration: '1h20',
    duration_min: 80,
    tss: 72,
    status: 'completed',
    warmup: '15\' footing très souple + 4 gammes dynamiques (montées de genoux, talons-fesses)',
    main_set: '50\' allure marathon Z2 @ 5:10-5:30/km — terrain vallonné si possible',
    cooldown: '15\' marche/footing Z1 + 10\' étirements dynamiques',
    focus: 'Endurance',
    equipment: ['Chaussures route (drop 8mm)', 'Montre GPS', 'Ceinture cardio'],
    target_zones: '5:10-5:30/km / 135-145bpm',
    coach_tip: 'Reste dans la zone conversationnelle. Si tu ne peux pas parler en phrases complètes, ralentis. Profite du vallonné pour travailler ta foulée en montée sans forcer.',
    purpose: 'Construire ta base aérobie pour encaisser le marathon d\'un Ironman. L\'endurance fondamentale est le pilier de ta performance longue distance.',
    nutrition: 'Gel au bout de 45min si faim. 500ml d\'eau dans les 2h qui suivent. Repas riche en glucides dans les 30min post-run.',
    feel_legs: 4,
    feel_cardio: 4,
    feel_mental: 3,
    intensity_blocks: [
      { zone: 'Z1', duration: 15 },
      { zone: 'Z2', duration: 25 },
      { zone: 'Z2', duration: 25 },
      { zone: 'Z1', duration: 15 },
    ],
  },
  {
    date: '2026-02-12', // Jeudi
    type: 'strength',
    title: 'Renforcement Core & Prévention',
    duration: '45min',
    duration_min: 45,
    tss: 30,
    status: 'completed',
    warmup: '10\' mobilité articulaire (hanches, épaules, chevilles) + activation glutes',
    main_set: '3 rounds : Planche (60") + Squats unipodaux (12x/jambe) + Pont fessier (15x) + Superman (12x) + Mountain climbers (20x) — r=90" entre rounds',
    cooldown: '10\' stretching profond (psoas, ischio-jambiers, quadriceps, mollets)',
    focus: 'Prévention',
    equipment: ['Tapis', 'Élastique résistance', 'Medecine ball'],
    target_zones: null,
    coach_tip: 'Qualité > Quantité. Chaque squat unipodal doit être lent et contrôlé. Si le genou tremble, réduis l\'amplitude. Le gainage doit être irréprochable.',
    purpose: 'Prévenir les blessures et renforcer les muscles stabilisateurs qui protègent tes articulations pendant les heures d\'entraînement en tri.',
    nutrition: 'Collation protéinée dans les 30min après (shaker whey + banane).',
    feel_legs: 6,
    feel_cardio: 2,
    feel_mental: 5,
    intensity_blocks: [
      { zone: 'Z1', duration: 10 },
      { zone: 'Z3', duration: 8 },
      { zone: 'Z2', duration: 2 },
      { zone: 'Z3', duration: 8 },
      { zone: 'Z2', duration: 2 },
      { zone: 'Z3', duration: 8 },
      { zone: 'Z1', duration: 10 },
    ],
  },
  {
    date: '2026-02-13', // Vendredi (AUJOURD'HUI)
    type: 'bike',
    title: 'VO2 Max — Pyramide de Puissance',
    duration: '1h15',
    duration_min: 75,
    tss: 88,
    status: 'upcoming',
    warmup: '15\' progressif Z1→Z2 + 2x1\' à 110% FTP pour ouvrir',
    main_set: 'Pyramide : 2\' Z5 / 2\' Z2 / 3\' Z5 / 3\' Z2 / 4\' Z5 / 4\' Z2 / 3\' Z5 / 3\' Z2 / 2\' Z5 — Puissance cible : 240-260W',
    cooldown: '15\' souple Z1 cadence libre',
    focus: 'VO2 Max',
    equipment: ['Vélo de route', 'Home trainer Wahoo', 'Capteur de puissance', 'Ventilateur'],
    target_zones: '240-260W / 170-180bpm',
    coach_tip: 'La pyramide monte puis redescend. Garde la même puissance cible à la montée ET à la descente. C\'est sur les blocs de 3\' et 2\' finaux que tu dois prouver ta résistance. Si tu décroches de plus de 10W, le bloc ne compte pas.',
    purpose: 'Repousser ton plafond de VO2 Max. Cette capacité à consommer de l\'oxygène est le moteur de toute ta performance. Même en Ironman, un VO2 Max élevé te donne de la marge.',
    nutrition: 'Gel 30min avant. 1 bidon maltodextrine + électrolytes pendant. Boisson de récupération juste après.',
    feel_legs: 6,
    feel_cardio: 10,
    feel_mental: 9,
    intensity_blocks: [
      { zone: 'Z1', duration: 10 },
      { zone: 'Z2', duration: 5 },
      { zone: 'Z5', duration: 2 },
      { zone: 'Z2', duration: 2 },
      { zone: 'Z5', duration: 3 },
      { zone: 'Z2', duration: 3 },
      { zone: 'Z5', duration: 4 },
      { zone: 'Z2', duration: 4 },
      { zone: 'Z5', duration: 3 },
      { zone: 'Z2', duration: 3 },
      { zone: 'Z5', duration: 2 },
      { zone: 'Z1', duration: 15 },
    ],
  },
  {
    date: '2026-02-14', // Samedi
    type: 'run',
    title: 'Tempo & Allure Spécifique Ironman',
    duration: '1h10',
    duration_min: 70,
    tss: 78,
    status: 'planned',
    warmup: '15\' footing Z1 + 4x100m progressions',
    main_set: '3x(12\' allure tempo @ 4:40-4:55/km / 3\' récup Z1 trot) — dernier bloc : pousse à 4:35/km si les sensations sont bonnes',
    cooldown: '10\' footing très souple + étirements',
    focus: 'Tempo',
    equipment: ['Chaussures compétition (carbone)', 'Montre GPS', 'Ceinture cardio'],
    target_zones: '4:40-4:55/km / 150-160bpm',
    coach_tip: 'L\'allure tempo doit te sembler "confortablement difficile". Tu dois sentir l\'effort mais rester en contrôle. C\'est exactement l\'allure que tu tiendras au marathon de Nice après 180km de vélo.',
    purpose: 'Calibrer ton allure spécifique Ironman et apprendre à ton corps à courir à cette intensité de façon économique.',
    nutrition: 'Petit-déjeuner 2h avant (riz + miel). 1 gel à mi-parcours. Bien s\'hydrater après.',
    feel_legs: 7,
    feel_cardio: 7,
    feel_mental: 6,
    intensity_blocks: [
      { zone: 'Z1', duration: 15 },
      { zone: 'Z3', duration: 12 },
      { zone: 'Z1', duration: 3 },
      { zone: 'Z3', duration: 12 },
      { zone: 'Z1', duration: 3 },
      { zone: 'Z3', duration: 12 },
      { zone: 'Z1', duration: 10 },
    ],
  },
  {
    date: '2026-02-15', // Dimanche
    type: 'swim',
    title: 'Vitesse & Sprints en Eau Libre',
    duration: '1h00',
    duration_min: 60,
    tss: 55,
    status: 'planned',
    warmup: '300m crawl + 200m pull-buoy + 4x50m sprints progressifs',
    main_set: '8x75m sprint (r=30") + 4x200m allure course (r=15") — simule les départs et changements d\'allure en peloton',
    cooldown: '300m très souple, mix 4 nages',
    focus: 'Vitesse',
    equipment: ['Plaquettes', 'Pull-buoy', 'Lunettes eau libre'],
    target_zones: '1:30-1:35/100m sprints / 1:45/100m allure',
    coach_tip: 'Sur les sprints, visualise un départ d\'eau libre : tu dois accélérer fort les 25 premiers mètres puis tenir. Garde un rythme de bras élevé même quand ça brûle.',
    purpose: 'Travailler ta capacité à changer de rythme en natation, essentielle pour les départs groupés et les repositionnements en peloton.',
    nutrition: 'Juste un café et une banane si séance matinale. Brunch complet après.',
    feel_legs: 2,
    feel_cardio: 7,
    feel_mental: 6,
    intensity_blocks: [
      { zone: 'Z1', duration: 10 },
      { zone: 'Z2', duration: 5 },
      { zone: 'Z5', duration: 2 },
      { zone: 'Z5', duration: 2 },
      { zone: 'Z5', duration: 2 },
      { zone: 'Z5', duration: 2 },
      { zone: 'Z5', duration: 2 },
      { zone: 'Z5', duration: 2 },
      { zone: 'Z5', duration: 2 },
      { zone: 'Z5', duration: 2 },
      { zone: 'Z3', duration: 5 },
      { zone: 'Z3', duration: 5 },
      { zone: 'Z3', duration: 5 },
      { zone: 'Z3', duration: 5 },
      { zone: 'Z1', duration: 8 },
    ],
  },
];

async function seed() {
  // D'abord supprimer les anciens workouts de cette semaine
  const { error: delError } = await supabase
    .from('workouts')
    .delete()
    .gte('date', '2026-02-09')
    .lte('date', '2026-02-15');

  if (delError) {
    console.error('Erreur suppression:', delError.message);
  } else {
    console.log('Anciens workouts supprimés (semaine 09-15 fév)');
  }

  // Insérer les nouveaux
  const { data, error } = await supabase
    .from('workouts')
    .insert(workouts)
    .select('id, date, title');

  if (error) {
    console.error('Erreur insertion:', error.message);
    console.error('Détails:', error);
  } else {
    console.log(`${data.length} workouts insérés :`);
    data.forEach(w => console.log(`  ${w.date} — ${w.title} (id: ${w.id})`));
  }
}

seed();
