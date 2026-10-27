// Chapelet : textes, réglages, déroulé des prières et géométrie du chapelet dessiné.
// Partagé entre la page (rendu initial) et le script client (scripts/chapelet/page.ts).

/** [titre, référence, fruit, méditation] */
export type Mystery = [string, string, string, string];
export interface MysterySet {
  name: string;
  adj: string;
  days: string;
  m: Mystery[];
}

export const SETS: MysterySet[] = [
  { name: 'Joyeux', adj: 'joyeux', days: 'Lundi · samedi', m: [
    ["L'Annonciation", 'Lc 1, 26-38', "L'humilité", "L'ange Gabriel annonce à Marie qu'elle sera la mère du Sauveur. Elle répond : « Qu'il me soit fait selon ta parole. »"],
    ['La Visitation', 'Lc 1, 39-56', 'La charité fraternelle', "Marie se hâte vers sa cousine Élisabeth. L'enfant tressaille en son sein, et Marie chante le Magnificat."],
    ['La Nativité', 'Lc 2, 1-20', "L'esprit de pauvreté", "Jésus naît à Bethléem et est couché dans une mangeoire. Les bergers viennent l'adorer."],
    ['La Présentation au Temple', 'Lc 2, 22-40', "L'obéissance", 'Marie et Joseph présentent Jésus au Temple. Syméon reconnaît en lui la lumière des nations.'],
    ['Le Recouvrement au Temple', 'Lc 2, 41-52', 'La recherche de Dieu', 'Après trois jours de recherche, Marie et Joseph retrouvent Jésus au Temple, parmi les docteurs.']] },
  { name: 'Lumineux', adj: 'lumineux', days: 'Jeudi', m: [
    ['Le Baptême de Jésus au Jourdain', 'Mt 3, 13-17', "La docilité à l'Esprit", "Jésus est baptisé par Jean. L'Esprit descend sur lui et le Père le désigne comme son Fils bien-aimé."],
    ['Les Noces de Cana', 'Jn 2, 1-12', 'La confiance en Marie', "À Cana, sur la demande de Marie, Jésus change l'eau en vin. « Tout ce qu'il vous dira, faites-le. »"],
    ["L'Annonce du Royaume", 'Mc 1, 14-15', 'La conversion', 'Jésus proclame que le Règne de Dieu est tout proche et appelle à la conversion.'],
    ['La Transfiguration', 'Lc 9, 28-36', 'Le désir de sainteté', 'Sur la montagne, Jésus est transfiguré devant Pierre, Jacques et Jean. « Écoutez-le. »'],
    ["L'Institution de l'Eucharistie", 'Mt 26, 26-29', "L'adoration", 'La veille de sa Passion, Jésus donne son corps et son sang sous les signes du pain et du vin.']] },
  { name: 'Douloureux', adj: 'douloureux', days: 'Mardi · vendredi', m: [
    ["L'Agonie à Gethsémani", 'Lc 22, 39-46', 'La contrition', 'Au jardin, Jésus prie dans l\'angoisse : « Que ta volonté soit faite, et non la mienne. »'],
    ['La Flagellation', 'Jn 19, 1', 'La pureté', 'Pilate fait flageller Jésus, livré aux soldats.'],
    ["Le Couronnement d'épines", 'Mt 27, 27-31', 'Le courage', 'Les soldats tressent une couronne d\'épines et se moquent de Jésus, roi des Juifs.'],
    ['Le Portement de la croix', 'Jn 19, 17', 'La patience', 'Jésus porte sa croix jusqu\'au lieu dit du Crâne, le Golgotha.'],
    ['La Crucifixion', 'Lc 23, 33-46', 'Le don de soi', 'Jésus meurt sur la croix : « Père, entre tes mains je remets mon esprit. »']] },
  { name: 'Glorieux', adj: 'glorieux', days: 'Mercredi · dimanche', m: [
    ['La Résurrection', 'Mc 16, 1-8', 'La foi', 'Au matin de Pâques, les femmes trouvent le tombeau vide. Le Christ est ressuscité.'],
    ["L'Ascension", 'Ac 1, 6-11', "L'espérance", 'Quarante jours après Pâques, Jésus est élevé au ciel sous les yeux des apôtres.'],
    ['La Pentecôte', 'Ac 2, 1-13', 'Le zèle apostolique', "L'Esprit Saint descend sur les apôtres réunis avec Marie au Cénacle."],
    ["L'Assomption", 'Ap 12, 1', "La grâce d'une bonne mort", 'Au terme de sa vie terrestre, Marie est élevée corps et âme dans la gloire du ciel.'],
    ['Le Couronnement de Marie', 'Ap 12, 1-6', 'La persévérance', 'Marie est couronnée Reine du ciel et de la terre.']] },
];

/** Mystères de chaque jour de la semaine (dimanche = 0). */
const DAYSET = [3, 0, 2, 3, 1, 2, 0];
export const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
export const ORD = ['1ᵉʳ', '2ᵉ', '3ᵉ', '4ᵉ', '5ᵉ'];
export const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
export const INTRO_AVE = ['Pour la foi', "Pour l'espérance", 'Pour la charité'];

export type PrayerKey = 'signe' | 'credo' | 'pater' | 'ave' | 'gloria' | 'fatima' | 'intention' | 'amen' | 'salve';
/** [titre, texte] ; « \n » sépare les paragraphes. */
export const T: Record<PrayerKey, [string, string]> = {
  signe: ['Signe de la croix', 'Au nom du Père, et du Fils, et du Saint-Esprit. Amen.'],
  credo: ['Je crois en Dieu', "Je crois en Dieu, le Père tout-puissant, créateur du ciel et de la terre. Et en Jésus-Christ, son Fils unique, notre Seigneur, qui a été conçu du Saint-Esprit, est né de la Vierge Marie, a souffert sous Ponce Pilate, a été crucifié, est mort et a été enseveli, est descendu aux enfers, le troisième jour est ressuscité des morts, est monté aux cieux, est assis à la droite de Dieu le Père tout-puissant, d'où il viendra juger les vivants et les morts.\nJe crois en l'Esprit Saint, à la sainte Église catholique, à la communion des saints, à la rémission des péchés, à la résurrection de la chair, à la vie éternelle. Amen."],
  pater: ['Notre Père', "Notre Père, qui es aux cieux, que ton nom soit sanctifié, que ton règne vienne, que ta volonté soit faite sur la terre comme au ciel. Donne-nous aujourd'hui notre pain de ce jour. Pardonne-nous nos offenses, comme nous pardonnons aussi à ceux qui nous ont offensés. Et ne nous laisse pas entrer en tentation, mais délivre-nous du Mal. Amen."],
  ave: ['Je vous salue Marie', "Je vous salue, Marie, pleine de grâce ; le Seigneur est avec vous. Vous êtes bénie entre toutes les femmes, et Jésus, le fruit de vos entrailles, est béni. Sainte Marie, Mère de Dieu, priez pour nous, pauvres pécheurs, maintenant et à l'heure de notre mort. Amen."],
  gloria: ['Gloire au Père', 'Gloire au Père, et au Fils, et au Saint-Esprit, comme il était au commencement, maintenant et toujours, pour les siècles des siècles. Amen.'],
  fatima: ['Prière de Fatima', "Ô mon Jésus, pardonnez-nous nos péchés, préservez-nous du feu de l'enfer, et conduisez au Ciel toutes les âmes, spécialement celles qui ont le plus besoin de votre miséricorde."],
  intention: ['Intention de la dizaine', 'Confiez à Marie une intention pour cette dizaine.\nPour vous-même, pour votre famille et vos amis, pour ceux qui souffrent, pour le Pape, les évêques et les prêtres, pour les défunts, pour une personne en particulier, pour vos ennemis.'],
  amen: ['Amen', 'Le chapelet est achevé. Rendons grâce à Dieu.'],
  salve: ['Salut, ô Reine', "Salut, ô Reine, Mère de miséricorde, notre vie, notre douceur, notre espérance, salut ! Enfants d'Ève, exilés, nous crions vers vous ; vers vous nous soupirons, gémissant et pleurant dans cette vallée de larmes.\nÔ vous, notre avocate, tournez vers nous vos regards miséricordieux. Et, après cet exil, montrez-nous Jésus, le fruit béni de vos entrailles. Ô clémente, ô miséricordieuse, ô douce Vierge Marie."],
};

/** Image des grains de chaque dizaine (couleurs missionnaires). */
export const BEAD_IMG = ['vert', 'rouge', 'jaune', 'bleu', 'violet'] as const;
export const DECADE_COLORS = ['#5FA77A', '#D2574E', '#E2BE6E', '#5E8BD6', '#9C6FD0'];

/* ---------- Réglages ---------- */

export const DEFAULT_CFG = { signe: true, credo: true, introAve: true, annonce: true, fruit: true, evangile: false, intention: false, clausule: false, gloria: true, fatima: true, salve: true, signeFin: false, calendrier: true, abrege: false, anneau: true };
export type Cfg = typeof DEFAULT_CFG;
export type CfgKey = keyof Cfg;

/** [titre du groupe, [clé, nom, aide][]] */
export const GROUPS: [string, [CfgKey, string, string][]][] = [
  ['Sur la croix et le pendentif', [['signe', 'Signe de la croix', 'Sur la croix, avant le Credo'], ['credo', 'Je crois en Dieu', 'Symbole des Apôtres'], ['introAve', 'Notre Père, 3 Ave et Gloria', 'Les 3 Ave pour les vertus théologales']]],
  ['Avant chaque dizaine', [['annonce', 'Rappel du mystère', "Se remettre en mémoire l'épisode médité"], ['fruit', 'Fruit du mystère', 'À demander tout au long de la dizaine'], ['evangile', "Passage de l'Évangile", 'Lire quelques versets avant de réciter'], ['intention', 'Intention de la dizaine', 'Confier une intention à Marie']]],
  ['Pendant la dizaine', [['clausule', 'Clausules', 'De Jean-Paul II : une phrase sur le mystère à chaque Ave'], ['gloria', 'Gloire au Père', 'Après le dixième Ave'], ['fatima', 'Prière de Fatima', '« Ô mon Jésus… », dite par certains']]],
  ['Mystères du jour', [['calendrier', "Dimanches de l'Avent et du Carême", "Joyeux pendant l'Avent, douloureux pendant le Carême"]]],
  ['Pour terminer', [['salve', 'Salut, ô Reine', 'Salve Regina'], ['signeFin', 'Signe de la croix', 'Pour clore la prière']]],
  ['Affichage', [['abrege', 'Ave abrégés', 'Premières paroles seulement, après le premier Ave'], ['anneau', 'Chapelet animé', 'Halo, lumière et texte qui apparaît mot à mot']]],
];

/** Clausules de Jean-Paul II : [mystères][mystère][Ave]. */
export const CL: string[][][] = [[["dont Gabriel annonce la venue","qui est le fils bien-aimé de Dieu","qui vient en toi par l'Esprit Saint","dont tu es la Mère toujours Vierge","qui s'incarne pour nous sauver","en qui s'accomplissent toutes les promesses","qui se fait homme pour que nous devenions enfants de Dieu","que tu portes en toi avec amour","qui désire vivre en nous","que nous devons aimer en nos frères"],["que tu portes en toi chez Elisabeth","qui te transporte d’allégresse","qui apporte la joie à Elisabeth","qui fait tressaillir de joie Jean-Baptiste","qui t’inspire le Magnificat","qui a fait pour toi des merveilles","qui renverse les puissants et élève les humbles","qui comble de biens les affamés","qui donne la joie à ceux qui l’aiment","que nous devons servir en nos frères"],["petit bébé dans la crèche","image du Dieu invisible","né pour nous à Bethléem","que tu couches dans la mangeoire","que tu adores avec Joseph","dont les anges annoncent la naissance","que les bergers viennent adorer","devant qui se prosternent les mages","qui se fait pauvre pour nous détacher des richesses","qui se fait tout petit pour nous apprendre l’humilité"],["que tu présentes au Temple","qui s’offre à son Père","que Siméon poussé par l’Esprit, vient adorer","en qui Siméon reconnaît le Sauveur","qui est la gloire d’Israël","qui est la lumière des nations","qui sera pour toujours un signe de contradiction","dont Siméon te fait entrevoir la Passion","en qui la prophétesse Anne voit le libérateur","que l’Esprit Saint révèle à ceux qui prient"],["qui vient prier au temple avec toi et Joseph","qui reste au temple à votre insu","qui s’occupe des affaires de son Père","qui nous apprend à chercher d’abord le Royaume des Cieux","dont la sagesse étonne les docteurs de la Loi","que Joseph et toi cherchiez avec angoisse","qui, à douze ans, éprouve votre foi","qui se soumet à toi et à Joseph","avec qui tu as vécu cachée à Nazareth","dont tu médites les paroles en ton cœur"]],[["qui reçoit le baptême de Jean dans le Jourdain","qui a voulu s’assimiler à l’humanité pécheresse","qui a pris sur lui tous les péchés du monde","à qui le Ciel ouvert vient rendre témoignage","sur qui vient reposer l’Esprit","qui entend la voix du Père","reconnu par le Père comme son Fils bien-aimé","qui a toute la faveur du Père","en qui le Père met tout son amour","qui nous ouvre à la vie nouvelle d’enfants de Dieu"],["qui est invité au repas de noce","à qui sa mère dit : « ils n’ont plus de vin »","qui dit à Marie « femme, qu’y a-t-il entre toi et moi ? »","dont l’heure n’est pas encore venue","que Marie nous invite à suivre en disant : « faites tout ce qu’il vous dira »","qui fit remplir les urnes avec de l’eau","qui a changé l’eau en vin","qui manifeste sa Gloire par ce premier miracle","qui vient sceller par son sang une alliance nouvelle","qui nous prépare au repas des noces de l’Agneau"],["qui vient nous annoncer la Bonne Nouvelle","qui nous appelle au repentir et à la foi","qui est venu pardonner nos péchés","qui nous enseigne la voie des béatitudes","qui est venu pour nous guérir","qui a ouvert les yeux des aveugles","qui a fait marcher les paralytiques","qui a purifié les lépreux","qui chasse les démons","qui nous enseigne la loi du pardon"],["qui invite Pierre, Jacques et Jean sur la montage","qui est transfiguré durant sa prière","qui devient d’une blancheur fulgurante","que les apôtres contemplent dans sa gloire","qui est entouré de Moïse et d’Elie","qui entend la bénédiction du Père","de qui le Père dit : « Celui-ci est mon fils bien-aimé, écoutez-le »","qui fortifie la foi des apôtres en vue de sa Passion","qui nous prépare à la révélation de sa gloire","qui partagera sa gloire éternelle avec nous"],["qui célèbre la Pâque avec ses disciples","qui bénit le pain et la coupe en rendant grâce","qui dit « Ceci est mon corps livré pour vous »","qui dit « Ceci est mon sang versé pour vous »","qui célèbre la nouvelle Alliance en son sang","qui nous dit « Faites ceci en mémoire de moi »","qui se fait nourriture pour les hommes","qui est le véritable agneau pascal","qui nous invite au banquet du Royaume","qui demeure pour toujours visible en son eucharistie"]],[["qui prend sur lui tous nos péchés","dont l’âme est triste à en mourir","qui prie dans l’angoisse","qui nous invite à veiller et à prier avec lui","qui dit \" Père, non pas ma volonté mais ta volonté\"","dont la sueur devint comme des gouttes de sang","qu’un ange vient réconforter","qui se laisse arrêter comme un agneau","que Judas trahit par un baiser","qui demande à Pierre de ne pas prendre l’épée"],["le plus beau des enfants des hommes","qui est flagellé jusqu’au sang","dont le corps devient une plaie","qui verse son sang pour laver nos péchés","qui nous purifie par sa chair flagellée","qui n’ouvre pas la bouche pour se plaindre","Agneau de Dieu, immolé pour nous sauver","dont les meurtrissures nous guérissent","qui est encore torturé dans tous les opprimés","ton enfant bien-aimé écorché"],["qui est notre seul roi","humilié pour expier notre orgueil","que les soldats couronnent d’épines","dont la face ruisselle de sang","dont le visage est couvert de crachats","qui se tait devant les insultes","toujours doux et humble de cœur","toujours miséricordieux","qui soutient les persécutés","qui nous apprend la véritable humilité"],["dont Pilate proclame l’innocence","condamné à mort et chargé de sa croix","qui tombe trois fois sous le poids de la croix","qui se relève pour nous apprendre à nous relever de nos fautes","que tu rencontres sur la route du calvaire","avec qui tu souffres pour notre salut","que Simon de Cyrène aide à porter sa croix","qui imprime sa face sur le voile de Véronique","qui nous invite à pleurer sur nos péchés","qui nous apprend à porter notre croix"],["dépouillé de ses vêtements","crucifié entre deux malfaiteurs","qui crie : « J’ai soif »","qui dit : « Père, pardonne-leur ; ils ne savent pas ce qu’ils font »","qui te demande d’être notre mère","qui promet le paradis au bon larron","qui remet son esprit entre les mains de son Père","qui meurt d’amour pour nous","dont le côté est transpercé","qui, élevé de terre, attire tout à lui"]],[["qui sort glorieux du tombeau","dont les anges annoncent la résurrection","dont Pierre et Jean trouvent le tombeau vide","qui t’apparaît après sa résurrection","qui apparaît à Marie-Madeleine","qui chemine avec les disciples d’Emmaüs","qui apparaît aux apôtres","qui montre ses plaies à Thomas","qui confie son Église à Pierre","qui a vaincu la mort"],["qui monte glorieux au Ciel","qui règne glorieux à la droite du Père","qui nous prépare une place auprès de lui","qui demeure pour toujours avec nous","qui nous appelle à faire des disciples de toutes les nations","qui nous parle par les Ecritures","qui vient en nous par l’Eucharistie","qui est au milieu de nous quand nous sommes réunis en son nom","qui nous attire vers le Ciel","qui reviendra dans la Gloire pour juger tous les hommes"],["qui envoie le Saint Esprit aux apôtres","dont l’Esprit descend comme des langues de feu","dont l’Esprit éclaire les apôtres","dont l’Esprit soutient le courage des apôtres","dont l’Esprit comble de joie les apôtres","qui nous donne l’Esprit de Lumière","qui nous veut assidus à la prière","dont l’Esprit anime toute l’Eglise","qui nous envoie porter l’Evangile à nos frères","dont l’Esprit se répandra sur toute chair"],["qui nous a donné sa mère","qui te préserve de la corruption du tombeau","qui t’élève corps et âme dans sa gloire","qui te fait entrer dans la joie du Père","à qui tu chantes pour toujours ton amour","qui t’élève au-dessus des anges","qui fait de ton assomption un signe d’espérance pour tous les hommes","qui tourne nos désirs vers les réalités éternelles","qui nous ressuscitera tous à la fin des temps","qui donne la vie éternelle"],["qui te couronne reine du Ciel","qui fait de toi la reine des apôtres","qui fait de toi la reine des martyrs","qui fait de toi la reine des vierges","qui fait de toi la reine de tous les saints","qui fait de toi la reine de l’Eglise","qui fait de toi le secours des chrétiens","qui fait de toi la consolatrice des affligés","qui fait de toi le refuge des pécheurs","qui fait de toi la médiatrice de toutes grâces"]]];

/* ---------- Déroulé ---------- */

/** Une étape de la prière. d : -1 ouverture, 0-4 dizaines, 5 conclusion ; n : numéro de l'Ave. */
export interface Step {
  k: PrayerKey | 'myst';
  d: number;
  n?: number;
}

export function build(c: Cfg): Step[] {
  const s: Step[] = [];
  (['signe', 'credo'] as const).forEach((k) => c[k] && s.push({ k, d: -1 }));
  if (c.introAve) s.push({ k: 'pater', d: -1 }, { k: 'ave', d: -1, n: 1 }, { k: 'ave', d: -1, n: 2 }, { k: 'ave', d: -1, n: 3 }, { k: 'gloria', d: -1 });
  for (let d = 0; d < 5; d++) {
    if (c.annonce || c.evangile || c.fruit) s.push({ k: 'myst', d });
    if (c.intention) s.push({ k: 'intention', d });
    s.push({ k: 'pater', d });
    for (let n = 1; n <= 10; n++) s.push({ k: 'ave', d, n });
    if (c.gloria) s.push({ k: 'gloria', d });
    if (c.fatima) s.push({ k: 'fatima', d });
  }
  if (c.salve) s.push({ k: 'salve', d: 5 });
  if (c.signeFin) s.push({ k: 'signe', d: 5 });
  if (!s.some((x) => x.d === 5)) s.push({ k: 'amen', d: 5 });
  return s;
}

/** Grain du chapelet sur lequel se dit l'étape. */
export function beadOf(st: Step): string {
  if (st.d === -1) return st.k === 'pater' ? 'pp' : st.k === 'ave' ? `pa${st.n! - 1}` : st.k === 'gloria' ? 'medal' : 'cross';
  if (st.d === 5) return st.k === 'signe' ? 'cross' : 'medal';
  if (st.k === 'myst' || st.k === 'pater' || st.k === 'intention') return st.d === 0 ? 'medal' : `L${st.d}`;
  if (st.k === 'ave') return `a${st.d}_${st.n}`;
  return st.d < 4 ? `L${st.d + 1}` : 'medal';
}

/* ---------- Géométrie (repère 600 × 780) ---------- */

export const VW = 600;
export const VH = 780;
export const MX = 300;
export const MY = 478;
const CX = 300, CY = 262, RX = 228, RY = 222, T0 = 2.25;

export interface Bead {
  id: string;
  x: number;
  y: number;
  /** Décennie des Ave (absente pour les grains du Notre Père et du pendentif). */
  d?: number;
  big?: boolean;
  /** Part du pendentif parcourue à ce grain. */
  pf?: number;
}

function geometry() {
  const pts: [number, number][] = [[MX, MY]];
  const L = [CX + RX * Math.sin(-T0), CY - RY * Math.cos(-T0)];
  for (let i = 1; i <= 24; i++) pts.push([MX + ((L[0] - MX) * i) / 24, MY + ((L[1] - MY) * i) / 24]);
  for (let i = 1; i <= 240; i++) {
    const t = -T0 + (2 * T0 * i) / 240;
    pts.push([CX + RX * Math.sin(t), CY - RY * Math.cos(t)]);
  }
  const R = pts[pts.length - 1];
  for (let i = 1; i <= 24; i++) pts.push([R[0] + ((MX - R[0]) * i) / 24, R[1] + ((MY - R[1]) * i) / 24]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1];
  const at = (len: number) => {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < len) i++;
    const f = (len - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
  };
  const seq: { id: string; d?: number; big?: boolean; u: number }[] = [];
  let u = 1.9;
  for (let d = 0; d < 5; d++) {
    if (d > 0) {
      u += 1.75;
      seq.push({ id: `L${d}`, big: true, u });
      u += 1.75;
    }
    for (let n = 1; n <= 10; n++) {
      seq.push({ id: `a${d}_${n}`, d, u });
      if (n < 10) u += 1;
    }
  }
  u += 1.9;
  /** Part de la boucle parcourue à chaque grain. */
  const frac: Record<string, number> = { medal: 0 };
  const loopBeads: Bead[] = seq.map((b) => {
    const [x, y] = at((b.u / u) * total);
    frac[b.id] = b.u / u;
    return { id: b.id, d: b.d, big: b.big, x, y };
  });
  const pend: Bead[] = [
    { id: 'pa2', x: 291, y: 532, pf: 0.77 },
    { id: 'pa1', x: 282, y: 566, pf: 0.63 },
    { id: 'pa0', x: 287, y: 600, pf: 0.49 },
    { id: 'pp', x: 304, y: 642, big: true, pf: 0.3 },
  ];
  const beads = loopBeads.concat(pend);
  const loop = 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');
  // Part de la croix (anneau du crucifix) et monte jusqu'à la médaille
  const pendP = 'M328 709 C323 697 310 668 306 645 S283 600 283 580 S292 510 300 478';
  return { beads, loop, pendP, frac, pos: Object.fromEntries(beads.map((b) => [b.id, b])) as Record<string, Bead> };
}
export const GEO = geometry();

/** Petites lueurs qui montent autour du chapelet (positions en %). */
export const PARTICLES = Array.from({ length: 22 }, (_, k) => {
  const a = (((k * 137.5) % 360) * Math.PI) / 180;
  const r = 18 + ((k * 53) % 26);
  return { x: 50 + Math.cos(a) * r, y: 34 + Math.sin(a) * r * 0.9, s: 1.5 + (k % 3) };
});

/* ---------- Mystères du jour ---------- */

function easter(y: number) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mo = Math.floor((h + l - 7 * m + 114) / 31);
  return new Date(y, mo - 1, ((h + l - 7 * m + 114) % 31) + 1);
}

/** Mystères du jour ; avec `cal`, joyeux les dimanches de l'Avent et douloureux ceux du Carême. */
export function todaySet(cal = true, now = new Date()) {
  const t = new Date(now);
  t.setHours(0, 0, 0, 0);
  const wd = t.getDay();
  if (cal && wd === 0) {
    const y = t.getFullYear(), ea = easter(y), ash = new Date(ea);
    ash.setDate(ea.getDate() - 46);
    if (t >= ash && t < ea) return 2;
    const xmas = new Date(y, 11, 25), adv = new Date(xmas);
    adv.setDate(25 - (xmas.getDay() || 7) - 21);
    if (t >= adv && t < xmas) return 0;
  }
  return DAYSET[wd];
}
