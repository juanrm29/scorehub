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
  fApp: number;
  fTopside: number;
  fBulwark: number;
  fBow: number;
  draftRatio: number; // T/D
  shape: {
    type: string;
    bow: number;
    stern: number;
    mid: number;
  };
}

export const VESSEL_FACTORS: Record<VesselCategory, VesselFactors> = {
  'Tongkang/Barge': { cb: 0.90, fApp: 0.96, fTopside: 6.3, fBulwark: 2, fBow: 0.5, draftRatio: 0.55, shape: { type: 'BOXY', bow: 0.5, stern: 0.5, mid: 1 } },
  'Tugboat': { cb: 0.55, fApp: 1.12, fTopside: 4.2, fBulwark: 2.2, fBow: 0.6, draftRatio: 0.75, shape: { type: 'ROUNDED', bow: 0.3, stern: 0.35, mid: 0.72 } },
  'LCT/Landing Craft': { cb: 0.85, fApp: 0.82, fTopside: 5.0, fBulwark: 2, fBow: 0.5, draftRatio: 0.60, shape: { type: 'FLAT', bow: 0.5, stern: 0.5, mid: 1 } },
  'Cargo Ship': { cb: 0.65, fApp: 1.00, fTopside: 3.5, fBulwark: 2, fBow: 0.55, draftRatio: 0.75, shape: { type: 'STANDARD', bow: 0.45, stern: 0.5, mid: 0.85 } },
  'Tanker': { cb: 0.78, fApp: 0.98, fTopside: 3.0, fBulwark: 1.8, fBow: 0.5, draftRatio: 0.80, shape: { type: 'FULL', bow: 0.5, stern: 0.5, mid: 0.95 } },
  'Bulk Carrier': { cb: 0.85, fApp: 0.96, fTopside: 3.0, fBulwark: 1.8, fBow: 0.5, draftRatio: 0.80, shape: { type: 'FULL', bow: 0.5, stern: 0.5, mid: 0.98 } },
  'Passenger Ship': { cb: 0.58, fApp: 1.08, fTopside: 5.0, fBulwark: 2.5, fBow: 0.6, draftRatio: 0.60, shape: { type: 'SLENDER', bow: 0.25, stern: 0.3, mid: 0.7 } },
  'Fishing Vessel': { cb: 0.55, fApp: 1.12, fTopside: 3.8, fBulwark: 2, fBow: 0.6, draftRatio: 0.70, shape: { type: 'ROUNDED', bow: 0.3, stern: 0.35, mid: 0.72 } },
  'Supply Vessel': { cb: 0.65, fApp: 1.05, fTopside: 4.0, fBulwark: 2, fBow: 0.55, draftRatio: 0.72, shape: { type: 'STANDARD', bow: 0.4, stern: 0.45, mid: 0.8 } },
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

export interface SimpsonStation {
  station: number;
  x_L: number;
  pos: number;
  f_shape: number;
  halfBreadth: number;
  area: number;
  girthFactor: number;
  girth: number;
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
    simpsonError: number;
    simpsonValid: boolean;
    cbValid: boolean;
    lbRatioValid: boolean;
    btRatioValid: boolean;
    wsaRatioValid: boolean;
    allPassed: boolean;
  };
  stations: SimpsonStation[];
  technical: {
    wsaTaylor: number;
    wsaSimpson: number;
    volumeParametric: number;
    volumeSimpson: number;
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

// SIMPSON RULE MULTIPLIERS (11 stations: 0 to 10)
const SM = [1, 4, 2, 4, 2, 4, 2, 4, 2, 4, 1];

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

  // 1. PARAMETRIC (Taylor)
  // WSA = [3.223·√(∇·L) + 0.46·L·B] × F_App
  const volumeParametric = L * B * T * factors.cb;
  const wsaTaylor = (3.223 * Math.sqrt(volumeParametric * L) + 0.46 * L * B) * factors.fApp;

  // 2. SIMPSON'S RULE INTEGRATION
  const stations: SimpsonStation[] = [];
  let sumAreaSM = 0;
  let sumGirthSM = 0;
  
  const h = L / 10;
  const { bow, stern, mid } = factors.shape;

  for (let i = 0; i <= 10; i++) {
    const x_L = i / 10;
    
    // Shape function f(x/L)
    let f_shape = 0;
    if (x_L <= 0.2) {
      f_shape = stern + (mid - stern) * (x_L / 0.2);
    } else if (x_L >= 0.8) {
      f_shape = mid - (mid - bow) * ((x_L - 0.8) / 0.2);
    } else {
      f_shape = mid;
    }

    const halfBreadth = (B / 2) * f_shape;
    const area = 2 * halfBreadth * T * (0.5 + 0.5 * f_shape);
    
    // Girth Factor = 0.85 + 0.25*Cb + 0.20*f
    const girthFactor = 0.85 + 0.25 * factors.cb + 0.20 * f_shape;
    const girth = girthFactor * (B + 2 * T);

    stations.push({
      station: i,
      x_L,
      pos: x_L * L,
      f_shape,
      halfBreadth,
      area,
      girthFactor,
      girth
    });

    sumAreaSM += area * SM[i];
    sumGirthSM += girth * SM[i];
  }

  const volumeSimpson = (h / 3) * sumAreaSM;
  const wsaSimpson = (h / 3) * sumGirthSM;
  const displacement = volumeSimpson * 1.025;

  // 3. DETAIL B&P BREAKDOWN (16 Components)
  
  // 1. Underwater
  const uwLambung = wsaSimpson * factors.fApp;
  const uwSkeg = category === 'Tugboat' ? (0.15 * L * 0.8 * T * 4) : 0;
  const uwTotal = uwLambung + uwSkeg;

  // 2. Topside
  const tsTopside = L * freeboard * factors.fTopside;
  const tsTransom = B * freeboard * 1;
  const tsHaluan = ((B + B * factors.fBow) / 2) * freeboard * 0.5;
  const tsTotal = tsTopside + tsTransom + tsHaluan;

  // 3. Bulwark
  const bwLuar = L * 1 * 2;
  const bwDalam = L * 1 * 2;
  const bwTotal = bwLuar + bwDalam;

  // 4. Deck
  const dkMain = L * B * 1;
  const dkInternal = 0.4 * L * 0.6 * B * 1;
  const dkTotal = dkMain + dkInternal;

  // 5. Superstructure (Area = 2*(P+L)*H + P*L)
  const calcSS = (p: number, l: number, h: number) => 2 * (p + l) * h + p * l;
  const ssWinch = calcSS(0.25 * L, 0.3 * B, 3);
  const ssBridge = calcSS(0.35 * L, 0.5 * B, 4);
  const ssOther = calcSS(5, 4, 3); // Constant in excel
  const ssTotal = ssWinch + ssBridge + ssOther;

  // 6. Tangki Internal (Area = 2*(P*L + P*H + L*H))
  const calcTank = (p: number, l: number, h: number) => 2 * (p * l + p * h + l * h);
  const tkBallast = calcTank(0.3 * L, 0.7 * B, T);
  const tkBbm = calcTank(0.15 * L, 0.6 * B, T * 0.8);
  const tkAir = calcTank(0.1 * L, 0.4 * B, 2); // Constant H=2
  const tkTotal = tkBallast + tkBbm + tkAir;

  const totalBP_Area = uwTotal + tsTotal + bwTotal + dkTotal + ssTotal + tkTotal;

  // 4. STRUCTURE BREAKDOWN (Weights)
  // Thickness defaults (m)
  const tkPlat = { bot: 0.018, side: 0.012, top: 0.012, transom: 0.012, bow: 0.012, md: 0.012, id: 0.010, bw: 0.008, ss: 0.006, tanks: 0.010 };
  
  // Weights (ton) = Area * thickness * 7.85 * 1.1 (loss factor)
  const calcWeight = (area: number, t: number) => area * t * 7.85 * 1.1;
  
  const bottomW = calcWeight(L * B * 0.9, tkPlat.bot);
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
  const replatingWeightKg = totalStructureTon * 1000 * 0.05; // Asumsi 5% dari total berat kapal untuk repair replating

  // 5. MAN-HOUR TOTALS
  const manHourBP = totalBP_Area * 0.15 * condMult;
  const manDayBP = manHourBP / 8;

  // 6. PIPING (Estimasi kasar berbasis luasan)
  const totalPipingMH = (L * B * 0.1) * condMult;

  // 6. VALIDATIONS
  const simpsonError = Math.abs(volumeSimpson - volumeParametric) / volumeParametric;
  const simpsonValid = simpsonError < 0.05;
  const cbValid = factors.cb >= 0.5 && factors.cb <= 0.95;
  const lbRatio = L / B;
  const lbRatioValid = lbRatio >= 3 && lbRatio <= 10;
  const btRatio = B / T;
  const btRatioValid = btRatio >= 2 && btRatio <= 5;
  const wsaRatio = wsaSimpson / (L * B);
  const wsaRatioValid = wsaRatio >= 0.7 && wsaRatio <= 1.8;
  const allPassed = simpsonValid && cbValid && lbRatioValid && btRatioValid && wsaRatioValid;

  // 7. COMMERCIAL
  const costMH = (manHourBP + totalPipingMH + (replatingWeightKg/40)) * rates.mh;
  const costMaterial = replatingWeightKg * rates.material;
  const costCoating = totalBP_Area * rates.coating;
  const costDisposal = 5 * rates.disposal; // Asumsi 5 m3
  
  const subtotal = costMH + costMaterial + costCoating + costDisposal;
  const overhead = subtotal * 0.15;
  const margin = subtotal * 0.25;

  return {
    validations: {
      simpsonError, simpsonValid, cbValid, lbRatioValid, btRatioValid, wsaRatioValid, allPassed
    },
    stations,
    technical: {
      wsaTaylor, wsaSimpson, volumeParametric, volumeSimpson,
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
