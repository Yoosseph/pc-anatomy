/** The power supplies. */
export const psu: Record<string, string> = {
  'TUF Gaming 850W Gold housing': 'Boîtier de la TUF Gaming 850W Gold',
  '850W housing': 'Boîtier 850W',
  'The 150 × 150 × 86 mm folded steel shell of the ASUS TUF Gaming 850W Gold.':
    'La coque en acier plié de 150 × 150 × 86 mm de l’ASUS TUF Gaming 850W Gold.',
  'Contains mains-voltage parts, earths them, and forces intake air along the whole board before it leaves.':
    'Renferme les pièces sous tension secteur, les relie à la terre et force l’air aspiré à balayer toute la carte avant de sortir.',
  '1 modeled enclosure': '1 boîtier modélisé',
  'Published dimensions and external features of the ASUS TUF Gaming 850W Gold; internal geometry and component placement are illustrative.':
    'Dimensions et éléments extérieurs publiés de l’ASUS TUF Gaming 850W Gold ; la géométrie interne et l’emplacement des composants sont illustratifs.',
  'Fully modular': 'Entièrement modulaire',
  'Supply fan': 'Ventilateur de l’alimentation',
  'A 135 mm axial fan behind the broad top grille, drawing air over the board and out the rear.':
    'Un ventilateur axial de 135 mm derrière la large grille supérieure, qui aspire l’air sur la carte et le rejette à l’arrière.',
  'Removes the heat the switching devices, transformer and rectifiers produce, at low noise.':
    'Évacue, sans bruit excessif, la chaleur produite par les composants de découpage, le transformateur et les redresseurs.',
  '1 modeled fan': '1 ventilateur modélisé',
  'Guarded top face': 'Face supérieure grillagée',
  'Thermally regulated': 'Régulé thermiquement',
  'Supply board': 'Carte de l’alimentation',
  'One board carrying the whole conversion chain, with a wide isolation gap across the middle.':
    'Une seule carte qui porte toute la chaîne de conversion, avec un large espace d’isolement en son milieu.',
  'Keeps the mains-voltage side physically and electrically separated from the low-voltage side feeding the machine.':
    'Sépare physiquement et électriquement le côté secteur du côté basse tension qui alimente la machine.',
  '1 modeled board': '1 carte modélisée',
  'Primary / secondary barrier': 'Barrière primaire / secondaire',
  'Mains inlet and switch': 'Prise secteur et interrupteur',
  'Mains inlet': 'Prise secteur',
  'The three-pin socket and rocker switch where wall power enters, earth included.':
    'La prise à trois broches et l’interrupteur à bascule par où entre le courant du secteur, terre comprise.',
  'Brings alternating current in on a keyed, earthed connector that cannot be inserted the wrong way.':
    'Fait entrer le courant alternatif par un connecteur à détrompeur, relié à la terre, impossible à brancher dans le mauvais sens.',
  '1 modeled inlet': '1 prise modélisée',
  'C14 appliance inlet': 'Embase C14',
  'Live · neutral · earth': 'Phase · neutre · terre',
  'Mains filter': 'Filtre secteur',
  'EMI filter': 'Filtre CEM',
  'Common-mode chokes and a set of safety capacitors immediately behind the inlet.':
    'Des selfs de mode commun et un jeu de condensateurs de sécurité juste derrière la prise.',
  'Stops the supply’s own switching noise travelling back out onto the mains, and blunts incoming spikes.':
    'Empêche le bruit de découpage de l’alimentation de repartir sur le secteur, et atténue les pointes de tension entrantes.',
  '2 modeled chokes': '2 selfs modélisées',
  'Common-mode chokes · X and Y capacitors':
    'Selfs de mode commun · condensateurs X et Y',
  'Bridge rectifier': 'Pont redresseur',
  Rectifier: 'Redresseur',
  'A four-diode block bolted to a heatsink, turning alternating current into pulsing DC.':
    'Un bloc de quatre diodes vissé sur un dissipateur, qui transforme le courant alternatif en courant continu pulsé.',
  'Converts the incoming mains waveform into one-directional current the rest of the supply can work with.':
    'Convertit la forme d’onde du secteur en un courant à sens unique, exploitable par le reste de l’alimentation.',
  '1 modeled bridge': '1 pont modélisé',
  '4 diodes in one package': '4 diodes dans un boîtier',
  'Power factor correction': 'Correction du facteur de puissance',
  'PFC stage': 'Étage PFC',
  'A large wound inductor with its switching device and diode, boosting the rectified mains to a high DC rail.':
    'Une grosse bobine avec son composant de découpage et sa diode, qui élève le secteur redressé jusqu’à un rail continu haute tension.',
  'Makes the supply draw current in step with the mains waveform instead of in sharp spikes, and feeds a steady high-voltage rail.':
    'Fait absorber à l’alimentation un courant qui suit l’onde du secteur plutôt que des pics brutaux, et alimente un rail haute tension stable.',
  '1 modeled boost stage': '1 étage élévateur modélisé',
  'Boost converter, illustrative': 'Convertisseur élévateur, illustratif',
  'Bulk capacitor': 'Condensateur de stockage',
  'Bulk cap': 'Condo de stockage',
  'The large canister on the high-voltage side, the biggest single component on the board.':
    'Le gros cylindre du côté haute tension, le plus gros composant de la carte.',
  'Stores enough energy to carry the machine through the gaps between mains peaks, and through brief dropouts.':
    'Stocke assez d’énergie pour faire tenir la machine entre les crêtes du secteur, et pendant de brèves coupures.',
  '1 modeled capacitor': '1 condensateur modélisé',
  'High-voltage energy store': 'Réserve d’énergie haute tension',
  'Primary switching devices': 'Composants de découpage primaires',
  Switches: 'Interrupteurs',
  'Transistors on the tall primary heatsink, chopping the high-voltage rail tens of thousands of times a second.':
    'Des transistors sur le grand dissipateur primaire, qui hachent le rail haute tension des dizaines de milliers de fois par seconde.',
  'Turns steady DC back into high-frequency AC, which is the only way to put it through a transformer this small.':
    'Retransforme le courant continu stable en courant alternatif haute fréquence, seul moyen de le faire passer par un transformateur aussi petit.',
  '4 modeled devices': '4 composants modélisés',
  'High-side / low-side switching': 'Découpage côté haut / côté bas',
  'Main transformer': 'Transformateur principal',
  Transformer: 'Transformateur',
  'A taped ferrite core straddling the isolation gap, windings on both sides of it.':
    'Un noyau de ferrite rubané à cheval sur l’espace d’isolement, avec des enroulements de chaque côté.',
  'Steps the chopped high voltage down to about twelve volts, and is the barrier that keeps mains away from the machine.':
    'Abaisse la haute tension hachée à environ douze volts, et forme la barrière qui tient le secteur à l’écart de la machine.',
  '1 modeled transformer': '1 transformateur modélisé',
  'Step-down and isolation': 'Abaissement et isolement',
  'Switching heatsinks': 'Dissipateurs de découpage',
  Heatsinks: 'Dissipateurs',
  'Tall finned aluminium walls either side of the transformer, one per voltage side.':
    'De hautes parois d’aluminium à ailettes de part et d’autre du transformateur, une par côté de tension.',
  'Carries heat away from the switching devices and rectifiers into the air the fan is moving.':
    'Évacue la chaleur des composants de découpage et des redresseurs vers l’air que brasse le ventilateur.',
  'Primary and secondary side': 'Côté primaire et côté secondaire',
  'Secondary rectification': 'Redressement secondaire',
  Secondary: 'Secondaire',
  'Low-voltage transistors switched in time with the transformer, on the machine side of the barrier.':
    'Des transistors basse tension commutés au rythme du transformateur, du côté machine de la barrière.',
  'Rectifies the transformer output with far less waste than diodes would, producing the +12 V rail.':
    'Redresse la sortie du transformateur avec bien moins de pertes que des diodes, et produit le rail +12 V.',
  '6 modeled devices': '6 composants modélisés',
  'Synchronous rectification': 'Redressement synchrone',
  'Minor rail converters': 'Convertisseurs des rails secondaires',
  'Small daughter boards standing off the main board, fed from the twelve-volt rail.':
    'De petites cartes filles dressées sur la carte principale, alimentées par le rail douze volts.',
  'Derives the +5 V and +3.3 V rails locally, which regulates them better than taking extra transformer windings.':
    'Produisent localement les rails +5 V et +3,3 V, mieux régulés qu’avec des enroulements supplémentaires sur le transformateur.',
  '2 modeled converters': '2 convertisseurs modélisés',
  'Output capacitors': 'Condensateurs de sortie',
  'Output caps': 'Condos de sortie',
  'A bank of low-resistance capacitors and small chokes at the output end of the board.':
    'Une rangée de condensateurs à faible résistance et de petites selfs en sortie de carte.',
  'Smooths what is left of the switching ripple and supplies the instant current a sudden load demands.':
    'Lisse ce qui reste de l’ondulation de découpage et fournit le courant instantané qu’exige une charge soudaine.',
  '8 modeled capacitors': '8 condensateurs modélisés',
  'Low-ESR electrolytic and polymer':
    'Électrolytiques et polymères à faible ESR',
  'Supervisor and control': 'Supervision et contrôle',
  Supervisor: 'Superviseur',
  'The controller that runs the switching, plus the watchdog that measures every rail.':
    'Le contrôleur qui pilote le découpage, plus le circuit de surveillance qui mesure chaque rail.',
  'Holds the rails in regulation, asserts the ready signal when they are good, and shuts the supply down on over-current, over-voltage or over-temperature.':
    'Maintient les rails dans leur plage, envoie le signal « prêt » quand ils sont bons, et coupe l’alimentation en cas de surintensité, de surtension ou de surchauffe.',
  '2 modeled controllers': '2 contrôleurs modélisés',
  'Power-on · power-good': 'Mise sous tension · power-good',
  'Modular output panel': 'Panneau de sortie modulaire',
  'Output panel': 'Panneau de sortie',
  'Keyed sockets on the face that points into the case, each labelled for what may plug into it.':
    'Des prises à détrompeur sur la face tournée vers l’intérieur du boîtier, chacune étiquetée selon ce qu’on peut y brancher.',
  'Lets only the cables a build actually needs be fitted, so the rest never enter the case.':
    'Permet de ne brancher que les câbles dont le montage a besoin ; les autres n’entrent jamais dans le boîtier.',
  '8 modeled socket groups': '8 groupes de prises modélisés',
  'Socket families follow ASUS documentation; individual socket shape and placement are illustrative.':
    'Les familles de prises suivent la documentation ASUS ; la forme et l’emplacement de chaque prise sont illustratifs.',
  '24-pin · EPS · PCIe 16-pin · PCIe 8-pin · SATA':
    '24 broches · EPS · PCIe 16 broches · PCIe 8 broches · SATA',
  'Exhaust grille': 'Grille d’extraction',
  'The punched honeycomb across the rear face.':
    'Le nid d’abeilles perforé sur toute la face arrière.',
  'Lets heated air out with as little restriction as a panel that still keeps fingers away from mains parts can manage.':
    'Laisse sortir l’air chaud avec aussi peu de résistance que le permet un panneau qui tient encore les doigts à l’écart des pièces sous tension.',
  '1 modeled grille': '1 grille modélisée',
  'Hexagonal perforation': 'Perforation hexagonale',
  'TUF Gaming 750W Bronze housing': 'Boîtier de la TUF Gaming 750W Bronze',
  '750W housing': 'Boîtier 750W',
  'The 150 × 150 × 86 mm folded steel shell of the ASUS TUF Gaming 750W Bronze.':
    'La coque en acier plié de 150 × 150 × 86 mm de l’ASUS TUF Gaming 750W Bronze.',
  'Published dimensions and external features of the ASUS TUF Gaming 750W Bronze; internal geometry and component placement are illustrative.':
    'Dimensions et éléments extérieurs publiés de l’ASUS TUF Gaming 750W Bronze ; la géométrie interne et l’emplacement des composants sont illustratifs.',
  'Non-modular': 'Non modulaire',
  'Fixed cable harness': 'Faisceau de câbles fixes',
  'Fixed cables': 'Câbles fixes',
  'Permanent sleeved cable looms leave the supply through a protected opening, with no detachable PSU-side sockets.':
    'Des faisceaux gainés permanents sortent de l’alimentation par une ouverture protégée, sans prise détachable côté alimentation.',
  'Delivers power through permanently attached leads to the motherboard, CPU, graphics card and drives.':
    'Alimente la carte mère, le CPU, la carte graphique et les disques par des câbles attachés en permanence.',
  '4 modeled cable looms': '4 faisceaux modélisés',
  'Cable families follow ASUS documentation; bundle routing and connector geometry are illustrative.':
    'Les familles de câbles suivent la documentation ASUS ; le cheminement des faisceaux et la géométrie des connecteurs sont illustratifs.',
  '24-pin · EPS · PCIe 6+2-pin · SATA':
    '24 broches · EPS · PCIe 6+2 broches · SATA',
  'TUF Gaming 650W Bronze housing': 'Boîtier de la TUF Gaming 650W Bronze',
  '650W housing': 'Boîtier 650W',
  'The 150 × 150 × 86 mm folded steel shell of the ASUS TUF Gaming 650W Bronze.':
    'La coque en acier plié de 150 × 150 × 86 mm de l’ASUS TUF Gaming 650W Bronze.',
  'Published dimensions and external features of the ASUS TUF Gaming 650W Bronze; internal geometry and component placement are illustrative. ASUS does not state the cabling; it is drawn with fixed leads, as retail listings describe it.':
    'Dimensions et éléments extérieurs publiés de l’ASUS TUF Gaming 650W Bronze ; la géométrie interne et l’emplacement des composants sont illustratifs. ASUS ne précise pas le câblage ; il est dessiné avec des câbles fixes, comme le décrivent les fiches des revendeurs.',
  '24-pin · 2 × CPU 4+4-pin · 2 × PCIe 6+2-pin · 4 × SATA':
    '24 broches · 2 × CPU 4+4 broches · 2 × PCIe 6+2 broches · 4 × SATA',
  'TUF Gaming 1000W Gold housing': 'Boîtier de la TUF Gaming 1000W Gold',
  '1000W housing': 'Boîtier 1000W',
  'The 150 × 150 × 86 mm folded steel shell of the ASUS TUF Gaming 1000W Gold.':
    'La coque en acier plié de 150 × 150 × 86 mm de l’ASUS TUF Gaming 1000W Gold.',
  'Published dimensions and external features of the ASUS TUF Gaming 1000W Gold; internal geometry and component placement are illustrative.':
    'Dimensions et éléments extérieurs publiés de l’ASUS TUF Gaming 1000W Gold ; la géométrie interne et l’emplacement des composants sont illustratifs.',
  '24-pin · 2 × CPU 4+4-pin · PCIe 16-pin · 4 × PCIe 8-pin · 5 × SATA':
    '24 broches · 2 × CPU 4+4 broches · PCIe 16 broches · 4 × PCIe 8 broches · 5 × SATA',
  'TUF Gaming 1200W Gold housing': 'Boîtier de la TUF Gaming 1200W Gold',
  '1200W housing': 'Boîtier 1200W',
  'The 150 × 150 × 86 mm folded steel shell of the ASUS TUF Gaming 1200W Gold.':
    'La coque en acier plié de 150 × 150 × 86 mm de l’ASUS TUF Gaming 1200W Gold.',
  'Published dimensions and external features of the ASUS TUF Gaming 1200W Gold; internal geometry and component placement are illustrative.':
    'Dimensions et éléments extérieurs publiés de l’ASUS TUF Gaming 1200W Gold ; la géométrie interne et l’emplacement des composants sont illustratifs.',
  '24-pin · 2 × CPU 4+4-pin · 2 × PCIe 16-pin · 3 × PCIe 8-pin · 5 × SATA':
    '24 broches · 2 × CPU 4+4 broches · 2 × PCIe 16 broches · 3 × PCIe 8 broches · 5 × SATA',
};
