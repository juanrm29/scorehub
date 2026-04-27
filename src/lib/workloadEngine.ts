export type VesselCategory = 
  | 'Tugboat' 
  | 'Tongkang/Barge' 
  | 'LCT/Landing Craft' 
  | 'Cargo Ship' 
  | 'Tanker' 
  | 'Bulk Carrier' 
  | 'Passenger Ship' 
  | 'Fishing Vessel' 
  | 'Supply Vessel';

export type VesselCondition = 'Baik' | 'Sedang' | 'Buruk' | 'Sangat Buruk';

export interface VesselFactors {
  cb: number;
  cm: number; // Midship section coefficient
  cwp: number; // Waterplane area coefficient
  fApp: number;
  fTopside: number;
  fBulwark: number;
  fBow: number;
  fSkeg: number; // Universal skeg factor for all vessel types
  draftRatio: number; // T/D
  shape: {
    type: string;
    bow: number;
    stern: number;
    mid: number;
  };
}

// EMPIRICALLY TUNED FACTORS FOR CUTTING-EDGE NAVAL ARCHITECTURE ESTIMATION
export const VESSEL_FACTORS: Record<VesselCategory, VesselFactors> = {
  'Tongkang/Barge': { cb: 0.92, cm: 0.99, cwp: 0.95, fApp: 0.97, fTopside: 1.35, fBulwark: 2, fBow: 0.45, fSkeg: 0.04, draftRatio: 0.55, shape: { type: 'BOXY', bow: 0.55, stern: 0.55, mid: 1.00 } },
  'Tugboat': { cb: 0.55, cm: 0.85, cwp: 0.65, fApp: 1.12, fTopside: 1.52, fBulwark: 2.2, fBow: 0.60, fSkeg: 0.12, draftRatio: 0.75, shape: { type: 'ROUNDED', bow: 0.30, stern: 0.35, mid: 0.72 } },
  'LCT/Landing Craft': { cb: 0.88, cm: 0.98, cwp: 0.90, fApp: 0.90, fTopside: 1.28, fBulwark: 2, fBow: 0.50, fSkeg: 0.03, draftRatio: 0.60, shape: { type: 'FLAT', bow: 0.52, stern: 0.52, mid: 1.00 } },
  'Cargo Ship': { cb: 0.65, cm: 0.95, cwp: 0.75, fApp: 1.00, fTopside: 1.45, fBulwark: 2, fBow: 0.55, fSkeg: 0.02, draftRatio: 0.75, shape: { type: 'STANDARD', bow: 0.45, stern: 0.50, mid: 0.85 } },
  'Tanker': { cb: 0.78, cm: 0.98, cwp: 0.85, fApp: 1.03, fTopside: 1.45, fBulwark: 1.8, fBow: 0.50, fSkeg: 0.02, draftRatio: 0.80, shape: { type: 'FULL', bow: 0.50, stern: 0.50, mid: 0.95 } },
  'Bulk Carrier': { cb: 0.85, cm: 0.99, cwp: 0.90, fApp: 0.96, fTopside: 1.40, fBulwark: 1.8, fBow: 0.50, fSkeg: 0.02, draftRatio: 0.80, shape: { type: 'FULL', bow: 0.50, stern: 0.50, mid: 0.98 } },
  'Passenger Ship': { cb: 0.58, cm: 0.90, cwp: 0.70, fApp: 1.08, fTopside: 1.60, fBulwark: 2.5, fBow: 0.60, fSkeg: 0.02, draftRatio: 0.60, shape: { type: 'SLENDER', bow: 0.35, stern: 0.40, mid: 0.75 } },
  'Fishing Vessel': { cb: 0.55, cm: 0.85, cwp: 0.68, fApp: 1.12, fTopside: 1.55, fBulwark: 2, fBow: 0.60, fSkeg: 0.08, draftRatio: 0.70, shape: { type: 'ROUNDED', bow: 0.30, stern: 0.35, mid: 0.70 } },
  'Supply Vessel': { cb: 0.65, cm: 0.95, cwp: 0.75, fApp: 1.05, fTopside: 1.50, fBulwark: 2, fBow: 0.55, fSkeg: 0.06, draftRatio: 0.72, shape: { type: 'STANDARD', bow: 0.45, stern: 0.50, mid: 0.85 } },
};

export function getConditionMultiplier(condition: VesselCondition): number {
  switch (condition) {
    case 'Baik': return 1.0;
    case 'Sedang': return 1.3;
    case 'Buruk': return 1.5;
    case 'Sangat Buruk': return 2.0;
  }
}

export interface InputDimensions {
  L: number;
  B: number;
  D: number;
}

export interface StationData {
  station: number;
  x_L: number;
  pos: number;
  f_shape: number;
  halfBreadth: number;
}

export interface DetailBP {
  underwater: {
    lambungBawah: number;
    skeg: number;
    total: number;
  };
  topside: {
    topside: number;
    transom: number;
    haluan: number;
    total: number;
  };
  bulwark: {
    luar: number;
    dalam: number;
    total: number;
  };
  deck: {
    mainDeck: number;
    internalDeck: number;
    total: number;
  };
  superstructure: {
    rumahWinch: number;
    anjungan: number;
    strukturLain: number;
    total: number;
  };
  tangki: {
    ballast: number;
    bbm: number;
    airTawar: number;
    total: number;
  };
}

export interface CalculationResult {
  validations: {
    errorMargin: number;
    methodValid: boolean;
    cbValid: boolean;
    lbRatioValid: boolean;
    btRatioValid: boolean;
    wsaRatioValid: boolean;
    allPassed: boolean;
  };
  stations: StationData[];
  technical: {
    wsaTaylor: number;
    wsaHoltrop: number;
    wsaMumford: number;
    wsaGauss: number;
    wsaEnsemble: number; // eWSA
    volumeParametric: number;
    volumeGauss: number;
    totalBP_Area: number;
    manHourBP: number;
    manDayBP: number;
    totalPipingMH: number;
    replatingWeightKg: number;
    totalStructureTon: number;
    displacement: number;
  };
  bnpBreakdown: DetailBP;
  structure: {
    bottom: number;
    side: number;
    topside: number;
    transom: number;
    bow: number;
    mainDeck: number;
    internalDeck: number;
    bulwark: number;
    superstructure: number;
    internalTanks: number;
  };
  commercial: {
    costMH: number;
    costMaterial: number;
    costCoating: number;
    costDisposal: number;
    subtotal: number;
    overhead: number;
    margin: number;
    grandTotal: number;
  };
}

// GAUSS-LEGENDRE CONSTANTS (5-point)
const GL_N = [-0.9061798459, -0.5384693101, 0.0, 0.5384693101, 0.9061798459];
const GL_W = [0.2369268851, 0.4786286705, 0.5688888889, 0.4786286705, 0.2369268851];

function glInt(f: (x: number) => number, a: number, b: number) {
  const mid = (a + b) / 2, h = (b - a) / 2;
  let s = 0;
  for (let i = 0; i < 5; i++) s += GL_W[i] * f(mid + h * GL_N[i]);
  return h * s;
}

export function calculateWorkload(
  category: VesselCategory,
  condition: VesselCondition,
  dim: InputDimensions,
  rates: { mh: number; material: number; coating: number; disposal: number }
): CalculationResult {
  const { L, B, D } = dim;
  const factors = VESSEL_FACTORS[category];
  const T = D * factors.draftRatio;
  const freeboard = D - T;
  const condMult = getConditionMultiplier(condition);

  // 1. VOLUME
  const volumeParametric = L * B * T * factors.cb;

  // 2. ENSEMBLE WETTED SURFACE AREA (eWSA)
  // Multi-model approach using cutting edge Naval Architecture algorithms

  // Model A: Taylor Method
  const wsaTaylor = (3.223 * Math.sqrt(volumeParametric * L) + 0.46 * L * B) * factors.fApp;

  // Model B: Mumford Formula (Highly accurate for flat bottom ships like Barges)
  const wsaMumford = L * (1.7 * T + factors.cb * B) * factors.fApp;

  // Model C: Holtrop & Mennen (Highly accurate for Cargo/Tanker/Supply ships)
  // WSA = L * (2*T + B) * sqrt(Cm) * (0.453 + 0.4425*Cb - 0.2862*Cm - 0.003467*B/T + 0.3696*Cwp)
  let holtropFactor = 0.453 + 0.4425 * factors.cb - 0.2862 * factors.cm - 0.003467 * (B / T) + 0.3696 * factors.cwp;
  const wsaHoltrop = L * (2 * T + B) * Math.sqrt(factors.cm) * holtropFactor;

  // Model D: Gauss-Legendre Quadrature (Numerical Integration)
  const { bow, stern, mid } = factors.shape;
  function shapeF(xL: number) {
    if (xL <= 0.2) return stern + (mid - stern) * (xL / 0.2);
    if (xL <= 0.8) return mid;
    return mid - (mid - bow) * ((xL - 0.8) / 0.2);
  }
  function girthAt(xL: number) {
    const f = shapeF(xL);
    const girth_straight = B + 2 * T;
    return factors.fApp * girth_straight * (0.7 + 0.3 * f / mid);
  }
  function areaAt(xL: number) {
    const f = shapeF(xL);
    const halfBreadth = (B / 2) * f;
    return 2 * halfBreadth * T * (0.5 + 0.5 * f);
  }

  const nSub = 6;
  const step = L / nSub;
  let wsaGauss = 0;
  let volumeGauss = 0;
  for (let i = 0; i < nSub; i++) {
    const a = i * step, b = a + step;
    wsaGauss += glInt(x => girthAt(x / L), a, b);
    volumeGauss += glInt(x => areaAt(x / L), a, b);
  }

  const displacement = volumeGauss * 1.025;

  // Ensemble Weights Resolution
  let wsaEnsemble = 0;
  if (category === 'Tongkang/Barge' || category === 'LCT/Landing Craft') {
    // Flat bottoms excel with Mumford & GL
    wsaEnsemble = (wsaMumford * 0.4) + (wsaGauss * 0.4) + (wsaTaylor * 0.2);
  } else if (category === 'Cargo Ship' || category === 'Tanker' || category === 'Bulk Carrier') {
    // Commercial ships excel with Holtrop & GL
    wsaEnsemble = (wsaHoltrop * 0.5) + (wsaGauss * 0.3) + (wsaTaylor * 0.2);
  } else if (category === 'Tugboat' || category === 'Fishing Vessel') {
    // High curvature excels with GL
    wsaEnsemble = (wsaGauss * 0.5) + (wsaHoltrop * 0.3) + (wsaTaylor * 0.2);
  } else {
    // Standard blended approach
    wsaEnsemble = (wsaGauss * 0.3) + (wsaHoltrop * 0.3) + (wsaMumford * 0.3) + (wsaTaylor * 0.1);
  }

  // Generate 11 stations for charting
  const stations: StationData[] = [];
  for (let i = 0; i <= 10; i++) {
    const x_L = i / 10;
    const f_shape = shapeF(x_L);
    stations.push({
      station: i,
      x_L,
      pos: x_L * L,
      f_shape,
      halfBreadth: (B / 2) * f_shape
    });
  }

  // 3. DETAIL B&P BREAKDOWN (16 Components)
  
  // 1. Underwater
  const uwLambung = wsaEnsemble;
  const uwSkeg = factors.fSkeg * L * T * 2; // Skeg is now universal and calculated based on fSkeg coefficient
  const uwTotal = uwLambung + uwSkeg;

  // 2. Topside (More accurate geometrical progression)
  // Area = Hull sides + Transom area + Bow flare area
  const hullSides = 2 * L * freeboard * factors.fTopside;
  const transomArea = B * freeboard * (factors.shape.stern); // Stern width shape factor
  // Bow flare uses Pythagorean curve approximation: sqrt(width^2 + length^2)
  const bowLength = L * 0.2; // roughly 20% of length is bow flare
  const bowFlareCurve = Math.sqrt(Math.pow(B / 2, 2) + Math.pow(bowLength, 2)) * freeboard * 2 * (1 - factors.shape.bow);
  
  const tsTopside = hullSides;
  const tsTransom = transomArea;
  const tsHaluan = bowFlareCurve;
  const tsTotal = tsTopside + tsTransom + tsHaluan;

  // 3. Bulwark
  const bwLuar = L * 1 * 2;
  const bwDalam = L * 1 * 2;
  const bwTotal = bwLuar + bwDalam;

  // 4. Deck
  const dkMain = L * B * 0.88; 
  const dkInternal = 0.4 * L * 0.6 * B * 1;
  const dkTotal = dkMain + dkInternal;

  // 5. Superstructure
  const calcSS = (p: number, l: number, h: number) => 2 * (p + l) * h + p * l;
  const ssWinch = calcSS(0.25 * L, 0.3 * B, 3);
  const ssBridge = calcSS(0.35 * L, 0.5 * B, 4);
  const ssOther = calcSS(5, 4, 3);
  const ssTotal = ssWinch + ssBridge + ssOther;

  // 6. Tangki Internal
  const calcTank = (p: number, l: number, h: number) => 2 * (p * l + p * h + l * h);
  const tkBallast = calcTank(0.3 * L, 0.7 * B, T);
  const tkBbm = calcTank(0.15 * L, 0.6 * B, T * 0.8);
  const tkAir = calcTank(0.1 * L, 0.4 * B, 2);
  const tkTotal = tkBallast + tkBbm + tkAir;

  const totalBP_Area = uwTotal + tsTotal + bwTotal + dkTotal + ssTotal + tkTotal;

  // 4. STRUCTURE BREAKDOWN (Weights)
  const tkPlat = { bot: 0.018, side: 0.012, top: 0.012, transom: 0.012, bow: 0.012, md: 0.012, id: 0.010, bw: 0.008, ss: 0.006, tanks: 0.010 };
  const calcWeight = (area: number, t: number) => area * t * 7.85 * 1.1;
  
  const bottomW = calcWeight(L * B * factors.cb, tkPlat.bot);
  const sideW = calcWeight(L * T * 2, tkPlat.side);
  const topsideW = calcWeight(tsTopside, tkPlat.top);
  const transomW = calcWeight(tsTransom, tkPlat.transom);
  const bowW = calcWeight(tsHaluan, tkPlat.bow); 
  const mainDeckW = calcWeight(dkMain, tkPlat.md);
  const internalDeckW = calcWeight(dkInternal, tkPlat.id);
  const bulwarkW = calcWeight(bwTotal, tkPlat.bw);
  const superW = calcWeight(ssTotal, tkPlat.ss);
  const tanksW = calcWeight(tkTotal, tkPlat.tanks);

  const totalStructureTon = bottomW + sideW + topsideW + transomW + bowW + mainDeckW + internalDeckW + bulwarkW + superW + tanksW;
  const replatingWeightKg = totalStructureTon * 1000 * 0.05;

  // 5. MAN-HOUR TOTALS
  const manHourBP = totalBP_Area * 0.15 * condMult;
  const manDayBP = manHourBP / 8;

  const totalPipingMH = (L * B * 0.1) * condMult;

  // 6. VALIDATIONS
  const errorMargin = Math.abs(volumeGauss - volumeParametric) / volumeParametric;
  const methodValid = errorMargin < 0.15; // Accepted tolerance between pure mathematical integration and simplified volume
  const cbValid = factors.cb >= 0.5 && factors.cb <= 0.98;
  const lbRatio = L / B;
  const lbRatioValid = lbRatio >= 3 && lbRatio <= 12;
  const btRatio = B / T;
  const btRatioValid = btRatio >= 1.5 && btRatio <= 6;
  const wsaRatio = wsaEnsemble / (L * B);
  const wsaRatioValid = wsaRatio >= 0.7 && wsaRatio <= 2.2;
  const allPassed = methodValid && cbValid && lbRatioValid && btRatioValid && wsaRatioValid;

  // 7. COMMERCIAL
  const costMH = (manHourBP + totalPipingMH + (replatingWeightKg/40)) * rates.mh;
  const costMaterial = replatingWeightKg * rates.material;
  const costCoating = totalBP_Area * rates.coating;
  const costDisposal = 5 * rates.disposal;
  
  const subtotal = costMH + costMaterial + costCoating + costDisposal;
  const overhead = subtotal * 0.15;
  const margin = subtotal * 0.25;

  return {
    validations: {
      errorMargin, methodValid, cbValid, lbRatioValid, btRatioValid, wsaRatioValid, allPassed
    },
    stations,
    technical: {
      wsaTaylor, wsaHoltrop, wsaMumford, wsaGauss, wsaEnsemble, volumeParametric, volumeGauss,
      totalBP_Area, manHourBP, manDayBP, totalPipingMH,
      replatingWeightKg, totalStructureTon, displacement
    },
    bnpBreakdown: {
      underwater: { lambungBawah: uwLambung, skeg: uwSkeg, total: uwTotal },
      topside: { topside: tsTopside, transom: tsTransom, haluan: tsHaluan, total: tsTotal },
      bulwark: { luar: bwLuar, dalam: bwDalam, total: bwTotal },
      deck: { mainDeck: dkMain, internalDeck: dkInternal, total: dkTotal },
      superstructure: { rumahWinch: ssWinch, anjungan: ssBridge, strukturLain: ssOther, total: ssTotal },
      tangki: { ballast: tkBallast, bbm: tkBbm, airTawar: tkAir, total: tkTotal }
    },
    structure: {
      bottom: bottomW, side: sideW, topside: topsideW, transom: transomW, bow: bowW,
      mainDeck: mainDeckW, internalDeck: internalDeckW, bulwark: bulwarkW,
      superstructure: superW, internalTanks: tanksW
    },
    commercial: {
      costMH, costMaterial, costCoating, costDisposal, subtotal, overhead, margin, grandTotal: subtotal + overhead + margin
    }
  };
}
