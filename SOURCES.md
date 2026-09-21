# Technical provenance

Reviewed 2026-09-19. PC Anatomy is independent of the manufacturers cited here. All geometry is original.

## Current component reference audit

All 343 component entries now have references in their detail panels. The complete
[component-to-document index](docs/component-references.md) records those mappings.
The registry in `lib/sources.ts` is authoritative for current app links; older notes
below preserve the research history.

- CPU and GPU internals use NVIDIA's RTX Blackwell white paper, AMD's Zen 5
  microarchitecture guide, AMD's RDNA 4 Hot Chips 2025 presentation, Intel's
  Core Ultra 200S architecture/interface datasheet, and Intel's Xe2 launch
  briefing and oneAPI Xe architecture guide, alongside SKU specifications.
- The RX 9070 XT and Arc B580 card exteriors follow the Sapphire NITRO+ and the
  Intel Limited Edition. Where their makers publish no construction detail,
  independent teardown reviews are cited and named as such.
- Motherboard layout, slots, headers, audio and network connectivity use the ASUS
  X670E manual. Micron and Kingston document DDR5 module architecture.
- Samsung's 870 EVO and 990 PRO datasheets document the SATA and M.2 drive families.
  The 950 PRO white paper explains SSD controller/flash architecture; it does not
  establish the exact controller implementation in the illustrative models.
- Intel's **multi-rail ATX** power guide replaces the mismatched ATX12VO reference.
  TI's TIDA-010015 schematics explain PFC, LLC conversion and rectification. That
  reference design is a 24 V industrial supply, so it supports circuit principles,
  not the modeled ATX output voltages or a particular PC PSU's topology.
- ASUS's [TUF Gaming 850W Gold specifications](https://www.asus.com/motherboards-components/power-supply-units/tuf-gaming/tuf-gaming-850g/techspec/)
  and [TUF Gaming 750W Bronze specifications](https://www.asus.com/uk/motherboards-components/power-supply-units/tuf-gaming/tuf-gaming-750b/techspec/)
  establish each 150 × 150 × 86 mm enclosure, 135 mm fan, output rating, efficiency
  class and cable families. The Gold model has modular PSU-side sockets; the
  Bronze model has permanently attached leads. The sheet-metal details, connector
  cavities, cable routing and all internal components are original illustrative
  geometry, not ASUS service documentation or a teardown reconstruction.
- Noctua's fan and tower-cooler documents, ARCTIC's liquid-cooler construction, and
  Fractal Design's case manual support the mechanical component families. Their
  dimensions, counts and proprietary designs are not claimed for our generic models.
  In particular, the fan's sleeve is illustrative, not a reproduction of Noctua's
  SSO bearing; the decorative tower top cover is an original model detail.
- TI packaging, regulator, oscillator and ESD documentation and Littelfuse fuse
  documentation replace generic GPU-specification links for board-level components.
  No exact TI or Littelfuse IC or part is asserted to be populated on the ASUS card.

The old ATX archive, JEDEC landing page and SATA-IO homepage could not be verified
with the browsing tool during this audit. Current app links instead point to
manufacturer construction manuals, Micron's DDR5 white paper and TE Connectivity's
7+15-contact SATA connector drawings. Document links were checked through web
retrieval/search; automated direct HTTP checks were unavailable in this environment.

### M.2 SSD model scope

The Storage menu now exposes both the 2.5-inch SATA SSD and M.2 NVMe SSD. The latter
also opens from the motherboard. Its nominal 22 × 80 mm module has a mounting
notch, an M-key contact gap, a controller, DRAM and two NAND packages. BGA joints
are beneath the chips. Package count, contact count and routing are illustrative.
The model is an educational assembly, not a reproduction of the Samsung 990 PRO PCB.

### Memory module dive

The Memory menu dives from a DDR5 module to one DRAM package, to the 32 banks
of a 16 Gb x8 die, to the rows, columns and cells of a single bank. The
modelled module is one educational example — a single-sided, single-rank UDIMM
with eight x8 packages — and the copy says so wherever package count, rank
count or layout could be read as universal. Bank-block sizes, the cell grid
(about 16 × 8 illustrative cells against tens of thousands of real rows) and
package internals are illustrative; the package is sealed in reality and no die
floorplan or transistor placement is claimed. The module keeps the 133.35 mm
DDR5 length with a JEDEC height class (gaming spreaders are taller) and a keyed
288-pin edge.

- [JEDEC DDR5 SDRAM standard (JESD79-5D)](https://www.jedec.org/standards-documents/docs/jesd79-5d)
  and the [JEDEC DDR5 launch release](https://www.jedec.org/news/pressreleases/jedec-publishes-new-ddr5-standard-advancing-next-generation-high-performance)
  support the two independent 32-bit subchannels, the 32 banks in
  8 bank groups and BL16.
- [Micron's DDR5 client-module paper](https://www.micron.com/content/dam/micron/global/public/products/white-paper/ddr5-key-module-features-wp-client.pdf)
  supports the 288-pin module outline and pin count, the subchannel wiring
  and the on-module power regulation and SPD hub roles.
- [Micron's DDR5 new-features white paper](https://www.micron.com/content/dam/micron/global/public/products/white-paper/ddr5-new-features-white-paper.pdf)
  supports the bank organisation, burst length and refresh behaviour.
- [SK hynix on DDR5 banks, burst length and refresh](https://news.skhynix.com/en/why-ddr5-is-the-industrys-powerful-next-gen-memory)
  cross-checks the 32-bank, 8-group organisation.
- [SFU course notes on DRAM banks, rows and sense amplifiers](https://www.cs.sfu.ca/~ashriram/Courses/CS7ARCH/assets/lectures/11_Memory_Consistency_DRAM.pdf)
  support the 1T1C cell, destructive read with writeback, row buffer and
  sense-amp operation that no vendor white paper teaches cleanly.
- [Kingston's DDR5 overview](https://www.kingston.com/en/blog/pc-performance/ddr5-overview)
  (already cited) supports the module and subchannel architecture; TI BGA
  packaging notes (already cited) support the substrate and ball-grid
  construction language without claiming flip-chip or wire-bond detail.

### Reference module: Kingston FURY Beast

The modelled spreader follows the Kingston FURY Beast DDR5 line in style
only: two thin mirror plates over the packages with angled asymmetric
faceting, interlocked along the top edge with locking clips, text-only
branding that differs per face, and an exposed contact edge. Outline
(133.35 mm), height class, colour and the exposed edge are the published
facts; facet styling, interlock and clip detail, surface texture, exact badge
geometry and placement, IC-side population and routing are illustrative of
the 1Rx8 example, and no Kingston logo is reproduced.

- [Kingston FURY Beast DDR5 product page](https://www.kingston.com/en/memory/gaming/kingston-fury-beast-ddr5-memory)
  supports the line's dimensions, colours, capacities and rates.
- [Tom's Hardware review of the FURY Beast DDR5](https://www.tomshardware.com/reviews/kingston-fury-beast-ddr5-5200-c40-review),
  an independent review, supports the construction detail the maker does not
  publish: black PCB with matching spreader, single-sided 1Rx8 layout and the
  exposed edge seating the slot.
- [APH Networks review of the FURY Beast DDR5](https://aphnetworks.com/reviews/kingston-fury-beast-ddr5-5200-2x16gb/2),
  an independent review, supports the plate construction narrative: thin
  halves, top-edge interlock, locking clips and adhesive strips.

Kingston assembles modules; it does not fabricate the DRAM dies, which it
sources from manufacturers such as Micron, SK hynix and others with variance
between kits. Kingston attribution in this project covers the module —
spreader, dimensions and 1Rx8 organisation — and never the die, which stays
vendor-neutral throughout.

**Limits.** Early 8 Gb x4/x8 dies hold 16 banks (8 groups × 2), early 8 Gb
x16 dies hold 8 (4 groups × 2), and 16–64 Gb x16 dies hold 16 (4 groups × 4)
— the app qualifies its counts to 16 Gb or larger x8 dies. Row, column and
page counts are qualified the same way (16 row bits × 10 column bits on
16 Gb x8; a column address selects 8 bits on x8, so an open row is 1 KiB).
On-die ECC versus side-band DIMM ECC is left out of the copy except for the
subchannel width note the standard requires.

## Additional graphics cards · September 17, 2026

The GPU menu now holds three complete cards, each in its own dropdown and each
taken apart to the same depth: card, processor, and three logical scales below
it. The RTX 5090 is still the only card installed in the tower; the RX 9070 XT
and Arc B580 are opened from the GPU menu and are marked as alternatives, the
same way the Intel processor and the liquid cooler are.

### AMD Radeon RX 9070 XT (Sapphire NITRO+)

- [AMD Hot Chips 2025: RDNA 4 Radeon 9000 series](https://hc2025.hotchips.org/assets/program/conference/day1/8_amd_pomianowski_final.pdf)
  is the primary architecture source. It documents a monolithic TSMC 4 nm die
  of 356.5 mm², four shader engines, eight workgroup processors per engine, two
  compute units per WGP, and per shader engine a rasterizer, primitive unit,
  render backends (RB+) and render assist (RA) blocks. It gives the 8 MB L2
  cache, 64 MB third-generation Infinity Cache, four 4 × 16-bit memory
  controllers (256-bit), the command processor with packet accelerators, dual
  media engines, the Radiance Display Engine, the MP0 security and power
  microcontroller and the central compression engines. Its compute engine slide
  lists the scalar unit, two 32-wide ALUs (FMA and FMA/INT), the 8-wide TLU, the
  matrix accelerator, 192 KB vector GPR, 8 KB scalar GPR, 16 KB scalar cache,
  128 KB shared memory, 32 KB ray accelerator L0 cache, 32 KB shader instruction
  cache, scheduler units and texture load/store units. Its ray tracing slide
  gives 8 ray/box and 2 ray/triangle units and 8-wide BVH traversal.
- [AMD Radeon RX 9070 XT specifications](https://www.amd.com/en/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9070xt.html):
  64 compute units, 4,096 stream processors, 64 ray accelerators, 128 AI
  accelerators, 128 ROPs, 16 GB GDDR6 at 20 Gbps over 256 bits (640 GB/s), 64 MB
  Infinity Cache, 304 W TBP, 53.9 billion transistors, PCIe 5.0 ×16,
  DisplayPort 2.1a and HDMI 2.1b.
- [AMD RDNA 4 quick reference guide](https://www.amd.com/content/dam/amd/en/documents/partner-hub/radeon/amd-rdna-4-quick-reference-guide.pdf)
  cross-checks the generation of the ray and AI accelerators and the display
  interface standards.
- [Sapphire NITRO+ RX 9070 XT product page](https://www.sapphiretech.com/en/consumer/nitro-radeon-rx-9070-xt-16g-gddr6)
  identifies the exterior reference. AMD sold no card of its own for this GPU.
- [KitGuru's NITRO+ review](https://www.kitguru.net/components/graphic-cards/dominic-moass/sapphire-rx-9070-xt-nitro-review/all/1/)
  is an **independent teardown**, cited only for construction Sapphire does not
  publish: 330.8 × 128.5 × 65.68 mm, three 100 mm fans, six heat pipes onto a
  shared GPU and memory baseplate with secondary VRM plates, a steel support
  frame, a backplate held by six magnets, the 12V-2x6 socket and ARGB header on
  the rear of the PCB, two HDMI and two DisplayPort outputs, sixteen phases
  (10 GPU, 3 SoC, 2 memory, 1 VDDCI) run by two MPS MP2868A controllers with MPS
  MP87993 power stages, and no dual-BIOS switch.
- [MPS Intelli-Phase power stages](https://www.monolithicpower.com/en/products/power-management/multi-phase-controllers-intelli-phase/processor-core-power-intelli-phase-monolithic-drmos.html)
  and [MPS multiphase controllers](https://www.monolithicpower.com/en/products/power-management/multi-phase-controllers-intelli-phase/processor-core-power-controllers.html)
  explain those part families. Neither page lists the exact part numbers.
- [Samsung GDDR6](https://semiconductor.samsung.com/dram/gddr/gddr6/) explains
  the memory family. No memory vendor is claimed for the NITRO+.

**Limits.** AMD shows the compute engine as one diagram. Which of its blocks
belong to the workgroup processor (shared memory, schedulers) and which to each
compute unit is an interpretation of that diagram and is labelled as one in
every affected entry. Block sizes and positions are illustrative, and the
Navi 48 die scale is not a floorplan. AMD's Hot Chips slide and AMD's product
page disagree on the transistor count; the app quotes the product page's
53.9 billion. Board layout, pipe routing, fin count and passive population are
original approximations, not the Sapphire PCB.

### Intel Arc B580 (Limited Edition)

- [Intel Arc B580 specifications](https://www.intel.com/content/www/us/en/products/sku/241598/intel-arc-b580-graphics/specifications.html):
  Xe2 microarchitecture on TSMC N5, 20 Xe-cores, 5 render slices, 20 ray
  tracing units, 160 XMX engines, 160 Xe vector engines, 2,670 MHz graphics
  clock, 233 peak TOPS, 190 W TBP, 12 GB GDDR6 at 19 Gbps over 192 bits
  (456 GB/s), PCIe 4.0 ×8, four displays over HDMI 2.1 and DisplayPort 2.1
  (UHBR 13.5 and UHBR 10), H.264, HEVC and AV1 encode and decode, 272 × 115 mm,
  two slots, 779 g, one 8-pin connector.
- [Intel Arc B580 and B570 launch briefing](https://download.intel.com/newsroom/2024/client-computing/Intel-Arc-B580-B570-Media-Deck.pdf)
  documents the Xe2 blocks: eight 512-bit vector engines and eight 2048-bit XMX
  engines per Xe-core, native SIMD16 ALUs, 256 KB shared L1/SLM with 64-bit
  atomic operations, three-way co-issue, extended math and FP64, ray tracing
  units with 18 box and 2 triangle intersections, 3 traversal pipelines and a
  16 KB BVH cache, and for the whole GPU 20 texture samplers, 10 pixel backends,
  an 18 MB L2 cache and two multi-format transcoders.
- [Intel oneAPI GPU optimization guide: Xe GPU architecture](https://www.intel.com/content/www/us/en/docs/oneapi/optimization-guide-gpu/2025-2/intel-xe-gpu-architecture.html)
  gives the Xe2-HPG row for the B580: 20 Xe-cores, 8 vector engines per core,
  8 hardware threads per vector engine, 512-bit registers, 256 KB L1 and 128 KB
  SLM per Xe-core, native double precision and sub-group sizes of 16 and 32. It
  also documents the earlier Xe-HPG slice and Xe-core organisation.
- [Intel Arc B-series launch announcement](https://www.intel.com/content/www/us/en/newsroom/news/intel-launches-arc-b-series-graphics-cards.html)
  cross-checks the XMX engines, twin media transcoders and codec support.
- [Overclocking.com's B580 Limited Edition teardown](https://en.overclocking.com/review-intel-arc-b580-limited-edition/2/)
  and [KitGuru's review](https://www.kitguru.net/components/graphic-cards/dominic-moass/intel-arc-b580-limited-edition-review/all/1/)
  are **independent reviews**, cited for construction: two 85 mm fans with
  eleven ring-linked blades, four heat pipes into two fin stacks, a backplate
  cut-out for flow-through, an eight-layer PCB much shorter than the cooler with
  six GPU and two memory phases, a copper cold plate, six GDDR6 packages and a
  white LED logo as the only lighting.
- [Tom's Hardware teardown photographs](https://www.tomshardware.com/pc-components/gpus/intels-new-arc-gpu-gets-naked-in-unsanctioned-peep-show-b580-has-nvidia-founders-edition-inspired-cooler-bgm-g21-die-surrounded-by-20-gbps-gddr6-memory),
  an **independent report**, show the copper cold plate, the six GDDR6 packages
  around the centred BMG-G21, a board about half the length of the cooler and
  the backplate opening.

**Limits.** Intel publishes texture samplers and pixel backends as totals for
the GPU; the render slice scale divides them evenly across five slices and says
so. Intel does not publish the memory controller count, so the GDDR6 interface
is one block. No die area or transistor count is quoted, because neither
appears in the cited Intel documents. As with the other cards, board layout,
pipe routing and passive population are original approximations.

## Architecture and specifications

- [NVIDIA RTX Blackwell architecture whitepaper, v1.1](https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf), printed pp. 8–12 and 46–48. RTX 5090: 11 GPCs, 85 TPCs, 170 SMs, 21,760 CUDA cores, 680 Tensor cores, 170 RT cores, 96 MB L2. Full GB202: 12 GPCs, 96 TPCs, 192 SMs; these are not the shipping 5090 counts. A full GPC contains 8 TPCs and a TPC contains 2 SMs. Per SM: 128 CUDA cores, 4 Tensor cores, 1 RT core, 4 texture units, 256 KB registers, 128 KB L1/shared memory. The representative GPC is not a claim about which TPCs are disabled in a particular 5090.
- [NVIDIA RTX 5090 specifications and hardware overview](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/): 32 GB GDDR7, 512-bit interface, 575 W graphics power, PCIe 5.0, double flow-through cooler, DisplayPort and HDMI.
- [NVIDIA launch announcement](https://www.nvidia.com/en-us/geforce/news/rtx-50-series-graphics-cards-gpu-laptop-announcements/): cross-check of enabled CUDA/Tensor/RT counts and 1,792 GB/s memory bandwidth.

## Representation limits

### ASUS TUF RTX 5090 model update · September 15, 2026

The selected exterior reference is now the ASUS TUF Gaming RTX 5090.
[ASUS specifications](https://www.asus.com/uk/motherboards-components/graphics-cards/tuf-gaming/tuf-rtx5090-32g-gaming/techspec/)
document a 348 × 146 × 72 mm envelope, 3.6-slot thickness, three DisplayPort
2.1b and two HDMI 2.1b outputs, and one 16-pin power connector.
[ASUS construction images](https://www.asus.com/uk/motherboards-components/graphics-cards/tuf-gaming/tuf-rtx5090-32g-gaming/)
inform the angular shroud, brushed corner inserts, opposed centre fan, vented
backplate, vapor chamber and twelve heatpipes. Fins remain one selectable
heatsink assembly throughout dissection and inventory. GPU, memory and support
circuit placement remains an educational approximation, not manufacturing CAD,
an exact PCB netlist, or a service guide. Earlier generic cooler descriptions
below record previous versions and are superseded by this reference.

The physical assembly is an illustrative modern card, not an exact Founders Edition CAD model or repair guide. Board outline, traces, fasteners, fin count, passive placement and power stages are authored for clarity, not asserted engineering specifications. Internal views are logical diagrams with arbitrary block sizes and positions; transistor placement is not claimed. Repeated instances have stable identifiers but illustrative placement.

## Component expansion · September 12, 2026

The hardware catalog now separates the exposed silicon, package substrate, BGA connection field, thermal interface, retention spring, standoffs, fan motors and wiring. It also includes PWM control, VBIOS flash, reference crystal, power telemetry, temperature sensing, current shunts, auxiliary regulators, protection devices, fan headers, test points and separate HDMI/DisplayPort connectors. The architecture view includes NVENC, NVDEC, display, host-interface and command-front-end groups.

- [NVIDIA's Founders Edition construction overview](https://www.nvidia.com/en-gb/geforce/news/rtx-50-series-graphics-cards-gpu-laptop-announcements/) documents the liquid-metal thermal interface and three-piece FE PCB. Our single-board educational assembly is **not** the FE board layout.
- [MPS: GPU power conversion](https://www.monolithicpower.com/en/learning/resources/powering-the-next-sophisticated-ai-system) supports the explanations of controllers, power stages, inductors and capacitors. It is a reference for operating principles, not proof of the exact parts populated on an RTX 5090.
- [TI INA3221 documentation](https://www.ti.com/lit/ds/symlink/ina3221.pdf) supports shunt-based current and voltage monitoring principles. [TI TMP451 documentation](https://www.ti.com/product/TMP451) supports local and remote temperature sensing. The model does not claim these exact ICs are used on the reference card.
- [Winbond serial-flash documentation](https://www.winbond.com/hq/support/documentation/index.html?__locale=en) supports the nonvolatile flash-memory explanation; no vendor or flash capacity is claimed for the modeled firmware IC.
- [NVIDIA RTX 5090 specifications](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/) support the three ninth-generation encoders, two sixth-generation decoders and external display-interface specifications.

This is coverage of component **families**, not an exhaustive bill of materials. Optional components, values, board-side population, solder-joint counts and exact mechanical dimensions vary among board designs and revisions. The small passive parts and routing are representative. Hardware disassembly now stays physical; architecture is explored through its separate scale controls or by opening the GPU die.

Surface maps, package markings and all meshes are locally authored. Brushed-metal and molded-package microtextures are generated deterministically. Small submeshes are merged within selectable assemblies; repeated components retain distinct instance identities. Hardware inventory preserves size differences with bounded magnification of small parts.

## Interaction inspiration

[Human Atlas](https://github.com/ashemag/human-atlas) and the supplied screenshots inform orbit, system visibility, search, inspection and the assembled-to-inventory transition. No Human Atlas code, meshes, artwork or diagrams are copied.


## Whole machine · September 12, 2026

The project grew from a single graphics card to the machine around it. The card
and its architecture are unchanged; everything below is new.

The machine is a **generic modern desktop**, described by component family. The
graphics card is the only named product in the model. No motherboard, chipset,
processor, power supply, drive or case model is claimed, and the specifications
panels say so.

- [Intel ATX specification](https://www.bitsavers.org/pdf/intel/ATX/ATX_Specification_2.01_199702.PDF)
  gives the dimensions actually modelled to scale: a 305 × 244 mm board, the
  20.32 mm expansion-slot pitch, the nine-position mounting pattern and the
  158.75 × 44.45 mm rear I/O aperture. Case dimensions, panel thicknesses and
  the internal layout around those fixed points are illustrative.
- [PCI-SIG](https://pcisig.com/specifications) supports the PCI Express
  generation, per-lane signalling rate and lane widths quoted for the expansion
  slots and the M.2 sockets. Which slots are wired to how many lanes varies by
  board and is not claimed.
- [JEDEC DDR5 (JESD79-5)](https://www.jedec.org/standards-documents/docs/jesd79-5d)
  supports the 288-contact DDR5 module, its two sub-channels and the two-channel
  slot arrangement. Capacities and speeds are not claimed.
- [NVM Express](https://nvmexpress.org/specifications/) supports the NVMe
  protocol description and the M.2 2280 drive; [SATA-IO](https://sata-io.org/)
  supports the 6 Gb/s SATA interface used by the 2.5-inch drive and the
  3.5-inch disk.
- [Intel's ATX12VO desktop power supply design guide](https://cdrdv2-public.intel.com/613768/613768_2.11.pdf)
  supports the supply's rails, the 24-pin and 8-pin connector descriptions and
  the 12V-2x6 graphics connector. The modelled unit has no wattage, efficiency
  rating or topology claim.
- [MPS](https://www.monolithicpower.com/en/learning/resources/powering-the-next-sophisticated-ai-system)
  supports the multiphase buck regulator explanation used for the processor
  VRM, as it already does for the card. The fourteen modelled phases are
  illustrative; phase counts vary widely between boards.
- [TI temperature sensing](https://www.ti.com/product/TMP451) supports the
  monitoring and fan-control description; [Winbond serial flash](https://www.winbond.com/hq/support/documentation/index.html?__locale=en)
  supports the UEFI firmware flash. No vendor or capacity is claimed for either.

### Explicit limits on the machine model

The chassis is an illustrative mid tower, not a product. Cable routing, drive
placement, fan count, header positions, passive population and the rear port
selection are authored for clarity. The processor scale is a **placeholder**: a
generic ring of cores around a shared cache with a memory interface, labelled as
such in the interface and in every one of its concepts. It is not a floorplan
and not a specific processor, and it is deliberately far below the level of
detail the graphics branch reaches.
