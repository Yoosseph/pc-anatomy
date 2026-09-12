# Technical provenance

Reviewed 2026-09-12. PC Anatomy is independent of NVIDIA, Intel, AMD, JEDEC, PCI-SIG and Human Atlas. All geometry is original.

## Architecture and specifications

- [NVIDIA RTX Blackwell architecture whitepaper, v1.1](https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf), printed pp. 8–12 and 46–48. RTX 5090: 11 GPCs, 85 TPCs, 170 SMs, 21,760 CUDA cores, 680 Tensor cores, 170 RT cores, 96 MB L2. Full GB202: 12 GPCs, 96 TPCs, 192 SMs; these are not the shipping 5090 counts. A full GPC contains 8 TPCs and a TPC contains 2 SMs. Per SM: 128 CUDA cores, 4 Tensor cores, 1 RT core, 4 texture units, 256 KB registers, 128 KB L1/shared memory. The representative GPC is not a claim about which TPCs are disabled in a particular 5090.
- [NVIDIA RTX 5090 specifications and hardware overview](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/): 32 GB GDDR7, 512-bit interface, 575 W graphics power, PCIe 5.0, double flow-through cooler, DisplayPort and HDMI.
- [NVIDIA launch announcement](https://www.nvidia.com/en-us/geforce/news/rtx-50-series-graphics-cards-gpu-laptop-announcements/): cross-check of enabled CUDA/Tensor/RT counts and 1,792 GB/s memory bandwidth.

## Representation limits

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
