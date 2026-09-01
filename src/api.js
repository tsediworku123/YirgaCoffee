const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('yirga-token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

async function uploadImage(file) {
  const token = localStorage.getItem('yirga-token');
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE}/admin/upload`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/me', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (body) => request('/auth/password', { method: 'PUT', body: JSON.stringify(body) }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

  // Products
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? '?' + qs : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  getProductReviews: (id) => request(`/products/${id}/reviews`),
  addReview: (id, body) => request(`/products/${id}/reviews`, { method: 'POST', body: JSON.stringify(body) }),

  // Cart
  getCart: () => request('/cart'),
  addToCart: (product_id, quantity = 1) => request('/cart/add', { method: 'POST', body: JSON.stringify({ product_id, quantity }) }),
  updateCartItem: (id, quantity) => request(`/cart/${id}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeFromCart: (id) => request(`/cart/${id}`, { method: 'DELETE' }),
  clearCart: () => request('/cart', { method: 'DELETE' }),

  // Wishlist
  getWishlist: () => request('/wishlist'),
  toggleWishlist: (product_id) => request('/wishlist/add', { method: 'POST', body: JSON.stringify({ product_id }) }),
  checkWishlist: (productId) => request(`/wishlist/check/${productId}`),
  removeFromWishlist: (productId) => request(`/wishlist/${productId}`, { method: 'DELETE' }),

  // Orders
  createPayment: () => request('/orders/create-payment', { method: 'POST' }),
  initializeChapaPayment: (body) => request('/payments/chapa/initialize', { method: 'POST', body: JSON.stringify(body) }),
  checkChapaStatus: (txRef) => request(`/payments/chapa/status/${txRef}`),
  createOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  getOrders: () => request('/orders'),
  getOrder: (id) => request(`/orders/${id}`),

  // Wholesale
  getWholesaleTiers: () => request('/wholesale/tiers'),
  calculateWholesale: (body) => request('/wholesale/calculate', { method: 'POST', body: JSON.stringify(body) }),

  // Subscriptions
  getSubscriptions: () => request('/subscriptions'),
  createSubscription: (body) => request('/subscriptions', { method: 'POST', body: JSON.stringify(body) }),
  updateSubscription: (id, body) => request(`/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  cancelSubscription: (id) => request(`/subscriptions/${id}`, { method: 'DELETE' }),

  // Email
  sendOrderConfirmation: (body) => request('/email/order-confirmation', { method: 'POST', body: JSON.stringify(body) }),
  sendWelcome: (body) => request('/email/welcome', { method: 'POST', body: JSON.stringify(body) }),
  sendShippingUpdate: (body) => request('/email/shipping-update', { method: 'POST', body: JSON.stringify(body) }),

  // Contact
  sendMessage: (body) => request('/contact', { method: 'POST', body: JSON.stringify(body) }),
  subscribe: (email) => request('/contact/newsletter', { method: 'POST', body: JSON.stringify({ email }) }),

  // Admin
  getStats: () => request('/admin/stats'),
  adminGetProducts: () => request('/admin/products'),
  adminCreateProduct: (body) => request('/admin/products', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateProduct: (id, body) => request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  adminDeleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  adminGetOrders: (status) => request(`/admin/orders${status ? '?status=' + status : ''}`),
  adminUpdateOrder: (id, body) => request(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
  adminGetUsers: () => request('/admin/users'),
  adminGetMessages: () => request('/admin/messages'),
  adminReadMessage: (id) => request(`/admin/messages/${id}/read`, { method: 'PUT' }),
  adminGetReviews: () => request('/admin/reviews'),
  adminApproveReview: (id, body) => request(`/admin/reviews/${id}/approve`, { method: 'PUT', body: JSON.stringify(body) }),
  uploadImage,
};
