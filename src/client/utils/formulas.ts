import { IProduct, IFormulas, IFormula } from '../../shared/types';

export const calculateFrontlinePrice = (product: IProduct, formulas: IFormulas) => {
    if (!product) return {};
    const productType = (product.productType || 'wine').toLowerCase();
    const productName = (product.productName || '').toLowerCase();

    // Safety check just in case formulas state was corrupted
    if (!formulas || !formulas.wine) return {};

    // Explicitly type formula to avoid index signature errors
    let formula = formulas.wine;

    // Helper to check keywords in either field
    const isType = (keywords: string[]) => keywords.some(k => productType.includes(k) || productName.includes(k));

    if (isType(['spirit', 'liquor', 'vodka', 'whiskey', 'whisky', 'bourbon', 'rum', 'gin', 'tequila', 'mezcal', 'brandy', 'cognac', 'amaro', 'vermouth'])) {
        formula = formulas.spirits;
    } else if (isType(['non-alc', 'na ', 'juice', 'soda', 'non alc', 'water', 'tea', 'coffee'])) {
        formula = formulas.nonAlcoholic;
    }

    // Parse bottle size (remove 'ml' and convert to number)
    const bottleSize = parseFloat(String(product.bottleSize).replace(/[^0-9.]/g, '')) || 750;
    const packSize = parseInt(product.packSize) || 12;

    // AOC Converter Formula (matching the spreadsheet exactly):

    // 1. Net FOB = FOB - DA (discount amount, assume 0 for now)
    const netFOB = product.fobCasePrice;

    // 2. Case Size (L) = (bottles/case * bottle size ml) / 1000
    const caseSizeL = (packSize * bottleSize) / 1000;

    // 3. Tax = (Case Size L * taxPerLiter) + taxFixed
    const tax = (caseSizeL * formula.taxPerLiter) + formula.taxFixed;

    // 4. Taxes, etc = Shipping + Tax
    const taxesEtc = formula.shippingPerCase + tax;

    // 5. Laid In = Net FOB + Taxes, etc
    const laidIn = netFOB + taxesEtc;

    // 6. Whls Case = Laid In / 0.65
    // Default margin divisor if missing or 0 to prevent division by zero
    const marginDivisor = formula.marginDivisor || 0.65;
    const whlsCase = laidIn / marginDivisor;

    // 7. Whls Bottle = Whls Case / bottles per case
    const whlsBottle = whlsCase / packSize;

    // 8. SRP = ROUNDUP(Whls Bottle * 1.47, 0) - 0.01
    // Default SRP multiplier if missing
    const srpMultiplier = formula.srpMultiplier || 1.47;
    const srp = Math.ceil(whlsBottle * srpMultiplier) - 0.01;

    // 9. Frontline Bottle = SRP / 1.47
    const frontlinePrice = srp / srpMultiplier;

    return {
        frontlinePrice: frontlinePrice.toFixed(2),
        frontlineCase: (frontlinePrice * packSize).toFixed(2),
        srp: srp.toFixed(2),
        whlsBottle: whlsBottle.toFixed(2),
        whlsCase: whlsCase.toFixed(2),
        laidIn: laidIn.toFixed(2),
        formulaUsed: productType.includes('spirit') ? 'spirits' : productType.includes('non-alc') || productType.includes('non alc') ? 'nonAlcoholic' : 'wine'
    };
};
