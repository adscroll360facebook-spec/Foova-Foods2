import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  Package, ShoppingCart, Users, Plus, Pencil, Trash2, X, LayoutDashboard,
  Tag, Image, BarChart3, Eye, EyeOff, ToggleLeft, ToggleRight, Upload,
  Check, Truck, Clock, PackageCheck, MapPin, Phone, CreditCard, ChevronDown, ChevronUp,
  AlertTriangle, RefreshCw, History, Settings, Lock, Mail, Send, KeyRound, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Product = Tables<"products">;
type Order = Tables<"orders">;
type Coupon = Tables<"coupons">;
type Testimonial = Tables<"testimonials">;

const statusLabels: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", packed: "Packed", dispatched: "Dispatched",
  out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled",
};
const statusIcons: Record<string, any> = {
  pending: Clock, confirmed: Check, packed: PackageCheck, dispatched: Truck,
  out_for_delivery: MapPin, delivered: Check, cancelled: X,
};
const orderStatusFlow = ["pending", "confirmed", "packed", "dispatched", "out_for_delivery", "delivered"];

const productCategories = ["perfumes", "cosmetics", "skincare", "hair-care", "accessories", "Iftar Kits", "Dates", "Dry Fruits", "General"];

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([]);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "", description: "", price: 0, original_price: 0, category: "General",
    badge: "", weight: "", image_url: "", in_stock: true, stock_quantity: 0, tags: [] as string[], cod_available: true,
  });
  const [tagInput, setTagInput] = useState("");

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: "", discount_type: "percentage", discount_value: 0, min_order_amount: 0, max_uses: 0, expires_at: "", is_active: true,
  });

  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    customer_name: "", text: "", rating: 5, customer_image_url: "", is_visible: true,
  });

  const [bannerUploading, setBannerUploading] = useState(false);
  const [orderFilter, setOrderFilter] = useState("all");
  const [analyticsRange, setAnalyticsRange] = useState("7d");

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/login");
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [p, o, c, t, b, pr] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("testimonials").select("*").order("created_at", { ascending: false }),
      supabase.from("offer_banners").select("*").order("sort_order"),
      supabase.from("profiles").select("*"),
    ]);
    if (p.data) setProducts(p.data);
    if (o.data) setOrders(o.data);
    if (c.data) setCoupons(c.data);
    if (t.data) setTestimonials(t.data);
    if (b.data) setBanners(b.data);
    if (pr.data) setProfiles(pr.data);
  };

  // Product CRUD
  const handleSaveProduct = async () => {
    const payload = {
      name: productForm.name, description: productForm.description, price: productForm.price,
      original_price: productForm.original_price || null, category: productForm.category,
      badge: productForm.badge || null, weight: productForm.weight || null,
      image_url: productForm.image_url || null, in_stock: productForm.stock_quantity > 0,
      stock_quantity: productForm.stock_quantity, tags: productForm.tags, cod_available: productForm.cod_available,
    };
    if (editingProduct) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Product updated");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Product added");
    }
    setShowProductModal(false); setEditingProduct(null); resetProductForm(); loadData();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    toast.success("Deleted"); loadData();
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name, description: p.description || "", price: p.price,
      original_price: p.original_price || 0, category: p.category,
      badge: p.badge || "", weight: p.weight || "", image_url: p.image_url || "",
      in_stock: p.in_stock ?? true, stock_quantity: p.stock_quantity,
      tags: (p as any).tags || [], cod_available: (p as any).cod_available ?? true,
    });
    setShowProductModal(true);
  };

  const resetProductForm = () => setProductForm({
    name: "", description: "", price: 0, original_price: 0, category: "General",
    badge: "", weight: "", image_url: "", in_stock: true, stock_quantity: 0, tags: [], cod_available: true,
  });

  const toggleCodForProduct = async (p: Product) => {
    const current = (p as any).cod_available ?? true;
    await supabase.from("products").update({ cod_available: !current }).eq("id", p.id);
    toast.success(`COD ${!current ? "enabled" : "disabled"} for ${p.name}`);
    loadData();
  };

  const addTag = () => {
    if (tagInput.trim() && productForm.tags.length < 5) {
      setProductForm({ ...productForm, tags: [...productForm.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  // Order CRUD
  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    toast.success(`Status → ${statusLabels[status]}`); loadData();
  };

  const advanceOrderStatus = async (order: Order) => {
    const currentIdx = orderStatusFlow.indexOf(order.status);
    if (currentIdx < orderStatusFlow.length - 1) {
      const next = orderStatusFlow[currentIdx + 1];
      await updateOrderStatus(order.id, next);
    }
  };

  const updateTracking = async (orderId: string, tracking_number: string, tracking_link: string) => {
    await supabase.from("orders").update({ tracking_number, tracking_link }).eq("id", orderId);
    toast.success("Tracking updated"); loadData();
  };

  // Coupon CRUD
  const handleSaveCoupon = async () => {
    const payload = {
      code: couponForm.code.toUpperCase(), discount_type: couponForm.discount_type,
      discount_value: couponForm.discount_value,
      min_order_amount: couponForm.min_order_amount || null,
      max_uses: couponForm.max_uses || null,
      expires_at: couponForm.expires_at || null, is_active: couponForm.is_active,
    };
    if (editingCoupon) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", editingCoupon.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Coupon updated");
    } else {
      const { error } = await supabase.from("coupons").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Coupon created");
    }
    setShowCouponModal(false); setEditingCoupon(null); loadData();
  };

  const deleteCoupon = async (id: string) => {
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Deleted"); loadData();
  };

  const toggleCoupon = async (c: Coupon) => {
    await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    loadData();
  };

  // Testimonial CRUD
  const handleSaveTestimonial = async () => {
    const payload = {
      customer_name: testimonialForm.customer_name, text: testimonialForm.text,
      rating: testimonialForm.rating, customer_image_url: testimonialForm.customer_image_url || null,
      is_visible: testimonialForm.is_visible,
    };
    if (editingTestimonial) {
      const { error } = await supabase.from("testimonials").update(payload).eq("id", editingTestimonial.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Updated");
    } else {
      const { error } = await supabase.from("testimonials").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Added");
    }
    setShowTestimonialModal(false); setEditingTestimonial(null); loadData();
  };

  const deleteTestimonial = async (id: string) => {
    await supabase.from("testimonials").delete().eq("id", id);
    toast.success("Deleted"); loadData();
  };

  // Banner
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    const path = `banners/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("offer-banners").upload(path, file);
    if (uploadError) { toast.error(uploadError.message); setBannerUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("offer-banners").getPublicUrl(path);
    await supabase.from("offer_banners").insert({ image_url: publicUrl, is_active: true, sort_order: banners.length });
    toast.success("Banner uploaded");
    setBannerUploading(false);
    loadData();
  };

  const toggleBanner = async (b: any) => {
    await supabase.from("offer_banners").update({ is_active: !b.is_active }).eq("id", b.id);
    loadData();
  };

  const deleteBanner = async (id: string) => {
    await supabase.from("offer_banners").delete().eq("id", id);
    toast.success("Deleted"); loadData();
  };

  // Analytics
  const getAnalyticsData = () => {
    const now = new Date();
    let days = 7;
    if (analyticsRange === "30d") days = 30;
    else if (analyticsRange === "6m") days = 180;
    else if (analyticsRange === "1y") days = 365;
    else if (analyticsRange === "all") days = 9999;

    const rangeOrders = orders.filter((o) => {
      const d = new Date(o.created_at);
      return (now.getTime() - d.getTime()) / 86400000 <= days;
    });

    const grouped: Record<string, { revenue: number; sales: number }> = {};
    rangeOrders.forEach((o) => {
      const d = new Date(o.created_at).toLocaleDateString();
      if (!grouped[d]) grouped[d] = { revenue: 0, sales: 0 };
      grouped[d].revenue += Number(o.total);
      grouped[d].sales += 1;
    });

    return Object.entries(grouped).map(([date, data]) => ({ date, ...data })).slice(-30);
  };

  const filteredOrders = orderFilter === "all" ? orders : orders.filter((o) => o.status === orderFilter);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" /></div>;

  const totalRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const stats = [
    { label: "Total Users", value: profiles.length, icon: Users, color: "text-accent" },
    { label: "Products", value: products.length, icon: Package, color: "text-primary" },
    { label: "Total Sales", value: orders.filter((o) => o.status === "delivered").length, icon: ShoppingCart, color: "text-emerald-light" },
    { label: "Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: BarChart3, color: "text-gold-muted" },
  ];

  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "products", label: "Products", icon: Package },
    { key: "inventory", label: "Inventory", icon: AlertTriangle },
    { key: "orders", label: `Orders (${orders.length})`, icon: ShoppingCart },
    { key: "coupons", label: "Coupons", icon: Tag },
    { key: "banners", label: "Banners", icon: Image },
    { key: "testimonials", label: "Testimonials", icon: Users },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <main className="pt-28 pb-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl font-bold mb-8">
          Admin <span className="gold-text">Dashboard</span>
        </motion.h1>

        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${tab === t.key ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground/70 hover:text-foreground"}`}>
              <t.icon className="w-4 h-4" /><span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-6">
                  <s.icon className={`w-8 h-8 ${s.color} mb-3`} />
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-muted-foreground text-sm">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Stock Alert Widgets */}
            {(() => {
              const outOfStock = products.filter((p) => p.stock_quantity === 0);
              const lowStock = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 10);
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {/* Out of Stock Alert */}
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                    className="glass-card p-5 border border-red-800/40 bg-red-950/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <p className="font-bold text-red-400">Out of Stock Alert</p>
                        <p className="text-xs text-muted-foreground">{outOfStock.length} product{outOfStock.length !== 1 ? "s" : ""} out of stock</p>
                      </div>
                    </div>
                    {outOfStock.length === 0 ? (
                      <p className="text-sm text-emerald-400">✓ All products are in stock</p>
                    ) : (
                      <div className="space-y-1.5">
                        {outOfStock.slice(0, 4).map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-sm bg-red-950/20 px-3 py-2 rounded-lg">
                            <span className="truncate font-medium">{p.name}</span>
                            <span className="text-red-400 font-bold ml-2 flex-shrink-0">0 units</span>
                          </div>
                        ))}
                        {outOfStock.length > 4 && <p className="text-xs text-muted-foreground">+{outOfStock.length - 4} more...</p>}
                        <button onClick={() => setTab("inventory")} className="mt-2 text-xs text-accent hover:underline">View all →</button>
                      </div>
                    )}
                  </motion.div>

                  {/* Low Stock Alert */}
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                    className="glass-card p-5 border border-orange-800/40 bg-orange-950/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="font-bold text-orange-400">Low Stock Alert</p>
                        <p className="text-xs text-muted-foreground">{lowStock.length} product{lowStock.length !== 1 ? "s" : ""} running low (≤10)</p>
                      </div>
                    </div>
                    {lowStock.length === 0 ? (
                      <p className="text-sm text-emerald-400">✓ No stock warnings</p>
                    ) : (
                      <div className="space-y-1.5">
                        {lowStock.sort((a, b) => a.stock_quantity - b.stock_quantity).slice(0, 4).map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-sm bg-orange-950/20 px-3 py-2 rounded-lg">
                            <span className="truncate font-medium">{p.name}</span>
                            <span className="text-orange-400 font-bold ml-2 flex-shrink-0">{p.stock_quantity} left</span>
                          </div>
                        ))}
                        {lowStock.length > 4 && <p className="text-xs text-muted-foreground">+{lowStock.length - 4} more...</p>}
                        <button onClick={() => setTab("inventory")} className="mt-2 text-xs text-accent hover:underline">View all →</button>
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })()}

            {/* Recent orders */}
            <h3 className="font-display text-xl font-semibold mb-4">Recent Orders</h3>
            <div className="space-y-2">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="glass-card p-4 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-sm">#{o.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="text-accent font-bold">₹{o.total}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${o.status === "delivered" ? "bg-primary/20 text-primary" : o.status === "cancelled" ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent"}`}>
                    {statusLabels[o.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {tab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-semibold">Products</h2>
              <button onClick={() => { resetProductForm(); setEditingProduct(null); setShowProductModal(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-full font-medium text-sm">
                <Plus className="w-4 h-4" />Create Product
              </button>
            </div>
            <div className="hidden md:grid grid-cols-7 gap-4 px-4 mb-2 text-xs font-medium text-muted-foreground uppercase">
              <span className="col-span-2">Product</span><span>Price</span><span>Category</span><span>Stock</span><span>COD</span><span>Actions</span>
            </div>
            <div className="space-y-2">
              {products.map((p) => {
                const qty = p.stock_quantity ?? 0;
                const isOut = qty === 0;
                const isLow = qty > 0 && qty <= 10;
                return (
                  <div key={p.id} className="glass-card p-4 grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                    <div className="col-span-2 flex items-center gap-3">
                      {p.image_url && <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />}
                      <span className="font-medium truncate">{p.name}</span>
                    </div>
                    <span className="text-accent font-bold">₹{p.price}</span>
                    <span className="text-sm text-muted-foreground">{p.category}</span>
                    <span className={`text-sm font-bold px-2 py-1 rounded-lg w-fit ${isOut ? "bg-red-950/30 text-red-400" : isLow ? "bg-orange-950/30 text-orange-400" : "bg-emerald-950/30 text-emerald-400"
                      }`}>
                      {isOut ? "Out" : isLow ? `${qty} ⚠️` : "In Stock"}
                    </span>
                    <button onClick={() => toggleCodForProduct(p)} className="p-1" title="Toggle COD">
                      {(p as any).cod_available !== false ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => openEditProduct(p)} className="p-2 hover:bg-secondary rounded-lg"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => deleteProduct(p.id)} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* INVENTORY MANAGEMENT */}
        {tab === "inventory" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-semibold">Inventory <span className="gold-text">Management</span></h2>
              <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-full text-sm font-medium">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            {/* Stock Summary Stats */}
            {(() => {
              const outP = products.filter((p) => p.stock_quantity === 0);
              const lowP = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 10);
              const inP = products.filter((p) => p.stock_quantity > 10);
              return (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="glass-card p-5 border border-red-800/30">
                    <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
                    <p className="text-2xl font-bold text-red-400">{outP.length}</p>
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                  </div>
                  <div className="glass-card p-5 border border-orange-800/30">
                    <Package className="w-8 h-8 text-orange-400 mb-2" />
                    <p className="text-2xl font-bold text-orange-400">{lowP.length}</p>
                    <p className="text-sm text-muted-foreground">Low Stock (≤10)</p>
                  </div>
                  <div className="glass-card p-5 border border-emerald-800/30">
                    <PackageCheck className="w-8 h-8 text-emerald-400 mb-2" />
                    <p className="text-2xl font-bold text-emerald-400">{inP.length}</p>
                    <p className="text-sm text-muted-foreground">In Stock</p>
                  </div>
                </div>
              );
            })()}

            {/* Low Stock Products */}
            {products.filter((p) => p.stock_quantity <= 10).length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Low Stock Products
                  <span className="text-xs text-muted-foreground font-normal">(Sorted by lowest stock first)</span>
                </h3>
                <div className="space-y-2">
                  {products
                    .filter((p) => p.stock_quantity <= 10)
                    .sort((a, b) => a.stock_quantity - b.stock_quantity)
                    .map((p) => (
                      <InventoryRow key={p.id} product={p} onRestock={async (id, qty) => {
                        const { error } = await supabase.from("products").update({ stock_quantity: qty, in_stock: qty > 0 }).eq("id", id);
                        if (!error) { toast.success(`Restocked ${p.name} to ${qty} units`); loadData(); }
                        else toast.error(error.message);
                      }} />
                    ))}
                </div>
              </div>
            )}

            {/* All Products Stock */}
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <History className="w-5 h-5 text-accent" /> All Products Stock Status
            </h3>
            <div className="space-y-2">
              {products
                .sort((a, b) => a.stock_quantity - b.stock_quantity)
                .map((p) => (
                  <InventoryRow key={p.id} product={p} onRestock={async (id, qty) => {
                    const { error } = await supabase.from("products").update({ stock_quantity: qty, in_stock: qty > 0 }).eq("id", id);
                    if (!error) { toast.success(`Updated stock for ${p.name}`); loadData(); }
                    else toast.error(error.message);
                  }} />
                ))}
              {products.length === 0 && <div className="glass-card p-8 text-center text-muted-foreground">No products found</div>}
            </div>
          </div>
        )}

        {/* ORDERS - Advanced Management */}
        {tab === "orders" && (
          <div>
            <h2 className="font-display text-2xl font-semibold mb-4">Orders Management</h2>
            {/* Status filter tabs with counts */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {["all", ...orderStatusFlow, "cancelled"].map((s) => {
                const count = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
                return (
                  <button key={s} onClick={() => setOrderFilter(s)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${orderFilter === s ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground/70"}`}>
                    {s === "all" ? "All" : statusLabels[s]} ({count})
                  </button>
                );
              })}
            </div>

            {/* Order Stats */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {orderStatusFlow.map((s) => {
                const count = orders.filter(o => o.status === s).length;
                const Icon = statusIcons[s] || Clock;
                return (
                  <div key={s} className="glass-card p-3 text-center">
                    <Icon className="w-5 h-5 mx-auto mb-1 text-accent" />
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{statusLabels[s]}</p>
                  </div>
                );
              })}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="glass-card p-8 text-center text-muted-foreground">No orders</div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((o) => (
                  <AdvancedOrderRow key={o.id} order={o} onStatusChange={updateOrderStatus} onAdvance={advanceOrderStatus} onTrackingUpdate={updateTracking} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* COUPONS */}
        {tab === "coupons" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-semibold">Coupons</h2>
              <button onClick={() => { setEditingCoupon(null); setCouponForm({ code: "", discount_type: "percentage", discount_value: 0, min_order_amount: 0, max_uses: 0, expires_at: "", is_active: true }); setShowCouponModal(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-full font-medium text-sm">
                <Plus className="w-4 h-4" />Create Coupon
              </button>
            </div>
            <div className="space-y-2">
              {coupons.map((c) => (
                <div key={c.id} className="glass-card p-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-bold text-accent">{c.code}</p>
                    <p className="text-sm text-muted-foreground">{c.discount_type === "percentage" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                      {c.min_order_amount ? ` (min ₹${c.min_order_amount})` : ""}</p>
                    {c.expires_at && <p className="text-xs text-muted-foreground">Expires: {new Date(c.expires_at).toLocaleDateString()}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">Used: {c.used_count}{c.max_uses ? `/${c.max_uses}` : ""}</span>
                  <button onClick={() => toggleCoupon(c)} className="p-2">
                    {c.is_active ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => { setEditingCoupon(c); setCouponForm({ code: c.code, discount_type: c.discount_type, discount_value: Number(c.discount_value), min_order_amount: Number(c.min_order_amount || 0), max_uses: c.max_uses || 0, expires_at: c.expires_at || "", is_active: c.is_active }); setShowCouponModal(true); }}
                    className="p-2 hover:bg-secondary rounded-lg"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                  <button onClick={() => deleteCoupon(c.id)} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
                </div>
              ))}
              {coupons.length === 0 && <div className="glass-card p-8 text-center text-muted-foreground">No coupons yet</div>}
            </div>
          </div>
        )}

        {/* BANNERS */}
        {tab === "banners" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-semibold">Offer Banners</h2>
              <label className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-full font-medium text-sm cursor-pointer">
                <Upload className="w-4 h-4" />{bannerUploading ? "Uploading..." : "Upload Banner"}
                <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" disabled={bannerUploading} />
              </label>
            </div>
            <p className="text-muted-foreground text-sm mb-4">Recommended: 1600x400px (4:1 ratio)</p>
            <div className="space-y-3">
              {banners.map((b) => (
                <div key={b.id} className="glass-card p-4 flex items-center gap-4">
                  <img src={b.image_url} alt="Banner" className="w-40 h-10 object-cover rounded-lg" />
                  <div className="flex-1">
                    <span className={`text-xs font-medium ${b.is_active ? "text-primary" : "text-muted-foreground"}`}>
                      {b.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <button onClick={() => toggleBanner(b)} className="p-2">
                    {b.is_active ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => deleteBanner(b.id)} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
                </div>
              ))}
              {banners.length === 0 && <div className="glass-card p-8 text-center text-muted-foreground">No banners yet</div>}
            </div>
          </div>
        )}

        {/* TESTIMONIALS */}
        {tab === "testimonials" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-semibold">Testimonials</h2>
              <button onClick={() => { setEditingTestimonial(null); setTestimonialForm({ customer_name: "", text: "", rating: 5, customer_image_url: "", is_visible: true }); setShowTestimonialModal(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-full font-medium text-sm">
                <Plus className="w-4 h-4" />Add Testimonial
              </button>
            </div>
            <div className="space-y-2">
              {testimonials.map((t) => (
                <div key={t.id} className="glass-card p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{t.customer_name}</p>
                    <p className="text-muted-foreground text-sm truncate">{t.text}</p>
                    <span className="text-xs text-accent">{"⭐".repeat(t.rating)}</span>
                  </div>
                  <button onClick={() => {
                    supabase.from("testimonials").update({ is_visible: !t.is_visible }).eq("id", t.id).then(() => loadData());
                  }} className="p-2">
                    {t.is_visible ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <button onClick={() => { setEditingTestimonial(t); setTestimonialForm({ customer_name: t.customer_name, text: t.text, rating: t.rating, customer_image_url: t.customer_image_url || "", is_visible: t.is_visible }); setShowTestimonialModal(true); }}
                    className="p-2 hover:bg-secondary rounded-lg"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                  <button onClick={() => deleteTestimonial(t.id)} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {tab === "analytics" && (
          <div>
            <h2 className="font-display text-2xl font-semibold mb-6">Analytics</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((s) => (
                <div key={s.label} className="glass-card p-5">
                  <s.icon className={`w-6 h-6 ${s.color} mb-2`} />
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-muted-foreground text-xs">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold">Sales Overview</h3>
                <div className="flex gap-2">
                  {[{ k: "7d", l: "7D" }, { k: "30d", l: "1M" }, { k: "6m", l: "6M" }, { k: "1y", l: "1Y" }, { k: "all", l: "All" }].map((r) => (
                    <button key={r.k} onClick={() => setAnalyticsRange(r.k)}
                      className={`px-3 py-1 rounded-full text-xs ${analyticsRange === r.k ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {r.l}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getAnalyticsData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(var(--accent))" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" name="Sales" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <AdminSettings user={user} />
        )}

        {/* PRODUCT MODAL */}
        {showProductModal && (
          <Modal onClose={() => setShowProductModal(false)} title={`${editingProduct ? "Edit" : "Create"} Product`}>
            <div className="space-y-4">
              <Field label="Product Name" value={productForm.name} onChange={(v) => setProductForm({ ...productForm, name: v })} />
              <Field label="Description" value={productForm.description} onChange={(v) => setProductForm({ ...productForm, description: v })} textarea />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Price (INR)" value={productForm.price} onChange={(v) => setProductForm({ ...productForm, price: Number(v) })} type="number" />
                <Field label="Original Price" value={productForm.original_price} onChange={(v) => setProductForm({ ...productForm, original_price: Number(v) })} type="number" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Category</label>
                <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground">
                  {productCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Field label="Stock Quantity" value={productForm.stock_quantity} onChange={(v) => setProductForm({ ...productForm, stock_quantity: Number(v) })} type="number" />
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={productForm.cod_available} onChange={(e) => setProductForm({ ...productForm, cod_available: e.target.checked })} className="rounded" />
                <label className="text-sm font-medium">Cash on Delivery Available</label>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Tags (max 5)</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {productForm.tags.map((t, i) => (
                    <span key={i} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full flex items-center gap-1">
                      {t} <button onClick={() => setProductForm({ ...productForm, tags: productForm.tags.filter((_, j) => j !== i) })}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                {productForm.tags.length < 5 && (
                  <div className="flex gap-2">
                    <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      className="flex-1 px-4 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
                    <button onClick={addTag} className="px-4 py-2 bg-secondary rounded-xl text-sm">Add</button>
                  </div>
                )}
              </div>
              <Field label="Badge" value={productForm.badge} onChange={(v) => setProductForm({ ...productForm, badge: v })} />
              <Field label="Weight" value={productForm.weight} onChange={(v) => setProductForm({ ...productForm, weight: v })} />
              {/* ── Product Image Upload ── */}
              <div>
                <label className="text-sm font-medium block mb-2">Product Image</label>
                {/* Preview */}
                {productForm.image_url && (
                  <div className="relative mb-3 rounded-xl overflow-hidden border border-border bg-secondary/50">
                    <img src={productForm.image_url} alt="Preview" className="w-full h-40 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = ""; }} />
                    <button type="button" onClick={() => setProductForm({ ...productForm, image_url: "" })}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/80 text-white flex items-center justify-center hover:bg-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {/* Upload Area */}
                {!productForm.image_url && (
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all group">
                    <Upload className="w-8 h-8 text-muted-foreground group-hover:text-accent mb-2 transition-colors" />
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Click to upload or drag image</span>
                    <span className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP — Max 5 MB</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
                      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
                      const fileName = `products/product-${Date.now()}.${ext}`;
                      toast.loading("Uploading image...", { id: "img-upload" });
                      const { error: uploadErr } = await supabase.storage.from("offer-banners").upload(fileName, file, { cacheControl: "3600", upsert: false });
                      if (uploadErr) {
                        toast.error(`Upload failed: ${uploadErr.message}`, { id: "img-upload" });
                        return;
                      }
                      const { data: urlData } = supabase.storage.from("offer-banners").getPublicUrl(fileName);
                      setProductForm({ ...productForm, image_url: urlData.publicUrl });
                      toast.success("Image uploaded!", { id: "img-upload" });
                    }} />
                  </label>
                )}
                {/* OR: paste URL */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground uppercase">or paste URL</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <input
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full mt-2 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <button onClick={handleSaveProduct} className="w-full py-3 bg-accent text-accent-foreground rounded-full font-semibold">
                {editingProduct ? "Update" : "Create"} Product
              </button>
            </div>
          </Modal>
        )}

        {/* COUPON MODAL */}
        {showCouponModal && (
          <Modal onClose={() => setShowCouponModal(false)} title={`${editingCoupon ? "Edit" : "Create"} Coupon`}>
            <div className="space-y-4">
              <Field label="Coupon Code" value={couponForm.code} onChange={(v) => setCouponForm({ ...couponForm, code: v.toUpperCase() })} />
              <div>
                <label className="text-sm font-medium block mb-1">Discount Type</label>
                <select value={couponForm.discount_type} onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground">
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <Field label={couponForm.discount_type === "percentage" ? "Discount %" : "Discount Amount"} value={couponForm.discount_value} onChange={(v) => setCouponForm({ ...couponForm, discount_value: Number(v) })} type="number" />
              <Field label="Min Order Amount" value={couponForm.min_order_amount} onChange={(v) => setCouponForm({ ...couponForm, min_order_amount: Number(v) })} type="number" />
              <Field label="Max Uses (0 = unlimited)" value={couponForm.max_uses} onChange={(v) => setCouponForm({ ...couponForm, max_uses: Number(v) })} type="number" />
              <div>
                <label className="text-sm font-medium block mb-1">Expiration Date</label>
                <input type="date" value={couponForm.expires_at?.split("T")[0] || ""} onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={couponForm.is_active} onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })} className="rounded" />
                <label className="text-sm">Active</label>
              </div>
              <button onClick={handleSaveCoupon} className="w-full py-3 bg-accent text-accent-foreground rounded-full font-semibold">
                {editingCoupon ? "Update" : "Create"} Coupon
              </button>
            </div>
          </Modal>
        )}

        {/* TESTIMONIAL MODAL */}
        {showTestimonialModal && (
          <Modal onClose={() => setShowTestimonialModal(false)} title={`${editingTestimonial ? "Edit" : "Add"} Testimonial`}>
            <div className="space-y-4">
              <Field label="Customer Name" value={testimonialForm.customer_name} onChange={(v) => setTestimonialForm({ ...testimonialForm, customer_name: v })} />
              <Field label="Review Text" value={testimonialForm.text} onChange={(v) => setTestimonialForm({ ...testimonialForm, text: v })} textarea />
              <Field label="Rating (1-5)" value={testimonialForm.rating} onChange={(v) => setTestimonialForm({ ...testimonialForm, rating: Math.min(5, Math.max(1, Number(v))) })} type="number" />
              <Field label="Image URL (Optional)" value={testimonialForm.customer_image_url} onChange={(v) => setTestimonialForm({ ...testimonialForm, customer_image_url: v })} />
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={testimonialForm.is_visible} onChange={(e) => setTestimonialForm({ ...testimonialForm, is_visible: e.target.checked })} className="rounded" />
                <label className="text-sm">Visible on homepage</label>
              </div>
              <button onClick={handleSaveTestimonial} className="w-full py-3 bg-accent text-accent-foreground rounded-full font-semibold">
                {editingTestimonial ? "Update" : "Add"} Testimonial
              </button>
            </div>
          </Modal>
        )}
      </div>
    </main>
  );
};

// Reusable components
const Modal = ({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-display text-xl font-semibold">{title}</h3>
        <button onClick={onClose}><X className="w-5 h-5" /></button>
      </div>
      {children}
    </motion.div>
  </div>
);

const Field = ({ label, value, onChange, type = "text", textarea }: { label: string; value: any; onChange: (v: string) => void; type?: string; textarea?: boolean }) => (
  <div>
    <label className="text-sm font-medium block mb-1">{label}</label>
    {textarea ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
        className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
    ) : (
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
    )}
  </div>
);

// Advanced Order Row with step-by-step management
const AdvancedOrderRow = ({ order, onStatusChange, onAdvance, onTrackingUpdate }: { order: Order; onStatusChange: (id: string, s: string) => void; onAdvance: (order: Order) => void; onTrackingUpdate: (id: string, tn: string, tl: string) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [tn, setTn] = useState(order.tracking_number || "");
  const [tl, setTl] = useState(order.tracking_link || "");
  const items = Array.isArray(order.items) ? order.items as any[] : [];
  const currentIdx = orderStatusFlow.indexOf(order.status);
  const canAdvance = order.status !== "cancelled" && order.status !== "delivered";

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex justify-between items-start gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="font-semibold">#{order.id.slice(0, 8)}</p>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === "delivered" ? "bg-primary/20 text-primary" : order.status === "cancelled" ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent"}`}>
              {statusLabels[order.status]}
            </span>
            <span className="text-accent font-bold">₹{order.total}</span>
            <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
            <span className="text-xs px-2 py-0.5 bg-secondary rounded-full">{order.payment_method === "razorpay" ? "Online" : "COD"}</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 space-y-4">
          {/* Order Progress */}
          {order.status !== "cancelled" && (
            <div className="bg-secondary/30 rounded-xl p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">ORDER PROGRESS</p>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {orderStatusFlow.map((s, i) => {
                  const Icon = statusIcons[s] || Clock;
                  return (
                    <div key={s} className="flex items-center gap-1 flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i <= currentIdx ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs whitespace-nowrap ${i <= currentIdx ? "text-accent font-medium" : "text-muted-foreground"}`}>
                        {statusLabels[s]}
                      </span>
                      {i < orderStatusFlow.length - 1 && <div className={`w-6 h-0.5 ${i < currentIdx ? "bg-accent" : "bg-border"}`} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">ITEMS ({items.length})</p>
            <div className="space-y-2">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 bg-secondary/30 rounded-lg p-2">
                  {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ₹{item.price}</p>
                  </div>
                  <p className="text-sm font-bold text-accent">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Customer & Delivery Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.shipping_address && (
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> DELIVERY ADDRESS</p>
                <p className="text-sm">{order.shipping_address}</p>
              </div>
            )}
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><CreditCard className="w-3 h-3" /> PAYMENT</p>
              <p className="text-sm">{order.payment_method === "razorpay" ? "Online (Razorpay)" : "Cash on Delivery"}</p>
              {order.coupon_code && <p className="text-xs text-primary mt-1">Coupon: {order.coupon_code} (-₹{order.discount_amount})</p>}
              {order.phone && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {order.phone}</p>}
            </div>
          </div>

          {/* Tracking */}
          {order.tracking_number && (
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">TRACKING</p>
              <p className="text-sm font-mono">{order.tracking_number}</p>
              {order.tracking_link && <a href={order.tracking_link} target="_blank" rel="noopener noreferrer" className="text-accent text-xs hover:underline">Track →</a>}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {/* Quick advance button */}
            {canAdvance && (
              <button onClick={() => onAdvance(order)} className="px-4 py-2 bg-accent text-accent-foreground rounded-full text-sm font-medium flex items-center gap-2">
                <Check className="w-4 h-4" />
                Move to: {statusLabels[orderStatusFlow[currentIdx + 1]]}
              </button>
            )}

            {/* Status dropdown */}
            <select value={order.status} onChange={(e) => onStatusChange(order.id, e.target.value)}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm">
              {orderStatusFlow.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Tracking button */}
            <button onClick={() => setShowTracking(!showTracking)} className="px-4 py-2 bg-secondary text-foreground rounded-full text-sm font-medium">
              {showTracking ? "Hide" : "Add"} Tracking
            </button>
          </div>

          {showTracking && (
            <div className="flex gap-2 flex-wrap">
              <input value={tn} onChange={(e) => setTn(e.target.value)} placeholder="Tracking #" className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground min-w-[120px]" />
              <input value={tl} onChange={(e) => setTl(e.target.value)} placeholder="Tracking Link" className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground min-w-[120px]" />
              <button onClick={() => onTrackingUpdate(order.id, tn, tl)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium">Save</button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// Inventory Row – inline restock control
const InventoryRow = ({
  product,
  onRestock,
}: {
  product: Product;
  onRestock: (id: string, qty: number) => Promise<void>;
}) => {
  const qty = product.stock_quantity ?? 0;
  const isOut = qty === 0;
  const isLow = qty > 0 && qty <= 10;
  const [restockQty, setRestockQty] = useState(qty);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onRestock(product.id, restockQty);
    setSaving(false);
  };

  return (
    <div className={`glass-card p-4 flex items-center gap-4 flex-wrap ${isOut ? "border border-red-800/30" : isLow ? "border border-orange-800/30" : ""}`}>
      {product.image_url && (
        <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{product.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Last Updated: {new Date(product.updated_at).toLocaleString()}
        </p>
      </div>
      <span className={`text-sm font-bold px-3 py-1 rounded-full flex-shrink-0 ${isOut ? "bg-red-950/40 text-red-400" : isLow ? "bg-orange-950/40 text-orange-400" : "bg-emerald-950/40 text-emerald-400"}`}>
        {isOut ? "OUT OF STOCK" : isLow ? `Low: ${qty} left` : `In Stock: ${qty}`}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={restockQty}
          onChange={(e) => setRestockQty(Math.max(0, Number(e.target.value)))}
          className="w-20 px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <button
          onClick={save}
          disabled={saving || restockQty === qty}
          className="px-4 py-1.5 bg-accent text-accent-foreground rounded-full text-xs font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Update"}
        </button>
      </div>
    </div>
  );
};

// ─── Admin Settings Panel ────────────────────────────────────────────────────
const ADMIN_EMAIL = "foovafoods@gmail.com";

const AdminSettings = ({ user }: { user: any }) => {
  // Change Password
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Change Email
  const [emailForm, setEmailForm] = useState({ newEmail: "", confirmEmail: "" });
  const [emailLoading, setEmailLoading] = useState(false);

  // Reset link
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleChangePassword = async () => {
    if (!pwForm.newPw || !pwForm.confirm) {
      toast.error("Please fill all fields"); return;
    }
    if (pwForm.newPw.length < 8) {
      toast.error("New password must be at least 8 characters"); return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error("Passwords do not match"); return;
    }
    setPwLoading(true);
    // Re-authenticate first
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user?.email || ADMIN_EMAIL,
      password: pwForm.current,
    });
    if (signInErr) {
      toast.error("Current password is incorrect");
      setPwLoading(false); return;
    }
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    setPwLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("✅ Password changed successfully!");
    setPwForm({ current: "", newPw: "", confirm: "" });
  };

  const handleSendResetLink = async () => {
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(ADMIN_EMAIL, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setResetLoading(false);
    if (error) { toast.error(error.message); return; }
    setResetSent(true);
    toast.success(`✅ Password reset link sent to ${ADMIN_EMAIL}`);
  };

  const handleChangeEmail = async () => {
    if (!emailForm.newEmail || !emailForm.confirmEmail) {
      toast.error("Please fill both email fields"); return;
    }
    if (emailForm.newEmail !== emailForm.confirmEmail) {
      toast.error("Email addresses do not match"); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.newEmail)) {
      toast.error("Please enter a valid email address"); return;
    }
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: emailForm.newEmail });
    setEmailLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`✅ Confirmation sent to ${emailForm.newEmail}. Check your inbox to verify the change.`);
    setEmailForm({ newEmail: "", confirmEmail: "" });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-2xl mx-auto">
      <h2 className="font-display text-2xl font-bold">
        Admin <span className="gold-text">Settings</span>
      </h2>

      {/* Current Account Info */}
      <div className="glass-card p-6 border border-accent/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-semibold">Logged in as Admin</p>
            <p className="text-sm text-muted-foreground">{user?.email || ADMIN_EMAIL}</p>
          </div>
        </div>
      </div>

      {/* ── 1. Change Password ─────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center">
            <Lock className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Change Password</h3>
            <p className="text-xs text-muted-foreground">Update your admin account password</p>
          </div>
        </div>
        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="text-sm font-medium block mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={pwForm.current}
                onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                placeholder="Enter your current password"
                className="w-full px-4 py-2.5 pr-12 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {/* New Password */}
          <div>
            <label className="text-sm font-medium block mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={pwForm.newPw}
                onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-2.5 pr-12 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Strength indicator */}
            {pwForm.newPw && (
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${pwForm.newPw.length >= i * 3
                    ? i <= 1 ? "bg-red-500" : i <= 2 ? "bg-orange-500" : i <= 3 ? "bg-yellow-500" : "bg-emerald-500"
                    : "bg-secondary"
                    }`} />
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  {pwForm.newPw.length < 4 ? "Weak" : pwForm.newPw.length < 8 ? "Fair" : pwForm.newPw.length < 12 ? "Good" : "Strong"}
                </span>
              </div>
            )}
          </div>
          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium block mb-1">Confirm New Password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              placeholder="Re-enter new password"
              className={`w-full px-4 py-2.5 rounded-xl bg-secondary border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 ${pwForm.confirm && pwForm.newPw !== pwForm.confirm
                ? "border-red-500 focus:ring-red-500/50"
                : pwForm.confirm && pwForm.newPw === pwForm.confirm
                  ? "border-emerald-500 focus:ring-emerald-500/50"
                  : "border-border"
                }`}
            />
            {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>
          <button
            onClick={handleChangePassword}
            disabled={pwLoading || !pwForm.current || !pwForm.newPw || !pwForm.confirm}
            className="w-full py-3 bg-accent text-accent-foreground font-semibold rounded-full flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-[0_0_20px_hsl(43_85%_55%/0.3)]"
          >
            <KeyRound className="w-4 h-4" />
            {pwLoading ? "Updating Password..." : "Update Password"}
          </button>
        </div>
      </div>

      {/* ── 2. Forgot / Reset Password by Email ───────────────────────── */}
      <div className="glass-card p-6 border border-orange-800/30 bg-orange-950/5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-full bg-orange-500/15 flex items-center justify-center">
            <Send className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Forgot Password?</h3>
            <p className="text-xs text-muted-foreground">
              Send a password reset link to <span className="text-accent font-medium">{ADMIN_EMAIL}</span>
            </p>
          </div>
        </div>

        <div className="bg-secondary/50 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
          <Mail className="w-4 h-4 text-accent flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Reset link will be sent to:</p>
            <p className="font-semibold text-sm">{ADMIN_EMAIL}</p>
          </div>
        </div>

        {resetSent ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-950/30 border border-emerald-700/40 rounded-xl">
            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-emerald-400 font-semibold text-sm">Reset link sent!</p>
              <p className="text-xs text-muted-foreground">
                Check <span className="text-accent">{ADMIN_EMAIL}</span> for the password reset email.
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSendResetLink}
            disabled={resetLoading}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-full flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-orange-400 transition-colors"
          >
            <Send className="w-4 h-4" />
            {resetLoading ? "Sending..." : `Send Reset Link to ${ADMIN_EMAIL}`}
          </button>
        )}
      </div>

      {/* ── 3. Change Admin Email ──────────────────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
            <Mail className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Change Admin Email</h3>
            <p className="text-xs text-muted-foreground">A confirmation will be sent to the new email address</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-secondary/50 rounded-xl px-4 py-3 mb-2">
            <p className="text-xs text-muted-foreground">Current email:</p>
            <p className="font-semibold text-sm">{user?.email || "—"}</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">New Email Address</label>
            <input
              type="email"
              value={emailForm.newEmail}
              onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
              placeholder="e.g. foovafoods@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Confirm New Email</label>
            <input
              type="email"
              value={emailForm.confirmEmail}
              onChange={(e) => setEmailForm({ ...emailForm, confirmEmail: e.target.value })}
              placeholder="Re-enter new email"
              className={`w-full px-4 py-2.5 rounded-xl bg-secondary border text-foreground focus:outline-none focus:ring-2 ${emailForm.confirmEmail && emailForm.newEmail !== emailForm.confirmEmail
                ? "border-red-500 focus:ring-red-500/50"
                : emailForm.confirmEmail && emailForm.newEmail === emailForm.confirmEmail
                  ? "border-emerald-500 focus:ring-emerald-500/50"
                  : "border-border focus:ring-accent/50"
                }`}
            />
            {emailForm.confirmEmail && emailForm.newEmail !== emailForm.confirmEmail && (
              <p className="text-xs text-red-400 mt-1">Email addresses do not match</p>
            )}
          </div>
          <div className="bg-accent/5 border border-accent/20 rounded-xl px-4 py-3 text-xs text-muted-foreground">
            ⚠️ After submitting, a confirmation link will be sent to the <strong>new email</strong>. Click it to complete the change.
          </div>
          <button
            onClick={handleChangeEmail}
            disabled={emailLoading || !emailForm.newEmail || !emailForm.confirmEmail}
            className="w-full py-3 bg-accent text-accent-foreground font-semibold rounded-full flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_20px_hsl(43_85%_55%/0.3)] transition-all"
          >
            <Mail className="w-4 h-4" />
            {emailLoading ? "Updating Email..." : "Update Admin Email"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;

