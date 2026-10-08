import { createContext, useContext } from "react";

export interface CartDrawerState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

/** No provider (e.g. isolated component tests) → a harmless no-op drawer. */
export const CartDrawerContext = createContext<CartDrawerState>({ open: false, setOpen: () => {} });

export const useCartDrawer = () => useContext(CartDrawerContext);
