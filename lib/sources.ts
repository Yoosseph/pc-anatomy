/**
 * Every technical claim in the manifest points at one of these.
 *
 * Standards bodies and vendor documentation first. A source backs the operating
 * principle and the published specification of a component *family*. It is
 * never evidence that a particular modeled part is populated on a particular
 * machine.
 *
 * One exception, named as such: a retail card's internal construction (heat
 * pipe count, power phases, board length) is rarely published by its maker.
 * Where a model follows a specific card, a hands-on teardown review is cited
 * for that construction alone, and its name says it is an independent review.
 */
export const sources = {
  tuf5090: {
    name: 'ASUS · TUF RTX 5090 construction and cooling',
    url: 'https://www.asus.com/uk/motherboards-components/graphics-cards/tuf-gaming/tuf-rtx5090-32g-gaming/',
  },
  tuf5090specs: {
    name: 'ASUS · TUF RTX 5090 specifications',
    url: 'https://www.asus.com/uk/motherboards-components/graphics-cards/tuf-gaming/tuf-rtx5090-32g-gaming/techspec/',
  },
  whitepaper: {
    name: 'NVIDIA · RTX Blackwell architecture',
    url: 'https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf',
  },
  specs: {
    name: 'NVIDIA · RTX 5090 specifications',
    url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/',
  },
  cuda: {
    name: 'NVIDIA · CUDA programming guide',
    url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/',
  },
  powerdesign: {
    name: 'MPS · GPU power conversion principles',
    url: 'https://www.monolithicpower.com/en/learning/resources/powering-the-next-sophisticated-ai-system',
  },
  monitor: {
    name: 'Texas Instruments · Current and voltage monitoring',
    url: 'https://www.ti.com/lit/ds/symlink/ina3221.pdf',
  },
  temperature: {
    name: 'Texas Instruments · Temperature sensing',
    url: 'https://www.ti.com/product/TMP451',
  },
  flash: {
    name: 'Winbond · W25Q serial NOR flash documentation',
    url: 'https://www.winbond.com/hq/product/code-storage-flash/qspi-nor/w25q-jv/?__locale=en&partNo=W25Q128JVBIQG',
  },
  construction: {
    name: 'NVIDIA · Founders Edition cooling and construction',
    url: 'https://www.nvidia.com/en-gb/geforce/news/rtx-50-series-graphics-cards-gpu-laptop-announcements/',
  },
  // ── Whole-machine standards ──────────────────────────────────────────────
  psu: {
    name: 'Intel · ATX multi-rail power supply design guide',
    url: 'https://www.intel.com/content/www/us/en/content-details/336521/atx-version-3-multi-rail-desktop-platform-power-supply-design-guide.html',
  },
  tuf850g: {
    name: 'ASUS · TUF Gaming 850W Gold specifications and construction',
    url: 'https://www.asus.com/motherboards-components/power-supply-units/tuf-gaming/tuf-gaming-850g/techspec/',
  },
  tuf850fan: {
    name: 'ASUS · TUF Gaming 850W Gold fan and construction',
    url: 'https://www.asus.com/motherboards-components/power-supply-units/tuf-gaming/tuf-gaming-850g/',
  },
  tuf750b: {
    name: 'ASUS · TUF Gaming 750W Bronze specifications and construction',
    url: 'https://www.asus.com/uk/motherboards-components/power-supply-units/tuf-gaming/tuf-gaming-750b/techspec/',
  },
  tuf750fan: {
    name: 'ASUS · TUF Gaming 750W Bronze fan and construction',
    url: 'https://www.asus.com/us/motherboards-components/power-supply-units/tuf-gaming/tuf-gaming-750b/',
  },
  ddr5: {
    name: 'Micron · DDR5 client module architecture white paper',
    url: 'https://www.micron.com/content/dam/micron/global/public/products/white-paper/ddr5-key-module-features-wp-client.pdf',
  },
  pcie: {
    name: 'PCI-SIG · PCI Express specifications',
    url: 'https://pcisig.com/specifications',
  },
  nvme: {
    name: 'NVM Express · Specifications',
    url: 'https://nvmexpress.org/specifications/',
  },
  bldc: {
    name: 'Texas Instruments · Brushless DC motor commutation with Hall sensors',
    url: 'https://www.ti.com/document-viewer/lit/html/SLVAEG3',
  },
  coolermount: {
    name: 'Intel · Processor cooler socket compatibility',
    url: 'https://www.intel.com/content/www/us/en/support/articles/000099700/processors.html',
  },
  sata: {
    name: 'TE Connectivity · SATA 7 + 15 contact connector drawings',
    url: 'https://www.te.com/en/product-2129475-1.html',
  },
  aio: {
    name: 'ARCTIC · Liquid Freezer III pump, coldplate and radiator design',
    url: 'https://www.arctic.de/en/Liquid-Freezer-III-360',
  },
  ryzen: {
    name: 'AMD · Ryzen 9 9950X specifications',
    url: 'https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9950x.html',
  },
  zen5: {
    name: 'AMD · Zen 5 microarchitecture optimization guide',
    url: 'https://docs.amd.com/v/u/en-US/58455_1.00',
  },
  corei9: {
    name: 'Intel · Core Ultra 9 285K specifications',
    url: 'https://www.intel.com/content/www/us/en/products/sku/241060/intel-core-ultra-9-processor-285k-36m-cache-up-to-5-70-ghz/specifications.html',
  },
  arrowlake: {
    name: 'Intel · Core Ultra 200S architecture and interfaces datasheet',
    url: 'https://edc.intel.com/content/www/us/en/design/products/platforms/details/arrow-lake-s/core-ultra-200s-series-processors-datasheet-volume-1-of-2/',
  },
  mainboardmanual: {
    name: 'ASUS · X670E motherboard layout and connector manual',
    url: 'https://dlcdnets.asus.com/pub/ASUS/mb/Socket%20AM5/TUF_GAMING_X670E-PLUS_WIFI/E20195_TUF_GAMING_X670E_PLUS_WIFI_UM_WEB.pdf',
  },
  samsungnvme: {
    name: 'Samsung · 990 PRO M.2 SSD hardware datasheet',
    url: 'https://download.semiconductor.samsung.com/resources/data-sheet/samsung_nvme_ssd_990_pro_datasheet_rev.2.0.pdf',
  },
  samsungsata: {
    name: 'Samsung · 870 EVO SATA SSD hardware datasheet',
    url: 'https://download.semiconductor.samsung.com/resources/data-sheet/Samsung_SSD_870_EVO_Data_Sheet_Rev1.1_230509.pdf',
  },
  ssdarchitecture: {
    name: 'Samsung · SSD controller and flash architecture white paper',
    url: 'https://download.semiconductor.samsung.com/resources/white-paper/Samsung_SSD_950_PRO_White_paper.pdf',
  },
  ddr5architecture: {
    name: 'Kingston · DDR5 module and subchannel architecture',
    url: 'https://www.kingston.com/en/blog/pc-performance/ddr5-overview',
  },
  jedecddr5: {
    name: 'JEDEC · DDR5 SDRAM standard (JESD79-5D)',
    url: 'https://www.jedec.org/standards-documents/docs/jesd79-5d',
  },
  micronddr5: {
    name: 'Micron · DDR5 SDRAM new features white paper',
    url: 'https://www.micron.com/content/dam/micron/global/public/products/white-paper/ddr5-new-features-white-paper.pdf',
  },
  skhynixddr5: {
    name: 'SK hynix · DDR5 banks, burst length and refresh',
    url: 'https://news.skhynix.com/en/why-ddr5-is-the-industrys-powerful-next-gen-memory',
  },
  // University teaching reference: no vendor white paper explains the 1T1C cell and sense-amp operation cleanly.
  dramfundamentals: {
    name: 'Simon Fraser University · DRAM banks, rows and sense amplifiers (course notes)',
    url: 'https://www.cs.sfu.ca/~ashriram/Courses/CS7ARCH/assets/lectures/11_Memory_Consistency_DRAM.pdf',
  },
  kingstonfury: {
    name: 'Kingston · FURY Beast DDR5 product page',
    url: 'https://www.kingston.com/en/memory/gaming/kingston-fury-beast-ddr5-memory',
  },
  // Independent review, cited for construction detail the maker does not publish.
  kingstonfuryreview: {
    name: "Tom's Hardware (independent review) · Kingston FURY Beast DDR5 construction",
    url: 'https://www.tomshardware.com/reviews/kingston-fury-beast-ddr5-5200-c40-review',
  },
  // Independent review, cited for the plate/interlock/clip construction narrative.
  aphnetworks: {
    name: 'APH Networks (independent review) · Kingston FURY Beast DDR5 construction',
    url: 'https://aphnetworks.com/reviews/kingston-fury-beast-ddr5-5200-2x16gb/2',
  },
  fanconstruction: {
    name: 'Noctua · Fan frame, impeller and bearing construction',
    url: 'https://cdn.noctua.at/media/noctua_nf_a12x25_pwm_infosheet_en_web.pdf',
  },
  aircooler: {
    name: 'Noctua · Tower cooler construction and mounting',
    url: 'https://cdn.noctua.at/media/noctua_nh_u12a_infosheet_en_web.pdf',
  },
  acdc: {
    name: 'Texas Instruments · PFC / LLC power supply reference design and schematics',
    url: 'https://www.ti.com/tool/TIDA-010015',
  },
  multiphase: {
    name: 'Texas Instruments · Multiphase regulator circuit architecture',
    url: 'https://www.ti.com/product/TPS53679',
  },
  esd: {
    name: 'Texas Instruments · Display-interface ESD protection reference design',
    url: 'https://www.ti.com/tool/TIDA-050001',
  },
  packaging: {
    name: 'Texas Instruments · BGA packaging and PCB assembly notes',
    url: 'https://www.ti.com/design-development/packaging/smt-application-notes.html',
  },
  crystal: {
    name: 'Texas Instruments · Crystal oscillator circuit and layout',
    url: 'https://www.ti.com/video/6313368697112',
  },
  bearing: {
    name: 'Noctua · Fan bearing principles and cross-section',
    url: 'https://www.noctua.at/en/expertise/tech/sso-bearing',
  },
  fuse: {
    name: 'Littelfuse · Surface-mount fuse construction and ratings',
    url: 'https://www.littelfuse.com/assetdocs/fuse-437-datasheet?assetguid=7efbf979-42bb-4da1-b7b4-e1ec5d2b3789',
  },
  chassis: {
    name: 'Fractal Design · ATX case assembly and drive-mount diagrams',
    url: 'https://www.fractal-design.com/app/uploads/2023/08/Define-7-Manual-V.3-2023-08-21.pdf',
  },
  // ── AMD Radeon RX 9070 XT ───────────────────────────────────────────────
  rdna4: {
    name: 'AMD · RDNA 4 Radeon 9000 series architecture (Hot Chips 2025)',
    url: 'https://hc2025.hotchips.org/assets/program/conference/day1/8_amd_pomianowski_final.pdf',
  },
  rx9070xt: {
    name: 'AMD · Radeon RX 9070 XT specifications',
    url: 'https://www.amd.com/en/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9070xt.html',
  },
  rdna4guide: {
    name: 'AMD · RDNA 4 quick reference guide',
    url: 'https://www.amd.com/content/dam/amd/en/documents/partner-hub/radeon/amd-rdna-4-quick-reference-guide.pdf',
  },
  nitro9070: {
    name: 'Sapphire · NITRO+ Radeon RX 9070 XT OC product page',
    url: 'https://www.sapphiretech.com/en/consumer/nitro-radeon-rx-9070-xt-16g-gddr6',
  },
  nitroteardown: {
    name: 'KitGuru (independent review) · Sapphire RX 9070 XT Nitro+ construction and PCB',
    url: 'https://www.kitguru.net/components/graphic-cards/dominic-moass/sapphire-rx-9070-xt-nitro-review/all/1/',
  },
  mpsphase: {
    name: 'MPS · Intelli-Phase integrated driver and MOSFET power stages',
    url: 'https://www.monolithicpower.com/en/products/power-management/multi-phase-controllers-intelli-phase/processor-core-power-intelli-phase-monolithic-drmos.html',
  },
  mpscontroller: {
    name: 'MPS · Digital multi-phase processor core controllers',
    url: 'https://www.monolithicpower.com/en/products/power-management/multi-phase-controllers-intelli-phase/processor-core-power-controllers.html',
  },
  gddr6: {
    name: 'Samsung · GDDR6 graphics DRAM',
    url: 'https://semiconductor.samsung.com/dram/gddr/gddr6/',
  },
  // ── Intel Arc B580 ───────────────────────────────────────────────────────
  arcb580: {
    name: 'Intel · Arc B580 Graphics specifications',
    url: 'https://www.intel.com/content/www/us/en/products/sku/241598/intel-arc-b580-graphics/specifications.html',
  },
  xe2deck: {
    name: 'Intel · Arc B580 and B570 launch briefing: Xe2 architecture',
    url: 'https://download.intel.com/newsroom/2024/client-computing/Intel-Arc-B580-B570-Media-Deck.pdf',
  },
  xearchitecture: {
    name: 'Intel · oneAPI GPU optimization guide: Xe GPU architecture',
    url: 'https://www.intel.com/content/www/us/en/docs/oneapi/optimization-guide-gpu/2025-2/intel-xe-gpu-architecture.html',
  },
  arclaunch: {
    name: 'Intel · Arc B-series launch announcement',
    url: 'https://www.intel.com/content/www/us/en/newsroom/news/intel-launches-arc-b-series-graphics-cards.html',
  },
  arcteardown: {
    name: 'Overclocking.com (independent review) · Arc B580 Limited Edition teardown',
    url: 'https://en.overclocking.com/review-intel-arc-b580-limited-edition/2/',
  },
  arcphotos: {
    name: "Tom's Hardware (independent report) · Arc B580 teardown photographs",
    url: 'https://www.tomshardware.com/pc-components/gpus/intels-new-arc-gpu-gets-naked-in-unsanctioned-peep-show-b580-has-nvidia-founders-edition-inspired-cooler-bgm-g21-die-surrounded-by-20-gbps-gddr6-memory',
  },
  arcreview: {
    name: 'KitGuru (independent review) · Arc B580 Limited Edition cooler and board',
    url: 'https://www.kitguru.net/components/graphic-cards/dominic-moass/intel-arc-b580-limited-edition-review/all/1/',
  },
} as const;

export type SourceId = keyof typeof sources;
