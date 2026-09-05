import { useMemo, useState } from "react";

function ProductSearch({ search, setSearch, products = [], filteredProducts = [], addProduct }) {
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem("pos_catalog_view") || "grid";
    } catch {
      return "grid";
    }
  });
  const [selectedCategory, setSelectedCategory] = useState("All");

  function handleViewModeChange(mode) {
    setViewMode(mode);
    try {
      localStorage.setItem("pos_catalog_view", mode);
    } catch (e) {
      console.warn("Could not persist view mode:", e);
    }
  }

  // Extract unique categories from products
  const categories = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      const cat = (p.category || "").trim() || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const uniqueCats = Object.keys(counts).sort();
    return [
      { name: "All", count: products.length },
      ...uniqueCats.map((c) => ({ name: c, count: counts[c] })),
    ];
  }, [products]);

  // Filter products by selected category
  const displayedProducts = useMemo(() => {
    if (selectedCategory === "All") {
      return filteredProducts;
    }
    return filteredProducts.filter((p) => {
      const cat = (p.category || "").trim() || "General";
      return cat.toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [filteredProducts, selectedCategory]);

  return (
    <section className="flex min-w-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Search Header */}
      <div className="border-b border-slate-200 p-3.5 space-y-3 bg-white">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔍
            </span>
            <input
              id="product-search-input"
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && displayedProducts.length > 0) {
                  addProduct(displayedProducts[0]);
                  setSearch("");
                }
              }}
              type="text"
              placeholder="Search product by name, barcode, or SKU... (Enter to quick-add)"
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-9 pr-20 py-2 text-xs outline-none focus:border-slate-500 focus:bg-white transition-all font-medium"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 px-1"
              >
                ✕
              </button>
            ) : (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                F2
              </span>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => handleViewModeChange("grid")}
              title="Grid / Tiles view"
              className={`rounded-md px-2.5 py-1.5 transition-all flex items-center gap-1 text-[11px] ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 font-semibold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>⊞</span>
              <span className="hidden sm:inline">Tiles</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("list")}
              title="List view"
              className={`rounded-md px-2.5 py-1.5 transition-all flex items-center gap-1 text-[11px] ${
                viewMode === "list"
                  ? "bg-white text-slate-900 font-semibold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>☰</span>
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar text-xs">
            {categories.map((cat) => {
              const active = selectedCategory.toLowerCase() === cat.name.toLowerCase();
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] transition-all flex items-center gap-1.5 ${
                    active
                      ? "bg-slate-900 text-white font-semibold shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] ${
                      active ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Catalog Display */}
      <div className="flex-1 overflow-y-auto p-3.5 bg-slate-50/40">
        {displayedProducts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-10 text-center">
            <span className="text-3xl text-slate-300">🔍</span>
            <p className="mt-2 text-xs font-semibold text-slate-600">No products found</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Try searching with a different term or clear the category filter.
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-3 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                Clear search
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* RESPONSIVE GRID TILES: 2 cols on laptop, 3-4 cols on wide screen */
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {displayedProducts.map((product) => {
              const isTracked = product.trackStock !== false;
              const stock = Number(product.stockQuantity || 0);
              const threshold = Number(product.lowStockAlert || 5);
              const isOut = isTracked && stock <= 0;
              const isLow = isTracked && stock > 0 && stock <= threshold;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProduct(product)}
                  className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 text-left shadow-2xs transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
                >
                  {/* Top: Name & Category */}
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-semibold text-xs text-slate-900 line-clamp-2 leading-snug group-hover:text-slate-950">
                        {product.name}
                      </p>
                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        {product.unit}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>{product.category || "General"}</span>
                      {product.barcode && <span>• {product.barcode}</span>}
                    </div>
                  </div>

                  {/* Bottom: Stock Status & Price */}
                  <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-2">
                    <div>
                      {isTracked ? (
                        <span
                          className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                            isOut
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : isLow
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isOut ? "Out of stock" : isLow ? `Low: ${stock}` : `Stock: ${stock}`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Unlimited</span>
                      )}
                    </div>

                    <div className="text-right">
                      {product.mrp !== null && Number(product.mrp) > Number(product.sellingPrice) && (
                        <p className="text-[9px] text-slate-400 line-through leading-none">
                          MRP ₹{Number(product.mrp).toFixed(2)}
                        </p>
                      )}
                      <p className="font-extrabold text-sm text-slate-900 leading-tight">
                        ₹{Number(product.sellingPrice).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* HIGH-DENSITY LIST VIEW */
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px]">
                <tr>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-center">Stock</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedProducts.map((product) => {
                  const isTracked = product.trackStock !== false;
                  const stock = Number(product.stockQuantity || 0);
                  const threshold = Number(product.lowStockAlert || 5);
                  const isOut = isTracked && stock <= 0;
                  const isLow = isTracked && stock > 0 && stock <= threshold;

                  return (
                    <tr
                      key={product.id}
                      onClick={() => addProduct(product)}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-3 py-2 font-medium text-slate-900">
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {product.unit} {product.barcode ? `• Barcode: ${product.barcode}` : ""}
                        </p>
                      </td>

                      <td className="px-3 py-2 text-slate-600 text-[11px]">
                        {product.category || "General"}
                      </td>

                      <td className="px-3 py-2 text-center">
                        {isTracked ? (
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                              isOut
                                ? "bg-red-50 text-red-700"
                                : isLow
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-emerald-50 text-emerald-800"
                            }`}
                          >
                            {stock} {product.unit}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>

                      <td className="px-3 py-2 text-right">
                        {product.mrp !== null && Number(product.mrp) > Number(product.sellingPrice) && (
                          <span className="mr-1 text-[10px] text-slate-400 line-through">
                            ₹{Number(product.mrp).toFixed(2)}
                          </span>
                        )}
                        <span className="font-bold text-slate-900">
                          ₹{Number(product.sellingPrice).toFixed(2)}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          className="rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors"
                        >
                          + Add
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductSearch;
