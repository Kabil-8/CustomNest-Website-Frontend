export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  collection?: string;
  price: number;
  originalPrice?: number | null;
  compareAtPrice?: number | null;
  rating: number;
  reviewCount: number;
  image: string;
  images?: string[];
  gallery?: string[];
  description: string;
  materials?: string;
  care?: string;
  featured?: boolean;
  isFeatured?: boolean;
  featuredRank?: number;
  showOnHome?: boolean;
  bestseller?: boolean;
  isNew?: boolean;
  customizable?: boolean;
  customization?: {
    colors?: string[];
    textAllowed?: boolean;
  };
  availableColors?: { id: string; name: string; hexCode: string }[];
  sizes?: { label: string; priceModifier: number }[];
  yarnType?: 'normal' | 'acrylic' | 'both';
  normalPrice?: number | null;
  acrylicPrice?: number | null;
  stock: number;
}

export interface Category {
  id?: string;
  slug: string;
  name: string;
  collection?: string;
  image: string;
  description?: string;
}

export interface Collection {
  slug: string;
  name: string;
  tagline: string;
  image: string;
}

export interface CustomizationChoice {
  color?: string;
  yarnType?: string;
  text?: string;
  size?: string;
  personalization?: string;
  specialRequest?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  customization?: CustomizationChoice;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  customization?: CustomizationChoice;
}

export interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  items: OrderItem[];
  address: Address;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  paymentMethod?: 'card' | 'upi' | 'upi-qr' | 'razorpay';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentScreenshot?: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  // Shipping, Handcrafting & Delivery Estimates
  estimatedDeliveryDate?: string | null;
  trackingNumber?: string;
  courierPartner?: string;
  shippedAt?: string | null;
  // Custom order fields
  isCustomOrder?: boolean;
  customOrderId?: string;
  customOrderMessages?: CustomOrderMessage[];
}

declare global {
  interface Window {
    google?: any;
    Razorpay?: any;
  }
}

export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}

export interface CustomOrderMessage {
  _id: string;
  sender: 'admin' | 'customer';
  text: string;
  createdAt: string;
}

export interface CustomOrderRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  productType: string;
  colors: string;
  yarnType?: 'normal' | 'acrylic' | 'either' | '';
  size: string;
  quantity: number;
  budget: string;
  deadline: string;
  description: string;
  referenceImage?: string;
  status: 'New' | 'In Review' | 'Quoted' | 'Accepted' | 'Declined';
  agreedPrice?: number | null;
  linkedOrderId?: string | null;
  messages: CustomOrderMessage[];
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
