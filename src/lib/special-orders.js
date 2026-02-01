import { supabase } from './supabase';

const ORG_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * Fetch all special order items grouped by user
 */
export async function getAllSpecialOrders() {
    const { data, error } = await supabase
        .from('special_order_items')
        .select(`
      *,
      products (*)
    `)
        .eq('organization_id', ORG_ID);

    if (error) {
        console.error('Error fetching special orders:', error);
        return {};
    }

    // Get user profiles separately
    const userIds = [...new Set(data.map(item => item.user_id))];

    let userMap = {};
    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, username')
            .in('id', userIds);

        if (profiles) {
            profiles.forEach(p => {
                userMap[p.id] = p.username;
            });
        }
    }

    // Group by username
    const byUser = {};
    data.forEach(item => {
        const username = userMap[item.user_id] || 'Unknown';
        if (!byUser[username]) byUser[username] = [];

        byUser[username].push({
            id: item.product_id,
            cases: item.cases,
            bottles: item.bottles,
            quantity: (item.cases * (item.products?.pack_size || 12)) + item.bottles,
            requestedQuantity: (item.cases * (item.products?.pack_size || 12)) + item.bottles,
            status: item.status,
            notes: item.notes,
            adminNotes: item.admin_notes,
            hasUnseenUpdate: item.has_unseen_update,
            submitted: item.submitted,
            frontlinePrice: item.frontline_price_snapshot,
            producer: item.products?.producer,
            productName: item.products?.product_name,
            vintage: item.products?.vintage,
            packSize: String(item.products?.pack_size || 12),
            bottleSize: String(item.products?.bottle_size_ml || 750),
        });
    });

    return byUser;
}

/**
 * Get special orders for a specific user
 */
export async function getUserSpecialOrders(userId) {
    const { data, error } = await supabase
        .from('special_order_items')
        .select(`
      *,
      products (*)
    `)
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching user special orders:', error);
        return [];
    }

    return data.map(item => ({
        id: item.product_id,
        cases: item.cases,
        bottles: item.bottles,
        quantity: (item.cases * (item.products?.pack_size || 12)) + item.bottles,
        requestedQuantity: (item.cases * (item.products?.pack_size || 12)) + item.bottles,
        status: item.status,
        notes: item.notes,
        adminNotes: item.admin_notes,
        hasUnseenUpdate: item.has_unseen_update,
        submitted: item.submitted,
        frontlinePrice: item.frontline_price_snapshot,
        producer: item.products?.producer,
        productName: item.products?.product_name,
        vintage: item.products?.vintage,
        packSize: String(item.products?.pack_size),
        bottleSize: String(item.products?.bottle_size_ml),
    }));
}

/**
 * Add item to special order list
 */
export async function addSpecialOrderItem(userId, product) {
    const { data, error } = await supabase
        .from('special_order_items')
        .upsert({
            organization_id: ORG_ID,
            user_id: userId,
            product_id: product.id,
            cases: 1,
            bottles: 0,
            status: 'Requested',
            frontline_price_snapshot: parseFloat(product.frontlinePrice) || 0,
        }, {
            onConflict: 'user_id,product_id'
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding special order item:', error);
        return null;
    }

    return data;
}

/**
 * Update special order item
 */
export async function updateSpecialOrderItem(userId, productId, updates) {
    const updateData = {
        updated_at: new Date().toISOString(),
    };

    if (updates.cases !== undefined) updateData.cases = updates.cases;
    if (updates.bottles !== undefined) updateData.bottles = updates.bottles;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.adminNotes !== undefined) updateData.admin_notes = updates.adminNotes;
    if (updates.hasUnseenUpdate !== undefined) updateData.has_unseen_update = updates.hasUnseenUpdate;
    if (updates.submitted !== undefined) updateData.submitted = updates.submitted;

    const { error } = await supabase
        .from('special_order_items')
        .update(updateData)
        .eq('user_id', userId)
        .eq('product_id', productId);

    if (error) {
        console.error('Error updating special order item:', error);
        return false;
    }

    return true;
}

/**
 * Remove item from special order list
 */
export async function removeSpecialOrderItem(userId, productId) {
    const { error } = await supabase
        .from('special_order_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

    if (error) {
        console.error('Error removing special order item:', error);
        return false;
    }

    return true;
}