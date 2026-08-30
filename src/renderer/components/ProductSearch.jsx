function ProductSearch({ search, setSearch, filteredProducts, addProduct }) {
  return (
    <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white">
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
          placeholder="Search product..."
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
        />
      </div>

      <div className="flex-1 overflow-auto p-4">
        {filteredProducts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            No product found.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addProduct(product)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium">{product.name}</p>

                  <p className="mt-1 text-xs text-slate-500">{product.unit}</p>
                </div>

                <div className="text-right">
                  {product.mrp !== null && (
                    <p className="text-xs text-slate-400">
                      MRP ₹{Number(product.mrp).toFixed(2)}
                    </p>
                  )}

                  <p className="font-semibold">
                    ₹{Number(product.sellingPrice).toFixed(2)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductSearch;
