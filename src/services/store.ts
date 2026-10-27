import { Dish, RestaurantInfo, WaiterCall, ReviewItem } from '../types';
import { INITIAL_DISHES, INITIAL_RESTAURANT, INITIAL_CATEGORIES } from '../data/initialData';

const STORAGE_KEYS = {
  DISHES: 'menulab_dishes_v1',
  RESTAURANTS: 'menulab_restaurants_list_v1',
  CURRENT_RESTAURANT_ID: 'menulab_current_restaurant_id_v1',
  CATEGORIES: 'menulab_categories_v1',
  WAITER_CALLS: 'menulab_waiter_calls_v1',
  REVIEWS: 'menulab_reviews_v1',
};

export const INITIAL_RESTAURANTS_LIST: RestaurantInfo[] = [
  INITIAL_RESTAURANT,
  {
    id: 'pizzeriavesuvio',
    name: 'Pizzeria & Friggitoria Vesuvio',
    tagline: 'Pizza fritta napoletana e specialità di mare.',
    logo: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=300&q=80',
    coverImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
    address: 'Corso Umberto I 112, Napoli',
    phone: '+39 081 777 9988',
    email: 'vesuvio@menulab.it',
    isOpen: true,
    openingHours: 'Lun - Dom: 18:30 - 00:00',
    currency: '€',
    googleReviewUrl: 'https://g.page/r/example',
    tripAdvisorUrl: 'https://www.tripadvisor.it',
    subscription: {
      planName: 'Abbonamento Mensile Pro',
      status: 'Attivo',
      endDate: '2026-11-30',
      monthlyFee: 49,
    },
    promoPopup: {
      title: '🍕 Promo Vesuvio!',
      subtitle: 'Sconto 15% con codice VESUVIO15',
      couponCode: 'VESUVIO15',
      active: true,
    },
    coupons: [
      { id: 'cv1', code: 'VESUVIO15', discountPercent: 15, description: 'Sconto 15% pizze e fritti', active: true }
    ]
  },
  {
    id: 'trattoriabarchetta',
    name: 'Ristorante Barchetta sul Porto',
    tagline: 'Pesce fresco del pescato locale ogni giorno.',
    logo: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=300&q=80',
    coverImage: 'https://images.unsplash.com/photo-1507048331197-7d4acfa1f18c?auto=format&fit=crop&w=1200&q=80',
    address: 'Molo Luise 5, Napoli',
    phone: '+39 081 999 4321',
    email: 'barchetta@menulab.it',
    isOpen: true,
    openingHours: 'Mar - Dom: 12:30 - 15:30 | 20:00 - 23:30',
    currency: '€',
    googleReviewUrl: 'https://g.page/r/example',
    tripAdvisorUrl: 'https://www.tripadvisor.it',
    subscription: {
      planName: 'Abbonamento Annuale VIP',
      status: 'Attivo',
      endDate: '2027-05-15',
      monthlyFee: 39,
    },
    promoPopup: {
      title: '🐟 Benvenuti al Porto!',
      subtitle: 'Usa PORTOPESCATO per il 10% di sconto sul crudo di mare',
      couponCode: 'PORTOPESCATO',
      active: true,
    },
    coupons: [
      { id: 'cp1', code: 'PORTOPESCATO', discountPercent: 10, description: 'Sconto 10% menu mare', active: true }
    ]
  }
];

export const getStoredRestaurantsList = (): RestaurantInfo[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RESTAURANTS);
    return data ? JSON.parse(data) : INITIAL_RESTAURANTS_LIST;
  } catch {
    return INITIAL_RESTAURANTS_LIST;
  }
};

export const saveStoredRestaurantsList = (list: RestaurantInfo[]) => {
  localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(list));
  window.dispatchEvent(new Event('menulab_data_updated'));
};

export const getStoredRestaurant = (): RestaurantInfo => {
  try {
    const list = getStoredRestaurantsList();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_RESTAURANT_ID);
    if (currentId) {
      const found = list.find(r => r.id === currentId);
      if (found) return found;
    }
    return list[0] || INITIAL_RESTAURANT;
  } catch {
    return INITIAL_RESTAURANT;
  }
};

export const saveStoredRestaurant = (info: RestaurantInfo) => {
  const list = getStoredRestaurantsList();
  const updatedList = list.map(r => r.id === info.id ? info : r);
  if (!updatedList.some(r => r.id === info.id)) {
    updatedList.push(info);
  }
  saveStoredRestaurantsList(updatedList);
  localStorage.setItem(STORAGE_KEYS.CURRENT_RESTAURANT_ID, info.id);
  window.dispatchEvent(new Event('menulab_data_updated'));
};

export const setCurrentRestaurantId = (id: string) => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_RESTAURANT_ID, id);
  window.dispatchEvent(new Event('menulab_data_updated'));
};

export const getStoredDishes = (): Dish[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DISHES);
    return data ? JSON.parse(data) : INITIAL_DISHES;
  } catch {
    return INITIAL_DISHES;
  }
};

export const saveStoredDishes = (dishes: Dish[]) => {
  localStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(dishes));
  window.dispatchEvent(new Event('menulab_data_updated'));
};

export const getStoredCategories = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : INITIAL_CATEGORIES;
  } catch {
    return INITIAL_CATEGORIES;
  }
};

export const saveStoredCategories = (categories: string[]) => {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  window.dispatchEvent(new Event('menulab_data_updated'));
};

export const getStoredWaiterCalls = (): WaiterCall[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WAITER_CALLS);
    return data ? JSON.parse(data) : [
      { id: 'w1', tableNumber: 'Tavolo 4', type: 'call_waiter', timestamp: Date.now() - 120000, status: 'pending' },
      { id: 'w2', tableNumber: 'Tavolo 12', type: 'request_bill', timestamp: Date.now() - 300000, status: 'resolved' },
    ];
  } catch {
    return [];
  }
};

export const saveStoredWaiterCalls = (calls: WaiterCall[]) => {
  localStorage.setItem(STORAGE_KEYS.WAITER_CALLS, JSON.stringify(calls));
  window.dispatchEvent(new Event('menulab_calls_updated'));
};

export const getStoredReviews = (): ReviewItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return data ? JSON.parse(data) : [
      { id: 'r1', rating: 5, comment: 'Pizza straordinaria, impasto leggerissimo e servizio impeccabile!', name: 'Marco R.', timestamp: Date.now() - 86400000 },
      { id: 'r2', rating: 5, comment: 'I paccheri alla Nerano sono divini. Torneremo sicuramente!', name: 'Elena B.', timestamp: Date.now() - 172800000 },
    ];
  } catch {
    return [];
  }
};

export const saveStoredReviews = (reviews: ReviewItem[]) => {
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  window.dispatchEvent(new Event('menulab_reviews_updated'));
};
