import { describe, it, expect, beforeEach } from 'vitest';
import { CubeEngine } from './cube.engine';
import { checkIsSolved, createSolvedState } from './cube.state';
import { getInverseMove, invertMoveSequence, isValidMove } from './cube.moves';
import { INITIAL_CORNERS, INITIAL_EDGES } from './cube.constants';

describe('Virtual Cube Model & State', () => {
  it('correctly reports solved state on clean pieces', () => {
    expect(checkIsSolved(INITIAL_CORNERS, INITIAL_EDGES)).toBe(true);
  });

  it('detects unsolved when a corner is twisted', () => {
    const corners = INITIAL_CORNERS.map((c, i) =>
      i === 0 ? { ...c, orientation: 1 } : { ...c }
    );
    expect(checkIsSolved(corners, INITIAL_EDGES)).toBe(false);
  });

  it('detects unsolved when an edge is flipped', () => {
    const edges = INITIAL_EDGES.map((e, i) =>
      i === 0 ? { ...e, orientation: 1 } : { ...e }
    );
    expect(checkIsSolved(INITIAL_CORNERS, edges)).toBe(false);
  });

  it('detects unsolved when pieces are swapped in position', () => {
    const corners = INITIAL_CORNERS.map((c, i) => {
      if (i === 0) return { ...c, position: 1 };
      if (i === 1) return { ...c, position: 0 };
      return { ...c };
    });
    expect(checkIsSolved(corners, INITIAL_EDGES)).toBe(false);
  });

  it('createSolvedState creates 8 corners and 12 edges with 0 orientation', () => {
    const state = createSolvedState();
    expect(state.corners.length).toBe(8);
    expect(state.edges.length).toBe(12);
    expect(state.isSolved).toBe(true);
    expect(state.corners.every((c) => c.orientation === 0)).toBe(true);
    expect(state.edges.every((e) => e.orientation === 0)).toBe(true);
  });
});

describe('Virtual Cube Moves', () => {
  it('inverts single moves correctly', () => {
    expect(getInverseMove('R')).toBe("R'");
    expect(getInverseMove("R'")).toBe('R');
    expect(getInverseMove('R2')).toBe('R2');
    expect(getInverseMove('U')).toBe("U'");
    expect(getInverseMove("U'")).toBe('U');
    expect(getInverseMove('U2')).toBe('U2');
    expect(getInverseMove('Rw')).toBe("Rw'");
  });

  it('inverts move sequences correctly', () => {
    const seq = ['R', 'U', "R'", "U'"];
    const inv = invertMoveSequence(seq);
    expect(inv).toEqual(['U', 'R', "U'", "R'"]);
  });

  it('validates WCA and cube moves', () => {
    expect(isValidMove('R')).toBe(true);
    expect(isValidMove("R'")).toBe(true);
    expect(isValidMove('R2')).toBe(true);
    expect(isValidMove('y')).toBe(true);
    expect(isValidMove("y'")).toBe(true);
    expect(isValidMove('Rw')).toBe(true);
    expect(isValidMove('INVALID')).toBe(false);
  });
});

describe('Virtual Cube Engine (CubeEngine)', () => {
  let engine: CubeEngine;

  beforeEach(async () => {
    engine = new CubeEngine();
    await engine.init();
  });

  it('starts in solved state', () => {
    expect(engine.isSolved()).toBe(true);
    expect(engine.getState().corners.length).toBe(8);
    expect(engine.getState().edges.length).toBe(12);
  });

  it('is not solved after R, and solved again after R prime', () => {
    engine.applyMove('R');
    expect(engine.isSolved()).toBe(false);

    engine.applyMove("R'");
    expect(engine.isSolved()).toBe(true);
  });

  it('returns to solved after 6 sexy moves (R U R\' U\')*6', () => {
    const sexyMove = ['R', 'U', "R'", "U'"];
    for (let i = 0; i < 6; i++) {
      for (const m of sexyMove) {
        engine.applyMove(m);
      }
    }
    expect(engine.isSolved()).toBe(true);
  });

  it('reset returns the cube immediately to solved', () => {
    engine.applyMove('R');
    engine.applyMove('U');
    engine.applyMove('F');
    expect(engine.isSolved()).toBe(false);

    engine.reset();
    expect(engine.isSolved()).toBe(true);
  });

  it('scramble applies moves and isSolved becomes false', () => {
    engine.scramble("R U R' U'");
    expect(engine.isSolved()).toBe(false);
    expect(engine.getState().moveCount).toBe(0);
  });
});
