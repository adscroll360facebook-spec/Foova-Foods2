
-- ============================================
-- Phase 2: Full Schema Migration
-- ============================================

-- 2A. Coupons Table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2B. Testimonials Table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_image_url TEXT,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible testimonials" ON public.testimonials
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Admins can manage testimonials" ON public.testimonials
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2C. Products Table Updates
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2D. Orders Table Updates
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_link TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC NOT NULL DEFAULT 0;

-- 2E. Payment Settings Table
CREATE TABLE public.payment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  key_id TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_test_mode BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment settings" ON public.payment_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default razorpay row
INSERT INTO public.payment_settings (provider) VALUES ('razorpay');

-- 2F. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- 2G. Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('testimonial-images', 'testimonial-images', true);

-- Storage RLS: public read
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Public can view testimonial images" ON storage.objects
  FOR SELECT USING (bucket_id = 'testimonial-images');

-- Storage RLS: admin upload
CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload testimonial images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'testimonial-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update testimonial images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'testimonial-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete testimonial images" ON storage.objects
  FOR DELETE USING (bucket_id = 'testimonial-images' AND public.has_role(auth.uid(), 'admin'));
