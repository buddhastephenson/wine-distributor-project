
// Mock calculateFrontlinePrice to avoid import issues
const calculateFrontlinePrice = (product, formulas) => {
    if (!product) return {};
    const productType = (product.productType || 'wine').toLowerCase();
    const productName = (product.productName || '').toLowerCase();

    // Safety check just in case formulas state was corrupted
    if (!formulas || !formulas.wine) return {};

    // Explicitly type formula to avoid index signature errors
    let formula = formulas.wine;

    // Helper to check keywords in either field
    const isType = (keywords) => keywords.some(k => productType.includes(k) || productName.includes(k));

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
        frontlinePrice, // Number for easier check
        srp,
        whlsBottle,
        laidIn
    };
};

const defaultFormula = {
    taxPerLiter: 0,
    taxFixed: 0,
    shippingPerCase: 0,
    marginDivisor: 0.65,
    srpMultiplier: 1.47
};

const formulas = {
    wine: { ...defaultFormula },
    spirits: { ...defaultFormula },
    nonAlcoholic: { ...defaultFormula }
};

// Target: 19.72
// Find FOB
for (let fob = 50; fob < 200; fob += 0.01) {
    const product = {
        productType: 'wine',
        productName: 'MERO251',
        bottleSize: '750ml',
        packSize: 12,
        fobCasePrice: fob
    };
    const res = calculateFrontlinePrice(product, formulas);

    if (Math.abs(res.frontlinePrice - 19.72) < 0.01) {
        console.log(`Found FOB for 19.72: ${fob.toFixed(2)}`);

        // Now try to see what formula yields 19.04 with this FOB
        check1904(fob, product);
    }
}

function check1904(fob, product) {
    // Check with default params variations

    // Variation 1: Maybe tax is higher?
    // Variation 2: Maybe shipping is higher?
    // Variation 3: Maybe margin is different?

    // We want 19.04.
    // 19.04 < 19.72.
    // So either costs are LOWER or Margin is HIGHER (divisor bigger) or Multiplier is ...

    // Attempt 1: Default shipping/tax might be non-zero in reality?
    // If the "Correct" one is 19.72, maybe it HAS shipping?
    // And the "Bad" one (19.04) DOES NOT have shipping?

    // Let's assume the user has CUSTOM settings.
    // Let's sweep params.

    // Scenario A: User added shipping/tax.
    // Let's try to add shipping until we hit 19.72 (assuming starting from lower, but we found FOB based on 0 shipping).
    // Wait, if 19.72 is correct, maybe the user has configured taxes/shipping.

    // Let's re-run finding FOB but with some shipping/tax assumptions.
    // Actually, let's just reverse engineer the formula from 19.04 using the SAME FOB.

    const possibleDiffs = [];

    // If 19.04 is the validation target
    const currentPrice = 19.04;

    // Try calculate with same FOB but different settings
    const testProduct = { ...product, fobCasePrice: fob };

    const settings = [
        { name: 'Default', f: { ...defaultFormula } },
        { name: 'Margin 0.70', f: { ...defaultFormula, marginDivisor: 0.70 } },
        { name: 'Margin 0.60', f: { ...defaultFormula, marginDivisor: 0.60 } },
        { name: 'No SRP Mult', f: { ...defaultFormula, srpMultiplier: 1.0 } }, // Unlikely
        { name: 'Different SRP', f: { ...defaultFormula, srpMultiplier: 1.33 } },
        { name: 'Different SRP 1.50', f: { ...defaultFormula, srpMultiplier: 1.50 } },
        // Maybe it's not a formula param, maybe it's formula TYPE.
        // If it fell back to Spirits?
    ];

    settings.forEach(s => {
        const f = { wine: s.f, spirits: s.f, nonAlcoholic: s.f };
        const r = calculateFrontlinePrice(testProduct, f);
        if (Math.abs(r.frontlinePrice - 19.04) < 0.05) {
            console.log(`Found MATCH for 19.04 with FOB ${fob.toFixed(2)} using: ${s.name} => ${r.frontlinePrice.toFixed(2)}`);
        }
    });

    // What if the "Bad" one (19.04) corresponds to the FOB with Defaults?
    // And the "Good" one (19.72) corresponds to FOB with Custom Taxes?
    // Let's check if 19.04 comes from pure defaults.
    // If so, then the "Bad" one is just missing the custom settings.

    // Let's assume FOB X -> Default Formula -> 19.04
    // Then calculate what Formula params give 19.72 from X.
}

// Reverse check: Find FOB that gives 19.04 with defaults
console.log('--- checking default yields 19.04 ---');
for (let fob = 50; fob < 200; fob += 0.01) {
    const product = {
        productType: 'wine',
        productName: 'MERO251',
        bottleSize: '750ml',
        packSize: 12,
        fobCasePrice: fob
    };
    const res = calculateFrontlinePrice(product, formulas);
    if (Math.abs(res.frontlinePrice - 19.04) < 0.01) {
        console.log(`FOB ${fob.toFixed(2)} yields 19.04 with DEFAULTS.`);

        // Now check if this same FOB yields 19.72 with some added tax/shipping
        check1972(fob, product);
    }
}

function check1972(fob, product) {
    // Try adding shipping/tax
    for (let ship = 0; ship < 20; ship += 0.5) {
        for (let tax = 0; tax < 5; tax += 0.1) {
            const f = { ...defaultFormula, shippingPerCase: ship, taxPerLiter: tax };
            const forms = { wine: f, spirits: f, nonAlcoholic: f };
            const r = calculateFrontlinePrice(product, forms);
            if (Math.abs(r.frontlinePrice - 19.72) < 0.02) {
                console.log(`MATCH 19.72 with FOB ${fob.toFixed(2)}: Shipping ${ship}, TaxL ${tax} => ${r.frontlinePrice.toFixed(2)}`);
            }
        }
    }
}
