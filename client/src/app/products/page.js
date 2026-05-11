"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiChevronRight,
  FiAlertCircle,
  FiSearch,
  FiSliders,
} from "react-icons/fi";
import { ClientOnly } from "@/components/client-only";
import { toast } from "sonner";
import ProductCard from "@/components/ProducCard";

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="aspect-square w-full bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-16 bg-gray-100 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="h-5 w-20 bg-gray-100 rounded" />
        <div className="h-9 w-full bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

function FilterSection({ title, isOpen, onToggle, children, count }) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="flex items-center justify-between w-full px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {count > 0 && (
            <span className="text-[10px] bg-trayalife-500 text-white px-1.5 py-0.5 rounded-full font-bold">
              {count}
            </span>
          )}
        </div>
        {isOpen ? (
          <FiChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-3">{children}</div>
      </div>
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const decodePlus = (str) => (str ? str.replace(/\+/g, " ") : "");
  const searchQuery = decodePlus(searchParams.get("search") || "");
  const categorySlug = searchParams.get("category") || "";
  const productType = searchParams.get("productType") || "";
  const colorId = searchParams.get("color") || "";
  const sizeId = searchParams.get("size") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sortParam = searchParams.get("sort") || "createdAt";
  const orderParam = searchParams.get("order") || "desc";

  const getInitialActiveSection = () => {
    if (searchQuery) return "search";
    if (categorySlug) return "categories";
    if (colorId) return "colors";
    if (sizeId) return "sizes";
    return "categories";
  };

  const [openSections, setOpenSections] = useState({
    search: false,
    categories: true,
    price: true,
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [allAttributes, setAllAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedColors, setSelectedColors] = useState(colorId ? [colorId] : []);
  const [selectedSizes, setSelectedSizes] = useState(sizeId ? [sizeId] : []);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [maxPossiblePrice, setMaxPossiblePrice] = useState(5000);

  const [filters, setFilters] = useState({
    search: searchQuery,
    category: categorySlug,
    productType: productType,
    color: colorId,
    size: sizeId,
    minPrice: minPrice,
    maxPrice: maxPrice,
    sort: sortParam,
    order: orderParam,
  });

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [priceRange, setPriceRange] = useState([
    Number(minPrice) || 0,
    Number(maxPrice) || 5000,
  ]);

  useEffect(() => {
    setSearchInput(filters.search || "");
  }, [filters.search]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    const newFiltersFromURL = {
      search: searchQuery,
      category: categorySlug,
      productType: productType,
      color: colorId,
      size: sizeId,
      minPrice: minPrice,
      maxPrice: maxPrice,
      sort: sortParam,
      order: orderParam,
    };

    const isSame =
      filters.search === newFiltersFromURL.search &&
      filters.category === newFiltersFromURL.category &&
      filters.productType === newFiltersFromURL.productType &&
      filters.color === newFiltersFromURL.color &&
      filters.size === newFiltersFromURL.size &&
      String(filters.minPrice || "") === String(newFiltersFromURL.minPrice || "") &&
      String(filters.maxPrice || "") === String(newFiltersFromURL.maxPrice || "") &&
      filters.sort === newFiltersFromURL.sort &&
      filters.order === newFiltersFromURL.order;

    if (!isSame) {
      setFilters(newFiltersFromURL);
      setSelectedColors(colorId ? [colorId] : []);
      setSelectedSizes(sizeId ? [sizeId] : []);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, categorySlug, productType, colorId, sizeId, minPrice, maxPrice, sortParam, orderParam]);

  const updateURL = (newFilters) => {
    const pairs = [];
    const add = (k, v) => {
      if (v !== undefined && v !== null && v !== "") {
        const key = encodeURIComponent(k);
        const val = encodeURIComponent(String(v)).replace(/%20/g, "+");
        pairs.push(`${key}=${val}`);
      }
    };
    add("search", newFilters.search);
    add("category", newFilters.category);
    add("productType", newFilters.productType);
    add("color", newFilters.color);
    add("size", newFilters.size);
    add("minPrice", newFilters.minPrice);
    add("maxPrice", newFilters.maxPrice);
    if (newFilters.sort !== "createdAt" || newFilters.order !== "desc") {
      add("sort", newFilters.sort);
      add("order", newFilters.order);
    }
    const qs = pairs.join("&");
    router.push(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let response;

        if (filters.productType) {
          const queryParams = new URLSearchParams();
          queryParams.append("limit", String(pagination.limit * pagination.page));
          response = await fetchApi(`/public/products/type/${filters.productType}?${queryParams.toString()}`);
          const allProducts = response.data?.products || [];
          const startIndex = (pagination.page - 1) * pagination.limit;
          const paginatedProducts = allProducts.slice(startIndex, startIndex + pagination.limit);
          setProducts(paginatedProducts);
          setPagination({
            page: pagination.page,
            limit: pagination.limit,
            total: allProducts.length,
            pages: Math.ceil(allProducts.length / pagination.limit),
          });
        } else {
          const queryParams = new URLSearchParams();
          queryParams.append("page", String(pagination.page));
          queryParams.append("limit", String(pagination.limit));

          const validSortFields = ["createdAt", "updatedAt", "name", "featured"];
          let sortField = filters.sort;
          if (!validSortFields.includes(sortField)) sortField = "createdAt";
          queryParams.append("sort", sortField);
          queryParams.append("order", filters.order);

          if (filters.search) queryParams.append("search", filters.search);
          if (filters.category) queryParams.append("category", filters.category);
          if (filters.minPrice) queryParams.append("minPrice", filters.minPrice);
          if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice);

          const allSelectedAttributeValueIds = new Set();
          if (selectedColors.length > 0) {
            queryParams.append("color", selectedColors[0]);
            selectedColors.forEach((id) => allSelectedAttributeValueIds.add(id));
          }
          if (selectedSizes.length > 0) {
            queryParams.append("size", selectedSizes[0]);
            selectedSizes.forEach((id) => allSelectedAttributeValueIds.add(id));
          }
          Object.keys(selectedAttributes).forEach((attrKey) => {
            if (attrKey !== "color" && attrKey !== "size") {
              const selectedValues = selectedAttributes[attrKey] || [];
              if (selectedValues.length > 0) {
                selectedValues.forEach((id) => allSelectedAttributeValueIds.add(id));
              }
            }
          });
          if (allSelectedAttributeValueIds.size > 0) {
            queryParams.append("attributeValueIds", Array.from(allSelectedAttributeValueIds).join(","));
          }

          response = await fetchApi(`/public/products?${queryParams.toString()}`);
          setProducts(response.data.products || []);
          setPagination(response.data.pagination || {});
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters, pagination.page, pagination.limit, selectedColors, selectedSizes, selectedAttributes]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [categoriesRes, filterAttrsRes] = await Promise.all([
          fetchApi("/public/categories"),
          fetchApi("/public/filter-attributes"),
        ]);
        setCategories(categoriesRes.data.categories || []);
        setColors(filterAttrsRes.data.colors || []);
        setSizes(filterAttrsRes.data.sizes || []);
        if (filterAttrsRes.data.attributes && Array.isArray(filterAttrsRes.data.attributes)) {
          setAllAttributes(filterAttrsRes.data.attributes);
          const initialSections = {};
          filterAttrsRes.data.attributes.forEach((attr) => {
            initialSections[attr.name.toLowerCase() + "s"] = false;
          });
          setOpenSections((prev) => ({ ...prev, ...initialSections }));
        } else {
          const attrs = [];
          if (filterAttrsRes.data.colors?.length > 0) {
            attrs.push({ id: "color-attr", name: "Color", inputType: "select", values: filterAttrsRes.data.colors });
          }
          if (filterAttrsRes.data.sizes?.length > 0) {
            attrs.push({ id: "size-attr", name: "Size", inputType: "select", values: filterAttrsRes.data.sizes });
          }
          setAllAttributes(attrs);
        }
      } catch (err) {
        console.error("Error fetching filter options:", err);
      }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const fetchMaxPrice = async () => {
      try {
        const response = await fetchApi("/public/products/max-price");
        const max = response.data.maxPrice || 5000;
        const rounded = Math.ceil(max / 100) * 100;
        setMaxPossiblePrice(rounded);
        setPriceRange([0, rounded]);
      } catch {
        setMaxPossiblePrice(5000);
      }
    };
    fetchMaxPrice();
  }, []);

  useEffect(() => {
    if (error) toast.error("Error loading products. Please try again.");
  }, [error]);

  useEffect(() => {
    let raf1 = 0, raf2 = 0, timeoutId = 0;
    const doScroll = () => {
      const el = document.getElementById("products-main");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    };
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => { timeoutId = window.setTimeout(doScroll, 80); });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); clearTimeout(timeoutId); };
  }, [pagination.page]);

  const handleFilterChange = (name, value) => {
    if ((name === "minPrice" || name === "maxPrice") && value !== "") {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;
      value = numValue.toString();
    }
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    updateURL(newFilters);
    if (pagination.page !== 1) setPagination((prev) => ({ ...prev, page: 1 }));
    if (mobileFiltersOpen && window.innerWidth < 768 && name !== "minPrice" && name !== "maxPrice" && name !== "search") {
      setMobileFiltersOpen(false);
    }
  };

  const handleAttributeValueChange = (attributeName, attributeValueId) => {
    const attrKey = attributeName.toLowerCase();
    const currentSelected = selectedAttributes[attrKey] || [];
    const isAlreadySelected = currentSelected.includes(attributeValueId);
    const updatedSelected = isAlreadySelected
      ? currentSelected.filter((id) => id !== attributeValueId)
      : [attributeValueId];

    setSelectedAttributes((prev) => ({ ...prev, [attrKey]: updatedSelected }));
    if (attrKey === "color") {
      setSelectedColors(updatedSelected);
      handleFilterChange("color", updatedSelected.length > 0 ? updatedSelected[0] : "");
    } else if (attrKey === "size") {
      setSelectedSizes(updatedSelected);
      handleFilterChange("size", updatedSelected.length > 0 ? updatedSelected[0] : "");
    }
  };

  const clearFilters = () => {
    const cleared = { search: "", category: "", productType: "", color: "", size: "", minPrice: "", maxPrice: "", sort: "createdAt", order: "desc" };
    setFilters(cleared);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedAttributes({});
    setPriceRange([0, maxPossiblePrice]);
    updateURL(cleared);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    let newSort = "createdAt", newOrder = "desc";
    if (value === "oldest") { newSort = "createdAt"; newOrder = "asc"; }
    else if (value === "price-low") { newSort = "createdAt"; newOrder = "asc"; }
    else if (value === "price-high") { newSort = "createdAt"; newOrder = "desc"; }
    else if (value === "name-asc") { newSort = "name"; newOrder = "asc"; }
    else if (value === "name-desc") { newSort = "name"; newOrder = "desc"; }
    const newFilters = { ...filters, sort: newSort, order: newOrder };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeFilterCount = [
    filters.search,
    filters.category,
    ...selectedColors,
    ...selectedSizes,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  const currentSortValue =
    filters.sort === "createdAt" && filters.order === "desc" ? "newest" :
    filters.sort === "createdAt" && filters.order === "asc" ? "oldest" :
    filters.sort === "name" && filters.order === "asc" ? "name-asc" :
    filters.sort === "name" && filters.order === "desc" ? "name-desc" : "newest";

  const FilterSidebar = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-28">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <FiSliders className="h-4 w-4 text-trayalife-500" />
          <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Filter</span>
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-trayalife-500 font-semibold hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <FilterSection
        title="Search"
        isOpen={openSections.search}
        onToggle={() => toggleSection("search")}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); handleFilterChange("search", searchInput); }}
          className="relative mt-1"
        >
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-trayalife-500 focus:ring-1 focus:ring-trayalife-500 transition-colors"
          />
        </form>
      </FilterSection>

      {/* Categories */}
      <FilterSection
        title="Category"
        isOpen={openSections.categories}
        onToggle={() => toggleSection("categories")}
        count={filters.category ? 1 : 0}
      >
        <div className="space-y-0.5 max-h-56 overflow-y-auto mt-1">
          {categories.map((category) => (
            <div key={category.id}>
              <button
                className={`flex items-center justify-between w-full px-2 py-2 rounded-lg text-sm transition-colors text-left ${
                  filters.category === category.slug
                    ? "bg-trayalife-50 text-trayalife-500 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                }`}
                onClick={() => handleFilterChange("category", filters.category === category.slug ? "" : category.slug)}
              >
                <div className="flex items-center gap-2">
                  <FiChevronRight className={`h-3 w-3 transition-transform ${filters.category === category.slug ? "rotate-90 text-trayalife-500" : "text-gray-300"}`} />
                  <span>{category.name}</span>
                </div>
                {category._count?.products !== undefined && (
                  <span className="text-xs text-gray-400">{category._count.products}</span>
                )}
              </button>
              {category.children?.length > 0 && (
                <div className="ml-5 space-y-0.5">
                  {category.children.map((child) => (
                    <button
                      key={child.id}
                      className={`flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${
                        filters.category === child.slug
                          ? "text-trayalife-500 font-semibold"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => handleFilterChange("category", filters.category === child.slug ? "" : child.slug)}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Dynamic Attributes */}
      {allAttributes.map((attribute, attrIndex) => {
        const attrKey = attribute.name.toLowerCase();
        const sectionKey = `${attrKey}s`;
        const isOpen = openSections[sectionKey] || false;
        const displaySelectedValues =
          attrKey === "color" ? selectedColors :
          attrKey === "size" ? selectedSizes :
          selectedAttributes[attrKey] || [];

        return (
          <FilterSection
            key={attribute.id}
            title={attribute.name}
            isOpen={isOpen}
            onToggle={() => toggleSection(sectionKey)}
            count={displaySelectedValues.length}
          >
            <div className="space-y-0.5 max-h-56 overflow-y-auto mt-1">
              {attrKey === "color" && attribute.values.length > 0 ? (
                /* Color swatches */
                <div className="flex flex-wrap gap-2 py-1">
                  {attribute.values.map((value) => (
                    <button
                      key={value.id}
                      title={value.name}
                      onClick={() => handleAttributeValueChange(attribute.name, value.id)}
                      className={`relative w-7 h-7 rounded-full border-2 transition-all ${
                        displaySelectedValues.includes(value.id)
                          ? "border-trayalife-500 scale-110 shadow-md"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                      style={value.hexCode ? { backgroundColor: value.hexCode } : {}}
                    >
                      {!value.hexCode && value.image && (
                        <Image src={value.image} alt={value.name} fill className="rounded-full object-cover" />
                      )}
                      {!value.hexCode && !value.image && (
                        <span className="text-[9px] font-bold text-gray-600 absolute inset-0 flex items-center justify-center">
                          {value.name.slice(0, 2)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                attribute.values.map((value) => {
                  const isSelected = displaySelectedValues.includes(value.id);
                  return (
                    <button
                      key={value.id}
                      className={`flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm transition-colors text-left ${
                        isSelected
                          ? "bg-trayalife-50 text-trayalife-600 font-semibold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        attrKey === "size"
                          ? handleAttributeValueChange(attribute.name, value.id)
                          : handleAttributeValueChange(attribute.name, value.id)
                      }
                    >
                      <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        isSelected ? "bg-trayalife-500 border-trayalife-500" : "border-gray-300"
                      }`}>
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span>{value.display || value.name}</span>
                      {value.productCount !== undefined && (
                        <span className="ml-auto text-xs text-gray-400">{value.productCount}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </FilterSection>
        );
      })}

      {/* Price Range */}
      <FilterSection
        title="Price"
        isOpen={openSections.price}
        onToggle={() => toggleSection("price")}
        count={(filters.minPrice || filters.maxPrice) ? 1 : 0}
      >
        <div className="mt-2 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Min (₹)</label>
              <input
                type="number"
                min={0}
                max={priceRange[1]}
                value={priceRange[0]}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPriceRange([val, priceRange[1]]);
                }}
                onBlur={() => handleFilterChange("minPrice", priceRange[0] > 0 ? String(priceRange[0]) : "")}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-trayalife-500 focus:ring-1 focus:ring-trayalife-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Max (₹)</label>
              <input
                type="number"
                min={priceRange[0]}
                max={maxPossiblePrice}
                value={priceRange[1]}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPriceRange([priceRange[0], val]);
                }}
                onBlur={() => handleFilterChange("maxPrice", priceRange[1] < maxPossiblePrice ? String(priceRange[1]) : "")}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-trayalife-500 focus:ring-1 focus:ring-trayalife-500"
              />
            </div>
          </div>
          {(filters.minPrice || filters.maxPrice) && (
            <button
              onClick={() => { setPriceRange([0, maxPossiblePrice]); handleFilterChange("minPrice", ""); handleFilterChange("maxPrice", ""); }}
              className="text-xs text-trayalife-500 hover:underline"
            >
              Clear price filter
            </button>
          )}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <div id="products-main">
      {/* Page title bar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {filters.category
              ? (categories.find((c) => c.slug === filters.category)?.name || "Products")
              : filters.search
              ? `Search: "${filters.search}"`
              : filters.productType === "new"
              ? "New Arrivals"
              : "All Products"}
            {!loading && pagination.total > 0 && (
              <span className="ml-2 text-base font-normal text-gray-400">
                — ({pagination.total} Products)
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Mobile filter button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="md:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FiFilter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-trayalife-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Sort By:</span>
            <select
              className="text-sm text-gray-700 font-medium focus:outline-none bg-transparent cursor-pointer"
              onChange={handleSortChange}
              disabled={loading}
              value={currentSortValue}
            >
              <option value="newest">Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">A – Z</option>
              <option value="name-desc">Z – A</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {filters.search && (
            <span className="inline-flex items-center gap-1 bg-trayalife-50 text-trayalife-600 text-xs font-medium px-3 py-1.5 rounded-full border border-trayalife-100">
              Search: {filters.search}
              <button onClick={() => handleFilterChange("search", "")} className="ml-0.5 hover:text-red-500">
                <FiX className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center gap-1 bg-trayalife-50 text-trayalife-600 text-xs font-medium px-3 py-1.5 rounded-full border border-trayalife-100">
              {categories.find((c) => c.slug === filters.category)?.name || filters.category}
              <button onClick={() => handleFilterChange("category", "")} className="ml-0.5 hover:text-red-500">
                <FiX className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedColors.length > 0 && (
            <span className="inline-flex items-center gap-1 bg-trayalife-50 text-trayalife-600 text-xs font-medium px-3 py-1.5 rounded-full border border-trayalife-100">
              Color: {colors.find((c) => c.id === selectedColors[0])?.name || selectedColors[0]}
              <button onClick={() => { setSelectedColors([]); handleFilterChange("color", ""); }} className="ml-0.5 hover:text-red-500">
                <FiX className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedSizes.length > 0 && (
            <span className="inline-flex items-center gap-1 bg-trayalife-50 text-trayalife-600 text-xs font-medium px-3 py-1.5 rounded-full border border-trayalife-100">
              Size: {sizes.find((s) => s.id === selectedSizes[0])?.display || sizes.find((s) => s.id === selectedSizes[0])?.name || selectedSizes[0]}
              <button onClick={() => { setSelectedSizes([]); handleFilterChange("size", ""); }} className="ml-0.5 hover:text-red-500">
                <FiX className="h-3 w-3" />
              </button>
            </span>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <span className="inline-flex items-center gap-1 bg-trayalife-50 text-trayalife-600 text-xs font-medium px-3 py-1.5 rounded-full border border-trayalife-100">
              ₹{filters.minPrice || "0"} – ₹{filters.maxPrice || "∞"}
              <button onClick={() => { handleFilterChange("minPrice", ""); handleFilterChange("maxPrice", ""); }} className="ml-0.5 hover:text-red-500">
                <FiX className="h-3 w-3" />
              </button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-500 underline transition-colors">
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-56 lg:w-60 flex-shrink-0">
          <FilterSidebar />
        </aside>

        {/* Products Area */}
        <div className="flex-1 min-w-0">
          {/* Loading indicator overlay */}
          {loading && products.length > 0 && (
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
              <div className="w-3.5 h-3.5 border-2 border-trayalife-500 border-t-transparent rounded-full animate-spin" />
              Updating results…
            </div>
          )}

          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {[...Array(20)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FiAlertCircle className="h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-lg font-semibold text-gray-700 mb-2">No products found</h2>
              <p className="text-sm text-gray-400 mb-6 max-w-xs">
                Try adjusting your filters or search term to find what you&apos;re looking for.
              </p>
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 bg-trayalife-500 hover:bg-trayalife-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-1.5 mt-10 mb-4">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronRight className="h-4 w-4 rotate-180" />
                  </button>

                  {[...Array(pagination.pages)].map((_, i) => {
                    const page = i + 1;
                    const isActive = pagination.page === page;
                    const show =
                      page === 1 ||
                      page === pagination.pages ||
                      (page >= pagination.page - 1 && page <= pagination.page + 1);

                    if (!show) {
                      if (
                        (page === 2 && pagination.page > 3) ||
                        (page === pagination.pages - 1 && pagination.page < pagination.pages - 2)
                      ) {
                        return (
                          <span key={page} className="w-9 h-9 flex items-center justify-center text-sm text-gray-400">
                            …
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={loading}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-trayalife-500 text-white shadow-sm"
                            : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages || loading}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[70] flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative ml-auto w-[85%] max-w-xs h-full bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <FiSliders className="h-4 w-4 text-trayalife-500" />
                <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Filter</span>
              </div>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FilterSidebar />
            </div>
            <div className="px-4 py-4 border-t border-gray-100 bg-white">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 bg-trayalife-500 hover:bg-trayalife-600 text-white font-semibold text-sm rounded-xl transition-colors"
              >
                Show {pagination.total || 0} Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-6 pb-8">
      <ClientOnly
        fallback={
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-trayalife-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-trayalife-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <ProductsContent />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
