export const adminPaths = {
  root: "/admin",
  login: "/admin/login",
  products: "/admin/products",
  newProduct: "/admin/products/new",
  product: (id: string) => `/admin/products/${id}`,
  categories: "/admin/categories",
};
