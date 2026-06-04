export interface Item {
    id: number;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    minimumStock: number;
    maximumStock: number;
    active: boolean;
}