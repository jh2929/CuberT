export type CubeEventId =
  | '333'
  | '222'
  | '444'
  | '555'
  | '666'
  | '777'
  | '333oh'
  | '333bld'
  | 'pyram'
  | 'skewb'
  | 'minx'
  | 'sq1'
  | 'clock';

export interface CubeEventMeta {
  id: CubeEventId;
  name: string;
  shortName: string;
  category: 'wca';
}

export const CUBE_EVENTS: Record<CubeEventId, CubeEventMeta> = {
  '333': { id: '333', name: '3x3x3 Cube', shortName: '3x3', category: 'wca' },
  '222': { id: '222', name: '2x2x2 Cube', shortName: '2x2', category: 'wca' },
  '444': { id: '444', name: '4x4x4 Cube', shortName: '4x4', category: 'wca' },
  '555': { id: '555', name: '5x5x5 Cube', shortName: '5x5', category: 'wca' },
  '666': { id: '666', name: '6x6x6 Cube', shortName: '6x6', category: 'wca' },
  '777': { id: '777', name: '7x7x7 Cube', shortName: '7x7', category: 'wca' },
  '333oh': { id: '333oh', name: '3x3 One-Handed', shortName: '3x3 OH', category: 'wca' },
  '333bld': { id: '333bld', name: '3x3 Blindfolded', shortName: '3x3 BLD', category: 'wca' },
  'pyram': { id: 'pyram', name: 'Pyraminx', shortName: 'Pyraminx', category: 'wca' },
  'skewb': { id: 'skewb', name: 'Skewb', shortName: 'Skewb', category: 'wca' },
  'minx': { id: 'minx', name: 'Megaminx', shortName: 'Megaminx', category: 'wca' },
  'sq1': { id: 'sq1', name: 'Square-1', shortName: 'Square-1', category: 'wca' },
  'clock': { id: 'clock', name: 'Rubik\'s Clock', shortName: 'Clock', category: 'wca' },
};

export const CUBE_EVENT_LIST = Object.values(CUBE_EVENTS);
