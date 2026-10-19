import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import { notebookLevels, type NotebookLevel } from './notebook-levels.ts';
import {
  notebookKit,
  notebookSpecs,
  type NotebookSystem,
} from './notebook-kit.ts';
import { buildNotebookCover, buildNotebookDeck } from './notebook-chassis.ts';
import {
  buildNotebookBoard,
  buildNotebookCooling,
  buildNotebookBattery,
  buildNotebookMemory,
  buildNotebookStorage,
  buildNotebookPackage,
} from './notebook-hardware.ts';
import { buildNotebookDisplay } from './notebook-display.ts';
import { buildNotebookArchitecture } from './notebook-architecture.ts';

/** One physical coordinate system from the complete machine to each assembly. */
export function buildNotebook(
  level: NotebookLevel,
  tools: ModelTools,
  root: T.Group,
) {
  if (notebookLevels[level].kind === 'logical')
    return buildNotebookArchitecture(level, tools, root);
  const system: NotebookSystem = level.startsWith('legion')
    ? 'legion'
    : 'macbook';
  if (level === 'legion' || level === 'macbook')
    return buildCompleteNotebook(system, tools);
  if (level === 'legionboard' || level === 'macboard')
    return buildNotebookBoard(system, tools);
  if (level === 'legioncooling' || level === 'maccooling')
    return buildNotebookCooling(system, tools);
  if (level === 'legionbattery' || level === 'macbattery')
    return buildNotebookBattery(system, tools);
  if (level === 'legiondisplay' || level === 'macdisplay')
    return buildNotebookDisplay(system, tools);
  if (level === 'legionpackage') return buildNotebookPackage(tools);
  if (level === 'legionmemory') return buildNotebookMemory(tools);
  return buildNotebookStorage(level, tools);
}

function buildCompleteNotebook(system: NotebookSystem, tools: ModelTools) {
  const spec = notebookSpecs[system],
    mac = system === 'macbook',
    { put, slab, cylinder, tube, v, mm } = notebookKit(tools);
  const { cover, fasteners } = buildNotebookCover(system, tools);
  tools.add(`${system}-cover`, cover, v(0, -spec.base / 2, 0), v(0, -80, 0));
  tools.add(
    `${system}-fasteners`,
    fasteners,
    v(0, -spec.base / 2 - 0.7, 0),
    v(0, -125, 0),
  );
  const { deck, pad, padAt } = buildNotebookDeck(system, tools);
  tools.add(`${system}-deck`, deck, v(0, spec.base / 2, 0), v(0, 160, 40));
  tools.add(
    `${system}-trackpad`,
    pad,
    v(padAt[0], spec.base / 2 + padAt[1], padAt[2]),
    v(0, 205, 70),
  );
  const hinges = new T.Group();
  for (const x of [-spec.width * 0.34, spec.width * 0.34]) {
    put(
      hinges,
      cylinder(3, mac ? 29 : 35, '#65717f'),
      [x, 0, 0],
      [0, 0, Math.PI / 2],
    );
    put(hinges, slab([mac ? 29 : 35, 1.2, 16], '#76838e', 0.8), [x, -2.4, 5]);
    for (const dx of [-10, 10])
      put(hinges, cylinder(1.0, 0.3, '#bec7cd'), [x + dx, -1.7, 9]);
  }
  tools.add(
    `${system}-hinges`,
    hinges,
    v(0, spec.base / 2 - 1, -spec.depth / 2 + 13),
    v(0, 90, -60),
  );
  const displayId = mac ? 'macdisplay' : 'legiondisplay';
  const screen = tools.assembly(displayId);
  screen.position.z = -mm(spec.lidDepth / 2);
  const pivot = new T.Group();
  pivot.add(screen);
  pivot.rotation.x = Math.PI * 0.4;
  const wrapper = new T.Group();
  wrapper.add(pivot);
  tools.add(
    displayId,
    wrapper,
    v(0, spec.base / 2, -spec.depth / 2 + 13),
    v(0, 100, -105),
  );
  tools.add(
    mac ? 'macboard' : 'legionboard',
    tools.assembly(mac ? 'macboard' : 'legionboard'),
    v(0, mac ? -3.5 : -4, spec.boardZ),
    v(0, 65, -10),
  );
  tools.add(
    mac ? 'maccooling' : 'legioncooling',
    tools.assembly(mac ? 'maccooling' : 'legioncooling'),
    v(0, mac ? 0.4 : 0, spec.coolerZ),
    v(0, 105, -30),
  );
  tools.add(
    mac ? 'macbattery' : 'legionbattery',
    tools.assembly(mac ? 'macbattery' : 'legionbattery'),
    v(0, mac ? -0.4 : -2.2, spec.batteryZ),
    v(0, 45, 95),
  );
  const speakers = new T.Group();
  for (const side of [-1, 1]) {
    const x = side * (spec.width / 2 - (mac ? 17 : 21)),
      enclosure = new T.Group();
    put(
      enclosure,
      slab([mac ? 20 : 23, 4.2, mac ? 77 : 66], '#18222c', 0.05, 4),
      [0, 0, 0],
    );
    for (const z of mac ? [-24, 22] : [-17, 17]) {
      put(enclosure, cylinder(mac ? 6.7 : 7.8, 0.6, '#55626c'), [0, 2.4, z]);
      put(enclosure, cylinder(mac ? 4.8 : 5.8, 0.75, '#1b252e'), [0, 2.8, z]);
    }
    put(speakers, enclosure, [x, 0, mac ? 59 : 83]);
    speakers.add(
      tube(
        [
          [x, 0, mac ? 25 : 51],
          [x - side * 13, 0, mac ? 23 : 43],
          [x - side * 26, 0, mac ? 17 : 31],
        ],
        0.35,
        '#393d43',
      ),
    );
  }
  tools.add(
    `${system}-speakers`,
    speakers,
    v(0, mac ? 0 : -1, 0),
    v(50, 55, 45),
  );
}
