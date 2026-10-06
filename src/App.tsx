import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Products from "./pages/Products.tsx";
import TacticalFootwear from "./pages/TacticalFootwear.tsx";
import CombatApparel from "./pages/CombatApparel.tsx";
import LoadBearing from "./pages/LoadBearing.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import LegalIndex from "./pages/legal/LegalIndex.tsx";
import Terms from "./pages/legal/Terms.tsx";
import Privacy from "./pages/legal/Privacy.tsx";
import Returns from "./pages/legal/Returns.tsx";
import Shipping from "./pages/legal/Shipping.tsx";
import Cancellation from "./pages/legal/Cancellation.tsx";
import LegalContact from "./pages/legal/Contact.tsx";
import { AdminRoute } from "./admin/route";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/tactical-footwear" element={<TacticalFootwear />} />
            <Route path="/products/combat-apparel" element={<CombatApparel />} />
            <Route path="/products/load-bearing" element={<LoadBearing />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/legal" element={<LegalIndex />} />
            <Route path="/legal/terms" element={<Terms />} />
            <Route path="/legal/privacy" element={<Privacy />} />
            <Route path="/legal/returns" element={<Returns />} />
            <Route path="/legal/shipping" element={<Shipping />} />
            <Route path="/legal/cancellation" element={<Cancellation />} />
            <Route path="/legal/contact" element={<LegalContact />} />
            <Route path="/admin/*" element={<AdminRoute />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
