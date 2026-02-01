import { supabase } from './supabase';

const ORG_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * Fetch pricing formulas for the organization
 */
export async function getFormulas() {
    const { data, error } = await supabase
        .from('pricing_formulas')
        .select('*')
        .eq('organization_id', ORG_ID);

    if (error) {
        console.error('Error fetching formulas:', error);
        return null;
    }

    // Transform to match existing app format
    const formulas = {};
    data.forEach(f => {
        const key = f.formula_type === 'non_alcoholic' ? 'nonAlcoholic' : f.formula_type;
        formulas[key] = {
            taxPerLiter: parseFloat(f.tax_per_liter),
            taxFixed: parseFloat(f.tax_fixed),
            shippingPerCase: parseFloat(f.shipping_per_case),
            marginDivisor: parseFloat(f.margin_divisor),
            srpMultiplier: parseFloat(f.srp_multiplier),
        };
    });

    return formulas;
}

/**
 * Update a pricing formula
 */
export async function updateFormula(formulaType, values) {
    const dbType = formulaType === 'nonAlcoholic' ? 'non_alcoholic' : formulaType;

    const { error } = await supabase
        .from('pricing_formulas')
        .update({
            tax_per_liter: values.taxPerLiter,
            tax_fixed: values.taxFixed,
            shipping_per_case: values.shippingPerCase,
            margin_divisor: values.marginDivisor,
            srp_multiplier: values.srpMultiplier,
            updated_at: new Date().toISOString(),
        })
        .eq('organization_id', ORG_ID)
        .eq('formula_type', dbType);

    if (error) {
        console.error('Error updating formula:', error);
        return false;
    }

    return true;
}