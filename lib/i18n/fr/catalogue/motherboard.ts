/** The X670E motherboard, whose parts every other board reuses. */
export const motherboard: Record<string, string> = {
  'Mainboard substrate': 'Substrat de la carte mère',
  Board: 'Carte',
  'A multi-layer fibreglass board with copper planes and routed signal layers between them.':
    'Une carte multicouche en fibre de verre, avec des plans de cuivre et des couches de signaux routées entre eux.',
  'Carries every signal and supply rail on the board, with ground planes that keep high-speed links intact.':
    'Transporte chaque signal et chaque rail d’alimentation de la carte, avec des plans de masse qui préservent les liaisons rapides.',
  'Multi-layer, illustrative stack': 'Multicouche, empilement illustratif',
  'Processor socket': 'Socket du processeur',
  'A land-grid array of spring contacts under a lever-operated retention frame.':
    'Une matrice de contacts à ressort (LGA) sous un cadre de maintien actionné par levier.',
  'Presses hundreds of contacts against the processor’s pads so it can be installed without soldering.':
    'Presse des centaines de contacts contre les pastilles du processeur, pour l’installer sans soudure.',
  '1 modeled socket': '1 socket modélisé',
  'AMD AM5 land grid array, illustrative':
    'AMD AM5 à matrice de contacts (LGA), illustratif',
  'Lever and load plate': 'Levier et plaque de pression',
  'Central processing unit': 'Processeur central (CPU)',
  'The general-purpose processor: a small number of very fast, very flexible cores.':
    'Le processeur généraliste : un petit nombre de cœurs très rapides et très polyvalents.',
  'AMD AM5 land grid array': 'AMD AM5 à matrice de contacts (LGA)',
  'Integrated heat spreader': 'Dissipateur thermique intégré (IHS)',
  'Memory slots': 'Emplacements mémoire',
  'DIMM slot': 'Emplacement DIMM',
  'Keyed edge connectors with latches, wired as two channels of two slots.':
    'Des connecteurs de bord à détrompeur et à loquets, câblés en deux canaux de deux emplacements.',
  'Connects memory modules to the processor’s memory controller on length-matched traces.':
    'Relie les modules mémoire au contrôleur mémoire du processeur par des pistes de longueur égalisée.',
  '4 modeled slots': '4 emplacements modélisés',
  '288-pin DDR5': 'DDR5 288 broches',
  'Kingston FURY Beast DDR5 modules': 'Modules Kingston FURY Beast DDR5',
  'Two 16 GB DDR5 UDIMMs, one per channel: eight DRAM packages each under a black aluminium spreader, with their own power regulation on the module.':
    'Deux UDIMM DDR5 de 16 Go, un par canal : huit boîtiers de DRAM chacun sous un dissipateur en aluminium noir, avec leur propre régulation d’alimentation sur le module.',
  'Holds the code and data the processor is working on right now. It is fast, plentiful and erased at power-off.':
    'Contient le code et les données sur lesquels le processeur travaille en ce moment. Rapide, abondante, et effacée à l’extinction.',
  '2 modeled modules': '2 modules modélisés',
  'Installed as the complete DDR5 module model; see that scale for what is published and what is illustrative.':
    'Installé sous la forme du modèle complet de module DDR5 ; voir cette échelle pour ce qui est publié et ce qui est illustratif.',
  'DDR5-6000 with XMP or EXPO · DDR5-4800 JEDEC default':
    'DDR5-6000 avec XMP ou EXPO · DDR5-4800 JEDEC par défaut',
  'CL36-38-38 at 1.35 V': 'CL36-38-38 à 1,35 V',
  '16 GB · single rank · 8 × 16 Gb x8': '16 Go · simple rang · 8 × 16 Gb x8',
  '2 independent 32-bit subchannels': '2 sous-canaux indépendants de 32 bits',
  '32 · 8 groups of 4': '32 · 8 groupes de 4',
  'BL16 · 16n prefetch': 'BL16 · prélecture 16n',
  'PMIC on the module, fed 5 V': 'PMIC sur le module, alimenté en 5 V',
  'Yes · corrects single-bit errors inside the DRAM':
    'Oui · corrige les erreurs d’un bit à l’intérieur de la DRAM',
  'Same design as DDR4 — mats, sense amplifiers, one transistor and one capacitor per bit — with 65,536 rows per bank and wordlines boosted to 1.8 V':
    'Même conception qu’en DDR4 — matrices, amplificateurs de lecture, un transistor et un condensateur par bit — avec 65 536 rangées par banc et des lignes de mot portées à 1,8 V',
  '288-pin': '288 broches',
  'A support processor that fans one link from the processor out into many slower ones.':
    'Un processeur d’appoint qui démultiplie une liaison venue du processeur en de nombreuses liaisons plus lentes.',
  'Provides the extra PCIe lanes, SATA ports and USB controllers the processor does not expose directly.':
    'Fournit les lignes PCIe, les ports SATA et les contrôleurs USB supplémentaires que le processeur n’expose pas directement.',
  '1 modeled device': '1 composant modélisé',
  'Platform I/O hub': 'Concentrateur d’E/S de la plateforme',
  'Passive heatsink': 'Dissipateur passif',
  'UEFI firmware flash': 'Flash du firmware UEFI',
  'A small non-volatile flash chip holding the firmware that runs before any operating system exists.':
    'Une petite puce de mémoire flash non volatile qui contient le firmware exécuté avant tout système d’exploitation.',
  'Brings the board up from cold, trains memory, enumerates devices and hands control to a bootloader.':
    'Démarre la carte à froid, calibre la mémoire, recense les périphériques et passe la main à un chargeur d’amorçage.',
  '1 modeled flash device': '1 mémoire flash modélisée',
  'Serial flash': 'Flash série',
  'CMOS battery': 'Pile CMOS',
  Battery: 'Pile',
  'A coin cell in a clip beside the firmware flash.':
    'Une pile bouton dans un clip, à côté de la flash du firmware.',
  'Keeps the real-time clock and a small block of firmware settings alive while the machine is unplugged.':
    'Maintient l’horloge temps réel et un petit bloc de réglages du firmware pendant que la machine est débranchée.',
  '1 modeled cell': '1 pile modélisée',
  'Lithium coin cell': 'Pile bouton au lithium',
  'PCIe ×16 slots': 'Emplacements PCIe ×16',
  'Long expansion slots with a retention latch, wired with up to sixteen lanes.':
    'De longs emplacements d’extension avec un loquet de maintien, câblés avec jusqu’à seize lignes.',
  'Gives a graphics card or accelerator a wide, direct, high-bandwidth path to the processor.':
    'Offre à une carte graphique ou à un accélérateur un chemin large, direct et à haut débit vers le processeur.',
  '2 modeled slots': '2 emplacements modélisés',
  'Up to ×16': 'Jusqu’à ×16',
  'PCIe ×1 slots': 'Emplacements PCIe ×1',
  'Short single-lane slots for capture, network and audio cards.':
    'De courts emplacements à une ligne pour cartes d’acquisition, réseau et son.',
  'Adds expansion for devices that need a modest amount of bandwidth.':
    'Ajoute des extensions pour les périphériques qui demandent un débit modeste.',
  'M.2 sockets': 'Emplacements M.2',
  'M.2 socket': 'Emplacement M.2',
  'Flat edge sockets between the expansion slots, each under a thermal cover.':
    'Des connecteurs de bord plats entre les emplacements d’extension, chacun sous un capot thermique.',
  'Connects a solid-state drive straight to PCIe lanes with no cable and no drive bay.':
    'Relie un SSD directement à des lignes PCIe, sans câble ni baie de disque.',
  '2 modeled sockets': '2 emplacements modélisés',
  'NVMe solid-state drive': 'SSD NVMe',
  'Flash packages and a controller on a bare card, speaking NVMe over PCIe.':
    'Des boîtiers de flash et un contrôleur sur une carte nue, qui communiquent en NVMe sur PCIe.',
  'Stores the operating system and data with far more parallelism than the older SATA command set allowed.':
    'Stocke le système d’exploitation et les données avec bien plus de parallélisme que l’ancien jeu de commandes SATA ne le permettait.',
  'Bare module · motherboard edge connector':
    'Module nu · connecteur de bord sur la carte mère',
  'M.2 thermal covers': 'Capots thermiques M.2',
  'M.2 cover': 'Capot M.2',
  'Finned plates clamped over the drives on a thermal pad.':
    'Des plaques à ailettes serrées sur les SSD, par-dessus un pad thermique.',
  'Draws heat off the controller so sustained writes do not force the drive to slow itself down.':
    'Évacue la chaleur du contrôleur pour que les écritures prolongées n’obligent pas le SSD à ralentir.',
  '2 modeled covers': '2 capots modélisés',
  'Thermal pad': 'Pad thermique',
  'Processor voltage regulator': 'Régulateur de tension du processeur',
  'Switching power stages, inductors and capacitors in a row along the top and left of the socket.':
    'Des étages de puissance à découpage, des bobines et des condensateurs alignés en haut et à gauche du socket.',
  'Steps 12 V down to the processor’s core voltage and holds it steady through very fast load swings.':
    'Abaisse le 12 V jusqu’à la tension de cœur du processeur et la maintient stable malgré des variations de charge très rapides.',
  '14 modeled phases': '14 phases modélisées',
  'Multiphase buck, illustrative': 'Abaisseur multiphase, illustratif',
  'VRM heatsinks': 'Dissipateurs du VRM',
  'VRM heatsink': 'Dissipateur du VRM',
  'Finned aluminium blocks over the power stages.':
    'Des blocs d’aluminium à ailettes posés sur les étages de puissance.',
  'Keeps the switching devices within their rated temperature at sustained high current.':
    'Maintient les composants de découpage dans leur plage de température nominale sous un fort courant prolongé.',
  '2 modeled heatsinks': '2 dissipateurs modélisés',
  '24-pin board power connector':
    'Connecteur d’alimentation 24 broches de la carte',
  'The tall keyed connector on the right edge that the main supply loom plugs into.':
    'Le haut connecteur à détrompeur sur le bord droit, où se branche le faisceau principal de l’alimentation.',
  'Brings the supply’s main rails onto the board, along with the signals that switch it on and report readiness.':
    'Amène les rails principaux de l’alimentation sur la carte, ainsi que les signaux qui l’allument et signalent qu’elle est prête.',
  '1 modeled connector': '1 connecteur modélisé',
  'Processor power connectors': 'Connecteurs d’alimentation du processeur',
  'EPS 8-pin': 'EPS 8 broches',
  'Eight-pin connectors at the top edge feeding the regulator directly.':
    'Des connecteurs 8 broches sur le bord supérieur, qui alimentent directement le régulateur.',
  'Delivers high current to the processor’s regulator on conductors sized for it, separate from the main loom.':
    'Fournit un courant élevé au régulateur du processeur par des conducteurs dimensionnés pour cela, à part du faisceau principal.',
  '2 modeled connectors': '2 connecteurs modélisés',
  '8 per connector': '8 par connecteur',
  'SATA ports': 'Ports SATA',
  'SATA port': 'Port SATA',
  'Right-angle L-keyed connectors along the board’s right edge.':
    'Des connecteurs coudés à détrompeur en L le long du bord droit de la carte.',
  'Connects drives in the cage to the chipset’s storage controller.':
    'Relie les disques de la baie au contrôleur de stockage du chipset.',
  '4 modeled ports': '4 ports modélisés',
  'Rear I/O stack': 'Bloc d’E/S arrière',
  'Rear I/O': 'E/S arrière',
  'The block of external connectors that shows through the back of the case.':
    'Le bloc de connecteurs externes visible à l’arrière du boîtier.',
  'Connects the machine to everything outside it: peripherals, network, audio and displays.':
    'Relie la machine à tout ce qui l’entoure : périphériques, réseau, audio et écrans.',
  '1 modeled stack': '1 bloc modélisé',
  'Network controller': 'Contrôleur réseau',
  'A controller beside the rear jack, with its magnetics between it and the socket.':
    'Un contrôleur à côté de la prise arrière, avec son transformateur d’isolement entre lui et la prise.',
  'Turns packets into signals on twisted-pair cabling, isolated from the board electrically.':
    'Transforme les paquets en signaux sur câble à paires torsadées, électriquement isolés de la carte.',
  '1 modeled controller': '1 contrôleur modélisé',
  'Wired Ethernet': 'Ethernet filaire',
  'Audio codec': 'Codec audio',
  'A converter in a partitioned corner of the board, often with its own ground island.':
    'Un convertisseur dans un coin cloisonné de la carte, souvent avec son propre îlot de masse.',
  'Converts between digital audio and the analogue signals the rear jacks carry.':
    'Convertit entre l’audio numérique et les signaux analogiques que transportent les prises arrière.',
  '1 modeled codec': '1 codec modélisé',
  'Separated ground area': 'Zone de masse séparée',
  'Sensor and fan controller': 'Contrôleur de capteurs et de ventilateurs',
  'Sensor hub': 'Concentrateur de capteurs',
  'A small controller that reads temperatures and drives the fan headers.':
    'Un petit contrôleur qui lit les températures et pilote les connecteurs de ventilateurs.',
  'Runs the fan curves and reports board voltages and temperatures to firmware and the operating system.':
    'Applique les courbes de ventilation et transmet les tensions et températures de la carte au firmware et au système d’exploitation.',
  'Monitoring and fan control': 'Surveillance et contrôle des ventilateurs',
  'Fan headers': 'Connecteurs de ventilateurs',
  'Fan header': 'Connecteur de ventilateur',
  'Four-pin posts scattered around the board edges.':
    'Des barrettes 4 broches réparties sur les bords de la carte.',
  'Powers each fan and gives it a speed command while reading its tachometer back.':
    'Alimente chaque ventilateur et lui donne une consigne de vitesse tout en relisant son tachymètre.',
  '6 modeled headers': '6 connecteurs modélisés',
  '4-pin PWM': 'PWM 4 broches',
  'Front-panel headers': 'Connecteurs de façade',
  'Front header': 'Connecteur façade',
  'Pin blocks along the bottom edge for the case’s buttons, LEDs and front ports.':
    'Des blocs de broches le long du bord inférieur pour les boutons, les LED et les ports avant du boîtier.',
  'Brings the power button, activity lights and front connectors back to the board.':
    'Ramène à la carte le bouton de marche, les voyants d’activité et les connecteurs avant.',
  '4 modeled headers': '4 connecteurs modélisés',
  'Front panel · USB · audio': 'Façade · USB · audio',
};
