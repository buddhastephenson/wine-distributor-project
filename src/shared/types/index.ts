export interface IUser {
    id: string;
    username: string;
    type: 'admin' | 'customer' | 'vendor';
    email: string;
    isSuperAdmin?: boolean;
    vendors?: string[]; // Array of supplier names for Vendor Admins
    accessRevoked?: boolean;
    password?: string; // Optional as often excluded
    resetToken?: string;
    resetTokenExpiry?: number;
}

export interface IProduct {
    id: string;
    itemCode: string;
    producer: string;
    productName: string;
    vintage?: string;
    packSize: string;
    bottleSize: string;
    productType: string;
    fobCasePrice: number;
    productLink?: string;
    country?: string;
    region?: string;
    appellation?: string;
    supplier?: string;
    vendor?: string; // ID of the vendor user
    uploadDate?: string | Date;
    // Derived pricing fields (often computed on fly but useful in UI)
    frontlinePrice?: string;
    frontlineCase?: string;
    srp?: string;
    whlsBottle?: string;
    whlsCase?: string;
    laidIn?: string;
    formulaUsed?: string;
    grapeVariety?: string; // New: Imported from price list
    extendedData?: Record<string, string | number>; // New: Custom columns
}

export const ORDER_STATUS = {
    PENDING: 'Pending',
    ON_PO: 'On Purchase Order',
    BACKORDERED: 'Backordered',
    NOT_AVAILABLE: 'Not Available',
    IN_STOCK: 'Arrived/In Stock',
    DELIVERED: 'Delivered',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export interface ISpecialOrder {
    id: string;
    username: string;
    itemCode: string;
    productId?: string;
    producer?: string;
    productName?: string;
    vintage?: string;
    packSize?: string;
    bottleSize?: string;
    productType?: string;
    fobCasePrice?: number;
    supplier?: string;
    uploadDate?: string | Date;
    frontlinePrice?: string;
    srp?: string;
    whlsBottle?: string;
    laidIn?: string;
    formulaUsed?: string;
    productLink?: string;
    isSuggestedLink?: boolean;
    cases: number;
    bottles: number;
    quantity?: number; // legacy?
    status: string;
    notes?: string;
    adminNotes?: string;
    submitted?: boolean;
    isArchived?: boolean;
    hasUnseenUpdate?: boolean; // For customer
    adminUnseen?: boolean; // For admin
    messages?: IOrderMessage[];
    createdAt?: string | Date; // Added for sorting
}

export interface IOrderMessage {
    id: string;
    text: string;
    sender: string; // username
    timestamp: string | Date;
    isAdmin: boolean;
}

export interface IAuthResponse {
    success: boolean;
    user?: IUser;
    error?: string;
    token?: string; // For future JWT
}

export interface ITaxonomy {
    name: string;
    data: any; // Flexible tree structure
}

export interface IStorage {
    key: string;
    value: string; // JSON string
}

export interface IFormula {
    taxPerLiter: number;
    taxFixed: number;
    shippingPerCase: number;
    marginDivisor: number;
    srpMultiplier: number;
}

export interface IFormulas {
    wine: IFormula;
    spirits: IFormula;
    nonAlcoholic: IFormula;
}
