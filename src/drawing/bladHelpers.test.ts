import { describe, it, expect } from "vitest";
import {
  rechthoekOutline,
  segmentLengtes,
  knipHoekUit,
  bewerkSegmentLengte,
} from "./bladHelpers";

describe("rechthoekOutline", () => {
  it("geeft 4 punten terug", () => {
    expect(rechthoekOutline(1958, 1001)).toHaveLength(4);
  });

  it("heeft correcte coördinaten", () => {
    const o = rechthoekOutline(1958, 1001);
    expect(o[0]).toEqual({ x: 0, y: 0 });
    expect(o[1]).toEqual({ x: 1958, y: 0 });
    expect(o[2]).toEqual({ x: 1958, y: 1001 });
    expect(o[3]).toEqual({ x: 0, y: 1001 });
  });
});

describe("segmentLengtes", () => {
  it("rechthoek 1958×1001 geeft [1958, 1001, 1958, 1001]", () => {
    const o = rechthoekOutline(1958, 1001);
    expect(segmentLengtes(o)).toEqual([1958, 1001, 1958, 1001]);
  });

  it("vierkant 500×500", () => {
    expect(segmentLengtes(rechthoekOutline(500, 500))).toEqual([500, 500, 500, 500]);
  });
});

describe("knipHoekUit", () => {
  it("rechtsboven-hoek van een 1958×1001 rechthoek geeft 6 punten in L-vorm", () => {
    const o = rechthoekOutline(1958, 1001);
    const result = knipHoekUit(o, 2, 200, 100);
    expect(result).toHaveLength(6);

    // Punt dat aankomt vanuit de rechterrand
    expect(result[2]).toEqual({ x: 1958, y: 901 });
    // Binnenhoek uithap
    expect(result[3]).toEqual({ x: 1758, y: 901 });
    // Punt dat vertrekt langs de bovenrand
    expect(result[4]).toEqual({ x: 1758, y: 1001 });
  });

  it("linksonder-hoek (index 0) van een 600×400 rechthoek", () => {
    const o = rechthoekOutline(600, 400);
    const result = knipHoekUit(o, 0, 50, 80);
    expect(result).toHaveLength(6);
  });
});

describe("bewerkSegmentLengte", () => {
  it("breedte-zijde (segment 1) verandert alleen Y, niet X", () => {
    const o = rechthoekOutline(1958, 1001);
    const result = bewerkSegmentLengte(o, 1, 1200);

    // P0 en P1 blijven op dezelfde Y (y=0)
    expect(result[0]).toEqual({ x: 0, y: 0 });
    expect(result[1]).toEqual({ x: 1958, y: 0 });

    // P2 en P3 hebben nu y=1200, X onveranderd
    expect(result[2].x).toBeCloseTo(1958);
    expect(result[2].y).toBeCloseTo(1200);
    expect(result[3].x).toBeCloseTo(0);
    expect(result[3].y).toBeCloseTo(1200);
  });

  it("lengte-zijde (segment 0) verandert alleen X van P1 en P2", () => {
    const o = rechthoekOutline(1958, 1001);
    const result = bewerkSegmentLengte(o, 0, 2000);

    expect(result[0]).toEqual({ x: 0, y: 0 });
    expect(result[1].x).toBeCloseTo(2000);
    expect(result[1].y).toBeCloseTo(0);
    expect(result[2].x).toBeCloseTo(2000);
    expect(result[2].y).toBeCloseTo(1001);
    // P3 (linkerbovenhoek) blijft op x=0
    expect(result[3].x).toBeCloseTo(0);
    expect(result[3].y).toBeCloseTo(1001);
  });
});
