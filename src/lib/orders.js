import { supabase } from './supabase';

const ORG_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * Fetch all orders for the organization
 */
export async function getOrders() {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('organization_id', ORG_ID)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    // Transform to match existing app format
    return data.map(o => ({
        id: o.id,
        customer: o.items?.[0]?.customer || 'Unknown',
        items: o.items || [],
        total: String(o.total),
        status: o.status,
        date: o.created_at,
        idealDeliveryDate: o.ideal_delivery_date,
        mustHaveByDate: o.must_have_by_date,
        adminNote: o.admin_note,
    }));
}

/**
 * Create a new order
 */
export async function createOrder(order, userId) {
    const { data, error } = await supabase
        .from('orders')
        .insert({
            organization_id: ORG_ID,
            user_id: userId,
            items: order.items,
            total: parseFloat(order.total) || 0,
            status: order.status || 'submitted',
            ideal_delivery_date: order.idealDeliveryDate || null,
            must_have_by_date: order.mustHaveByDate || null,
            admin_note: order.adminNote || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating order:', error);
        return null;
    }

    return data;
}

/**
 * Update order status or note
 */
export async function updateOrder(orderId, updates) {
    const updateData = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.adminNote !== undefined) updateData.admin_note = updates.adminNote;
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

    if (error) {
        console.error('Error updating order:', error);
        return false;
    }

    return true;
}