import type { BuildMessages } from '../build-messages.ts';

const plural = (n: number, one: string, many: string) =>
  `${n} ${n > 1 ? many : one}`;

/** The build workspace's strings in French. Same shape as `../build-messages.ts`. */
export const buildMessages: BuildMessages = {
  workspace: {
    status: { ok: 'Compatible', warn: 'À vérifier', fail: 'Problème' },
    slotTags: {
      processor: 'CPU',
      cooler: 'Ventirad',
      board: 'Carte',
      memory: 'RAM',
      storage: 'Stockage',
      graphics: 'GPU',
      power: 'Alim',
    },
    explorer: 'Explorateur',
    panels: 'Panneaux du montage',
    parts: 'Pièces',
    checks: 'Vérifications',
    hidePanels: 'Masquer les panneaux',
    showPanels: 'Afficher les panneaux',
    hideParts: 'Masquer les pièces',
    showParts: 'Afficher les pièces',
    slotCount: (n) => plural(n, 'emplacement', 'emplacements'),
    fixedCase:
      'Le boîtier reste le même dans tous les montages : une tour ATX avec des entretoises pour cartes ATX et micro-ATX, de la place pour une carte graphique de 420 mm et trois ventilateurs avant de 120 mm.',
    compatibility: 'Compatibilité',
    hideCompatibility: 'Masquer la compatibilité',
    showCompatibility: 'Afficher la compatibilité',
    checkCount: (n) => plural(n, 'vérification', 'vérifications'),
    figuresNote:
      'Les chiffres sont ceux publiés par chaque fabricant, ou des mesures du boîtier modélisé. Une alimentation sous une recommandation peut tout de même faire tourner la machine ; une alimentation sous un minimum déclaré n’est pas prise en charge par le fabricant de la carte.',
    restore: 'Revenir au montage d’origine',
    fitting: 'Mise en place des pièces…',
    shareTitle: 'Copier un lien vers ce montage',
    copied: 'Copié',
    share: 'Partager votre montage',
    linkCopied: 'Lien copié dans le presse-papiers',
    copyLink: 'Copiez ce lien',
    copiedHint:
      'Collez-le dans un message ou une publication. Toute personne qui l’ouvre voit ce montage, pièce par pièce.',
    copyBlocked:
      'Le navigateur n’a pas autorisé la copie : le lien est sélectionné pour que vous le copiiez.',
    filterByMaker: (slot) => `Filtrer « ${slot} » par fabricant`,
    allOptions: (n) => `Tous (${n})`,
    options: (slot) => `Choix pour « ${slot} »`,
    conflicts: 'Incompatible',
    slots: 'Emplacements',
    verdict: (flagged) =>
      `Compatibilité : ${
        flagged
          ? `${plural(flagged, 'point', 'points')} à examiner`
          : 'tout fonctionne'
      }`,
    ratedDraw: 'Consommation nominale',
    ofWatts: (watts) => `sur ${watts} W`,
    groups: {
      fail: 'Problèmes à corriger',
      warn: 'À vérifier',
      ok: 'Réussies',
    },
    counts: { fail: 'à corriger', warn: 'à vérifier', ok: 'réussies' },
    allPass: (n) => `Les ${n} vérifications sont réussies`,
    passing: (n) =>
      `${plural(n, 'vérification réussie', 'vérifications réussies')}`,
    allWork: 'Tout fonctionne ensemble',
    worksWith: (n) =>
      `Compatible, avec ${plural(n, 'point', 'points')} à vérifier`,
    toFix: (n) => `${plural(n, 'problème', 'problèmes')} à corriger`,
    passCount: (ok, total) =>
      `${ok} vérification${ok > 1 ? 's' : ''} sur ${total} réussie${ok > 1 ? 's' : ''}`,
    change: (slot) => `Changer : ${slot}`,
  },
  facts: {
    radiator: (mm) => `Radiateur ${mm} mm`,
    cardRoom: (mm) => `Place pour la carte ${mm} mm`,
    tall: (mm) => `${mm} mm de haut`,
    sata25: 'SATA 2,5 pouces',
    lengthOf: (length, room) => `${length} sur ${room} mm`,
    modular: 'Modulaire',
    fixedCables: 'Câbles fixes',
    sixteenPinLead: 'Câble 12V-2x6',
    drawOf: (draw, watts) => `${draw} sur ${watts} W nominaux`,
  },
  checks: {
    socketFits: 'Le processeur va dans le socket',
    socketFitsDetail: (cpu, board) =>
      `Le ${cpu.name} est un processeur ${cpu.socket}, et la ${board.name} a un socket ${board.socket}.`,
    socketMisfit: 'Le processeur ne va pas dans le socket',
    socketMisfitDetail: (cpu, board) =>
      `Le ${cpu.name} demande un socket ${cpu.socket}. La ${board.name} a un socket ${board.socket} : le processeur reste dans sa boîte et le socket garde son capot.`,
    radiatorFits: 'Le radiateur tient en façade du boîtier',
    radiatorTooLong: 'Le radiateur est trop long pour le boîtier',
    radiatorDetail: (radiator, room) =>
      `Le radiateur de ${radiator.length} mm accueille ${radiator.fans} ventilateurs de 120 mm. Le boîtier en a ${room.frontFans} derrière la façade, et ${room.roof} mm entre la carte mère et le plafond, trop peu pour un radiateur et ses ventilateurs.`,
    towerFits: 'Le ventirad tient sous le panneau latéral',
    towerTooTall: 'Le ventirad est trop haut pour le boîtier',
    towerDetail: (height, room) =>
      `La tour dépasse de ${height} mm au-dessus de la carte mère, et le boîtier offre environ ${room} mm jusqu’à la vitre latérale.`,
    boardFits: 'La carte mère tient dans le boîtier',
    boardMisfit: 'La carte mère ne tient pas dans le boîtier',
    boardDetail: (board, boards) =>
      `La ${board.name} est une carte ${board.formFactor} de ${board.size[0]} × ${board.size[1]} mm, et le boîtier a des entretoises pour cartes ${boards.join(' et ')}.`,
    memoryFits: 'La mémoire va dans les emplacements',
    memoryFitsDetail: (ram, board) =>
      `${plural(ram.modules, `module ${ram.generation}`, `modules ${ram.generation}`)} dans les quatre emplacements ${board.memory} de la carte mère.`,
    memoryMisfit: 'La mémoire ne va pas dans les emplacements',
    memoryMisfitDetail: (ram, board) =>
      `L’encoche d’un module ${ram.generation} n’est pas au même endroit que celle d’un emplacement ${board.memory} : impossible de l’enfoncer. Les emplacements restent vides.`,
    speedProfile: (speed) =>
      `Le kit atteint la DDR5-${speed} grâce à son profil XMP ou EXPO, qui le pousse au-delà de la spécification du processeur.`,
    speedRated: 'La vitesse mémoire respecte la spécification publiée',
    speedUnrated: (maker, cpu, modules) =>
      `${maker} spécifie le ${cpu.name} jusqu’à la DDR5-${cpu.memorySpeed[2]} et ne publie pas de chiffre distinct pour ${modules} modules.`,
    speedRating: (maker, cpu) =>
      `${maker} spécifie le ${cpu.name} en DDR5-${cpu.memorySpeed[2]} avec deux modules simple rang${cpu.memorySpeed[4] ? ` et en DDR5-${cpu.memorySpeed[4]} avec quatre` : ''}.`,
    speedSlower: 'Quatre modules tournent moins vite',
    speedSlowerDetail: (rated) =>
      `Avec tous les emplacements remplis, ce profil a peu de chances de tenir : attendez-vous à une mémoire plus proche de la DDR5-${rated}.`,
    speedWithin: 'La vitesse mémoire est atteignable',
    lengthRadiator: (length, thickness) =>
      `Avec le radiateur derrière les ventilateurs avant, cela fait ${length} mm moins ses ${thickness} mm.`,
    lengthFits: 'La carte graphique tient dans le boîtier',
    lengthFitsDetail: (length, room) =>
      `${length} mm de long, et le boîtier accepte des cartes jusqu’à environ ${room} mm.`,
    lengthTooLong: 'La carte graphique est trop longue pour le boîtier',
    lengthTooLongDetail: (length, room) =>
      `${length} mm de long, mais le boîtier n’accepte qu’environ ${room} mm.`,
    supplyDetail: (gpu, psu) =>
      `${gpu.psuSource} indique ${gpu.psu} W comme alimentation ${gpu.psuKind === 'minimum' ? 'minimale' : 'recommandée'} pour la ${gpu.name}. La ${psu.name} fournit ${psu.watts} W nominaux.`,
    supplyMeets: 'L’alimentation atteint le chiffre du fabricant de la carte',
    supplyBelowMinimum: 'L’alimentation est sous le minimum de la carte',
    supplyBelowRecommendation:
      'L’alimentation est sous la recommandation du fabricant de la carte',
    cableMatches: 'Le câble d’alimentation correspond à la carte',
    eightPinDetail: (psu) =>
      `La carte prend un câble PCIe 8 broches, et la ${psu.name} en a ${psu.eightPin}.`,
    noLead: 'Aucun câble pour la carte',
    noEightPinDetail: (psu) =>
      `La carte prend un câble PCIe 8 broches, et la ${psu.name} n’en a aucun.`,
    sixteenPinDetail: (psu) =>
      `La carte prend un câble 16 broches 12V-2x6, que la ${psu.name} possède.`,
    noSixteenPin: 'Aucun câble 16 broches pour la carte',
    noSixteenPinDetail: (psu) =>
      `La ${psu.name} n’a que des câbles PCIe 8 broches, et la carte a une prise 16 broches 12V-2x6. Il faut un câble 12V-2x6 ou un adaptateur.`,
    needsAdapter: 'La carte a besoin de son adaptateur',
    adapterDetail: (psu, adapter) =>
      `La ${psu.name} n’a pas de câble 16 broches 12V-2x6. La carte est livrée avec un adaptateur ${adapter.name}, et l’alimentation a ${plural(psu.eightPin, 'câble PCIe 8 broches', 'câbles PCIe 8 broches')} pour le brancher.`,
    adapterShort: 'Pas assez de câbles pour l’adaptateur de la carte',
    adapterShortDetail: (psu, adapter) =>
      `La ${psu.name} n’a pas de câble 16 broches 12V-2x6, et l’adaptateur ${adapter.name} de la carte demande ${adapter.leads} câbles alors que l’alimentation en a ${psu.eightPin}.`,
    m2: 'Le SSD M.2 se loge dans l’emplacement M.2 de la carte mère et s’alimente par lui.',
    driveFits: 'Le SSD tient sur la carte mère',
    noCables: 'Le montage ne demande aucun câble de disque.',
    drivesConnected: 'Les deux disques sont branchés',
    sataDetail: (psu) =>
      `Le SSD SATA prend un câble de données vers l’un des ports SATA de la carte mère et un câble d’alimentation de la ${psu.name}, qui a ${plural(psu.sata, 'connecteur d’alimentation SATA', 'connecteurs d’alimentation SATA')}.`,
    noSataLead: 'Aucun câble d’alimentation pour le disque SATA',
    noSataLeadDetail: (psu) =>
      `Le SSD SATA a besoin d’un câble d’alimentation SATA, et la ${psu.name} n’en a aucun.`,
    unseated: (cpu) =>
      `Le ${cpu.name} est compté comme choisi, bien qu’il n’aille pas sur cette carte mère.`,
    budgetDetail: (cpu, gpu, psu) =>
      `${cpu.watts} W (${cpu.wattsLabel}) plus ${gpu.watts} W pour la carte graphique font ${cpu.watts + gpu.watts} W, pour ${psu.watts} W disponibles. La mémoire, les disques, les ventilateurs et les pics brefs s’y ajoutent.`,
    budgetWithin:
      'Le processeur et la carte restent dans la puissance de l’alimentation',
    budgetOver:
      'Le processeur et la carte dépassent la puissance de l’alimentation',
  },
};
