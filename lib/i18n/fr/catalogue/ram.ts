/** The DDR5 and DDR4 memory modules, down to a single cell. */
export const ram: Record<string, string> = {
  'Module circuit board': 'Circuit imprimé du module',
  'Module board': 'Carte du module',
  'A multi-layer board 133.35 mm long and 31.25 mm tall, cut with the DDR5 key, a latch notch at each end and a straight contact edge.':
    'Une carte multicouche de 133,35 mm de long et 31,25 mm de haut, découpée avec le détrompeur DDR5, une encoche de loquet à chaque bout et une rangée de contacts droite.',
  'Routes two independent 32-bit subchannels from the contacts to the packages, and carries the 5 V input to the regulator in its centre.':
    'Achemine deux sous-canaux indépendants de 32 bits des contacts jusqu’aux boîtiers, et amène l’entrée 5 V jusqu’au régulateur en son centre.',
  '1 board': '1 carte',
  'Kingston FURY Beast DDR5 KF560C36BBE-16: length, height with spreader, thickness, the 0.85 mm contact pitch and the 288-contact count follow JEDEC and the maker’s data sheet. Component placement, passives, the key’s exact offset and the spreader facets are illustrative.':
    'Kingston FURY Beast DDR5 KF560C36BBE-16 : la longueur, la hauteur avec dissipateur, l’épaisseur, le pas de contact de 0,85 mm et les 288 contacts suivent la norme JEDEC et la fiche technique du fabricant. L’emplacement des composants, les composants passifs, la position exacte du détrompeur et les facettes du dissipateur sont illustratifs.',
  '133.35 × 31.25 mm (JEDEC)': '133,35 × 31,25 mm (JEDEC)',
  'About 1.27 mm': 'Environ 1,27 mm',
  'Eight packages on the primary face; secondary face bare':
    'Huit boîtiers sur la face principale ; face secondaire nue',
  'DDR5 DRAM packages': 'Boîtiers de DRAM DDR5',
  'Eight 16 Gb x8 packages in one rank. The four on the left answer subchannel A and the four on the right subchannel B; each subchannel has its own chip select and command bus.':
    'Huit boîtiers 16 Gb x8 sur un seul rang. Les quatre de gauche répondent au sous-canal A et les quatre de droite au sous-canal B ; chaque sous-canal a sa propre sélection de puce et son propre bus de commande.',
  'Stores the bits. A read on one subchannel takes 16 transfers of 32 bits from its four packages: 64 bytes, one processor cache line.':
    'Stockent les bits. Une lecture sur un sous-canal prend 16 transferts de 32 bits depuis ses quatre boîtiers : 64 octets, une ligne de cache du processeur.',
  '8 packages': '8 boîtiers',
  '2G × 8 per package · 16 Gb': '2G × 8 par boîtier · 16 Gb',
  '78-ball FBGA · 7.5 × 11 mm': 'FBGA 78 billes · 7,5 × 11 mm',
  'Single rank (1Rx8)': 'Simple rang (1Rx8)',
  '2 × 32-bit subchannels': '2 sous-canaux de 32 bits',
  'SPD hub': 'Concentrateur SPD',
  'A small controller holding the module’s 1,024-byte profile, with a temperature sensor built in, on the module’s sideband bus.':
    'Un petit contrôleur qui contient le profil de 1 024 octets du module, avec un capteur de température intégré, sur le bus annexe du module.',
  'Tells the firmware at boot what the module is — capacity, organisation, the JEDEC timings and the faster XMP and EXPO profiles — so memory training can start from the right settings.':
    'Indique au firmware, au démarrage, ce qu’est le module — capacité, organisation, timings JEDEC et profils XMP et EXPO plus rapides — pour que le calibrage de la mémoire parte des bons réglages.',
  '1,024 bytes': '1 024 octets',
  'Integrated temperature sensor': 'Capteur de température intégré',
  'I3C Basic / I²C sideband': 'Bus annexe I3C Basic / I²C',
  'Decoupling capacitors': 'Condensateurs de découplage',
  Decoupling: 'Découplage',
  'Rows of small ceramic capacitors under each package, with larger ones around the regulator.':
    'Des rangées de petits condensateurs céramiques sous chaque boîtier, et de plus gros autour du régulateur.',
  'Holds charge right next to each package, so the sudden current of a burst is supplied locally instead of dragging the rail down.':
    'Gardent une réserve de charge juste à côté de chaque boîtier, pour que le pic de courant d’une rafale soit fourni localement au lieu de faire chuter le rail.',
  '30 modeled parts': '30 composants modélisés',
  'Kingston FURY Beast DDR5 KF560C36BBE-16: length, height with spreader, thickness, the 0.85 mm contact pitch and the 288-contact count follow JEDEC and the maker’s data sheet. Component placement, passives, the key’s exact offset and the spreader facets are illustrative. Capacitor count and positions are representative.':
    'Kingston FURY Beast DDR5 KF560C36BBE-16 : la longueur, la hauteur avec dissipateur, l’épaisseur, le pas de contact de 0,85 mm et les 288 contacts suivent la norme JEDEC et la fiche technique du fabricant. L’emplacement des composants, les composants passifs, la position exacte du détrompeur et les facettes du dissipateur sont illustratifs. Le nombre et la position des condensateurs sont représentatifs.',
  'Multilayer ceramic, surface mount':
    'Céramique multicouche, montage en surface',
  'Edge contacts': 'Contacts de bord',
  '288 gold contacts, 144 per face at 0.85 mm pitch, on a straight edge. The key sits at a DDR5-only position.':
    '288 contacts dorés, 144 par face au pas de 0,85 mm, sur un bord droit. Le détrompeur est à une position propre à la DDR5.',
  'Carries both subchannels, their command buses, 5 V bulk power and the sideband bus through the slot. The key stops a DDR4 module going into a DDR5 slot.':
    'Fait passer par l’emplacement les deux sous-canaux, leurs bus de commande, l’alimentation 5 V et le bus annexe. Le détrompeur empêche d’insérer un module DDR4 dans un emplacement DDR5.',
  'Kingston FURY Beast DDR5 KF560C36BBE-16: length, height with spreader, thickness, the 0.85 mm contact pitch and the 288-contact count follow JEDEC and the maker’s data sheet. Component placement, passives, the key’s exact offset and the spreader facets are illustrative. The key offset is illustrative; it differs between the generations as drawn.':
    'Kingston FURY Beast DDR5 KF560C36BBE-16 : la longueur, la hauteur avec dissipateur, l’épaisseur, le pas de contact de 0,85 mm et les 288 contacts suivent la norme JEDEC et la fiche technique du fabricant. L’emplacement des composants, les composants passifs, la position exacte du détrompeur et les facettes du dissipateur sont illustratifs. La position du détrompeur est illustrative ; elle diffère d’une génération à l’autre, comme dessiné.',
  '288 · 144 per face': '288 · 144 par face',
  '0.85 mm': '0,85 mm',
  Straight: 'Droit',
  'DDR5 position': 'Position DDR5',
  'Thermal pads': 'Pads thermiques',
  'Soft pads over the package tops and a separate blue pad over the regulator on the primary face, and an adhesive strip on the bare secondary face.':
    'Des pads souples sur le dessus des boîtiers et un pad bleu distinct sur le régulateur, sur la face principale, et une bande adhésive sur la face secondaire nue.',
  'Fills the gap between the packages and the spreader so heat crosses it, and holds both plates to the board.':
    'Comblent l’espace entre les boîtiers et le dissipateur pour que la chaleur le traverse, et maintiennent les deux plaques sur la carte.',
  '3 pads and 1 tape': '3 pads et 1 bande',
  'Kingston FURY Beast DDR5 KF560C36BBE-16: length, height with spreader, thickness, the 0.85 mm contact pitch and the 288-contact count follow JEDEC and the maker’s data sheet. Component placement, passives, the key’s exact offset and the spreader facets are illustrative. Pad outline and thickness are illustrative.':
    'Kingston FURY Beast DDR5 KF560C36BBE-16 : la longueur, la hauteur avec dissipateur, l’épaisseur, le pas de contact de 0,85 mm et les 288 contacts suivent la norme JEDEC et la fiche technique du fabricant. L’emplacement des composants, les composants passifs, la position exacte du détrompeur et les facettes du dissipateur sont illustratifs. Le contour et l’épaisseur des pads sont illustratifs.',
  'Thermal interface pad and adhesive tape':
    'Pad d’interface thermique et bande adhésive',
  'Heat spreader, front': 'Dissipateur, face avant',
  Spreader: 'Dissipateur',
  'A black aluminium plate over the packages, low enough to clear tall air coolers, folded over the top edge to meet its twin.':
    'Une plaque d’aluminium noir sur les boîtiers, assez basse pour passer sous les grands ventirads, repliée sur le bord supérieur pour rejoindre sa jumelle.',
  'Spreads the heat of eight packages over a larger surface for the case air to carry away.':
    'Répartit la chaleur de huit boîtiers sur une plus grande surface, que l’air du boîtier emporte.',
  '1 plate': '1 plaque',
  'Kingston FURY Beast DDR5 KF560C36BBE-16: length, height with spreader, thickness, the 0.85 mm contact pitch and the 288-contact count follow JEDEC and the maker’s data sheet. Component placement, passives, the key’s exact offset and the spreader facets are illustrative. The facets follow the product line’s look without reproducing its artwork or logo.':
    'Kingston FURY Beast DDR5 KF560C36BBE-16 : la longueur, la hauteur avec dissipateur, l’épaisseur, le pas de contact de 0,85 mm et les 288 contacts suivent la norme JEDEC et la fiche technique du fabricant. L’emplacement des composants, les composants passifs, la position exacte du détrompeur et les facettes du dissipateur sont illustratifs. Les facettes reprennent l’allure de la gamme sans reproduire son graphisme ni son logo.',
  '34.9 mm with the module': '34,9 mm avec le module',
  '6.62 mm across both plates': '6,62 mm pour les deux plaques',
  Black: 'Noir',
  'Heat spreader, back': 'Dissipateur, face arrière',
  'Back plate': 'Plaque arrière',
  'The matching plate on the secondary face, carrying the specification label.':
    'La plaque assortie sur la face secondaire, qui porte l’étiquette de caractéristiques.',
  'Closes the module and carries the part number, speed and voltage a builder checks against the motherboard’s support list.':
    'Ferme le module et porte la référence, la fréquence et la tension que l’on compare à la liste de compatibilité de la carte mère.',
  'Power management IC': 'Circuit de gestion d’alimentation (PMIC)',
  'A switching regulator in the middle of the module. DDR5 moved this onto the module; on DDR4 the motherboard does the job.':
    'Un régulateur à découpage au milieu du module. La DDR5 l’a déplacé sur le module ; en DDR4, c’est la carte mère qui s’en charge.',
  'Turns the 5 V the slot supplies into the DRAM’s rails, right beside the packages that draw them, so the supply is steadier than one sent down from the board.':
    'Convertit le 5 V fourni par l’emplacement en tensions pour la DRAM, juste à côté des boîtiers qui les consomment, pour une alimentation plus stable que si elle venait de la carte mère.',
  'Raised to 1.35 V for the XMP / EXPO profile':
    'Portée à 1,35 V pour le profil XMP / EXPO',
  'Regulator inductors': 'Bobines du régulateur',
  Inductors: 'Bobines',
  'Three small power inductors beside the PMIC, one per switching output.':
    'Trois petites bobines de puissance à côté du PMIC, une par sortie à découpage.',
  'Store energy between switching pulses, smoothing the regulator’s chopped output into steady DC for the DRAM.':
    'Stockent l’énergie entre les impulsions de découpage, lissant la sortie hachée du régulateur en courant continu stable pour la DRAM.',
  '3 inductors': '3 bobines',
  'Kingston FURY Beast DDR5 KF560C36BBE-16: length, height with spreader, thickness, the 0.85 mm contact pitch and the 288-contact count follow JEDEC and the maker’s data sheet. Component placement, passives, the key’s exact offset and the spreader facets are illustrative. Inductor count and placement are representative.':
    'Kingston FURY Beast DDR5 KF560C36BBE-16 : la longueur, la hauteur avec dissipateur, l’épaisseur, le pas de contact de 0,85 mm et les 288 contacts suivent la norme JEDEC et la fiche technique du fabricant. L’emplacement des composants, les composants passifs, la position exacte du détrompeur et les facettes du dissipateur sont illustratifs. Le nombre et l’emplacement des bobines sont représentatifs.',
  'Buck converter output filter':
    'Filtre de sortie d’un convertisseur abaisseur',
  'Mold compound': 'Résine de moulage',
  'Mold cap': 'Capot moulé',
  'Black epoxy moulded over the back of the die, laser-marked on top with a dot at ball A1.':
    'De la résine époxy noire moulée sur le dos de la puce, marquée au laser sur le dessus avec un point à la bille A1.',
  'Seals the die against moisture and handling, and gives the package a flat top for the pick-and-place nozzle and the heat spreader pad.':
    'Protège la puce de l’humidité et des manipulations, et donne au boîtier un dessus plat pour la buse de pose et le pad du dissipateur.',
  '1 cap': '1 capot',
  'Ball count, 0.8 mm pitch, the 13 × (3 + 3) matrix with its empty centre columns and the 7.5 × 11 mm body follow the DRAM maker’s FBGA drawing. Thickness is drawn 2.5 × true; die size, pad and wire counts and layer thicknesses are illustrative.':
    'Le nombre de billes, le pas de 0,8 mm, la matrice 13 × (3 + 3) avec ses colonnes centrales vides et le corps de 7,5 × 11 mm suivent le plan FBGA du fabricant de DRAM. L’épaisseur est dessinée 2,5 fois plus grande que nature ; la taille de la puce, le nombre de pastilles et de fils et l’épaisseur des couches sont illustratifs.',
  'Filled epoxy': 'Époxy chargée',
  'Laser, with pin-1 dot': 'Laser, avec point de broche 1',
  'DDR5 SDRAM die': 'Puce SDRAM DDR5',
  Die: 'Puce',
  'One 16 Gb silicon die, mounted upside down: its circuitry faces the substrate and its bare back faces the mold. The bond pads run down the middle of its face.':
    'Une puce de silicium de 16 Gb, montée à l’envers : ses circuits font face au substrat et son dos nu fait face à la résine. Les pastilles de liaison courent au milieu de sa face.',
  'Holds 32 banks of storage cells and the logic that runs them.':
    'Contient 32 bancs de cellules de stockage et la logique qui les pilote.',
  '1 die': '1 puce',
  '2G × 8 · 32 banks': '2G × 8 · 32 bancs',
  'Face down, centre pads': 'Face vers le bas, pastilles centrales',
  'Centre bond pads': 'Pastilles de liaison centrales',
  'Bond pads': 'Pastilles de liaison',
  'Two rows of metal pads down the centre line of the die face: every signal and supply the die has leaves through them.':
    'Deux rangées de pastilles métalliques sur l’axe central de la face de la puce : chaque signal et chaque alimentation de la puce passent par elles.',
  'The die’s only connection to the outside. Putting them in the middle keeps every wire short and lets one slot in the substrate reach them all.':
    'La seule connexion de la puce avec l’extérieur. Les placer au milieu garde chaque fil court et permet à une seule fente du substrat de les atteindre toutes.',
  '2 rows': '2 rangées',
  'Centre stripe of the die face': 'Bande centrale de la face de la puce',
  'Die attach': 'Fixation de la puce',
  'Two strips of adhesive film holding the face of the die to the substrate, one either side of the slot.':
    'Deux bandes de film adhésif qui collent la face de la puce au substrat, une de chaque côté de la fente.',
  'Fixes the die in place before wire bonding and cushions it against the substrate.':
    'Fixe la puce avant le câblage par fils et l’amortit contre le substrat.',
  '2 strips': '2 bandes',
  'Adhesive film, illustrative': 'Film adhésif, illustratif',
  Substrate: 'Substrat',
  'A thin laminate circuit board with a slot cut down its middle, under the die’s pad stripe. Bond fingers line both edges of the slot on the underside; ball lands cover the rest.':
    'Un mince circuit imprimé stratifié, avec une fente découpée en son milieu sous la bande de pastilles de la puce. Des plots de liaison bordent les deux côtés de la fente en dessous ; les plages de billes couvrent le reste.',
  'Fans the die’s centre pads out to 78 balls on a pitch a module board can be built to.':
    'Répartit les pastilles centrales de la puce vers 78 billes, à un pas que l’on sait réaliser sur une carte de module.',
  '1 substrate': '1 substrat',
  'Under the die’s centre pads': 'Sous les pastilles centrales de la puce',
  'Bond fingers to ball lands': 'Des plots de liaison aux plages de billes',
  'Bond wires': 'Fils de liaison',
  'Fine gold wires that drop from each pad on the die, through the slot, and land on a finger on the underside of the substrate.':
    'De fins fils d’or qui descendent de chaque pastille de la puce, traversent la fente et se posent sur un plot sous le substrat.',
  'Join the die to the package. Because the die faces down, the wires never have to reach around its edge.':
    'Relient la puce au boîtier. Comme la puce est face vers le bas, les fils n’ont jamais à contourner son bord.',
  'One per pad': 'Un par pastille',
  'Gold wire, illustrative gauge': 'Fil d’or, diamètre illustratif',
  'Slot encapsulant': 'Enrobage de la fente',
  Encapsulant: 'Enrobage',
  'A bead of resin filling the slot and covering the wires on the underside, drawn translucent here so the wires show.':
    'Un cordon de résine qui remplit la fente et recouvre les fils en dessous, dessiné translucide ici pour que les fils restent visibles.',
  'Protects the wires. It is also why the ball grid has three empty columns down its middle: the bead is there.':
    'Protège les fils. C’est aussi pour cela que la grille de billes a trois colonnes vides au milieu : le cordon est là.',
  '1 bead': '1 cordon',
  'Down the centre of the underside': 'Au centre de la face inférieure',
  'Solder balls': 'Billes de soudure',
  Balls: 'Billes',
  '78 solder balls on a 0.8 mm grid: 13 rows of three either side of the encapsulant bead.':
    '78 billes de soudure sur une grille de 0,8 mm : 13 rangées de trois de chaque côté du cordon d’enrobage.',
  'Solder the package to the module board and carry every signal and supply into it.':
    'Soudent le boîtier sur la carte du module et y font entrer chaque signal et chaque alimentation.',
  '78 balls': '78 billes',
  '0.8 × 0.8 mm': '0,8 × 0,8 mm',
  '13 rows × 6 columns, 3 centre columns depopulated':
    '13 rangées × 6 colonnes, 3 colonnes centrales non peuplées',
  '7.5 × 11 mm': '7,5 × 11 mm',
  Banks: 'Bancs',
  '32 independent arrays of cells. Each can have one row open at a time, so up to 32 rows can be open across the die at once.':
    '32 matrices de cellules indépendantes. Chacune peut avoir une rangée ouverte à la fois, donc jusqu’à 32 rangées peuvent être ouvertes en même temps sur la puce.',
  'Lets the die work on several requests at once: while one bank opens a row, another can be read from.':
    'Permettent à la puce de traiter plusieurs requêtes à la fois : pendant qu’un banc ouvre une rangée, on peut lire dans un autre.',
  '32 banks': '32 bancs',
  'Counts and features are the data sheet’s. Block sizes and positions are illustrative: a real die is laid out by the vendor and is not published.':
    'Les nombres et les fonctions sont ceux de la fiche technique. La taille et la position des blocs sont illustratives : l’implantation réelle d’une puce est faite par le fabricant et n’est pas publiée.',
  '32 on a 16 Gb x8 die': '32 sur une puce 16 Gb x8',
  '8 bank groups × 4 banks': '8 groupes de bancs × 4 bancs',
  '65,536 per bank (R0–R15)': '65 536 par banc (R0–R15)',
  '1 KiB (1,024 columns × 8 bits)': '1 Kio (1 024 colonnes × 8 bits)',
  'Bank group I/O': 'E/S des groupes de bancs',
  'Bank group': 'Groupe de bancs',
  'Each group of four banks shares its own local data path to the centre of the die. DDR5 doubles the groups to eight.':
    'Chaque groupe de quatre bancs partage son propre chemin de données local vers le centre de la puce. La DDR5 double le nombre de groupes, à huit.',
  'Two reads in different groups can follow each other at the short spacing (tCCD_S); two in the same group must wait the longer tCCD_L while its data path recovers.':
    'Deux lectures dans des groupes différents peuvent se suivre avec l’écart court (tCCD_S) ; deux dans le même groupe doivent attendre l’écart plus long tCCD_L, le temps que son chemin de données se libère.',
  '8 groups': '8 groupes',
  'tCCD_S between groups · tCCD_L within one':
    'tCCD_S entre groupes · tCCD_L dans un même groupe',
  'Command and address input': 'Entrée des commandes et adresses',
  Command: 'Commandes',
  'Fourteen shared CA pins, sampled on both clock edges, carry every command and address in one or two cycles.':
    'Quatorze broches CA partagées, échantillonnées sur les deux fronts d’horloge, transportent chaque commande et adresse en un ou deux cycles.',
  'Decodes activate, read, write, precharge and refresh commands and steers the address to the right bank, row and column.':
    'Décode les commandes d’activation, de lecture, d’écriture, de précharge et de rafraîchissement, et dirige l’adresse vers le bon banc, la bonne rangée et la bonne colonne.',
  '1 block': '1 bloc',
  'On-die, command-controlled': 'Sur la puce, piloté par commande',
  'Mode registers': 'Registres de mode',
  'Mode regs': 'Registres',
  'Registers the controller writes to set latency, burst length, termination, internal reference voltages and the training modes.':
    'Des registres que le contrôleur écrit pour régler la latence, la longueur de rafale, la terminaison, les tensions de référence internes et les modes de calibrage.',
  'Holds the settings that memory training arrives at during boot.':
    'Conservent les réglages auxquels aboutit le calibrage de la mémoire au démarrage.',
  '1 register file': '1 banc de registres',
  'Internal VREF for DQ, CA and CS · loopback · duty-cycle adjust':
    'VREF interne pour DQ, CA et CS · bouclage · réglage du rapport cyclique',
  'Refresh control': 'Contrôle du rafraîchissement',
  Refresh: 'Rafraîchissement',
  'Counts through the rows so that every cell is rewritten within 32 ms. Same-bank refresh can refresh one bank in every group while the others keep working.':
    'Parcourt les rangées pour que chaque cellule soit réécrite en moins de 32 ms. Le rafraîchissement par banc peut rafraîchir un banc dans chaque groupe pendant que les autres continuent de travailler.',
  'Cells leak. Without refresh a stored one would fade into a zero in a fraction of a second.':
    'Les cellules fuient. Sans rafraîchissement, un 1 stocké s’effacerait en 0 en une fraction de seconde.',
  '32 ms, 8,192 commands (≤ 85 °C)': '32 ms, 8 192 commandes (≤ 85 °C)',
  'All-bank · same-bank': 'Tous les bancs · même banc',
  'On-die ECC': 'ECC intégré à la puce',
  'Every 128 bits written gets 8 check bits stored beside it; every read is checked and a single flipped bit corrected before it leaves the die.':
    'Chaque bloc de 128 bits écrit reçoit 8 bits de contrôle stockés à côté ; chaque lecture est vérifiée et un bit inversé est corrigé avant de quitter la puce.',
  'Covers the weak cells that shrinking them brings. It protects the array only: errors on the wires to the processor need ECC modules, which these are not.':
    'Couvre les cellules fragiles qu’entraîne leur miniaturisation. Il ne protège que la matrice : les erreurs sur les liaisons vers le processeur demandent des modules ECC, ce que ceux-ci ne sont pas.',
  '1 engine': '1 moteur',
  '128 data + 8 check bits': '128 bits de données + 8 bits de contrôle',
  'Single-bit errors in the array': 'Erreurs d’un bit dans la matrice',
  'Module ECC (x72/x80 ECC DIMMs)': 'ECC du module (barrettes ECC x72/x80)',
  'Prefetch and data path': 'Prélecture et chemin de données',
  Prefetch: 'Prélecture',
  'One column access pulls 128 bits from the open row at once, which are then sent over the 8 data pins in 16 transfers.':
    'Un accès colonne extrait d’un coup 128 bits de la rangée ouverte, envoyés ensuite sur les 8 broches de données en 16 transferts.',
  'Lets a slow array keep up with a fast interface: the array works on wide words at a fraction of the pin rate.':
    'Permet à une matrice lente de suivre une interface rapide : la matrice travaille sur des mots larges, à une fraction de la cadence des broches.',
  '1 path': '1 chemin',
  'BL16 · 128 bits per x8 access': 'BL16 · 128 bits par accès x8',
  'Data I/O': 'E/S de données',
  'Eight data pins and a strobe pair, with decision-feedback equalisation on the receivers and CRC on reads and writes.':
    'Huit broches de données et une paire de strobe, avec égalisation à retour de décision sur les récepteurs et CRC en lecture et en écriture.',
  'Moves data at 6000 MT/s per pin on this module; the equaliser cleans up the signal that such speeds leave at the end of a module trace.':
    'Transfère les données à 6000 MT/s par broche sur ce module ; l’égaliseur nettoie le signal que de telles vitesses dégradent au bout d’une piste de module.',
  'Read and write CRC': 'CRC en lecture et en écriture',
  'ZQ calibration and termination': 'Calibrage ZQ et terminaison',
  'Measures the driver and termination resistors against one precision resistor on the ZQ pin and trims them.':
    'Mesure les résistances de sortie et de terminaison par rapport à une résistance de précision sur la broche ZQ, et les ajuste.',
  'Keeps output drive strength and on-die termination correct as the die heats up, so signals stay clean.':
    'Maintient la force de sortie et la terminaison intégrée correctes à mesure que la puce chauffe, pour que les signaux restent propres.',
  'External precision resistor on ZQ': 'Résistance de précision externe sur ZQ',
  Mats: 'Matrices',
  Mat: 'Matrice',
  'The tiles a bank is built from, each roughly 512 rows by 512 columns of cells. A row of mats across the bank is a subarray.':
    'Les tuiles dont est fait un banc, chacune d’environ 512 rangées sur 512 colonnes de cellules. Une rangée de matrices à travers le banc forme un sous-réseau.',
  'Keeps every wordline and bitline short. A line spanning a whole bank would be too slow and too heavily loaded to sense a single cell’s charge.':
    'Garde chaque ligne de mot et chaque ligne de bit courtes. Une ligne couvrant tout un banc serait trop lente et trop chargée pour détecter la charge d’une seule cellule.',
  '36 drawn': '36 dessinées',
  'The hierarchy follows published DRAM architecture research. A real 16 Gb bank holds 65,536 rows in subarrays of about 512 rows each; six subarrays of six mats are drawn.':
    'La hiérarchie suit la recherche publiée sur l’architecture des DRAM. Un vrai banc de 16 Gb contient 65 536 rangées réparties en sous-réseaux d’environ 512 rangées ; six sous-réseaux de six matrices sont dessinés.',
  'About 512 × 512 cells': 'Environ 512 × 512 cellules',
  'Opens across every mat of one subarray':
    'S’ouvre sur toutes les matrices d’un sous-réseau',
  'Local SA': 'SA local',
  'A stripe of sense amplifiers between each pair of subarrays: the local row buffer.':
    'Une bande d’amplificateurs de lecture entre chaque paire de sous-réseaux : le tampon de rangée local.',
  'When a row opens, these amplify every bitline in it at once and hold the whole row, which is why reading the rest of an open row is fast.':
    'Quand une rangée s’ouvre, ils amplifient d’un coup toutes ses lignes de bit et gardent la rangée entière, c’est pourquoi lire le reste d’une rangée ouverte est rapide.',
  '7 stripes drawn': '7 bandes dessinées',
  'One open row of the subarray': 'Une rangée ouverte du sous-réseau',
  'Sub-wordline drivers': 'Pilotes de sous-lignes de mot',
  'Narrow stripes of drivers between the mats.':
    'Des bandes étroites de pilotes entre les matrices.',
  'Take a global wordline and drive the short local wordline in each mat up to the boosted VPP level that fully turns the access transistors on.':
    'Reçoivent une ligne de mot globale et portent la courte ligne de mot locale de chaque matrice au niveau surélevé VPP, qui ouvre complètement les transistors d’accès.',
  '42 stripes drawn': '42 bandes dessinées',
  'Local wordlines at VPP, 1.8 V': 'Lignes de mot locales à VPP, 1,8 V',
  'Global wordlines': 'Lignes de mot globales',
  'Global WL': 'WL globale',
  'Lines from the row decoder running over the mats of each subarray.':
    'Des lignes issues du décodeur de rangée qui passent au-dessus des matrices de chaque sous-réseau.',
  'Carry the selected row to the sub-wordline drivers of every mat it crosses.':
    'Transmettent la rangée sélectionnée aux pilotes de sous-lignes de mot de chaque matrice qu’elles traversent.',
  '6 drawn': '6 dessinées',
  'By the global row decoder': 'Par le décodeur de rangée global',
  'Global bitlines': 'Lignes de bit globales',
  'Global BL': 'BL globale',
  'Lines running down the bank past every subarray, connecting the local row buffers to the global sense amplifiers.':
    'Des lignes qui descendent le long du banc devant chaque sous-réseau, reliant les tampons de rangée locaux aux amplificateurs de lecture globaux.',
  'Carry the columns selected from the open row out of the array, a few bits at a time.':
    'Font sortir de la matrice les colonnes sélectionnées dans la rangée ouverte, quelques bits à la fois.',
  '12 drawn': '12 dessinées',
  'Local row buffer → global row buffer':
    'Tampon de rangée local → tampon de rangée global',
  'Global row decoder': 'Décodeur de rangée global',
  'Turns the 16-bit row address of an ACTIVATE into one global wordline.':
    'Transforme l’adresse de rangée de 16 bits d’un ACTIVATE en une seule ligne de mot globale.',
  'Chooses which of the 65,536 rows opens.':
    'Choisit laquelle des 65 536 rangées s’ouvre.',
  '1 decoder': '1 décodeur',
  'Global sense amplifiers': 'Amplificateurs de lecture globaux',
  'Global SA': 'SA global',
  'The global row buffer at the foot of the bank.':
    'Le tampon de rangée global, au pied du banc.',
  'Amplify the small signals arriving on the global bitlines and hand the selected bits to the bank group’s data path.':
    'Amplifient les faibles signaux qui arrivent sur les lignes de bit globales et passent les bits sélectionnés au chemin de données du groupe de bancs.',
  '1 stripe': '1 bande',
  'Global row buffer': 'Tampon de rangée global',
  'Column decoder': 'Décodeur de colonne',
  'Turns the 10-bit column address of a READ or WRITE into column-select lines.':
    'Transforme l’adresse de colonne de 10 bits d’un READ ou d’un WRITE en lignes de sélection de colonne.',
  'Chooses which bits of the open 1 KiB row go out — 128 of them per access on a x8 die.':
    'Choisit quels bits de la rangée ouverte de 1 Kio sortent — 128 par accès sur une puce x8.',
  'Bank control': 'Contrôle du banc',
  'Latches the row address and times the bank’s ACTIVATE, READ, WRITE and PRECHARGE sequence.':
    'Mémorise l’adresse de rangée et cadence la séquence ACTIVATE, READ, WRITE et PRECHARGE du banc.',
  'Enforces the bank’s timings: a row must be open tRCD before it is read and closed tRP before another opens.':
    'Fait respecter les timings du banc : une rangée doit être ouverte depuis tRCD avant d’être lue, et fermée depuis tRP avant qu’une autre ne s’ouvre.',
  'Storage capacitors': 'Condensateurs de stockage',
  Capacitor: 'Condensateur',
  'One tiny capacitor per bit. Charged is a one, empty a zero; the bright ones here hold a pattern.':
    'Un minuscule condensateur par bit. Chargé, c’est un 1 ; vide, un 0 ; les plus clairs ici contiennent un motif.',
  'Holds the bit as a charge measured in femtocoulombs. The charge leaks away, which is why DRAM must be refreshed and why it is “dynamic”.':
    'Conserve le bit sous forme d’une charge de quelques femtocoulombs. Cette charge fuit, c’est pourquoi la DRAM doit être rafraîchie et pourquoi elle est « dynamique ».',
  '48 drawn': '48 dessinés',
  'Schematic, not a layout: modern cells are packed in a staggered pattern with buried wordlines and tall cylindrical capacitors. Forty-eight cells of a mat holding hundreds of thousands are drawn.':
    'Schéma, pas un plan d’implantation : les cellules modernes sont disposées en quinconce, avec des lignes de mot enterrées et de hauts condensateurs cylindriques. Quarante-huit cellules d’une matrice qui en contient des centaines de milliers sont dessinées.',
  '1T1C: one transistor, one capacitor':
    '1T1C : un transistor, un condensateur',
  'Tall cylinder': 'Haut cylindre',
  'Access transistors': 'Transistors d’accès',
  'Access FET': 'FET d’accès',
  'One transistor per cell between its capacitor and its bitline, gated by the wordline.':
    'Un transistor par cellule entre son condensateur et sa ligne de bit, commandé par la ligne de mot.',
  'Isolates the capacitor so its charge stays put, and connects it to the bitline when the row opens.':
    'Isole le condensateur pour que sa charge reste en place, et le relie à la ligne de bit quand la rangée s’ouvre.',
  'The wordline': 'La ligne de mot',
  'Capacitor ↔ bitline': 'Condensateur ↔ ligne de bit',
  Wordlines: 'Lignes de mot',
  'Gate lines running along the row, one per row of cells.':
    'Des lignes de grille le long de la rangée, une par rangée de cellules.',
  'Raising one to VPP opens every cell in that row onto its bitline at once — which is why DRAM always opens a whole row.':
    'En porter une à VPP connecte d’un coup toutes les cellules de la rangée à leur ligne de bit — c’est pourquoi la DRAM ouvre toujours une rangée entière.',
  'Boosted to VPP, 1.8 V, when selected':
    'Portée à VPP, 1,8 V, quand sélectionnée',
  Bitlines: 'Lignes de bit',
  'Lines running along the column, one per column of cells, down to a sense amplifier.':
    'Des lignes le long de la colonne, une par colonne de cellules, jusqu’à un amplificateur de lecture.',
  'Precharged halfway, then nudged slightly up or down when a cell shares its charge — a swing of well under a tenth of a volt for the amplifier to read.':
    'Préchargées à mi-tension, puis légèrement poussées vers le haut ou le bas quand une cellule partage sa charge — une variation bien inférieure à un dixième de volt, que l’amplificateur doit lire.',
  '8 drawn': '8 dessinées',
  'Precharged to the midpoint': 'Préchargées au point milieu',
  'Cell plate': 'Plaque de cellule',
  Plate: 'Plaque',
  'The common top electrode shared by every capacitor in the array.':
    'L’électrode supérieure commune à tous les condensateurs de la matrice.',
  'Is the other side of every capacitor, held at a fixed voltage.':
    'Forme l’autre armature de chaque condensateur, maintenue à une tension fixe.',
  'By all capacitors in the array': 'Par tous les condensateurs de la matrice',
  'Wordline drivers': 'Pilotes de lignes de mot',
  'WL drivers': 'Pilotes WL',
  'The sub-wordline drivers at the edge of the mat.':
    'Les pilotes de sous-lignes de mot au bord de la matrice.',
  'Pull the chosen wordline to VPP, and every other one firmly off.':
    'Portent la ligne de mot choisie à VPP et maintiennent fermement toutes les autres à l’arrêt.',
  'Precharge and equalise': 'Précharge et égalisation',
  Precharge: 'Précharge',
  'Switches that short each bitline pair together and to the midpoint voltage.':
    'Des interrupteurs qui court-circuitent chaque paire de lignes de bit entre elles et au point milieu.',
  'Resets the bitlines after a row closes, so the next row starts from a known level. PRECHARGE is this step.':
    'Réinitialisent les lignes de bit après la fermeture d’une rangée, pour que la suivante parte d’un niveau connu. PRECHARGE, c’est cette étape.',
  'Sense amp': 'Ampli de lecture',
  'A cross-coupled latch per bitline, comparing it with a reference bitline from the neighbouring mat.':
    'Une bascule à couplage croisé par ligne de bit, qui la compare à une ligne de bit de référence de la matrice voisine.',
  'Detects the tiny swing, drives the bitline fully high or low, and so writes the value straight back into the cell whose charge the read just used up.':
    'Détecte la minuscule variation, porte la ligne de bit complètement à l’état haut ou bas, et réécrit ainsi la valeur directement dans la cellule dont la lecture vient d’épuiser la charge.',
  'Destructive, restored by the amplifier':
    'Destructive, restaurée par l’amplificateur',
  'Open bitline': 'Ligne de bit ouverte',
  'Column select switches': 'Interrupteurs de sélection de colonne',
  'Column select': 'Sélection de colonne',
  'Transistors between each sense amplifier and the local I/O lines.':
    'Des transistors entre chaque amplificateur de lecture et les lignes d’E/S locales.',
  'Open for the columns a READ or WRITE addresses, and only those, to connect them to the data path.':
    'S’ouvrent pour les colonnes visées par un READ ou un WRITE, et seulement celles-là, pour les relier au chemin de données.',
  'By column-select lines': 'Par les lignes de sélection de colonne',
  'Local I/O lines': 'Lignes d’E/S locales',
  'Local I/O': 'E/S locales',
  'A complementary pair of lines along the sense-amplifier stripe.':
    'Une paire de lignes complémentaires le long de la bande d’amplificateurs de lecture.',
  'Carry the selected bit out to the global bitlines, or a write in from them.':
    'Font sortir le bit sélectionné vers les lignes de bit globales, ou y font entrer une écriture.',
  '1 pair': '1 paire',
  'Differential pair': 'Paire différentielle',
  'A 16 GB DDR4-3200 UDIMM from the same line as the installed DDR5 module, for comparison. It will not fit the DDR5 slots on this board.':
    'Une UDIMM DDR4-3200 de 16 Go de la même gamme que le module DDR5 installé, pour comparaison. Elle ne rentre pas dans les emplacements DDR5 de cette carte.',
  'Holds working memory for the previous generation of desktop platforms.':
    'Sert de mémoire de travail à la génération précédente de plateformes de bureau.',
  '1 reference specimen': '1 spécimen de référence',
  'Kingston FURY Beast DDR4 KF432C16BB/16: length, height with spreader, thickness, the 0.85 mm contact pitch and the 288-contact count follow JEDEC and the maker’s data sheet. Component placement, passives, the key’s exact offset and the spreader facets are illustrative.':
    'Kingston FURY Beast DDR4 KF432C16BB/16 : la longueur, la hauteur avec dissipateur, l’épaisseur, le pas de contact de 0,85 mm et les 288 contacts suivent la norme JEDEC et la fiche technique du fabricant. L’emplacement des composants, les composants passifs, la position exacte du détrompeur et les facettes du dissipateur sont illustratifs.',
  'DDR4-3200 with XMP · DDR4-2400 JEDEC default':
    'DDR4-3200 avec XMP · DDR4-2400 JEDEC par défaut',
  'CL16-20-20 at 1.35 V': 'CL16-20-20 à 1,35 V',
  '1 × 64-bit channel': '1 canal de 64 bits',
  'BL8 · 8n prefetch': 'BL8 · prélecture 8n',
  'Regulated on the motherboard': 'Régulée sur la carte mère',
  None: 'Aucun',
  'Same design as DDR5 — mats, sense amplifiers, one transistor and one capacitor per bit — with 131,072 rows per bank and wordlines boosted to 2.5 V':
    'Même conception qu’en DDR5 — matrices, amplificateurs de lecture, un transistor et un condensateur par bit — avec 131 072 rangées par banc et des lignes de mot portées à 2,5 V',
  'A multi-layer board 133.35 mm long and 31.25 mm tall, cut with the DDR4 key, a latch notch at each end and a contact edge that bows downward in the middle.':
    'Une carte multicouche de 133,35 mm de long et 31,25 mm de haut, découpée avec le détrompeur DDR4, une encoche de loquet à chaque bout et une rangée de contacts légèrement bombée vers le bas au milieu.',
  'Routes one 64-bit channel from the contacts to the packages, and the command bus past all eight of them in a single fly-by chain.':
    'Achemine un canal de 64 bits des contacts jusqu’aux boîtiers, et fait passer le bus de commande devant les huit en une seule chaîne fly-by.',
  'DDR4 DRAM packages': 'Boîtiers de DRAM DDR4',
  'Eight 16 Gb x8 packages in one rank, all on one 64-bit channel: each package supplies 8 of the 64 data bits on every transfer.':
    'Huit boîtiers 16 Gb x8 sur un seul rang, tous sur un canal de 64 bits : chaque boîtier fournit 8 des 64 bits de données à chaque transfert.',
  'Stores the bits. A read takes 8 transfers of 64 bits from all eight packages: 64 bytes, one processor cache line.':
    'Stockent les bits. Une lecture prend 8 transferts de 64 bits depuis les huit boîtiers : 64 octets, une ligne de cache du processeur.',
  'A serial EEPROM holding the module’s profile on its own 2.2–3.6 V supply.':
    'Une EEPROM série qui contient le profil du module, sur sa propre alimentation de 2,2 à 3,6 V.',
  'Rows of small ceramic capacitors under each package and beside the termination networks.':
    'Des rangées de petits condensateurs céramiques sous chaque boîtier et à côté des réseaux de terminaison.',
  '26 modeled parts': '26 composants modélisés',
  'Kingston FURY Beast DDR4 KF432C16BB/16: length, height with spreader, thickness, the 0.85 mm contact pitch and the 288-contact count follow JEDEC and the maker’s data sheet. Component placement, passives, the key’s exact offset and the spreader facets are illustrative. Capacitor count and positions are representative.':
    'Kingston FURY Beast DDR4 KF432C16BB/16 : la longueur, la hauteur avec dissipateur, l’épaisseur, le pas de contact de 0,85 mm et les 288 contacts suivent la norme JEDEC et la fiche technique du fabricant. L’emplacement des composants, les composants passifs, la position exacte du détrompeur et les facettes du dissipateur sont illustratifs. Le nombre et la position des condensateurs sont représentatifs.',
  '288 gold contacts, 144 per face at 0.85 mm pitch. The edge is curved, so the middle contacts touch first and the module rocks in instead of meeting all 288 at once.':
    '288 contacts dorés, 144 par face au pas de 0,85 mm. Le bord est bombé : les contacts du milieu touchent en premier et le module s’insère en basculant au lieu de rencontrer les 288 d’un coup.',
  'Carries the channel, the command bus, the 1.2 V and 2.5 V supplies and the SPD bus through the slot. The key stops a DDR5 module going into a DDR4 slot.':
    'Fait passer par l’emplacement le canal, le bus de commande, les alimentations 1,2 V et 2,5 V et le bus SPD. Le détrompeur empêche d’insérer un module DDR5 dans un emplacement DDR4.',
  'Kingston FURY Beast DDR4 KF432C16BB/16: length, height with spreader, thickness, the 0.85 mm contact pitch and the 288-contact count follow JEDEC and the maker’s data sheet. Component placement, passives, the key’s exact offset and the spreader facets are illustrative. The key offset is illustrative; it differs between the generations as drawn.':
    'Kingston FURY Beast DDR4 KF432C16BB/16 : la longueur, la hauteur avec dissipateur, l’épaisseur, le pas de contact de 0,85 mm et les 288 contacts suivent la norme JEDEC et la fiche technique du fabricant. L’emplacement des composants, les composants passifs, la position exacte du détrompeur et les facettes du dissipateur sont illustratifs. La position du détrompeur est illustrative ; elle diffère d’une génération à l’autre, comme dessiné.',
  'Curved, for lower insertion force':
    'Bombé, pour réduire l’effort d’insertion',
  'DDR4 position': 'Position DDR4',
  'A soft pad over the package tops on the primary face, and an adhesive strip on the bare secondary face.':
    'Un pad souple sur le dessus des boîtiers de la face principale, et une bande adhésive sur la face secondaire nue.',
  '2 pads and 1 tape': '2 pads et 1 bande',
  'Kingston FURY Beast DDR4 KF432C16BB/16: length, height with spreader, thickness, the 0.85 mm contact pitch and the 288-contact count follow JEDEC and the maker’s data sheet. Component placement, passives, the key’s exact offset and the spreader facets are illustrative. Pad outline and thickness are illustrative.':
    'Kingston FURY Beast DDR4 KF432C16BB/16 : la longueur, la hauteur avec dissipateur, l’épaisseur, le pas de contact de 0,85 mm et les 288 contacts suivent la norme JEDEC et la fiche technique du fabricant. L’emplacement des composants, les composants passifs, la position exacte du détrompeur et les facettes du dissipateur sont illustratifs. Le contour et l’épaisseur des pads sont illustratifs.',
  'A black aluminium plate over the packages with a stepped crown along its top edge.':
    'Une plaque d’aluminium noir sur les boîtiers, avec une crête en gradins le long de son bord supérieur.',
  'Kingston FURY Beast DDR4 KF432C16BB/16: length, height with spreader, thickness, the 0.85 mm contact pitch and the 288-contact count follow JEDEC and the maker’s data sheet. Component placement, passives, the key’s exact offset and the spreader facets are illustrative. The facets follow the product line’s look without reproducing its artwork or logo.':
    'Kingston FURY Beast DDR4 KF432C16BB/16 : la longueur, la hauteur avec dissipateur, l’épaisseur, le pas de contact de 0,85 mm et les 288 contacts suivent la norme JEDEC et la fiche technique du fabricant. L’emplacement des composants, les composants passifs, la position exacte du détrompeur et les facettes du dissipateur sont illustratifs. Les facettes reprennent l’allure de la gamme sans reproduire son graphisme ni son logo.',
  '34 mm with the module': '34 mm avec le module',
  '7.2 mm across both plates': '7,2 mm pour les deux plaques',
  'Command bus termination': 'Terminaison du bus de commande',
  Termination: 'Terminaison',
  'Resistor networks at the far end of the fly-by command bus, past the last package.':
    'Des réseaux de résistances au bout du bus de commande fly-by, après le dernier boîtier.',
  'The command, address and clock lines run past all eight packages in turn; the resistors to VTT at the end absorb the signal so it does not reflect back along the chain. DDR5 moved this termination onto the die.':
    'Les lignes de commande, d’adresse et d’horloge passent tour à tour devant les huit boîtiers ; les résistances vers VTT en bout de ligne absorbent le signal pour qu’il ne se réfléchisse pas le long de la chaîne. La DDR5 a déplacé cette terminaison dans la puce.',
  '5 networks': '5 réseaux',
  'Kingston FURY Beast DDR4 KF432C16BB/16: length, height with spreader, thickness, the 0.85 mm contact pitch and the 288-contact count follow JEDEC and the maker’s data sheet. Component placement, passives, the key’s exact offset and the spreader facets are illustrative. Network count and placement are representative.':
    'Kingston FURY Beast DDR4 KF432C16BB/16 : la longueur, la hauteur avec dissipateur, l’épaisseur, le pas de contact de 0,85 mm et les 288 contacts suivent la norme JEDEC et la fiche technique du fabricant. L’emplacement des composants, les composants passifs, la position exacte du détrompeur et les facettes du dissipateur sont illustratifs. Le nombre et l’emplacement des réseaux sont représentatifs.',
  'Fly-by, terminated to VTT': 'Fly-by, terminé vers VTT',
  '30–47 Ω class': 'Classe 30–47 Ω',
  'DDR4 SDRAM die': 'Puce SDRAM DDR4',
  'Holds 16 banks of storage cells and the logic that runs them.':
    'Contient 16 bancs de cellules de stockage et la logique qui les pilote.',
  '2G × 8 · 16 banks': '2G × 8 · 16 bancs',
  '16 independent arrays of cells, each able to hold one row open.':
    '16 matrices de cellules indépendantes, chacune capable de garder une rangée ouverte.',
  '16 banks': '16 bancs',
  '16 on a 16 Gb x8 die': '16 sur une puce 16 Gb x8',
  '4 bank groups × 4 banks': '4 groupes de bancs × 4 bancs',
  '131,072 per bank (A0–A16)': '131 072 par banc (A0–A16)',
  'Each group of four banks shares its own local data path to the centre of the die. DDR4 introduced them, four per die.':
    'Chaque groupe de quatre bancs partage son propre chemin de données local vers le centre de la puce. La DDR4 les a introduits, quatre par puce.',
  '4 groups': '4 groupes',
  'Dedicated command pins — ACT_n, and RAS_n, CAS_n, WE_n that double as address bits — plus bank group, bank and address lines, with optional parity.':
    'Des broches de commande dédiées — ACT_n, et RAS_n, CAS_n, WE_n qui servent aussi de bits d’adresse — plus des lignes de groupe de bancs, de banc et d’adresse, avec une parité optionnelle.',
  'CA parity': 'Parité CA',
  'Registers MR0–MR6 that set latency, burst length, termination and reference voltages.':
    'Les registres MR0 à MR6, qui règlent la latence, la longueur de rafale, la terminaison et les tensions de référence.',
  'Internal VREF for DQ': 'VREF interne pour DQ',
  'Counts through the rows so that every cell is rewritten within 64 ms. Every refresh command takes all banks at once, or a finer-grained fraction of them.':
    'Parcourt les rangées pour que chaque cellule soit réécrite en moins de 64 ms. Chaque commande de rafraîchissement porte sur tous les bancs à la fois, ou sur une fraction plus fine d’entre eux.',
  '64 ms, 8,192 commands (≤ 85 °C)': '64 ms, 8 192 commandes (≤ 85 °C)',
  'All-bank · fine granularity': 'Tous les bancs · granularité fine',
  'Delay-locked loop': 'Boucle à verrouillage de délai (DLL)',
  'A loop that lines the output timing of the data up with the incoming clock.':
    'Une boucle qui aligne la temporisation de sortie des données sur l’horloge entrante.',
  'Keeps read data aligned to the clock edge the controller expects, across temperature and voltage.':
    'Garde les données lues alignées sur le front d’horloge qu’attend le contrôleur, quelles que soient la température et la tension.',
  '1 loop': '1 boucle',
  'DLL on / DLL off': 'DLL activée / DLL désactivée',
  'One column access pulls 64 bits from the open row at once, which are then sent over the 8 data pins in 8 transfers.':
    'Un accès colonne extrait d’un coup 64 bits de la rangée ouverte, envoyés ensuite sur les 8 broches de données en 8 transferts.',
  'BL8 · 64 bits per x8 access': 'BL8 · 64 bits par accès x8',
  'Eight data pins and a strobe pair, with data bus inversion and write CRC.':
    'Huit broches de données et une paire de strobe, avec inversion du bus de données et CRC en écriture.',
  'Moves data at up to 3200 MT/s per pin; bus inversion cuts the number of pins switching at once.':
    'Transfère les données jusqu’à 3200 MT/s par broche ; l’inversion de bus réduit le nombre de broches qui basculent en même temps.',
  'DBI · write CRC': 'DBI · CRC en écriture',
  'The hierarchy follows published DRAM architecture research. A real 16 Gb bank holds 131,072 rows in subarrays of about 512 rows each; six subarrays of six mats are drawn.':
    'La hiérarchie suit la recherche publiée sur l’architecture des DRAM. Un vrai banc de 16 Gb contient 131 072 rangées réparties en sous-réseaux d’environ 512 rangées ; six sous-réseaux de six matrices sont dessinés.',
  'Local wordlines at VPP, 2.5 V': 'Lignes de mot locales à VPP, 2,5 V',
  'Turns the 17-bit row address of an ACTIVATE into one global wordline.':
    'Transforme l’adresse de rangée de 17 bits d’un ACTIVATE en une seule ligne de mot globale.',
  'Chooses which of the 131,072 rows opens.':
    'Choisit laquelle des 131 072 rangées s’ouvre.',
  'Chooses which bits of the open 1 KiB row go out — 64 of them per access on a x8 die.':
    'Choisit quels bits de la rangée ouverte de 1 Kio sortent — 64 par accès sur une puce x8.',
  'Boosted to VPP, 2.5 V, when selected':
    'Portée à VPP, 2,5 V, quand sélectionnée',
};
