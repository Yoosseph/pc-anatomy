/** The Ryzen and Core Ultra processors. */
export const processors: Record<string, string> = {
  'Sixteen Zen 5 cores across two core complex dies, with a separate I/O die carrying memory and PCIe, all on one AM5 package.':
    'Seize cœurs Zen 5 répartis sur deux puces de cœurs (CCD), avec une puce d’E/S séparée qui gère la mémoire et le PCIe, le tout dans un même boîtier AM5.',
  'Splitting the processor into small repeated dies keeps yields high and lets the parts that do not need an expensive process stay on a cheaper one.':
    'Découper le processeur en petites puces répétées maintient un bon rendement de fabrication, et laisse les parties qui n’ont pas besoin d’un procédé coûteux sur un procédé moins cher.',
  '1 modeled package': '1 boîtier modélisé',
  'Specifications are AMD published figures. The die arrangement follows public package photography; block positions inside each die are illustrative and not a mask layout.':
    'Les caractéristiques sont les chiffres publiés par AMD. L’agencement des puces suit les photos publiques du boîtier ; la position des blocs dans chaque puce est illustrative et ne constitue pas un plan de masque.',
  'Zen 5 · chiplet': 'Zen 5 · chiplets',
  '4.3 GHz base, up to 5.7 GHz boost':
    '4,3 GHz de base, jusqu’à 5,7 GHz en boost',
  'TSMC 4 nm cores, TSMC 6 nm I/O die':
    'Cœurs en TSMC 4 nm, puce d’E/S en TSMC 6 nm',
  'Core complex die': 'Puce de cœurs (CCD)',
  'One small die holding eight Zen 5 cores and the 32 MB of L3 they share. The package carries two of them, identical to each other.':
    'Une petite puce qui contient huit cœurs Zen 5 et les 32 Mo de L3 qu’ils partagent. Le boîtier en porte deux, identiques.',
  'A small die yields far better than a large one, and two of the same part are cheaper to make than one twice the size. The cost is that a thread on one die reaches the other die only across the package.':
    'Une petite puce a un bien meilleur rendement qu’une grande, et deux exemplaires d’une même pièce coûtent moins cher à produire qu’une seule deux fois plus grande. En contrepartie, un thread sur une puce n’atteint l’autre qu’en traversant le boîtier.',
  '2 modeled dies': '2 puces modélisées',
  '2 per package': '2 par boîtier',
  '8 each': '8 chacune',
  'About 70.6 mm²': 'Environ 70,6 mm²',
  'Zen 5 core': 'Cœur Zen 5',
  'A full out of order core with its own 80 KB of L1 and 1 MB of L2, running two threads.':
    'Un cœur complet à exécution dans le désordre, avec ses propres 80 Ko de L1 et 1 Mo de L2, qui exécute deux threads.',
  'Every core here is the same size and the same design, so the operating system can treat any of the sixteen as equivalent when it places work.':
    'Tous les cœurs ici ont la même taille et la même conception : le système d’exploitation peut traiter les seize comme équivalents pour répartir le travail.',
  '16 modeled cores': '16 cœurs modélisés',
  '16 total, 8 per die': '16 au total, 8 par puce',
  '80 KB, 48 KB data and 32 KB instruction':
    '80 Ko, 48 Ko de données et 32 Ko d’instructions',
  '2 per core': '2 par cœur',
  'A 32 MB pool on each core complex die, shared by the eight cores on that die and not by the other eight.':
    'Une réserve de 32 Mo sur chaque puce de cœurs, partagée par les huit cœurs de cette puce, pas par les huit autres.',
  'Holds what the cores are working on so most accesses never reach memory. Because it is per die, threads that share data run best when the scheduler keeps them on the same die.':
    'Garde ce sur quoi travaillent les cœurs, pour que la plupart des accès n’aillent jamais jusqu’à la mémoire. Comme il est propre à chaque puce, les threads qui partagent des données tournent mieux quand l’ordonnanceur les garde sur la même puce.',
  '2 modeled pools': '2 réserves modélisées',
  'I/O die': 'Puce d’E/S',
  'A separate, larger die on an older process holding the memory controllers, the PCIe lanes, the display output and the fabric that joins everything.':
    'Une puce séparée, plus grande et sur un procédé plus ancien, qui contient les contrôleurs mémoire, les lignes PCIe, la sortie vidéo et l’interconnexion qui relie le tout.',
  'Memory and PCIe interfaces gain almost nothing from a leading edge process, so putting them on a cheaper one costs no performance and saves a great deal of expensive wafer area.':
    'Les interfaces mémoire et PCIe ne gagnent presque rien à un procédé de pointe : les placer sur un procédé moins cher ne coûte aucune performance et économise beaucoup de surface de wafer coûteuse.',
  '1 modeled die': '1 puce modélisée',
  'Dual channel DDR5, up to 256 GB': 'DDR5 double canal, jusqu’à 256 Go',
  'Memory, PCIe, display, fabric': 'Mémoire, PCIe, affichage, interconnexion',
  'DDR5 memory controllers': 'Contrôleurs mémoire DDR5',
  'DDR5 controllers': 'Contrôleurs DDR5',
  'Two controller blocks at the edge of the I/O die connect the processor package to dual-channel DDR5 memory.':
    'Deux blocs de contrôleur au bord de la puce d’E/S relient le boîtier du processeur à la mémoire DDR5 double canal.',
  'Schedule reads and writes, train the electrical link and translate fabric requests into DDR5 commands.':
    'Ordonnancent les lectures et écritures, calibrent la liaison électrique et traduisent les requêtes de l’interconnexion en commandes DDR5.',
  '2 modeled controller blocks': '2 blocs de contrôleur modélisés',
  'Dual-channel DDR5': 'DDR5 double canal',
  'Up to 256 GB': 'Jusqu’à 256 Go',
  'PCI Express root complex': 'Complexe racine PCI Express',
  'PCIe root': 'Racine PCIe',
  'The high-speed serial interfaces that make the processor the root of the platform PCI Express hierarchy.':
    'Les interfaces série rapides qui font du processeur la racine de la hiérarchie PCI Express de la plateforme.',
  'Connects graphics, NVMe storage and the platform chipset directly to the processor package.':
    'Relie la carte graphique, le stockage NVMe et le chipset directement au boîtier du processeur.',
  '2 modeled interface regions': '2 zones d’interface modélisées',
  'Root complex': 'Complexe racine',
  'I/O-die fabric': 'Interconnexion de la puce d’E/S',
  'I/O fabric': 'Interconnexion d’E/S',
  'The central routing fabric inside the I/O die joins memory, PCIe and the package links to both core dies.':
    'L’interconnexion centrale de la puce d’E/S relie la mémoire, le PCIe et les liaisons du boîtier aux deux puces de cœurs.',
  'Moves requests between interfaces and gives every core complex a path to memory and external devices.':
    'Fait circuler les requêtes entre les interfaces et donne à chaque complexe de cœurs un chemin vers la mémoire et les périphériques externes.',
  '1 modeled fabric': '1 interconnexion modélisée',
  'Illustrative central crossbar': 'Crossbar central illustratif',
  'Display engine': 'Moteur d’affichage',
  'A small integrated graphics and display region able to drive a desktop without a discrete graphics card.':
    'Une petite zone graphique et d’affichage intégrée, capable d’afficher un bureau sans carte graphique dédiée.',
  'Provides basic display output, media functions and a fallback path for diagnosis or office workloads.':
    'Fournit une sortie vidéo de base, des fonctions multimédias et une solution de repli pour le diagnostic ou la bureautique.',
  '1 modeled region': '1 zone modélisée',
  'Integrated display and media': 'Affichage et multimédia intégrés',
  'USB and platform I/O': 'USB et E/S de la plateforme',
  'Platform I/O': 'E/S de la plateforme',
  'Lower-speed controller logic serving USB and the package-management functions around the high-speed links.':
    'La logique de contrôleur moins rapide qui sert l’USB et les fonctions de gestion du boîtier autour des liaisons rapides.',
  'Handles external peripherals and the housekeeping interfaces that do not belong in the core dies.':
    'Gère les périphériques externes et les interfaces d’intendance qui n’ont pas leur place dans les puces de cœurs.',
  'USB and platform services': 'USB et services de la plateforme',
  Fabric: 'Interconnexion',
  'The links across the package substrate joining each core complex die to the I/O die.':
    'Les liaisons à travers le substrat du boîtier qui relient chaque puce de cœurs à la puce d’E/S.',
  'Carries every memory access and every cache transfer between the dies. It is the price of splitting the processor up: a die talking to memory, or to the other die, goes through here first.':
    'Transporte chaque accès mémoire et chaque transfert de cache entre les puces. C’est le prix du découpage du processeur : une puce qui parle à la mémoire, ou à l’autre puce, passe d’abord par ici.',
  '2 modeled links': '2 liaisons modélisées',
  'Each core die to the I/O die': 'Chaque puce de cœurs vers la puce d’E/S',
  'Twenty four cores of two different sizes on a compute tile, stacked with three more tiles onto a base tile that wires them together.':
    'Vingt-quatre cœurs de deux tailles différentes sur une tuile de calcul, empilée avec trois autres tuiles sur une tuile de base qui les relie.',
  'Where AMD repeats one small die, Intel specialises: each tile is made on the process that suits its job, and the base tile underneath carries the connections between them.':
    'Là où AMD répète une petite puce, Intel spécialise : chaque tuile est fabriquée sur le procédé adapté à son rôle, et la tuile de base en dessous porte les connexions entre elles.',
  'Specifications are Intel published figures. Tile sizes follow published die areas; block positions within the compute tile are illustrative and not a mask layout.':
    'Les caractéristiques sont les chiffres publiés par Intel. La taille des tuiles suit les surfaces de puce publiées ; la position des blocs dans la tuile de calcul est illustrative et ne constitue pas un plan de masque.',
  '24 cores, 24 threads, 8 performance and 16 efficient':
    '24 cœurs, 24 threads, 8 performance et 16 efficacité',
  '3.7 GHz performance base, up to 5.7 GHz turbo':
    '3,7 GHz de base (performance), jusqu’à 5,7 GHz en turbo',
  '36 MB shared, 40 MB total L2': '36 Mo partagés, 40 Mo de L2 au total',
  'TSMC N3B compute tile': 'Tuile de calcul en TSMC N3B',
  '125 W base, 250 W maximum turbo': '125 W de base, 250 W en turbo maximal',
  'Compute tile': 'Tuile de calcul',
  'The tile carrying all twenty four cores and the shared cache, on the most advanced process in the package.':
    'La tuile qui porte les vingt-quatre cœurs et le cache partagé, sur le procédé le plus avancé du boîtier.',
  'Only the cores justify the cost of the leading edge node, so only the cores are built on it. Everything else in the package sits on something cheaper.':
    'Seuls les cœurs justifient le coût du procédé de pointe, donc seuls les cœurs y sont fabriqués. Tout le reste du boîtier repose sur moins cher.',
  '1 modeled tile': '1 tuile modélisée',
  'About 117 mm²': 'Environ 117 mm²',
  'Performance core': 'Cœur performance',
  'A large Lion Cove core with 3 MB of L2 to itself, built for the work where one thread finishing sooner is what matters.':
    'Un grand cœur Lion Cove avec 3 Mo de L2 rien que pour lui, conçu pour les tâches où ce qui compte, c’est qu’un thread finisse plus tôt.',
  'Wide, deep and expensive in area. These take the threads you are waiting on, while the small cores take everything running in the background.':
    'Large, profond et gourmand en surface. Ils prennent les threads que vous attendez, tandis que les petits cœurs prennent tout ce qui tourne en arrière-plan.',
  '8 modeled cores': '8 cœurs modélisés',
  '1 per core': '1 par cœur',
  'Efficient core': 'Cœur efficacité',
  'A smaller Skymont core, grouped in fours around 4 MB of L2 the cluster shares. Sixteen of them fit in roughly the area of four large cores.':
    'Un cœur Skymont plus petit, groupé par quatre autour de 4 Mo de L2 partagés par le cluster. Seize d’entre eux tiennent à peu près dans la surface de quatre grands cœurs.',
  'Throughput per square millimetre rather than speed per thread. On this generation the clusters sit between the large cores rather than in one block off to the side.':
    'Le débit par millimètre carré plutôt que la vitesse par thread. Sur cette génération, les clusters se placent entre les grands cœurs plutôt qu’en un bloc à part.',
  '16 modeled cores, in 4 clusters': '16 cœurs modélisés, en 4 clusters',
  '16, in clusters of 4': '16, en clusters de 4',
  'Shared cache': 'Cache partagé',
  'One 36 MB pool on the ring that joins every core, large and small alike.':
    'Une seule réserve de 36 Mo sur l’anneau qui relie tous les cœurs, grands comme petits.',
  'Unlike a split pool, any core can use all of it, so the scheduler is free to move a thread between a large core and a small one without leaving its working set behind.':
    'Contrairement à une réserve divisée, n’importe quel cœur peut l’utiliser en entier : l’ordonnanceur peut donc déplacer un thread entre un grand et un petit cœur sans laisser ses données derrière lui.',
  '1 modeled pool': '1 réserve modélisée',
  'All 24 cores': 'Les 24 cœurs',
  'SoC tile': 'Tuile SoC',
  'The tile holding the memory controllers, the fabric and the low power island that keeps running when the compute tile is idle.':
    'La tuile qui contient les contrôleurs mémoire, l’interconnexion et l’îlot basse consommation qui continue de tourner quand la tuile de calcul est au repos.',
  'Lets the expensive compute tile switch off entirely for light work while the machine stays responsive.':
    'Permet à la coûteuse tuile de calcul de s’éteindre complètement pour les tâches légères, tout en gardant la machine réactive.',
  'About 87 mm²': 'Environ 87 mm²',
  'Dual channel DDR5 up to 6400 MT/s': 'DDR5 double canal jusqu’à 6400 MT/s',
  'Graphics tile': 'Tuile graphique',
  'A small integrated graphics tile, enough to drive displays and decode video without a card fitted.':
    'Une petite tuile graphique intégrée, suffisante pour piloter des écrans et décoder la vidéo sans carte graphique.',
  'Keeps the machine usable with no graphics card in the slot, and handles video encode and decode in fixed function hardware even when a card is fitted.':
    'Garde la machine utilisable sans carte graphique, et gère l’encodage et le décodage vidéo dans du matériel dédié même quand une carte est installée.',
  'About 23 mm²': 'Environ 23 mm²',
  'I/O extender tile': 'Tuile d’extension d’E/S',
  'I/O tile': 'Tuile d’E/S',
  'A small tile carrying the high speed external links that would not fit on the SoC tile, notably PCIe and Thunderbolt.':
    'Une petite tuile qui porte les liaisons externes rapides qui ne tenaient pas sur la tuile SoC, notamment le PCIe et le Thunderbolt.',
  'Interfaces like these are dominated by analogue circuitry that does not shrink usefully on a newer process, so they are pushed out onto their own inexpensive tile.':
    'Ces interfaces sont dominées par des circuits analogiques qui ne rétrécissent guère sur un procédé plus récent : on les déporte donc sur leur propre tuile, peu coûteuse.',
  'About 24 mm²': 'Environ 24 mm²',
  'PCI Express interfaces': 'Interfaces PCI Express',
  'PCIe interfaces': 'Interfaces PCIe',
  'High-speed physical interfaces on the extender tile connect external PCI Express links to the processor fabric.':
    'Des interfaces physiques rapides sur la tuile d’extension relient les liaisons PCI Express externes à l’interconnexion du processeur.',
  'Moves graphics and storage traffic across short analogue front ends without consuming advanced compute-tile area.':
    'Fait transiter le trafic graphique et de stockage par de courts étages analogiques, sans consommer de surface sur la tuile de calcul avancée.',
  'I/O extender': 'Extension d’E/S',
  'Thunderbolt interfaces': 'Interfaces Thunderbolt',
  'External high-speed I/O circuitry grouped on the extender tile alongside the PCI Express physical interfaces.':
    'Des circuits d’E/S externes rapides regroupés sur la tuile d’extension, à côté des interfaces physiques PCI Express.',
  'Provides a compact, shared high-bandwidth connection for displays, storage and docked peripherals.':
    'Offre une connexion compacte, partagée et à haut débit pour les écrans, le stockage et les périphériques sur station d’accueil.',
  'External high-speed I/O': 'E/S externes rapides',
  'Die-to-die interface': 'Interface puce à puce',
  'Die-to-die link': 'Liaison puce à puce',
  'A dense internal interface at the tile edge carries traffic down through the Foveros base tile to the SoC fabric.':
    'Une interface interne dense au bord de la tuile fait descendre le trafic à travers la tuile de base Foveros jusqu’à l’interconnexion du SoC.',
  'Makes the separate I/O tile behave as part of one processor rather than as an external device.':
    'Fait se comporter la tuile d’E/S séparée comme une partie d’un même processeur plutôt que comme un périphérique externe.',
  '1 modeled interface band': '1 bande d’interface modélisée',
  'I/O tile through Foveros base': 'Tuile d’E/S via la base Foveros',
  'Clock and signal conditioning': 'Horloges et conditionnement des signaux',
  Clocking: 'Horloges',
  'Shared analogue support logic conditions reference clocks and high-speed signals for the tile interfaces.':
    'Une logique d’appoint analogique partagée qui conditionne les horloges de référence et les signaux rapides des interfaces de la tuile.',
  'Keeps serial links synchronized and electrically reliable as data crosses the package boundary.':
    'Garde les liaisons série synchronisées et électriquement fiables quand les données franchissent la limite du boîtier.',
  '1 modeled support region': '1 zone d’appoint modélisée',
  'Illustrative PHY support logic': 'Logique d’appoint PHY illustrative',
  'Foveros base tile': 'Tuile de base Foveros',
  'Base tile': 'Tuile de base',
  'A large, deliberately simple die underneath the others, carrying power and the wiring between them. The four working tiles are stacked face down onto it.':
    'Une grande puce volontairement simple sous les autres, qui porte l’alimentation et le câblage entre elles. Les quatre tuiles actives y sont empilées face vers le bas.',
  'This is what makes the tiles behave as one processor. Connections between tiles run through silicon here rather than across a substrate, which is shorter, denser and cheaper in power than package level wiring.':
    'C’est ce qui fait se comporter les tuiles comme un seul processeur. Les connexions entre tuiles passent ici par du silicium plutôt que par un substrat : c’est plus court, plus dense et moins coûteux en énergie qu’un câblage au niveau du boîtier.',
  '1 modeled base': '1 base modélisée',
  'About 303 mm²': 'Environ 303 mm²',
  'Die to die wiring and power delivery':
    'Câblage puce à puce et distribution de l’alimentation',
};
