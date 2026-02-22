
-- Reviews table for product reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  text text NOT NULL,
  reviewer_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all reviews" ON public.reviews FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Addresses table
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  pincode text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  locality text,
  address text NOT NULL,
  landmark text,
  alternate_phone text,
  address_type text NOT NULL DEFAULT 'home',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all addresses" ON public.addresses FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Offer banners table
CREATE TABLE public.offer_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text,
  link text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners" ON public.offer_banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage banners" ON public.offer_banners FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_offer_banners_updated_at BEFORE UPDATE ON public.offer_banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add tags column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create offer-banners storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('offer-banners', 'offer-banners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view offer banner images" ON storage.objects FOR SELECT USING (bucket_id = 'offer-banners');
CREATE POLICY "Admins can upload offer banner images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'offer-banners' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete offer banner images" ON storage.objects FOR DELETE USING (bucket_id = 'offer-banners' AND has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
