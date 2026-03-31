const SAMPLE_PRODUCTS = [
  { id: 1, sku: "QF-1001", name: "Gofar (90) / per L", category: "Gas Products", price: 205, stock: 99981, taxRate: 0 },
  { id: 2, sku: "QF-1002", name: "Mofar (94) / per L", category: "Gas Products", price: 210, stock: 99962, taxRate: 0 },
  { id: 3, sku: "QF-1003", name: "Go (87) / per L", category: "Gas Products", price: 200, stock: 99996, taxRate: 0 },
  { id: 4, sku: "QF-1004", name: "Diesel / per L", category: "Gas Products", price: 208, stock: 99999, taxRate: 0 },
  { id: 5, sku: "QF-1005", name: "Kerosene / per L", category: "Gas Products", price: 155, stock: 99909, taxRate: 0 },
  { id: 6, sku: "QF-2001", name: "Engine Oil", category: "Accessories", price: 2500, stock: 24, taxRate: 0 },
];

const SAMPLE_STAFF = [
  { id: "1001", name: "Manager", role: "Admin" },
  { id: "1002", name: "Cashier 1", role: "Cashier" },
  { id: "1003", name: "Supervisor 1", role: "Supervisor" },
];

const SAMPLE_CUSTOMERS = [
  { id: 1, name: "Walk-in Customer", phone: "", email: "", address: "", notes: "" },
  { id: 2, name: "QuickFuel Fleet Account", phone: "592-600-0000", email: "fleet@quickfuel.com", address: "Linden", notes: "Commercial customer" },
];

const currency = new Intl.NumberFormat("en-GY", {
  style: "currency",
  currency: "GYD",
  maximumFractionDigits: 2,
});

function money(value) {
  return currency.format(Number(value) || 0);
}

function dateTimeNow() {
  return new Date().toLocaleString();
}

function dateKeyNow() {
  return new Date().toISOString().split("T")[0];
}

function getRangeBounds(range) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startWeek = new Date(startToday);
  startWeek.setDate(startWeek.getDate() - startWeek.getDay());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const startYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

  if (range === "today") return { start: startToday, end: endToday, label: "Today" };
  if (range === "week") return { start: startWeek, end: now, label: "This Week" };
  if (range === "month") return { start: startMonth, end: now, label: "This Month" };
  if (range === "year") return { start: startYear, end: now, label: "This Year" };
  return { start: null, end: null, label: "All Time" };
}

function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function Section({ title, right, children }) {
  return (
    <section className="section">
      <div className="section-header">
        <h3>{title}</h3>
        {right || <div />}
      </div>
      {children}
    </section>
  );
}

function App() {
  const [activeTab, setActiveTab] = React.useState("checkout");
  const [products, setProducts] = React.useState(SAMPLE_PRODUCTS);
  const [customers, setCustomers] = React.useState(SAMPLE_CUSTOMERS);
  const [transactions, setTransactions] = React.useState([]);
  const [currentStaff] = React.useState(SAMPLE_STAFF[0]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("1");

  const [cart, setCart] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [discountRate, setDiscountRate] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState("Cash");
  const [amountReceived, setAmountReceived] = React.useState("");

  const [reportRange, setReportRange] = React.useState("today");
  const [reportCategory, setReportCategory] = React.useState("All");

  const [newCustomer, setNewCustomer] = React.useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const selectedCustomer =
    customers.find((c) => String(c.id) === String(selectedCustomerId)) || customers[0];

  const visibleProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const quickViewProducts = visibleProducts.filter((p) => p.category === "Gas Products");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = subtotal * ((Number(discountRate) || 0) / 100);
  const taxAmount = cart.reduce(
    (sum, item) =>
      sum + item.price * item.quantity * ((Number(item.taxRate) || 0) / 100),
    0
  );
  const total = Math.max(subtotal - discountAmount, 0) + taxAmount;
  const change = Math.max((Number(amountReceived) || 0) - total, 0);

  const canCheckout =
    cart.length > 0 &&
    (paymentMethod !== "Cash" || (Number(amountReceived) || 0) >= total);

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  }

  function updateQty(id, delta) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.max(0, Math.min(item.quantity + delta, item.stock)),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(id) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  function clearSale() {
    setCart([]);
    setDiscountRate(0);
    setAmountReceived("");
    setPaymentMethod("Cash");
  }

  function nextReceiptId() {
    const max = transactions.reduce((m, tx) => {
      const match = String(tx.id).match(/(\d+)$/);
      const num = match ? Number(match[1]) : 0;
      return Math.max(m, num);
    }, 0);
    return `R-${String(max + 1).padStart(5, "0")}`;
  }

  function completeSale() {
    if (!canCheckout) return;

    const receipt = {
      id: nextReceiptId(),
      date: dateTimeNow(),
      dateKey: dateKeyNow(),
      items: cart,
      subtotal,
      discountRate: Number(discountRate) || 0,
      discountAmount,
      taxAmount,
      total,
      paymentMethod,
      amountReceived: Number(amountReceived) || 0,
      change,
      staffId: currentStaff.id,
      staffName: currentStaff.name,
      customerId: String(selectedCustomer.id),
      customerName: selectedCustomer.name,
    };

    setTransactions([receipt, ...transactions]);

    setProducts((current) =>
      current.map((product) => {
        const sold = cart.find((item) => item.id === product.id);
        return sold
          ? { ...product, stock: Math.max(product.stock - sold.quantity, 0) }
          : product;
      })
    );

    clearSale();
  }

  function addCustomer() {
    if (!newCustomer.name.trim()) return;
    const nextId = customers.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0) + 1;
    setCustomers([...customers, { id: nextId, ...newCustomer }]);
    setNewCustomer({
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });
  }

  const rangeBounds = getRangeBounds(reportRange);

  const reportCategories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
  ];

  const rangedTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    if (Number.isNaN(txDate.getTime())) return false;
    if (rangeBounds.start && rangeBounds.end) {
      if (!(txDate >= rangeBounds.start && txDate <= rangeBounds.end)) return false;
    }
    if (reportCategory === "All") return true;
    return tx.items.some((item) => item.category === reportCategory);
  });

  const summary = {
    transactionCount: rangedTransactions.length,
    grossSales: rangedTransactions.reduce((sum, tx) => sum + tx.total, 0),
    totalItems: rangedTransactions.reduce(
      (sum, tx) => sum + tx.items.reduce((s, item) => s + item.quantity, 0),
      0
    ),
    averageSale: rangedTransactions.length
      ? rangedTransactions.reduce((sum, tx) => sum + tx.total, 0) /
        rangedTransactions.length
      : 0,
    cashSales: rangedTransactions
      .filter((tx) => tx.paymentMethod === "Cash")
      .reduce((sum, tx) => sum + tx.total, 0),
    cardSales: rangedTransactions
      .filter((tx) => tx.paymentMethod === "Card")
      .reduce((sum, tx) => sum + tx.total, 0),
    transferSales: rangedTransactions
      .filter((tx) => tx.paymentMethod === "Transfer")
      .reduce((sum, tx) => sum + tx.total, 0),
  };

  const paymentBreakdown = [
    { label: "Cash", value: summary.cashSales },
    { label: "Card", value: summary.cardSales },
    { label: "Transfer", value: summary.transferSales },
  ];

  const topProducts = Object.values(
    rangedTransactions.reduce((map, tx) => {
      tx.items.forEach((item) => {
        if (!map[item.id]) {
          map[item.id] = { name: item.name, sales: 0, quantity: 0 };
        }
        map[item.id].sales += item.quantity * item.price;
        map[item.id].quantity += item.quantity;
      });
      return map;
    }, {})
  )
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const hourlyTrend = React.useMemo(() => {
    const now = new Date();
    const buckets = [];

    for (let i = 5; i >= 0; i -= 1) {
      const start = new Date(now);
      start.setMinutes(0, 0, 0);
      start.setHours(now.getHours() - i);

      const end = new Date(start);
      end.setHours(start.getHours() + 1);

      buckets.push({
        label: start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        start,
        end,
        total: 0,
      });
    }

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      const bucket = buckets.find((b) => txDate >= b.start && txDate < b.end);
      if (!bucket) return;

      let value = tx.total;
      if (reportCategory !== "All") {
        value = tx.items
          .filter((item) => item.category === reportCategory)
          .reduce((sum, item) => sum + item.quantity * item.price, 0);
      }

      bucket.total += value;
    });

    return buckets;
  }, [transactions, reportCategory]);

  const staffPerformance = Object.values(
    rangedTransactions.reduce((map, tx) => {
      const key = tx.staffId;
      if (!map[key]) {
        map[key] = { name: tx.staffName, sales: 0, count: 0 };
      }
      map[key].sales += tx.total;
      map[key].count += 1;
      return map;
    }, {})
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <h1>QuickFuel</h1>
          <p>Static no-chart-library version</p>
        </div>

        <div className="nav">
          {["checkout", "customers", "reports", "admin"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="user-box">
          <div className="small">Current user</div>
          <div style={{ fontWeight: 700 }}>{currentStaff.name}</div>
          <div className="small">{currentStaff.role}</div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h2>QuickFuel</h2>
            <div className="muted">Separated HTML, CSS and JavaScript. No chart library.</div>
          </div>
        </div>

        {activeTab === "checkout" && (
          <div className="grid checkout-grid">
            <div>
              <Section title="Product Catalog">
                <div style={{ marginBottom: 12 }}>
                  <input
                    className="input"
                    placeholder="Search by name, SKU or category"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="grid product-grid">
                  {quickViewProducts.map((product) => (
                    <div key={product.id} className="product-card">
                      <div>
                        <h4>{product.name}</h4>
                        <div className="small">SKU: {product.sku}</div>
                        <div className="price">{money(product.price)}</div>
                        <div className="small">
                          Stock: {product.stock} • Tax {product.taxRate}%
                        </div>
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            <div>
              <Card>
                <Section title="Cart">
                  <div style={{ marginBottom: 12 }}>
                    <label className="label">Customer</label>
                    <select
                      className="select"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                      {customers.map((customer) => (
                        <option key={customer.id} value={String(customer.id)}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cart-list">
                    {cart.length === 0 ? (
                      <div className="muted">No items in cart.</div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.id} className="cart-item">
                          <div className="row">
                            <div>
                              <div style={{ fontWeight: 700 }}>{item.name}</div>
                              <div className="small">{money(item.price)} each</div>
                            </div>
                            <button className="btn btn-ghost" onClick={() => removeItem(item.id)}>
                              ×
                            </button>
                          </div>

                          <div className="row" style={{ marginTop: 10 }}>
                            <div className="button-row">
                              <button className="btn btn-outline" onClick={() => updateQty(item.id, -1)}>
                                -
                              </button>
                              <div style={{ minWidth: 24, textAlign: "center", fontWeight: 700 }}>
                                {item.quantity}
                              </div>
                              <button className="btn btn-outline" onClick={() => updateQty(item.id, 1)}>
                                +
                              </button>
                            </div>
                            <div style={{ fontWeight: 700 }}>
                              {money(item.quantity * item.price)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <button className="btn btn-outline" onClick={clearSale}>
                      Clear
                    </button>
                  </div>
                </Section>

                <Section title="Totals">
                  <div className="totals">
                    <div className="row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                    <div className="row" style={{ marginTop: 6 }}>
                      <span>Discount</span>
                      <span>- {money(discountAmount)}</span>
                    </div>
                    <div className="row" style={{ marginTop: 6 }}>
                      <span>Tax</span>
                      <span>{money(taxAmount)}</span>
                    </div>
                    <div className="row" style={{ marginTop: 8, fontWeight: 800, fontSize: 18 }}>
                      <span>Total</span>
                      <span>{money(total)}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label className="label">Discount %</label>
                    <input
                      className="input"
                      type="number"
                      value={discountRate}
                      onChange={(e) => setDiscountRate(e.target.value)}
                    />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label className="label">Payment Method</label>
                    <select
                      className="select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option>Cash</option>
                      <option>Card</option>
                      <option>Transfer</option>
                    </select>
                  </div>

                  {paymentMethod === "Cash" && (
                    <div style={{ marginTop: 12 }}>
                      <label className="label">Amount Received</label>
                      <input
                        className="input"
                        value={amountReceived}
                        onChange={(e) =>
                          setAmountReceived(e.target.value.replace(/[^0-9.]/g, ""))
                        }
                      />
                      <div className="small" style={{ marginTop: 6 }}>
                        Change: {money(change)}
                      </div>
                    </div>
                  )}

                  <div className="small" style={{ marginTop: 12 }}>
                    Staff: <strong>{currentStaff.name}</strong>
                  </div>
                  <div className="small" style={{ marginTop: 6 }}>
                    Customer: <strong>{selectedCustomer.name}</strong>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <button
                      className="btn btn-primary"
                      disabled={!canCheckout}
                      onClick={completeSale}
                    >
                      Checkout
                    </button>
                  </div>
                </Section>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "customers" && (
          <div>
            <Section title="Customers">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Address</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td>{customer.id}</td>
                        <td>
                          <input
                            className="input"
                            value={customer.name}
                            onChange={(e) =>
                              setCustomers(
                                customers.map((c) =>
                                  c.id === customer.id ? { ...c, name: e.target.value } : c
                                )
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            value={customer.phone}
                            onChange={(e) =>
                              setCustomers(
                                customers.map((c) =>
                                  c.id === customer.id ? { ...c, phone: e.target.value } : c
                                )
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            value={customer.email}
                            onChange={(e) =>
                              setCustomers(
                                customers.map((c) =>
                                  c.id === customer.id ? { ...c, email: e.target.value } : c
                                )
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            value={customer.address}
                            onChange={(e) =>
                              setCustomers(
                                customers.map((c) =>
                                  c.id === customer.id ? { ...c, address: e.target.value } : c
                                )
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            value={customer.notes}
                            onChange={(e) =>
                              setCustomers(
                                customers.map((c) =>
                                  c.id === customer.id ? { ...c, notes: e.target.value } : c
                                )
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Add New Customer">
              <div className="grid two-col">
                <div>
                  <label className="label">Name</label>
                  <input
                    className="input"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    className="input"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid two-col" style={{ marginTop: 8 }}>
                <div>
                  <label className="label">Email</label>
                  <input
                    className="input"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Address</label>
                  <input
                    className="input"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <label className="label">Notes</label>
                <textarea
                  className="textarea"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                />
              </div>

              <div style={{ marginTop: 10 }}>
                <button className="btn btn-primary" onClick={addCustomer}>
                  Add Customer
                </button>
              </div>
            </Section>
          </div>
        )}

        {activeTab === "reports" && (
          <div>
            <Section
              title="Reports"
              right={
                <div className="button-row">
                  {["today", "week", "month", "year", "all"].map((range) => (
                    <button
                      key={range}
                      className={`btn ${reportRange === range ? "btn-primary" : "btn-outline"}`}
                      onClick={() => setReportRange(range)}
                    >
                      {range === "all" ? "All Time" : range[0].toUpperCase() + range.slice(1)}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="muted">Range: {rangeBounds.label}</div>
              <div style={{ marginTop: 10, maxWidth: 240 }}>
                <label className="label">Category</label>
                <select
                  className="select"
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                >
                  {reportCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>
            </Section>

            <div className="stats">
              <Card>
                <div className="stat-title">Transactions</div>
                <div className="stat-value">{summary.transactionCount}</div>
              </Card>
              <Card>
                <div className="stat-title">Gross Sales</div>
                <div className="stat-value">{money(summary.grossSales)}</div>
              </Card>
              <Card>
                <div className="stat-title">Items Sold</div>
                <div className="stat-value">{summary.totalItems}</div>
              </Card>
              <Card>
                <div className="stat-title">Average Sale</div>
                <div className="stat-value">{money(summary.averageSale)}</div>
              </Card>
            </div>

            <div className="report-grid">
              <Card>
                <h4>Payment Breakdown</h4>
                <div className="mini-list">
                  {paymentBreakdown.map((item) => (
                    <div key={item.label} className="mini-row">
                      <span>{item.label}</span>
                      <strong>{money(item.value)}</strong>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h4>Top Products</h4>
                {topProducts.length === 0 ? (
                  <div className="notice">No sales in this range.</div>
                ) : (
                  <div className="mini-list">
                    {topProducts.map((item) => (
                      <div key={item.name} className="mini-row">
                        <div>
                          <div style={{ fontWeight: 700 }}>{item.name}</div>
                          <div className="small">{item.quantity} units</div>
                        </div>
                        <strong>{money(item.sales)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <h4>
                  Today’s Sales Trend {reportCategory !== "All" ? `• ${reportCategory}` : ""}
                </h4>
                <div className="mini-list">
                  {hourlyTrend.map((bucket) => (
                    <div key={bucket.label} className="mini-row">
                      <span>{bucket.label}</span>
                      <strong>{money(bucket.total)}</strong>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h4>Staff Performance</h4>
                {staffPerformance.length === 0 ? (
                  <div className="notice">No staff sales in this range.</div>
                ) : (
                  <div className="mini-list">
                    {staffPerformance.map((item) => (
                      <div key={item.name} className="mini-row">
                        <div>
                          <div style={{ fontWeight: 700 }}>{item.name}</div>
                          <div className="small">{item.count} transactions</div>
                        </div>
                        <strong>{money(item.sales)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === "admin" && (
          <div>
            <Section title="Staff Administration">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Staff ID</th>
                      <th>Name</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_STAFF.map((member) => (
                      <tr key={member.id}>
                        <td>{member.id}</td>
                        <td>{member.name}</td>
                        <td>{member.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
