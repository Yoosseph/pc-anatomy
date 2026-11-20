/** Scale names, headings and timeline labels, and the shared accuracy notes. */
export const levels: Record<string, string> = {
  'Illustrative geometry. Shape, placement and mechanical quantities are approximate; this is not a board layout or service model.':
    'Géométrie illustrative. La forme, l’emplacement et les quantités mécaniques sont approximatifs ; il ne s’agit ni d’un plan de carte ni d’un modèle de maintenance.',
  'Documented logical architecture. Block size and placement are illustrative; exact transistor-level placement is not publicly available.':
    'Architecture logique documentée. La taille et l’emplacement des blocs sont illustratifs ; l’implantation exacte au niveau des transistors n’est pas publique.',
  'Modelled to published form-factor dimensions. Component selection, population and routing are representative of the category, not of a specific product.':
    'Modélisé selon les dimensions publiées du format. Le choix des composants, leur implantation et le routage sont représentatifs de la catégorie, pas d’un produit précis.',
  'Desktop PC': 'PC de bureau',
  'The complete machine.': 'La machine complète.',
  'Case, board, power, storage and cooling':
    'Boîtier, carte mère, alimentation, stockage et refroidissement',
  Assembled: 'Assemblé',
  Inventory: 'Inventaire',
  'The motherboard.': 'La carte mère.',
  'ASUS · AM5 · ATX · installed': 'ASUS · AM5 · ATX · installée',
  'An Intel board.': 'Une carte Intel.',
  'A micro-ATX board.': 'Une carte micro-ATX.',
  'An MSI board.': 'Une carte MSI.',
  'A GIGABYTE board.': 'Une carte GIGABYTE.',
  'An ASRock board.': 'Une carte ASRock.',
  'Sixteen cores, on three dies.': 'Seize cœurs, sur trois puces.',
  'Two core complex dies and an I/O die':
    'Deux puces de cœurs (CCD) et une puce d’E/S',
  'AMD · Zen 5 · installed': 'AMD · Zen 5 · installé',
  'Ryzen I/O die': 'Puce d’E/S du Ryzen',
  'Inside the Ryzen I/O die.': 'Dans la puce d’E/S du Ryzen.',
  'Memory, PCIe, display and chiplet fabric':
    'Mémoire, PCIe, affichage et interconnexion des chiplets',
  'Twenty four cores, on stacked tiles.':
    'Vingt-quatre cœurs, sur des tuiles empilées.',
  'Compute, SoC, graphics and I/O tiles on a base':
    'Tuiles de calcul, SoC, graphique et E/S sur une base',
  'Core Ultra I/O tile': 'Tuile d’E/S du Core Ultra',
  'Inside the I/O extender tile.': 'Dans la tuile d’extension d’E/S.',
  'PCIe, Thunderbolt and die-to-die links':
    'PCIe, Thunderbolt et liaisons puce à puce',
  'Inside the memory module.': 'Dans le module mémoire.',
  'Kingston · 16 GB · DDR5-6000': 'Kingston · 16 Go · DDR5-6000',
  'Kingston · DDR5-6000 · installed': 'Kingston · DDR5-6000 · installée',
  'DRAM package': 'Boîtier de DRAM',
  'Inside a memory chip.': 'Dans une puce mémoire.',
  'Mold, die, bond wires, substrate and balls':
    'Résine, puce, fils de liaison, substrat et billes',
  'DRAM die': 'Puce de DRAM',
  'The whole die.': 'La puce entière.',
  'Bank groups, banks and the centre-stripe periphery':
    'Groupes de bancs, bancs et périphérie de la bande centrale',
  Bank: 'Banc',
  'One bank.': 'Un banc.',
  'Mats, sense-amplifier stripes, decoders and global lines':
    'Matrices, bandes d’amplificateurs de lecture, décodeurs et lignes globales',
  Cells: 'Cellules',
  'One transistor, one capacitor.': 'Un transistor, un condensateur.',
  'Wordlines, bitlines, capacitors and sense amplifiers':
    'Lignes de mot, lignes de bit, condensateurs et amplificateurs de lecture',
  'The previous generation.': 'La génération précédente.',
  'Kingston · 16 GB · DDR4-3200': 'Kingston · 16 Go · DDR4-3200',
  'Kingston · DDR4-3200 · for comparison':
    'Kingston · DDR4-3200 · pour comparaison',
  'Inside a DDR4 chip.': 'Dans une puce DDR4.',
  'Twice the rows of a DDR5 bank, built the same way':
    'Deux fois plus de rangées qu’un banc DDR5, construit de la même façon',
  'The same cell as DDR5, its wordlines boosted to 2.5 V':
    'La même cellule qu’en DDR5, avec des lignes de mot portées à 2,5 V',
  'Non-modular · TUF Gaming 650W Bronze':
    'Non modulaire · TUF Gaming 650W Bronze',
  'A smaller fixed-cable supply.':
    'Une alimentation plus petite à câbles fixes.',
  'Non-modular · TUF Gaming 750W Bronze':
    'Non modulaire · TUF Gaming 750W Bronze',
  'Inside a fixed-cable power supply.': 'Dans une alimentation à câbles fixes.',
  'Modular · TUF Gaming 850W Gold': 'Modulaire · TUF Gaming 850W Gold',
  'Inside a modular power supply.': 'Dans une alimentation modulaire.',
  'Modular · TUF Gaming 1000W Gold': 'Modulaire · TUF Gaming 1000W Gold',
  'A thousand watts, fully modular.': 'Mille watts, entièrement modulaire.',
  'ASUS · 1000 W · 80 PLUS Gold · installed':
    'ASUS · 1000 W · 80 PLUS Gold · installée',
  'Modular · TUF Gaming 1200W Gold': 'Modulaire · TUF Gaming 1200W Gold',
  'Twelve hundred watts, two 16-pin leads.':
    'Mille deux cents watts, deux câbles 16 broches.',
  'Case fan': 'Ventilateur de boîtier',
  'Inside a fan.': 'Dans un ventilateur.',
  'Frame, impeller, motor and bearing': 'Cadre, hélice, moteur et roulement',
  'CPU cooler': 'Ventirad CPU',
  'Inside the cooler.': 'Dans le ventirad.',
  'Coldplate, heat pipes and fin stack': 'Plaque froide, caloducs et ailettes',
  'Liquid cooling': 'Watercooling',
  'Inside the liquid loop.': 'Dans la boucle de refroidissement liquide.',
  'Radiator, pump, coldplate and tubing':
    'Radiateur, pompe, plaque froide et tuyaux',
  'Inside the solid-state drive.': 'Dans le SSD.',
  'NAND flash, controller and separate SATA connectors':
    'Mémoire flash NAND, contrôleur et connecteurs SATA séparés',
  'Inside an M.2 SSD.': 'Dans un SSD M.2.',
  'Controller, NAND flash, DRAM and keyed edge contacts':
    'Contrôleur, flash NAND, DRAM et contacts de bord à détrompeur',
  'The complete assembly.': 'L’assemblage complet.',
  'The whole graphics card': 'La carte graphique entière',
  'Inside the processor.': 'Dans le processeur.',
  'Inside the Blackwell chip': 'Dans la puce Blackwell',
  'A graphics processing cluster.': 'Un cluster de traitement graphique (GPC).',
  'One cluster of the compute array': 'Un cluster de la matrice de calcul',
  'A texture processing cluster.':
    'Un cluster de traitement de textures (TPC).',
  'A pair of multiprocessors': 'Une paire de multiprocesseurs',
  'A streaming multiprocessor.': 'Un multiprocesseur de flux (SM).',
  'Inside a streaming multiprocessor': 'Dans un multiprocesseur de flux',
  'A Radeon, fully assembled.': 'Une Radeon, entièrement assemblée.',
  'Inside the Navi 48 processor.': 'Dans le processeur Navi 48.',
  'Inside the RDNA 4 chip': 'Dans la puce RDNA 4',
  'A shader engine.': 'Un shader engine.',
  'Eight workgroup processors and a raster pipeline':
    'Huit processeurs de groupe de travail et un pipeline de rastérisation',
  'Workgroup processor': 'Processeur de groupe de travail (WGP)',
  'A workgroup processor.': 'Un processeur de groupe de travail.',
  'A pair of compute units': 'Une paire d’unités de calcul',
  'Compute unit': 'Unité de calcul',
  'A compute unit.': 'Une unité de calcul.',
  'Inside an RDNA 4 compute unit': 'Dans une unité de calcul RDNA 4',
  'An Arc card, fully assembled.': 'Une carte Arc, entièrement assemblée.',
  'Inside the Battlemage processor.': 'Dans le processeur Battlemage.',
  'Inside the Xe2 chip': 'Dans la puce Xe2',
  'A render slice.': 'Une render slice.',
  'Four Xe-cores with texture and pixel hardware':
    'Quatre Xe-cores avec le matériel de texture et de pixels',
  'An Xe-core.': 'Un Xe-core.',
  'Eight vector engines, a ray tracing unit and cache':
    'Huit moteurs vectoriels, une unité de ray tracing et du cache',
  'Vector engine': 'Moteur vectoriel',
  'A vector engine.': 'Un moteur vectoriel.',
  'Inside an Xe2 vector engine': 'Dans un moteur vectoriel Xe2',
  'A compact two-fan card.': 'Une carte compacte à deux ventilateurs.',
  'A one-fan ITX card.': 'Une carte ITX à un ventilateur.',
  'Legion system board': 'Carte système du Legion',
  'Legion system board.': 'Carte système du Legion.',
  'Soldered processors, replaceable memory and M.2 storage':
    'Processeurs soudés, mémoire remplaçable et stockage M.2',
  'Eight Zen 3 cores and integrated Radeon graphics':
    'Huit cœurs Zen 3 et une partie graphique Radeon intégrée',
  'Zen 3 core': 'Cœur Zen 3',
  'Zen 3 core.': 'Cœur Zen 3.',
  'Instruction flow through one representative CPU core':
    'Le flux d’instructions dans un cœur de CPU représentatif',
  'RTX 3060 Laptop GPU': 'GPU RTX 3060 Laptop',
  'RTX 3060 Laptop GPU.': 'GPU RTX 3060 Laptop.',
  'Ampere graphics with dedicated GDDR6': 'Graphisme Ampere avec GDDR6 dédiée',
  'Ampere SM': 'SM Ampere',
  'Ampere SM.': 'SM Ampere.',
  'Scheduling, arithmetic, texture and ray tracing':
    'Ordonnancement, calcul, textures et ray tracing',
  'Replaceable DDR4-3200 notebook memory':
    'Mémoire DDR4-3200 de portable, remplaçable',
  'DDR4 FBGA package': 'Boîtier FBGA DDR4',
  'DDR4 FBGA package.': 'Boîtier FBGA DDR4.',
  'Mold, die, substrate and solder-ball connections':
    'Résine, puce, substrat et billes de soudure',
  'DDR4 DRAM die': 'Puce de DRAM DDR4',
  'DDR4 DRAM die.': 'Puce de DRAM DDR4.',
  'Banks, row selection and data access':
    'Bancs, sélection de rangée et accès aux données',
  'DDR4 memory bank': 'Banc mémoire DDR4',
  'DDR4 memory bank.': 'Banc mémoire DDR4.',
  'Cell mats, row decoders, sensing and data access':
    'Matrices de cellules, décodeurs de rangée, lecture et accès aux données',
  'DDR4 memory cell': 'Cellule mémoire DDR4',
  'DDR4 memory cell.': 'Cellule mémoire DDR4.',
  'One transistor, one capacitor and refresh':
    'Un transistor, un condensateur et le rafraîchissement',
  'Legion M.2 SSD': 'SSD M.2 du Legion',
  'Legion M.2 SSD.': 'SSD M.2 du Legion.',
  'Removable PCIe NVMe storage': 'Stockage PCIe NVMe amovible',
  'Legion cooling': 'Refroidissement du Legion',
  'Legion cooling.': 'Refroidissement du Legion.',
  'Two blowers and a shared thermal assembly':
    'Deux turbines et un ensemble thermique partagé',
  'Legion battery': 'Batterie du Legion',
  'Legion battery.': 'Batterie du Legion.',
  '80 Wh configuration · cells and protection':
    'Configuration 80 Wh · cellules et protection',
  'Legion display': 'Écran du Legion',
  'Legion display.': 'Écran du Legion.',
  '15.6-inch FHD IPS · 165 Hz configuration':
    'Configuration 15,6 pouces FHD IPS · 165 Hz',
  'MacBook Pro 14-inch': 'MacBook Pro 14 pouces',
  'MacBook Pro 14-inch.': 'MacBook Pro 14 pouces.',
  '2021 · M1 Pro · 10-core CPU / 16-core GPU':
    '2021 · M1 Pro · CPU 10 cœurs / GPU 16 cœurs',
  'MacBook logic board': 'Carte logique du MacBook',
  'MacBook logic board.': 'Carte logique du MacBook.',
  'Apple Silicon, onboard flash and I/O':
    'Apple Silicon, flash intégrée et E/S',
  'CPU, GPU, Neural Engine and unified memory':
    'CPU, GPU, Neural Engine et mémoire unifiée',
  'M1 Pro CPU': 'CPU du M1 Pro',
  'M1 Pro CPU.': 'CPU du M1 Pro.',
  'Eight performance cores and two efficiency cores':
    'Huit cœurs performance et deux cœurs efficacité',
  'CPU core principles': 'Principes d’un cœur de CPU',
  'CPU core principles.': 'Principes d’un cœur de CPU.',
  'Conceptual instruction flow, not an Apple floorplan':
    'Flux d’instructions conceptuel, pas un plan de puce Apple',
  'M1 Pro GPU': 'GPU du M1 Pro',
  'M1 Pro GPU.': 'GPU du M1 Pro.',
  'Sixteen GPU cores sharing unified memory':
    'Seize cœurs GPU partageant la mémoire unifiée',
  'GPU core principles': 'Principes d’un cœur de GPU',
  'GPU core principles.': 'Principes d’un cœur de GPU.',
  'Conceptual parallel execution, not an Apple floorplan':
    'Exécution parallèle conceptuelle, pas un plan de puce Apple',
  'Unified memory': 'Mémoire unifiée',
  'Unified memory.': 'Mémoire unifiée.',
  'A shared pool for CPU, GPU and accelerators':
    'Une réserve commune au CPU, au GPU et aux accélérateurs',
  'DRAM organization': 'Organisation de la DRAM',
  'DRAM organization.': 'Organisation de la DRAM.',
  'Conceptual banks and row access; no asserted die topology':
    'Bancs et accès aux rangées conceptuels ; aucune topologie de puce affirmée',
  'DRAM bank principles': 'Principes d’un banc de DRAM',
  'DRAM bank principles.': 'Principes d’un banc de DRAM.',
  'Cell mats and access circuits; topology illustrative':
    'Matrices de cellules et circuits d’accès ; topologie illustrative',
  'DRAM memory cell': 'Cellule mémoire DRAM',
  'DRAM memory cell.': 'Cellule mémoire DRAM.',
  'A conceptual charge-storage cell':
    'Une cellule conceptuelle de stockage de charge',
  'MacBook flash storage': 'Stockage flash du MacBook',
  'MacBook flash storage.': 'Stockage flash du MacBook.',
  'Onboard NAND, managed by Apple Silicon':
    'NAND intégrée, gérée par l’Apple Silicon',
  'MacBook cooling': 'Refroidissement du MacBook',
  'MacBook cooling.': 'Refroidissement du MacBook.',
  'Two fans and a heat-pipe assembly':
    'Deux ventilateurs et un ensemble de caloducs',
  'MacBook battery': 'Batterie du MacBook',
  'MacBook battery.': 'Batterie du MacBook.',
  '70 Wh lithium-polymer battery assembly':
    'Batterie lithium-polymère de 70 Wh',
  'Liquid Retina XDR display': 'Écran Liquid Retina XDR',
  'Liquid Retina XDR display.': 'Écran Liquid Retina XDR.',
  '14.2-inch mini-LED backlit LCD':
    'Écran LCD de 14,2 pouces rétroéclairé par mini-LED',
};
