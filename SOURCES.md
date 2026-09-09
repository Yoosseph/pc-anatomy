# Technical provenance

Reviewed 2026-09-10. DieDive is independent of NVIDIA and Human Atlas. All geometry is original.

## Architecture and specifications

- [NVIDIA RTX Blackwell architecture whitepaper, v1.1](https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf), printed pp. 8–12 and 46–48. RTX 5090: 11 GPCs, 85 TPCs, 170 SMs, 21,760 CUDA cores, 680 Tensor cores, 170 RT cores, 96 MB L2. Full GB202: 12 GPCs, 96 TPCs, 192 SMs; these are not the shipping 5090 counts. A full GPC contains 8 TPCs and a TPC contains 2 SMs. Per SM: 128 CUDA cores, 4 Tensor cores, 1 RT core, 4 texture units, 256 KB registers, 128 KB L1/shared memory. The representative GPC is not a claim about which TPCs are disabled in a particular 5090.
- [NVIDIA RTX 5090 specifications and hardware overview](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/): 32 GB GDDR7, 512-bit interface, 575 W graphics power, PCIe 5.0, double flow-through cooler, DisplayPort and HDMI.
- [NVIDIA launch announcement](https://www.nvidia.com/en-us/geforce/news/rtx-50-series-graphics-cards-gpu-laptop-announcements/): cross-check of enabled CUDA/Tensor/RT counts and 1,792 GB/s memory bandwidth.

## Representation limits

The physical assembly is an illustrative modern card, not an exact Founders Edition CAD model or repair guide. Board outline, traces, fasteners, fin count, passive placement and power stages are authored for clarity, not asserted engineering specifications. Internal views are logical diagrams with arbitrary block sizes and positions; transistor placement is not claimed. Repeated instances have stable identifiers but illustrative placement.

## Interaction inspiration

[Human Atlas](https://github.com/ashemag/human-atlas) and the supplied screenshots inform orbit, system visibility, search, inspection and the assembled-to-inventory transition. No Human Atlas code, meshes, artwork or diagrams are copied.
