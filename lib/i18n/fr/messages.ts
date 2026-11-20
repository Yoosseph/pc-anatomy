import type { Messages } from '../messages.ts';
import { specLabels } from './spec-labels.ts';

const plural = (n: number, one: string, many: string) =>
  `${n} ${n > 1 ? many : one}`;

/** L’interface en français. Même forme que `en` dans `../messages.ts`. */
export const messages: Messages = {
  common: {
    on: 'Oui',
    off: 'Non',
    show: (what) => `Afficher ${what}`,
    hide: (what) => `Masquer ${what}`,
  },
  language: {
    label: 'Langue',
  },
  categories: {
    Chassis: 'Boîtier',
    Cooling: 'Refroidissement',
    Board: 'Cartes',
    Power: 'Alimentation',
    Memory: 'Mémoire',
    Storage: 'Stockage',
    Compute: 'Calcul',
    Graphics: 'Graphisme',
  },
  branches: {
    Cooling: 'Refroidissement',
    GPU: 'Carte graphique',
    Memory: 'Mémoire',
    Motherboard: 'Carte mère',
    'Power supply': 'Alimentation',
    Processor: 'Processeur',
    Storage: 'Stockage',
    'System board': 'Carte système',
    'Logic board': 'Carte logique',
    'Apple Silicon': 'Apple Silicon',
    Graphics: 'Graphisme',
    Battery: 'Batterie',
    Display: 'Écran',
  },
  specLabels,
  topbar: {
    reset: 'Réinitialiser PC Anatomy',
    github: 'PC Anatomy sur GitHub',
    createdBy: 'Créé par',
    feedback: 'Avis / Idée / Collaboration',
    feedbackShort: 'Avis',
    feedbackTitle:
      'Signaler une erreur, proposer une idée ou prendre contact pour collaborer',
    guide: 'Guide',
    guideTitle: 'Découvrir les composants d’un PC',
    toggleSystems: 'Afficher ou masquer les systèmes',
    findComponent: 'Trouver un composant',
    search: 'Rechercher',
    about: 'À propos',
    aboutLabel: 'À propos et sources',
    aboutTitle: 'À propos et crédits',
  },
  systems: {
    heading: 'SYSTÈMES VISIBLES',
    hideAll: 'Tout masquer',
    showAll: 'Tout afficher',
    showParts: (system) => `Afficher les composants : ${system}`,
    hideParts: (system) => `Masquer les composants : ${system}`,
  },
  about: {
    title: 'Du boîtier jusqu’à un cœur de calcul.',
    description:
      'PC Anatomy est un explorateur 3D interactif et gratuit du matériel informatique. Découvrez comment fonctionne un PC de bureau en inspectant et en démontant ses composants.',
    intro:
      'Partez d’une tour ATX assemblée, démontez-la, puis continuez : dans la carte mère, dans la carte graphique, et à travers le processeur GB202 jusqu’à un seul multiprocesseur de flux (SM). Chaque échelle est une branche dans laquelle on peut descendre, ou dont on peut ressortir.',
    modelsHeading: 'Deux types de modèles.',
    hardware: 'Le matériel',
    hardwareText:
      'est une géométrie mécanique originale et approximative. Le contour de la carte ATX, le pas des emplacements d’extension et l’ouverture des E/S arrière suivent le format publié. La RTX 5090, le Ryzen 9 9950X et le Core Ultra 9 285K sont des sujets nommés ; tout le reste est un exemple représentatif de sa famille de composants, pas la nomenclature d’une configuration précise.',
    silicon: 'Le silicium',
    siliconText:
      'montre l’architecture logique documentée. L’implantation exacte au niveau des transistors n’est pas publique. Un GB202 complet compte 192 SM ; la RTX 5090 en active 170. L’intérieur des GPC montre un cluster complet représentatif, et non une carte inventée des unités désactivées.',
    creditsHeading: 'Recherches et crédits',
    acceleration: 'Activer l’accélération matérielle du navigateur',
    guide:
      'Les composants d’un PC : guide illustré pour débutants (en anglais)',
    inspiration: 'Inspiration pour l’interaction · Human Atlas',
    source: 'Code source de PC Anatomy',
    foot: 'Aucune affiliation avec NVIDIA, AMD ou Intel. Aucun modèle 3D tiers. Recherches revues en septembre 2026.',
  },
  detail: {
    architecture: 'ARCHITECTURE',
    hardware: 'MATÉRIEL',
    close: 'Fermer les détails du composant',
    instance: (number) => `EXEMPLAIRE ${number}`,
    group: 'GROUPE DE COMPOSANTS',
    purpose: 'À quoi ça sert',
    partOf: 'Fait partie de',
    takeApart: (what) => `Démonter : ${what}`,
    showContext: 'Afficher le contexte',
    isolate: 'Isoler',
    focus: 'Cadrer',
    hide: 'Masquer',
    references: 'Références et architecture',
    referencesNote:
      'Les documents des fabricants et les normes décrivent cette famille de composants. La géométrie illustrative n’est pas un schéma de produit.',
  },
  search: {
    title: 'Trouver un composant',
    description:
      'Accédez directement à n’importe quel élément matériel ou d’architecture.',
    placeholder: 'Essayez Tensor, GDDR7, L2 ou SM…',
    empty: 'Aucun composant trouvé. Essayez « mémoire » ou « CUDA ».',
    matches: 'Structures correspondantes',
    suggested: 'Explorer le spécimen',
    logical: 'Architecture logique',
    physical: 'Matériel physique',
    browse: '↑ ↓ pour parcourir',
    inspect: 'Entrée pour inspecter',
  },
  stage: {
    hintTouch:
      'Touchez une pièce pour savoir ce que c’est et la démonter, ou appuyez sur Auto.',
    hintPointer:
      'Cliquez sur une pièce pour l’ouvrir, clic droit pour l’inspecter, ou appuyez sur Auto.',
    inventory: 'Inventaire des composants',
    separated: 'Ressources séparées',
    comingApart: 'Démontage en cours',
    hierarchy: 'Hiérarchie des composants',
    back: 'Remonter d’un niveau',
    dismissHint: 'Masquer l’astuce',
  },
  nav: {
    close: 'Fermer les systèmes',
    chooseSystem: 'Choisir un système',
    desktop: 'PC de bureau',
    laptops: 'Portables',
    mac: 'Mac',
    compare: 'Comparer des composants',
    build: 'Monter son PC',
    scale: 'Échelle d’exploration',
    placeholder: 'provisoire',
    scales: (n) => plural(n, 'échelle', 'échelles'),
    menuNote: (menu, scales, submenus) => {
      const dropdowns: Record<string, [string, string]> = {
        GPU: ['carte', 'cartes'],
        Memory: ['génération', 'générations'],
        Processor: ['processeur', 'processeurs'],
      };
      const products: Record<string, [string, string]> = {
        Motherboard: ['carte', 'cartes'],
        'Power supply': ['modèle', 'modèles'],
      };
      if (submenus > 0) {
        const [one, many] = dropdowns[menu] ?? ['modèle', 'modèles'];
        return `${plural(submenus, one, many)} · ${plural(scales, 'échelle', 'échelles')}`;
      }
      if (products[menu]) return plural(scales, ...products[menu]);
      return `${plural(scales, 'échelle', 'échelles')} à l’intérieur`;
    },
  },
  disassembly: {
    section: 'Contrôle de l’éclatement',
    slider: 'Démonter le spécimen',
    pauseAuto: 'Mettre en pause le démontage automatique',
    startAuto: 'Démonter automatiquement',
    pause: 'Pause',
    auto: 'Auto',
    expand: 'Déployer',
    disassemble: 'Démonter',
    dragOrPlay: 'GLISSER OU LANCER',
    percent: (n) => `${n} pour cent`,
    resetLabel: 'Réinitialiser la caméra et l’assemblage',
    reset: 'Réinitialiser',
  },
  power: {
    all: 'Tout',
    storage: 'Stockage',
    show: 'Afficher le flux d’alimentation',
    hide: 'Masquer le flux d’alimentation',
    toggle: 'Courant',
    toggleTitle: 'Suivre le courant de l’alimentation jusqu’à chaque composant',
    panel: 'Flux d’alimentation',
    heading: 'Suivre le courant',
    fromPsu: 'DEPUIS L’ALIMENTATION',
    less: 'Moins',
    details: 'Détails',
    destination: 'Destination du courant',
    inspect: (destination, route) => `Inspecter ${destination} : ${route}`,
    note: 'Les couleurs identifient les circuits. Les flèches indiquent le sens, pas la vitesse ni la puissance. Pointillés : courant qui passe par la carte mère.',
  },
  tools: {
    camera: 'Commandes de la caméra',
    views: {
      perspective: { short: '3D', name: 'Vue en perspective' },
      top: { short: 'DESSUS', name: 'Vue de dessus' },
      front: { short: 'FACE', name: 'Vue de face' },
      back: { short: 'ARRIÈRE', name: 'Vue arrière' },
    },
    fullscreenBlocked:
      'Le plein écran est bloqué par ce navigateur. Appuyez plutôt sur F11.',
    enterFullscreen: 'Passer en plein écran',
    exitFullscreen: 'Quitter le plein écran',
    airflow: 'Flux d’air',
    airflowShow: 'Afficher le flux d’air',
    airflowHide: 'Masquer le flux d’air',
    airflowHideTitle: 'Masquer le chemin de l’air',
    airflowShowTitle: 'Afficher le chemin de l’air dans la machine',
    airflowAssembledTitle:
      'Afficher le flux d’air — il se dessine sur la machine assemblée',
    hiddenCount: (n) => plural(n, 'composant masqué', 'composants masqués'),
    hiddenHeading: 'Masqués à cette échelle',
    unhide: 'Afficher',
  },
  page: {
    systemVisibility: 'Visibilité des systèmes',
    findSlot: 'Cliquez pour trouver son emplacement',
    nothingVisible: 'Aucune structure visible',
    showEverything: 'Afficher tous les systèmes',
  },
  viewer: {
    loadFailed:
      'La visionneuse 3D n’a pas pu se charger. Rechargez pour réessayer.',
    webgl:
      'WebGL n’a pas pu démarrer. Activez l’accélération graphique dans votre navigateur, puis rechargez la visionneuse.',
    model: 'Modèle 3D interactif d’ordinateur',
    tray: 'Pièces sur le plateau',
    loadingComponents: 'Chargement des composants…',
    loading: 'Chargement…',
    reload: 'Recharger la visionneuse',
    contextLost:
      'Le contexte 3D a été interrompu. Rechargez la visionneuse pour continuer.',
    hoverOpen: 'Clic gauche pour ouvrir · clic droit pour inspecter',
    hoverInspect: 'Cliquez pour inspecter',
  },
  tip: {
    label: 'Astuce de performance 3D',
    title: 'Une exploration 3D plus fluide',
    text: 'Activez l’accélération matérielle du navigateur pour un rendu plus fluide.',
    link: 'Comment l’activer',
    dismiss: 'Masquer l’astuce de performance',
  },
  feedback: {
    kinds: {
      issue: 'Problème ou erreur',
      idea: 'Idée ou demande',
      other: 'Collaboration ou autre chose',
    },
    invalid:
      'Un élément du formulaire n’a pas pu être accepté. Vérifiez que le message fait entre 10 et 5000 caractères et que l’adresse e-mail est complète.',
    rateLimited:
      'Cela fait beaucoup de messages en peu de temps. Patientez quelques minutes et réessayez.',
    failed:
      'Le message n’a pas pu être envoyé. Vérifiez votre connexion et réessayez ; ce que vous avez écrit est conservé.',
    title: 'Donner un avis',
    description:
      'Vous avez repéré une erreur, vous avez une idée ou vous voulez collaborer sur PC Anatomy ? Dites-le ici (en anglais si possible).',
    sent: 'Merci, votre message a été envoyé.',
    willReply: 'Je répondrai à l’adresse indiquée.',
    sendAnother: 'Envoyer un autre message',
    unavailable:
      'Le formulaire n’est pas disponible sur cette copie du site. Vous pouvez ouvrir une issue sur GitHub à la place ; ce que vous avez écrit est conservé ici pour que vous puissiez le copier.',
    openIssue: 'Ouvrir une issue GitHub',
    back: 'Retour au formulaire',
    about: 'De quoi s’agit-il ?',
    name: 'Nom',
    optional: 'facultatif',
    email: 'E-mail',
    emailHint: 'facultatif, pour que je puisse répondre',
    message: 'Message',
    atLeast: (n) => `Au moins ${n} caractères`,
    privacy:
      'L’adresse de cette page, votre sélection et la langue de l’interface sont envoyées avec votre message. Il est transmis par e-mail au responsable de PC Anatomy et sert uniquement à vous répondre.',
    sending: 'Envoi…',
    send: 'Envoyer',
  },
  compareCategories: {
    systems: 'Systèmes complets',
    boards: 'Cartes',
    processors: 'Processeurs',
    graphics: 'Graphisme',
    memory: 'Mémoire',
    storage: 'Stockage',
    cooling: 'Refroidissement',
    power: 'Alimentations et batteries',
    displays: 'Écrans',
    chassis: 'Boîtiers',
  },
  compare: {
    takenBy: (side) => `Sur ${side}`,
    diagram: 'Schéma',
    hardware: 'Matériel',
    selected: 'Sélectionné',
    choosePart: (side) => `Choisir la pièce ${side}`,
    pickerDescription:
      'Parcourez n’importe quel système. Votre autre choix reste en place.',
    closePicker: 'Fermer le sélecteur de pièce',
    searchLabel: 'Rechercher des pièces',
    searchPlaceholder: 'Rechercher une pièce, un modèle ou une architecture…',
    system: 'Système',
    allSystems: 'Tous les systèmes',
    categories: 'Catégories de pièces',
    allParts: 'Toutes les pièces',
    partCount: (n) => plural(n, 'pièce', 'pièces'),
    noMatches: 'Aucune pièce trouvée',
    noMatchesHint:
      'Essayez une autre catégorie, un autre système ou une autre recherche.',
    clearFilters: 'Effacer les filtres',
    viewerFailed:
      'La visionneuse de comparaison n’a pas pu se charger. Rechargez pour réessayer.',
    viewport: (left, right) =>
      `Comparaison 3D synchronisée de ${left} et ${right}`,
    leftViewport: (name) => `Vue de gauche : ${name}`,
    rightViewport: (name) => `Vue de droite : ${name}`,
    loading: 'Chargement des deux modèles…',
    comparedPart: 'Pièce comparée',
    sameScale: 'Même échelle physique dans les deux vues.',
    fitRelative:
      'Chaque modèle remplit sa vue. Les tailles ne sont pas relatives.',
    fitNoScale:
      'Chaque modèle remplit sa vue. Les schémas et les pièces illustratives n’ont pas d’échelle physique.',
    exploreBoth: 'Explorer les deux',
    expandBoth: 'Déployer les deux',
    disassembleBoth: 'Démonter les deux',
    specs: 'Caractéristiques',
    back: 'Retour à l’explorateur',
    pair: 'Paire comparée',
    swap: 'Inverser les côtés',
    modelScale: 'Échelle des modèles',
    fitEach: 'Ajuster chacun',
    trueSize: 'Taille réelle',
    visibleSide: 'Côté visible',
    left: 'A · Gauche',
    right: 'B · Droite',
    comparing: (left, right) => `Comparaison de ${left} avec ${right}.`,
    sharedControl: 'Contrôle de démontage commun',
    slider: 'Démonter ou déployer les deux modèles',
    percentBoth: (n) => `${n} pour cent pour les deux modèles`,
  },
  specs: {
    notListed: 'Non indiqué',
    specification: 'Caractéristique',
    noneForModels: 'Aucune caractéristique indiquée pour ces modèles.',
    noneForModel: 'Aucune caractéristique indiquée pour ce modèle.',
    diagram: 'Schéma d’architecture',
    title: 'Comparaison des caractéristiques',
    aligned:
      'Les champs identiques sont alignés. « Non indiqué » signifie que le catalogue n’a pas de valeur pour ce modèle.',
    independent:
      'Des pièces de types différents, chacune avec ses propres caractéristiques.',
    close: 'Fermer la comparaison des caractéristiques',
  },
  build: {
    slotLabels: {
      processor: 'Processeur',
      cooler: 'Refroidissement CPU',
      board: 'Carte mère',
      memory: 'Mémoire',
      storage: 'Stockage',
      graphics: 'Carte graphique',
      power: 'Alimentation',
    },
    title: 'Montez votre PC',
  },
  parts: {
    cores: (n) => `${n} cœurs`,
    ppt: 'limite de puissance du socket (PPT)',
    maxTurbo: 'puissance turbo maximale',
    airCooler: 'Ventirad tour',
    airCoolerSummary: '4 caloducs · ailettes de 120 mm',
    liquidCooler: 'Watercooling AIO 360 mm',
    liquidCoolerSummary: 'Bloc pompe · radiateur en façade',
    everySlot: 'tous les emplacements remplis',
    nvmeSata: 'SSD M.2 NVMe + SSD SATA 2,5 pouces',
    nvmeSataSummary: 'Deux disques · un câble SATA',
    nvmeOnly: 'SSD M.2 NVMe seul',
    nvmeOnlySummary: 'Un disque · aucun câble',
    fixedCables: 'câbles fixes',
    modular: 'modulaire',
    two16pin: 'deux 16 broches',
  },
  powerRoutes: {
    atx: {
      destination: 'Carte mère',
      description:
        'Le câble principal alimente la carte mère. Celle-ci redistribue aussi le courant aux emplacements d’extension et aux composants intégrés.',
    },
    eps: {
      destination: 'Régulateurs du CPU',
      description:
        'Une ligne 12 V distincte arrive sur la carte mère près du CPU. Des régulateurs de tension l’abaissent aux tensions plus basses et variables dont le processeur a besoin.',
    },
    gpu: {
      destination: 'Carte graphique',
      description: (card) =>
        `La ${card} installée reçoit une alimentation auxiliaire directe depuis l’alimentation, en plus du courant de son emplacement. Des régulateurs sur la carte produisent des tensions plus basses pour le GPU et la mémoire.`,
    },
    sata: {
      label: 'Alimentation SATA',
      voltage: '5 V utilisés par ce SSD',
      description:
        'Le connecteur d’alimentation à 15 broches est distinct du connecteur de données SATA à 7 broches. Ce SSD 2,5 pouces représentatif utilise le 5 V fourni directement par l’alimentation.',
    },
    slot: {
      label: 'Emplacement PCIe',
      destination: 'Carte graphique',
      description:
        'La carte mère fournit aussi du courant par l’emplacement PCIe. Le tracé en pointillés montre cette relation, pas le cheminement des pistes de cuivre dans la carte.',
    },
    noSataDrive:
      'Ce montage n’a pas de disque SATA. Le SSD M.2 s’alimente par l’emplacement où il est logé : aucun câble ne va jusqu’à lui.',
    reassemble: 'Remontez le PC pour voir les circuits d’alimentation.',
    leaveIsolation:
      'Quittez l’isolement pour voir les circuits d’alimentation.',
    paused:
      'Les circuits d’alimentation sont en pause pendant l’ouverture d’un composant.',
    showParts:
      'Affichez l’alimentation, les câbles et les composants de destination pour voir leurs circuits.',
  },
};
