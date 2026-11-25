export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
  } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, typeof data?.error === 'string' ? data.error : 'Request failed.');
  }

  return data as T;
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatOrderDate(dateStr: string, includeTime = true): string {
  if (!dateStr) return '—';
  const normalized = dateStr.includes('T') ? dateStr : `${dateStr.replace(' ', 'T')}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }
  return includeTime ? parsed.toLocaleString('en-IN') : parsed.toLocaleDateString('en-IN');
}

export const DISH_IMAGE_GALLERY = [
  {
    label: 'Chicken Biriyani',
    url: '/src/assets/images/dish_chicken_biriyani_1795337580667.jpg',
  },
  {
    label: 'Masala Dosa',
    url: '/src/assets/images/dish_masala_dosa_1795337580549.jpg',
  },
  {
    label: 'Paneer Butter Masala',
    url: '/src/assets/images/dish_paneer_butter_masala_1795337580614.jpg',
  },
  {
    label: 'Chicken Burger',
    url: '/src/assets/images/dish_chicken_burger_1795337580165.jpg',
  },
  {
    label: 'Tandoori Paneer Pizza',
    url: '/src/assets/images/dish_tandoori_pizza_1795337579979.jpg',
  },
  {
    label: 'Veg Fried Rice',
    url: '/src/assets/images/dish_veg_fried_rice_1795337580111.jpg',
  },
  {
    label: 'Warm Gulab Jamun',
    url: '/src/assets/images/dish_gulab_jamun_1795337580180.jpg',
  },
  {
    label: 'Fresh Lime Juice',
    url: '/src/assets/images/dish_fresh_lime_juice_1795337580925.jpg',
  },
] as const;
