export type QuoteItem = {
  productId: string;
  productName: string;
  categoryName: string;
  quantity: number;
  notes?: string;
};

export type LeadForEmail = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string | null;
  intent: 'install' | 'purchase' | 'both';
  message: string;
  quoteItems: QuoteItem[];
  createdAt: Date;
};