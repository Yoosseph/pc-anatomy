/**
 * Every technical claim in the manifest points at one of these.
 *
 * Standards bodies and vendor documentation only. A source backs the operating
 * principle and the published specification of a component *family* — it is
 * never evidence that a particular modeled part is populated on a particular
 * machine.
 */
export const sources = {
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
    name: 'Winbond · Serial flash documentation',
    url: 'https://www.winbond.com/hq/support/documentation/index.html?__locale=en',
  },
  construction: {
    name: 'NVIDIA · Founders Edition cooling and construction',
    url: 'https://www.nvidia.com/en-gb/geforce/news/rtx-50-series-graphics-cards-gpu-laptop-announcements/',
  },
  // ── Whole-machine standards ──────────────────────────────────────────────
  atx: {
    name: 'Intel · ATX specification (board and chassis geometry)',
    url: 'https://www.bitsavers.org/pdf/intel/ATX/ATX_Specification_2.01_199702.PDF',
  },
  psu: {
    name: 'Intel · ATX12VO desktop power supply design guide',
    url: 'https://cdrdv2-public.intel.com/613768/613768_2.11.pdf',
  },
  ddr5: {
    name: 'JEDEC · DDR5 SDRAM standard (JESD79-5)',
    url: 'https://www.jedec.org/standards-documents/docs/jesd79-5d',
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
    url: 'https://www.ti.com/lit/ab/slvaeg3b/slvaeg3b.pdf',
  },
  coolermount: {
    name: 'Intel · Processor cooler socket compatibility',
    url: 'https://www.intel.com/content/www/us/en/support/articles/000099700/processors.html',
  },
  sata: {
    name: 'SATA-IO · Serial ATA standard',
    url: 'https://sata-io.org/',
  },
} as const;

export type SourceId = keyof typeof sources;
