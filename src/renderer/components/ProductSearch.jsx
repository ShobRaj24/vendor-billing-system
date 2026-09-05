function ProductSearch({ search, setSearch, filteredProducts, addProduct }) {
  return (
    <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="border-b border-slate-200 p-4">
        <input
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && filteredProducts.length > 0) {
              addProduct(filteredProducts[0]);
            }
          }}
          type="text"
          placeholder="Search product by name, barcode, or SKU..."
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-xs outline-none focus:border-slate-500"
        />
      </div>

      <div className="flex-1 overflow-auto p-4">
        {filteredProducts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-xs text-slate-500">
            No products found.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => {
              const isTracked = product.trackStock !== false;
              const stock = Number(product.stockQuantity || 0);
              const threshold = Number(product.lowStockAlert || 5);
              const isOut = isTracked && stock <= 0;
              const isLow = isTracked && stock > 0 && stock <= threshold;

              return (
                <button
                  key={product.id}
                  onClick={() => addProduct(product)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3.5 text-left transition-all hover:border-slate-300 hover:bg-slate-50/70"
                >
                  <div>
                    <p className="font-semibold text-xs text-slate-900">{product.name}</p>

                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{product.unit}</span>
                      {product.barcode && (
                        <span>• Barcode: {product.barcode}</span>
                      )}
                      {isTracked && (
                        <span>
                          •{" "}
                          <strong
                            className={
                              isOut
                                ? "text-red-600 font-semibold"
                                : isLow
                                  ? "text-amber-700 font-semibold"
                                  : "text-emerald-700 font-medium"
                            }
                          >
                            {isOut
                              ? "Out of stock (0)"
                              : isLow
                                ? `Low stock (${stock})`
                                : `Stock: ${stock}`}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {product.mrp !== null && (
                      <p className="text-[10px] text-slate-400 line-through">
                        MRP ₹{Number(product.mrp).toFixed(2)}
                      </p>
                    )}

                    <p className="font-bold text-sm text-slate-900">
                      ₹{Number(product.sellingPrice).toFixed(2)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductSearch;
