import { useMemo, useState } from "react";

export function useBilling() {
  const [billItems, setBillItems] = useState([]);
  const [additionalDiscount, setAdditionalDiscount] = useState("");
  const [billSaved, setBillSaved] = useState(false);

  function addProduct(product) {
    setBillItems((currentItems) => {
      const existing = currentItems.find(
        (item) => item.productId === product.id,
      );

      if (existing) {
        const updatedItems = currentItems.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );

        const updatedItem = updatedItems.find(
          (item) => item.productId === product.id,
        );

        return [
          updatedItem,
          ...updatedItems.filter((item) => item.productId !== product.id),
        ];
      }

      return [
        {
          productId: product.id,
          name: product.name,
          unit: product.unit,
          quantity: 1,
          mrp: product.mrp,
          sellingPrice: product.sellingPrice,
        },
        ...currentItems,
      ];
    });
  }

  function updateQuantity(productId, quantity) {
    const numericQuantity = Number(quantity);

    if (Number.isNaN(numericQuantity) || numericQuantity < 0) {
      return;
    }

    setBillItems((items) =>
      items.map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        const isWholeUnit = item.unit === "Piece" || item.unit === "Pack";

        if (isWholeUnit && !Number.isInteger(numericQuantity)) {
          return item;
        }

        if (!isWholeUnit && numericQuantity % 0.5 !== 0) {
          return item;
        }

        return {
          ...item,
          quantity: numericQuantity,
        };
      }),
    );
  }

  function updatePrice(productId, field, value) {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue) || numericValue < 0) {
      return;
    }

    setBillItems((items) =>
      items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              [field]: numericValue,
            }
          : item,
      ),
    );
  }

  function removeItem(productId) {
    setBillItems((items) =>
      items.filter((item) => item.productId !== productId),
    );
  }

  const totalMrp = useMemo(() => {
    return billItems.reduce((total, item) => {
      return total + Number(item.mrp || 0) * item.quantity;
    }, 0);
  }, [billItems]);

  const subtotal = useMemo(() => {
    return billItems.reduce((total, item) => {
      return total + item.sellingPrice * item.quantity;
    }, 0);
  }, [billItems]);

  const productDiscount = useMemo(() => {
    return totalMrp - subtotal;
  }, [totalMrp, subtotal]);
  async function saveBill() {
    const finalAmount = Math.max(0, subtotal - Number(additionalDiscount || 0));

    const invoice = {
      invoiceNumber: `INV-${Date.now()}`,
      totalMrp,
      productDiscount,
      additionalDiscount: Number(additionalDiscount || 0),
      finalAmount,

      items: billItems.map((item) => ({
        productId: item.productId,
        productName: item.name,
        unit: item.unit,
        quantity: Number(item.quantity),
        mrp: item.mrp === null ? null : Number(item.mrp),
        sellingPrice: Number(item.sellingPrice),
        lineTotal: Number(item.sellingPrice) * Number(item.quantity),
      })),
    };

    console.log("SAVING INVOICE:", invoice);

    const savedInvoice = await window.api.invoices.create(invoice);

    console.log("INVOICE SAVED:", savedInvoice);

    setBillItems([]);
    setAdditionalDiscount("");
    setBillSaved(true);

    setTimeout(() => {
      setBillSaved(false);
    }, 3000);
    return savedInvoice;
  }
  return {
    billItems,
    setBillItems,

    additionalDiscount,
    setAdditionalDiscount,

    addProduct,
    updateQuantity,
    updatePrice,
    removeItem,

    totalMrp,
    subtotal,
    productDiscount,
    saveBill,
    billSaved,
  };
}
